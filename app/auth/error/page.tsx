'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

const MESSAGES: Record<string, string> = {
  Configuration: 'Server configuration error. Please contact support.',
  AccessDenied: 'Access was denied.',
  Verification: 'Token verification failed.',
  Default: 'Authentication failed. Please try again.',
}

function ErrorContent() {
  const params = useSearchParams()
  const error = params.get('error') ?? 'Default'
  const message = MESSAGES[error] ?? MESSAGES.Default

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface">
      <div className="bg-surface-raised border border-border rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="bg-red-500/10 rounded-full p-3 w-fit mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-text-base mb-2">Auth Error</h2>
        <p className="text-text-muted text-sm mb-6">{message}</p>
        <Link
          href="/auth/signin"
          className="bg-brand hover:bg-brand-dim text-dark-900 font-bold rounded-xl px-6 py-2.5 text-sm transition-colors inline-block"
        >
          Try again
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return <Suspense><ErrorContent /></Suspense>
}
