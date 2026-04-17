'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const RISK_QUESTIONS = [
  {
    question: "If your investment drops 30% overnight, you would...",
    options: [
      { label: "Sell everything", score: 1 },
      { label: "Wait and watch", score: 3 },
      { label: "Buy more — it's a discount!", score: 5 },
    ],
  },
  {
    question: "When do you need this money?",
    options: [
      { label: "Within 1 year", score: 1 },
      { label: "In 1-3 years", score: 3 },
      { label: "5+ years away", score: 5 },
    ],
  },
  {
    question: "How do you describe your investing style?",
    options: [
      { label: "Safety first always", score: 1 },
      { label: "Balanced approach", score: 3 },
      { label: "High risk high reward", score: 5 },
    ],
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [income, setIncome] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [riskAnswers, setRiskAnswers] = useState<number[]>([])
  const [csvParsed, setCsvParsed] = useState<unknown[]>([])
  const [csvLoading, setCsvLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const riskScore = riskAnswers.length === 3
    ? Math.round(riskAnswers.reduce((a, b) => a + b, 0) / 3)
    : 3

  async function handleCSV(file: File) {
    setCsvLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/parse-csv', { method: 'POST', body: fd })
      const data = await res.json()
      setCsvParsed(data)
      toast.success(`Parsed ${data.length} transactions`)
    } catch {
      toast.error('CSV parsing failed')
    } finally {
      setCsvLoading(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleCSV(file)
    },
    []
  )

  async function handleComplete() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const userRes = await fetch('/api/dashboard', {
        method: 'GET',
      })

      const createUserRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, monthly_income: parseFloat(income), risk_appetite: riskScore, phone, email }),
      })

      if (!createUserRes.ok) {
        const errData = await createUserRes.json()
        throw new Error(errData.error ?? 'Failed to create user')
      }

      const user = await createUserRes.json()
      localStorage.setItem('finpath_user', JSON.stringify(user))

      if (csvParsed.length > 0) {
        await Promise.all(
          csvParsed.slice(0, 50).map((tx: unknown) => {
            const t = tx as { merchant: string; amount: number; date: string; category: string }
            return fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: user.id, ...t }),
            })
          })
        )
      }

      toast.success('Welcome to FinPath!')
      router.replace('/dashboard')
    } catch (err) {
      toast.error((err as Error).message ?? 'Setup failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors duration-300 ${
                  s <= step ? 'bg-purple-600' : 'bg-gray-100'
                }`}
              />
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Let&apos;s get started</h2>
              <p className="text-sm text-gray-500 mt-1">Tell us a bit about yourself</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Arjun Mehta"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Monthly income</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="75000"
                  className="border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Phone (for SMS alerts, optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="arjun@example.com"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full"
              />
            </div>

            <button
              onClick={() => name && income && setStep(2)}
              disabled={!name || !income}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Risk profile</h2>
              <p className="text-sm text-gray-500 mt-1">3 quick questions to calibrate your portfolio</p>
            </div>

            {RISK_QUESTIONS.map((q, qi) => (
              <div key={qi}>
                <p className="text-sm font-medium text-gray-700 mb-2">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const selected = riskAnswers[qi] === opt.score
                    return (
                      <button
                        key={opt.score}
                        onClick={() => {
                          const updated = [...riskAnswers]
                          updated[qi] = opt.score
                          setRiskAnswers(updated)
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-colors ${
                          selected
                            ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-purple-200 hover:bg-purple-50/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={() => riskAnswers.length === 3 && setStep(3)}
              disabled={riskAnswers.length < 3}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Import transactions</h2>
              <p className="text-sm text-gray-500 mt-1">Upload your bank CSV for instant analysis (optional)</p>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                dragOver ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              {csvLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={28} className="animate-spin text-purple-600" />
                  <p className="text-sm text-gray-500">Parsing CSV...</p>
                </div>
              ) : csvParsed.length > 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle size={28} className="text-green-500" />
                  <p className="text-sm font-medium text-green-600">{csvParsed.length} transactions ready</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload size={28} className="text-gray-300" />
                  <p className="text-sm text-gray-500">Drag & drop your bank CSV here</p>
                  <label className="cursor-pointer">
                    <span className="text-xs text-purple-600 font-medium underline">Browse file</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleCSV(e.target.files[0])}
                    />
                  </label>
                  <p className="text-xs text-gray-400">Supports HDFC, SBI, ICICI formats</p>
                </div>
              )}
            </div>

            <button
              onClick={handleComplete}
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Setting up...' : 'Launch FinPath →'}
            </button>

            <button
              onClick={handleComplete}
              disabled={submitting}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
