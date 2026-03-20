import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const groupSchema = z.object({
  name: z.string().min(3, 'Le nom doit avoir au moins 3 caractères'),
  description: z.string().optional(),
  amount: z.number().positive('Le montant doit être positif'),
  currency: z.string().default('EUR'),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  max_members: z.number().min(2).max(50).default(20),
  late_tolerance: z.number().min(0).max(30).default(3),
})

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: groups, error } = await supabase
    .from('memberships')
    .select(`
      role,
      joined_at,
      groups (
        id, name, description, amount, currency,
        frequency, max_members, status, created_at, admin_id
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: groups }, { status: 200 })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const result = groupSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    )
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ ...result.data, admin_id: user.id })
    .select()
    .single()

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 })
  }

  const { error: memberError } = await supabase
    .from('memberships')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin',
      status: 'active',
      position: 1,
    })

  if (memberError) {
    console.error('Member error:', memberError)
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  return NextResponse.json({ data: group }, { status: 201 })
}