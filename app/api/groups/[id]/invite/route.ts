import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('Email invalide'),
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

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['admin', 'co_admin'].includes(membership.role)) {
    return NextResponse.json(
      { error: 'Seul un admin peut inviter des membres' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const result = inviteSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    )
  }

  const { email } = result.data

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    const { data: existingMember } = await supabase
      .from('memberships')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', existingUser.id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'Cette personne est déjà membre du groupe' },
        { status: 400 }
      )
    }
  }

  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .insert({
      group_id: groupId,
      email,
      invited_by: user.id,
    })
    .select()
    .single()

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  const { data: group } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .single()

  const { data: inviter } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TogetherFund <onboarding@resend.dev>',
        to: email,
        subject: `Invitation à rejoindre ${group?.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #000;">TogetherFund</h1>
            <h2>Vous avez été invité !</h2>
            <p>
              <strong>${inviter?.full_name}</strong> vous invite à rejoindre 
              le groupe <strong>${group?.name}</strong>.
            </p>
            <p>Lien valable <strong>72 heures</strong>.</p>
            <a href="${inviteUrl}"
              style="display: inline-block; background: #000; color: #fff; 
                     padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Rejoindre le groupe
            </a>
          </div>
        `,
      }),
    })
  } catch (emailError) {
    console.error('Email error:', emailError)
  }

  return NextResponse.json(
    { data: invitation, message: 'Invitation envoyée' },
    { status: 201 }
  )
}