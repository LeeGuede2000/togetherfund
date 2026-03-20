import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const cycleSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  beneficiary_id: z.string().uuid(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Vérifier que l'utilisateur est admin
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['admin', 'co_admin'].includes(membership.role)) {
    return NextResponse.json(
      { error: 'Seul un admin peut démarrer un cycle' },
      { status: 403 }
    )
  }

  // Vérifier qu'il n'y a pas déjà un cycle actif
  const { data: activeCycle } = await supabase
    .from('cycles')
    .select('id')
    .eq('group_id', groupId)
    .eq('status', 'active')
    .single()

  if (activeCycle) {
    return NextResponse.json(
      { error: 'Un cycle est déjà en cours' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const result = cycleSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    )
  }

  // Compter les cycles existants
  const { count } = await supabase
    .from('cycles')
    .select('*', { count: 'exact' })
    .eq('group_id', groupId)

  // Récupérer le nombre de membres
  const { data: members } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('status', 'active')

  const { data: group } = await supabase
    .from('groups')
    .select('amount')
    .eq('id', groupId)
    .single()

  const totalExpected = (members?.length || 0) * (group?.amount || 0)

  const { data: cycle, error: cycleError } = await supabase
    .from('cycles')
    .insert({
      group_id: groupId,
      cycle_number: (count || 0) + 1,
      beneficiary_id: result.data.beneficiary_id,
      start_date: result.data.start_date,
      end_date: result.data.end_date,
      total_expected: totalExpected,
      status: 'active',
    })
    .select()
    .single()

  if (cycleError) {
    return NextResponse.json({ error: cycleError.message }, { status: 500 })
  }

  // Créer les contributions pour chaque membre
  const contributions = members?.map(m => ({
    cycle_id: cycle.id,
    user_id: m.user_id,
    amount: group?.amount || 0,
    status: 'pending',
  }))

  if (contributions && contributions.length > 0) {
    await supabase.from('contributions').insert(contributions)
  }

  return NextResponse.json({ data: cycle }, { status: 201 })
}