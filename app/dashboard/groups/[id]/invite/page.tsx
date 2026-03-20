'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const response = await fetch(`/api/groups/${groupId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md p-8 text-center space-y-4 bg-card rounded-xl border">
          <div className="text-4xl">✉️</div>
          <h2 className="text-xl font-bold">Invitation envoyée !</h2>
          <p className="text-muted-foreground">
            Un email a été envoyé à <strong>{email}</strong>
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1"
              onClick={() => { setSuccess(false); setEmail('') }}>
              Inviter quelqu&apos;un d&apos;autre
            </Button>
            <Button className="flex-1"
              onClick={() => router.push(`/dashboard/groups/${groupId}`)}>
              Retour au groupe
            </Button>
          </div>
        </div>
      </div>
    )
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
          <h2 className="text-2xl font-bold">Inviter un membre</h2>
          <p className="text-muted-foreground mt-1">
            Envoyez une invitation par email
          </p>
        </div>

        <form onSubmit={handleInvite} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email du membre *</Label>
            <Input
              id="email"
              type="email"
              placeholder="aminata@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Lien valable 72 heures
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1"
              onClick={() => router.push(`/dashboard/groups/${groupId}`)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Envoi...' : "Envoyer l'invitation"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}