import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './profile-form'
import LogoutButton from '@/components/logout-button'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold">TogetherFund</h1>
        </div>
        <LogoutButton />
      </nav>

      <main className="max-w-lg mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Mon profil</h2>
          <p className="text-muted-foreground mt-1">
            Gérez vos informations personnelles
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <ProfileForm
            userId={user.id}
            initialName={profile?.full_name || ''}
            email={user.email || ''}
          />
        </div>
      </main>
    </div>
  )
}