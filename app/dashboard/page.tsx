import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import LogoutButton from '@/components/logout-button'

type Group = {
  id: string
  name: string
  description: string | null
  amount: number
  currency: string
  frequency: string
  max_members: number
  status: string
  admin_id: string
  role: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: memberships } = await supabase
    .from('memberships')
    .select(`
      role,
      joined_at,
      groups (
        id, name, description,
        amount, currency, frequency,
        max_members, status, admin_id
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')

  const groups: Group[] = memberships?.map(m => ({
    ...(m.groups as unknown as Omit<Group, 'role'>),
    role: m.role,
  })) || []

  return (
    <div className="min-h-screen bg-background">

      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">TogetherFund</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {profile?.full_name || user.email}
          </span>
          <LogoutButton />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">
              Bonjour {profile?.full_name?.split(' ')[0]} 👋
            </h2>
            <p className="text-muted-foreground mt-1">
              Gérez vos groupes de tontine
            </p>
          </div>
          <Link href="/dashboard/groups/new">
            <Button>+ Créer un groupe</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Groupes actifs</p>
            <p className="text-3xl font-bold mt-1">{groups.length}</p>
          </div>
          <div className="bg-card border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Contributions ce mois</p>
            <p className="text-3xl font-bold mt-1">0€</p>
          </div>
          <div className="bg-card border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Membres total</p>
            <p className="text-3xl font-bold mt-1">0</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Mes groupes</h3>
            <span className="text-sm text-muted-foreground">
              {groups.length} groupe{groups.length > 1 ? 's' : ''}
            </span>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">🫂</p>
              <p className="text-muted-foreground">
                Vous n&apos;avez pas encore de groupe
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Créez votre premier groupe de tontine
              </p>
              <Link href="/dashboard/groups/new">
                <Button variant="outline">+ Créer un groupe</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
                  <div className="border rounded-xl p-5 hover:border-primary transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold">{group.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        group.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {group.role === 'admin' ? 'Admin' : 'Membre'}
                      </span>
                    </div>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {group.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {group.amount} {group.currency}
                      </span>
                      <span className="text-muted-foreground">
                        {group.frequency === 'monthly' ? 'Mensuel' :
                         group.frequency === 'weekly' ? 'Hebdo' : 'Bimensuel'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}