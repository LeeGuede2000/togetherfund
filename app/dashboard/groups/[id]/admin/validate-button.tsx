'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function ValidateButton({
  contributionId,
}: {
  contributionId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')

  async function handleAction(action: 'validate' | 'reject') {
    if (action === 'validate') setLoading(true)
    else setRejecting(true)

    const response = await fetch(`/api/contributions/${contributionId}/validate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        rejection_reason: reason,
      }),
    })

    if (response.ok) {
      router.refresh()
    }

    setLoading(false)
    setRejecting(false)
    setShowReject(false)
  }

  return (
    <div className="space-y-3">
      {!showReject ? (
        <div className="flex gap-3">
          <Button
            size="sm"
            onClick={() => handleAction('validate')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Validation...' : '✅ Valider'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowReject(true)}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            ❌ Rejeter
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Raison du rejet (optionnel)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAction('reject')}
              disabled={rejecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejecting ? 'Rejet...' : 'Confirmer le rejet'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReject(false)}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}