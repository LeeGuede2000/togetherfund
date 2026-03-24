import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contributionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const { action, rejection_reason } = body

  if (!['validate', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  }

  // Récupérer la contribution
  const { data: contribution } = await supabase
    .from('contributions')
    .select('*, cycles(group_id)')
    .eq('id', contributionId)
    .single()

  if (!contribution) {
    return NextResponse.json(
      { error: 'Contribution introuvable' },
      { status: 404 }
    )
  }

  // Vérifier que l'utilisateur est admin du groupe
  const groupId = contribution.cycles?.group_id
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['admin', 'co_admin'].includes(membership.role)) {
    return NextResponse.json(
      { error: 'Seul un admin peut valider les contributions' },
      { status: 403 }
    )
  }

  const updateData = action === 'validate'
    ? {
        status: 'validated',
        validated_at: new Date().toISOString(),
        validated_by: user.id,
        rejection_reason: null,
      }
    : {
        status: 'rejected',
        rejection_reason: rejection_reason || 'Preuve invalide',
        validated_at: null,
        validated_by: null,
      }

  const { data: updated, error } = await supabase
    .from('contributions')
    .update(updateData)
    .eq('id', contributionId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: updated }, { status: 200 })
}