import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Connectez-vous pour accepter cette invitation' },
      { status: 401 }
    )
  }

  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invitation invalide ou expirée' },
      { status: 404 }
    )
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'Cette invitation a expiré' },
      { status: 400 }
    )
  }

  if (invitation.email !== user.email) {
    return NextResponse.json(
      { error: 'Cette invitation ne vous est pas destinée' },
      { status: 403 }
    )
  }

  const { count } = await supabase
    .from('memberships')
    .select('*', { count: 'exact' })
    .eq('group_id', invitation.group_id)
    .eq('status', 'active')

  const { data: group } = await supabase
    .from('groups')
    .select('max_members')
    .eq('id', invitation.group_id)
    .single()

  if (count && group && count >= group.max_members) {
    return NextResponse.json(
      { error: 'Ce groupe a atteint son nombre maximum de membres' },
      { status: 400 }
    )
  }

  const { error: memberError } = await supabase
    .from('memberships')
    .insert({
      group_id: invitation.group_id,
      user_id: user.id,
      role: 'member',
      status: 'active',
      position: (count || 0) + 1,
    })

  if (memberError) {
    return NextResponse.json(
      { error: memberError.message },
      { status: 500 }
    )
  }

  await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  return NextResponse.json(
    { message: 'Vous avez rejoint le groupe avec succès' },
    { status: 200 }
  )
}