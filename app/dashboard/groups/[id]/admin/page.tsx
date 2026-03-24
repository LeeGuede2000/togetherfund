import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ValidateButton from './validate-button'

type Contribution = {
  id: string
  amount: number
  status: string
  proof_url: string | null
  declared_at: string | null
  users: {
    id: string
    full_name: string
    email: string
  } | null
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (!group) notFound()

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['admin', 'co_admin'].includes(membership.role)) {
    redirect(`/dashboard/groups/${id}`)
  }

  const { data: activeCycle } = await supabase
    .from('cycles')
    .select('*')
    .eq('group_id', id)
    .eq('status', 'active')
    .single()

  const { data: contributionsData } = activeCycle
    ? await supabase
        .from('contributions')
        .select(`
          id, amount, status, proof_url, declared_at,
          users ( id, full_name, email )
        `)
        .eq('cycle_id', activeCycle.id)
    : { data: [] }

  const contributions = (contributionsData ?? []) as unknown as Contribution[]

  const statusLabel: Record<string, string> = {
    pending: 'En attente',
    declared: 'Déclarée',
    validated: 'Validée ✅',
    rejected: 'Rejetée ❌',
    late: 'En retard',
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    declared: 'bg-blue-100 text-blue-700',
    validated: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    late: 'bg-orange-100 text-orange-700',
  }

  const validated = contributions.filter((c) => c.status === 'validated').length
  const total = contributions.length

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-4 flex items-center gap-4">
        <Link
          href={`/dashboard/groups/${id}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Retour au groupe
        </Link>
        <h1 className="text-xl font-bold">TogetherFund</h1>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Validation des contributions</h2>
          <p className="text-muted-foreground mt-1">
            {group.name} — Cycle #{activeCycle?.cycle_number || '—'}
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progression du cycle</span>
            <span className="text-sm text-muted-foreground">
              {validated} / {total} validées
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: total > 0 ? `${(validated / total) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {!activeCycle ? (
          <div className="text-center py-12 bg-card border rounded-xl">
            <p className="text-4xl mb-4">🔄</p>
            <p className="text-muted-foreground">Aucun cycle actif</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contributions.map((contribution) => (
              <div key={contribution.id} className="bg-card border rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium">
                      {contribution.users?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium">{contribution.users?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {contribution.users?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-medium">{contribution.amount} EUR</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        statusColor[contribution.status] || 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {statusLabel[contribution.status] || contribution.status}
                    </span>
                  </div>
                </div>

                {contribution.proof_url && (
                  <div className="mt-3 pt-3 border-t">
                    <a
                      href={contribution.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Voir la preuve de paiement →
                    </a>
                  </div>
                )}

                {contribution.status === 'declared' && (
                  <div className="mt-3 pt-3 border-t">
                    <ValidateButton contributionId={contribution.id} />
                  </div>
                )}

                {contribution.status === 'validated' && contribution.declared_at && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Déclarée le {new Date(contribution.declared_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}