'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function SignInForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  // Signup fields
  const [name, setName] = useState('')
  const [income, setIncome] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl: '/onboarding' })
    } catch {
      toast.error('Google sign in failed')
      setGoogleLoading(false)
    }
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (password !== confirmPw) { toast.error('Passwords do not match'); setLoading(false); return }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, monthly_income: parseFloat(income) || 0 }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? 'Registration failed'); setLoading(false); return }
        toast.success('Account created! Signing in...')
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
        setLoading(false)
        return
      }

      router.replace(mode === 'signup' ? '/onboarding' : callbackUrl)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-base text-text-base placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-brand rounded-xl p-2">
            <Zap size={22} className="text-dark-900 fill-dark-900" />
          </div>
          <span className="text-3xl font-bold text-text-base">FinPath</span>
        </div>

        <div className="bg-surface-raised border border-border rounded-2xl p-8 shadow-xl">
          {/* Tab switcher */}
          <div className="flex bg-surface rounded-xl p-1 mb-6 border border-border">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  mode === m
                    ? 'bg-brand text-dark-900'
                    : 'text-text-muted hover:text-text-base'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-surface border border-border hover:border-brand/50 hover:bg-brand-muted rounded-xl py-3 text-sm font-semibold text-text-base transition-all disabled:opacity-50 mb-5"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-faint">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleCredentials} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-text-muted block mb-1.5">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arjun Mehta"
                  className={inputClass}
                  required={mode === 'signup'}
                />
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-text-muted block mb-1.5">Monthly income</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-text-muted text-sm">₹</span>
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="75000"
                    className={`${inputClass} pl-8`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-text-muted block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-text-faint" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-muted block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-text-faint" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className={`${inputClass} pl-10 pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-3.5 text-text-faint hover:text-text-muted"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-text-muted block mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-text-faint" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repeat password"
                    className={`${inputClass} pl-10`}
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dim text-dark-900 font-bold rounded-xl py-3 text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading
                ? mode === 'signup'
                  ? 'Creating account...'
                  : 'Signing in...'
                : mode === 'signup'
                ? 'Create Account'
                : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-faint mt-6">
          <Link href="/" className="hover:text-brand transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}
