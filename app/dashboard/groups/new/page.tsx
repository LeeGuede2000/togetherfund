'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    amount: '',
    currency: 'EUR',
    frequency: 'monthly',
    max_members: '20',
    late_tolerance: '3',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const response = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        max_members: parseInt(form.max_members),
        late_tolerance: parseInt(form.late_tolerance),
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Retour
        </button>
        <h1 className="text-xl font-bold">TogetherFund</h1>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Créer un groupe</h2>
          <p className="text-muted-foreground mt-1">
            Configurez votre groupe de tontine
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du groupe *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: Tontine Famille Diallo"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Description optionnelle..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant de cotisation *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="100"
                value={form.amount}
                onChange={handleChange}
                required
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <select
                id="currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="EUR">EUR €</option>
                <option value="USD">USD $</option>
                <option value="GBP">GBP £</option>
                <option value="XOF">XOF CFA</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Fréquence *</Label>
            <select
              id="frequency"
              name="frequency"
              value={form.frequency}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="weekly">Hebdomadaire</option>
              <option value="biweekly">Bimensuel</option>
              <option value="monthly">Mensuel</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_members">Membres maximum</Label>
              <Input
                id="max_members"
                name="max_members"
                type="number"
                value={form.max_members}
                onChange={handleChange}
                min="2"
                max="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late_tolerance">Tolérance retard (jours)</Label>
              <Input
                id="late_tolerance"
                name="late_tolerance"
                type="number"
                value={form.late_tolerance}
                onChange={handleChange}
                min="0"
                max="30"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Création...' : 'Créer le groupe'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}