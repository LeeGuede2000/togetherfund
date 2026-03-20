'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function AcceptInviteButton({
  token,
  groupId,
  email,
}: {
  token: string
  groupId: string
  email: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    setLoading(true)
    setError('')

    const response = await fetch(`/api/invitations/${token}/accept`, {
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

    router.push(`/dashboard/groups/${groupId}`)
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      <Button className="w-full" onClick={handleAccept} disabled={loading}>
        {loading ? 'Rejoindre...' : "Accepter l'invitation"}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Vous devez être connecté pour accepter cette invitation
      </p>
    </div>
  )
}