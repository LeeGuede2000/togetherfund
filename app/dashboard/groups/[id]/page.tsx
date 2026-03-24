import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type User = {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

type Membership = {
  id: string
  role: string
  position: number | null
  status: string
  joined_at: string
  users: User | null
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (!group) notFound()

  const { data: membershipsData } = await supabase
    .from('memberships')
    .select(`
      id, role, position, status, joined_at,
      users ( id, full_name, email, avatar_url )
    `)
    .eq('group_id', id)
    .eq('status', 'active')

  const memberships = membershipsData as Membership[] | null

  const { data: activeCycle } = await supabase
    .from('cycles')
    .select('*')
    .eq('group_id', id)
    .eq('status', 'active')
    .single()

  const userMembership = memberships?.find(m => m.users?.id === user.id)
  const isAdmin = userMembership?.role === 'admin' ||
                  userMembership?.role === 'co_admin'

  const frequencyLabel = {
    weekly: 'Hebdomadaire',
    biweekly: 'Bimensuel',
    monthly: 'Mensuel',
  }[group.frequency as string] || group.frequency

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-bold">TogetherFund</h1>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{group.name}</h2>
              <span className={`text-xs px-2 py-1 rounded-full ${
                group.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {group.status === 'active' ? 'Actif' : group.status}
              </span>
            </div>
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>{group.amount} {group.currency}</span>
              <span>•</span>
              <span>{frequencyLabel}</span>
              <span>•</span>
              <span>{memberships?.length || 0} / {group.max_members} membres</span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <Link href={`/dashboard/groups/${id}/invite`}>
                <Button>+ Inviter un membre</Button>
              </Link>
              <Link href={`/dashboard/groups/${id}/admin`}>
                <Button variant="outline">⚙️ Gérer les contributions</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-card border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Cycle en cours</h3>
              {activeCycle ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cycle numéro</span>
                    <span className="font-medium">#{activeCycle.cycle_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Période</span>
                    <span className="font-medium">
                      {new Date(activeCycle.start_date).toLocaleDateString('fr-FR')} →{' '}
                      {new Date(activeCycle.end_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Montant attendu</span>
                    <span className="font-medium">
                      {activeCycle.total_expected} {group.currency}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🔄</p>
                  <p className="text-muted-foreground text-sm mb-4">
                    Aucun cycle actif
                  </p>
                  {isAdmin && (
                    <Link href={`/dashboard/groups/${id}/cycles/new`}>
                      <Button variant="outline" size="sm">
                        Démarrer un cycle
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="bg-card border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Contributions</h3>
              {!activeCycle ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    Démarrez un cycle pour gérer les contributions
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberships?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {member.users?.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">
                          {member.users?.full_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                          En attente
                        </span>
                        {member.users?.id === user.id && (
                          <Link
                            href={`/dashboard/groups/${id}/contribute`}
                            className="text-xs text-primary hover:underline"
                          >
                            Déclarer →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="space-y-6">
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Membres</h3>
                <span className="text-sm text-muted-foreground">
                  {memberships?.length || 0}
                </span>
              </div>
              <div className="space-y-3">
                {memberships?.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                      {member.users?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.users?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.users?.email}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                      member.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {member.role === 'admin' ? 'Admin' :
                       member.role === 'co_admin' ? 'Co-admin' : 'Membre'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Informations</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cotisation</span>
                  <span className="font-medium">{group.amount} {group.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fréquence</span>
                  <span className="font-medium">{frequencyLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max membres</span>
                  <span className="font-medium">{group.max_members}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tolérance retard</span>
                  <span className="font-medium">{group.late_tolerance} jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créé le</span>
                  <span className="font-medium">
                    {new Date(group.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}