'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Member = {
  user_id: string
  position: number
  users: {
    id: string
    full_name: string
    email: string
  }
}

export default function NewCyclePage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    beneficiary_id: '',
  })

  useEffect(() => {
    async function loadMembers() {
      const supabase = createClient()
      const { data } = await supabase
        .from('memberships')
        .select('user_id, position, users(id, full_name, email)')
        .eq('group_id', groupId)
        .eq('status', 'active')

     if (data) setMembers(data as unknown as Member[])
    }
    loadMembers()
  }, [groupId])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const response = await fetch(`/api/groups/${groupId}/cycles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/dashboard/groups/${groupId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push(`/dashboard/groups/${groupId}`)}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Retour au groupe
        </button>
        <h1 className="text-xl font-bold">TogetherFund</h1>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Démarrer un cycle</h2>
          <p className="text-muted-foreground mt-1">
            Définissez les dates et le bénéficiaire
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="space-y-2">
            <Label htmlFor="start_date">Date de début *</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Date de fin *</Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiary_id">Bénéficiaire de ce cycle *</Label>
            <select
              id="beneficiary_id"
              name="beneficiary_id"
              value={form.beneficiary_id}
              onChange={handleChange}
              required
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Sélectionner un membre</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.users?.full_name} — {m.users?.email}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push(`/dashboard/groups/${groupId}`)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Démarrage...' : 'Démarrer le cycle'}
            </Button>
          </div>

        </form>
      </main>
    </div>
  )
}