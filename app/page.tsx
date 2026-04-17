'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, TrendingUp, Target, Brain } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem('finpath_user')
    if (user) router.replace('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #7c3aed22 0%, transparent 50%), radial-gradient(circle at 75% 75%, #7c3aed11 0%, transparent 50%)`,
        }}
      />

      <nav className="relative flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <Zap size={22} className="text-purple-700 fill-purple-700" />
          <span className="text-xl font-bold text-purple-700">FinPath</span>
        </div>
        <Link
          href="/onboarding"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5 py-2 text-sm font-medium transition-colors"
        >
          Get started
        </Link>
      </nav>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center py-16">
        <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          AI-Powered Personal Finance
        </span>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
          Your Personal CFO.{' '}
          <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            Finally.
          </span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mb-10 leading-relaxed">
          Close the gap between daily spending and generational wealth. FinPath runs 4 AI
          agents that analyze your behavior, model your goals, suggest portfolios, and warn
          you before a purchase hurts your future.
        </p>

        <Link
          href="/onboarding"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-8 py-3.5 text-base font-semibold transition-colors shadow-lg shadow-purple-200 hover:shadow-purple-300"
        >
          Start for free →
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 max-w-3xl w-full">
          {[
            {
              icon: Brain,
              title: 'Behavioral Analysis',
              desc: 'AI finds your spending leakage patterns and scores your financial health.',
            },
            {
              icon: Target,
              title: 'Goal Modeling',
              desc: 'Set a goal and get an exact daily savings number adjusted for inflation.',
            },
            {
              icon: TrendingUp,
              title: 'Portfolio Intelligence',
              desc: 'SEBI-aligned SIP recommendations with real Indian fund names.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md transition-shadow"
            >
              <div className="bg-purple-50 rounded-xl p-2.5 w-fit mb-3">
                <Icon size={20} className="text-purple-600" />
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
