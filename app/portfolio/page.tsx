'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Info, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import PortfolioDonut from '@/components/charts/PortfolioDonut'
import { formatINR } from '@/lib/utils/formatCurrency'
import type { PortfolioSuggestion, User } from '@/types'

const RISK_QUESTIONS = [
  {
    question: "If your investment drops 30% overnight, you would...",
    options: [{ label: "Sell everything", score: 1 }, { label: "Wait and watch", score: 3 }, { label: "Buy more — it's a discount!", score: 5 }],
  },
  {
    question: "When do you need this money?",
    options: [{ label: "Within 1 year", score: 1 }, { label: "In 1-3 years", score: 3 }, { label: "5+ years away", score: 5 }],
  },
  {
    question: "How do you describe your investing style?",
    options: [{ label: "Safety first always", score: 1 }, { label: "Balanced approach", score: 3 }, { label: "High risk high reward", score: 5 }],
  },
]

const ASSET_COLORS: Record<string, string> = {
  equity: 'bg-purple-100 text-purple-700 border-purple-200',
  debt: 'bg-green-100 text-green-700 border-green-200',
  gold: 'bg-amber-100 text-amber-700 border-amber-200',
  cash: 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function PortfolioPage() {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<PortfolioSuggestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [userId, setUserId] = useState('')
  const [income, setIncome] = useState(0)
  const [riskScore, setRiskScore] = useState(3)
  const [showQuiz, setShowQuiz] = useState(false)
  const [answers, setAnswers] = useState<number[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('finpath_user')
    if (!stored) { router.replace('/'); return }
    const u = JSON.parse(stored) as User
    setUserId(u.id)
    setIncome(u.monthly_income)
    setRiskScore(u.risk_appetite ?? 3)

    const cachedPortfolio = localStorage.getItem('finpath_portfolio')
    if (cachedPortfolio) {
      setPortfolio(JSON.parse(cachedPortfolio))
      setLoading(false)
    } else {
      setShowQuiz(true)
      setLoading(false)
    }
  }, [router])

  async function generatePortfolio(rs: number) {
    setGenerating(true)
    try {
      const res = await fetch('/api/portfolio-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, risk_score: rs, monthly_income: income }),
      })
      const data = await res.json()
      setPortfolio(data)
      localStorage.setItem('finpath_portfolio', JSON.stringify(data))
      setShowQuiz(false)
      toast.success('Portfolio generated!')
    } catch {
      toast.error('Portfolio generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function handleQuizSubmit() {
    if (answers.length < 3) return
    const rs = Math.round(answers.reduce((a, b) => a + b, 0) / 3)
    setRiskScore(rs)
    generatePortfolio(rs)
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-32" />)}
      </div>
    )
  }

  if (showQuiz || !portfolio) {
    return (
      <div className="p-6 md:p-8 max-w-lg">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Your Investment Profile</h1>
        <p className="text-sm text-gray-500 mb-6">Answer 3 quick questions to get your personalized portfolio</p>

        <div className="space-y-5">
          {RISK_QUESTIONS.map((q, qi) => (
            <div key={qi} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-medium text-gray-700 mb-3">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const selected = answers[qi] === opt.score
                  return (
                    <button
                      key={opt.score}
                      onClick={() => { const a = [...answers]; a[qi] = opt.score; setAnswers(a) }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-colors ${selected ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-purple-200'}`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <button
            onClick={handleQuizSubmit}
            disabled={answers.length < 3 || generating}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {generating && <Loader2 size={16} className="animate-spin" />}
            {generating ? 'Building portfolio...' : 'Get My Portfolio →'}
          </button>
        </div>
      </div>
    )
  }

  const assetClasses = Object.entries(portfolio.allocation) as [string, number][]

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Your Portfolio</h1>
          <p className="text-sm text-gray-500 mt-0.5">Risk score: {riskScore}/5</p>
        </div>
        <button
          onClick={() => { setShowQuiz(true); setAnswers([]) }}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          Recalculate
        </button>
      </div>

      {/* Donut + SIP */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5 text-center">
        <PortfolioDonut allocation={portfolio.allocation} />
        <div className="flex items-center justify-center gap-2 mt-2">
          <TrendingUp size={18} className="text-purple-600" />
          <p className="text-lg font-bold text-gray-900">
            Invest <span className="text-purple-600">{formatINR(portfolio.sip_amount)}/month</span> via SIP
          </p>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Info size={15} className="text-blue-500" />
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Analysis</p>
        </div>
        <p className="text-sm text-blue-800 leading-relaxed">{portfolio.reasoning}</p>
      </div>

      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 mb-5">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Market Note</p>
        <p className="text-sm text-amber-800">{portfolio.macro_note}</p>
      </div>

      {/* Instrument cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {assetClasses.filter(([, v]) => v > 0).map(([asset, pct]) => {
          const colorClass = ASSET_COLORS[asset] ?? 'bg-gray-100 text-gray-700 border-gray-200'
          const funds = portfolio.instruments?.[asset] ?? []
          return (
            <div key={asset} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800 capitalize">{asset}</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colorClass}`}>
                  {pct}%
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {funds.map((fund: string, i: number) => (
                  <span key={i} className={`text-xs px-2 py-1 rounded-lg border ${colorClass}`}>
                    {fund}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Not financial advice. Consult a SEBI registered investment advisor before investing.
      </p>
    </div>
  )
}
