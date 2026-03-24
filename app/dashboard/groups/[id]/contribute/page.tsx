'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Contribution = {
  id: string
  amount: number
  status: string
  proof_url: string | null
  declared_at: string | null
}

export default function ContributePage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [contribution, setContribution] = useState<Contribution | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [proofUrl, setProofUrl] = useState('')

  useEffect(() => {
    async function loadContribution() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: activeCycle, error: cycleError } = await supabase
        .from('cycles')
        .select('id')
        .eq('group_id', groupId)
        .eq('status', 'active')
        .single()

      if (cycleError || !activeCycle) return

      const { data: contributionData, error: contributionError } = await supabase
        .from('contributions')
        .select('*')
        .eq('cycle_id', activeCycle.id)
        .eq('user_id', user.id)
        .single()

      if (contributionError) return

      if (contributionData) setContribution(contributionData)
    }

    loadContribution()
  }, [groupId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `proof-${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('proofs')
      .upload(fileName, file)

    if (error) {
      setError('Erreur upload: ' + error.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('proofs')
      .getPublicUrl(data.path)

    setProofUrl(urlData.publicUrl)
    setUploading(false)
  }

  async function handleDeclare() {
    if (!contribution) return

    setLoading(true)
    setError('')

    const response = await fetch(`/api/contributions/${contribution.id}/declare`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof_url: proofUrl || null }),
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error || 'Une erreur est survenue')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const statusLabel: Record<string, string> = {
    pending: 'En attente',
    declared: 'Déclarée — en attente de validation',
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 text-center bg-card rounded-xl border space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-bold">Contribution déclarée !</h2>
          <p className="text-muted-foreground">
            L&apos;admin va valider votre paiement sous peu.
          </p>
          <Button onClick={() => router.push(`/dashboard/groups/${groupId}`)}>
            Retour au groupe
          </Button>
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
          <h2 className="text-2xl font-bold">Ma contribution</h2>
          <p className="text-muted-foreground mt-1">
            Déclarez votre paiement pour ce cycle
          </p>
        </div>

        {!contribution ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🔄</p>
            <p className="text-muted-foreground">Aucun cycle actif</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Montant</p>
                  <p className="text-2xl font-bold mt-1">
                    {contribution.amount} EUR
                  </p>
                </div>
                <span
                  className={`text-sm px-3 py-1 rounded-full ${
                    statusColor[contribution.status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {statusLabel[contribution.status] || contribution.status}
                </span>
              </div>
            </div>

            {(contribution.status === 'pending' || contribution.status === 'rejected') && (
              <div className="bg-card border rounded-xl p-6 space-y-4">
                <h3 className="font-semibold">Déclarer mon paiement</h3>

                <div className="space-y-2">
                  <Label htmlFor="proof">Preuve de paiement (optionnel)</Label>
                  <input
                    id="proof"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleUpload}
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <p className="text-xs text-muted-foreground">
                    Capture d&apos;écran de virement, reçu... (jpg, png, pdf)
                  </p>

                  {uploading && (
                    <p className="text-sm text-blue-600">Upload en cours...</p>
                  )}

                  {proofUrl && (
                    <p className="text-sm text-green-600">
                      ✅ Preuve uploadée avec succès
                    </p>
                  )}
                </div>

                {contribution.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">
                      Votre précédente déclaration a été rejetée.
                      Veuillez soumettre une nouvelle preuve.
                    </p>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  className="w-full"
                  onClick={handleDeclare}
                  disabled={loading || uploading}
                >
                  {loading ? 'Déclaration...' : "J'ai payé — Déclarer ma contribution"}
                </Button>
              </div>
            )}

            {contribution.proof_url && (
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-3">Preuve soumise</h3>
                <a
                  href={contribution.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Voir la preuve →
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}