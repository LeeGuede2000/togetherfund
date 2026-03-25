'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ProfileForm({
  userId,
  initialName,
  email,
}: {
  userId: string
  initialName: string
  email: string
}) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true)
    setError('')
    setSuccess(false)

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom complet</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Votre nom complet"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={email}
          disabled
          className="opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          L&apos;email ne peut pas être modifié
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">Profil mis à jour avec succès !</p>
      )}

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading ? 'Sauvegarde...' : 'Sauvegarder'}
      </Button>
    </div>
  )
}