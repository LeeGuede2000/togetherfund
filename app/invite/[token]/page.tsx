import { createClient } from '@/lib/supabase/server'
import AcceptInviteButton from './accept-button'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data: invitation } = await supabase
    .from('invitations')
    .select(`*, groups ( id, name, description, amount, currency, frequency )`)
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 text-center bg-card rounded-xl border">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">Invitation invalide</h2>
          <p className="text-muted-foreground">Ce lien a expiré ou est invalide.</p>
        </div>
      </div>
    )
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 text-center bg-card rounded-xl border">
          <div className="text-4xl mb-4">⏰</div>
          <h2 className="text-xl font-bold mb-2">Invitation expirée</h2>
          <p className="text-muted-foreground">
            Ce lien d&apos;invitation a expiré. Demandez un nouvel email.
          </p>
        </div>
      </div>
    )
  }

  const group = invitation.groups as {
    id: string
    name: string
    description: string
    amount: number
    currency: string
    frequency: string
  }

  const frequencyLabel = {
    weekly: 'Hebdomadaire',
    biweekly: 'Bimensuel',
    monthly: 'Mensuel',
  }[group.frequency] || group.frequency

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-xl border space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🫂</div>
          <h1 className="text-2xl font-bold">TogetherFund</h1>
          <p className="text-muted-foreground mt-1">
            Vous avez été invité à rejoindre un groupe
          </p>
        </div>

        <div className="bg-muted rounded-xl p-5 space-y-3">
          <h2 className="text-xl font-bold">{group.name}</h2>
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
          <div className="flex gap-4 text-sm">
            <span className="font-medium">{group.amount} {group.currency}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{frequencyLabel}</span>
          </div>
        </div>

        <AcceptInviteButton
          token={token}
          groupId={group.id}
          email={invitation.email}
        />
      </div>
    </div>
  )
}

