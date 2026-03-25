import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="text-6xl">🔍</div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground text-lg">
          Cette page n&apos;existe pas
        </p>
        <Link href="/dashboard">
          <Button>Retour au dashboard</Button>
        </Link>
      </div>
    </div>
  )
}