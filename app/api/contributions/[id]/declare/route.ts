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

  // Vérifier que la contribution appartient à l'utilisateur
  const { data: contribution } = await supabase
    .from('contributions')
    .select('*')
    .eq('id', contributionId)
    .eq('user_id', user.id)
    .single()

  if (!contribution) {
    return NextResponse.json(
      { error: 'Contribution introuvable' },
      { status: 404 }
    )
  }

  if (contribution.status !== 'pending' && contribution.status !== 'rejected') {
    return NextResponse.json(
      { error: 'Cette contribution ne peut plus être modifiée' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const { proof_url } = body

  const { data: updated, error } = await supabase
    .from('contributions')
    .update({
      status: 'declared',
      proof_url: proof_url || null,
      declared_at: new Date().toISOString(),
    })
    .eq('id', contributionId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: updated }, { status: 200 })
}