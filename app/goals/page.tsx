'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import GoalCard from '@/components/GoalCard'
import { formatINR } from '@/lib/utils/formatCurrency'
import { calculateDailySave, goalDeadlineDate } from '@/lib/utils/goalMath'
import type { Goal, User } from '@/types'

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState('')
  const [income, setIncome] = useState(0)

  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [saved, setSaved] = useState('')
  const [months, setMonths] = useState(12)

  const liveDaily = title && target && months
    ? calculateDailySave(parseFloat(target) || 0, parseFloat(saved) || 0, months)
    : 0
  const liveDeadline = goalDeadlineDate(months)
  const liveMonthly = liveDaily * 30
  const livePct = income > 0 ? Math.round((liveMonthly / income) * 100) : 0
  const feasible = income > 0 && liveMonthly < income * 0.5

  const fetchGoals = useCallback(async (uid: string) => {
    const res = await fetch(`/api/goals?user_id=${uid}`)
    const data = await res.json()
    setGoals(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('finpath_user')
    if (!stored) { router.replace('/'); return }
    const u = JSON.parse(stored) as User
    setUserId(u.id)
    setIncome(u.monthly_income)
    fetchGoals(u.id).finally(() => setLoading(false))
  }, [router, fetchGoals])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !target) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/calculate-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          title,
          target_amount: parseFloat(target),
          current_savings: parseFloat(saved) || 0,
          deadline_months: months,
          income,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Goal created!')
      setTitle('')
      setTarget('')
      setSaved('')
      setMonths(12)
      fetchGoals(userId)
    } catch {
      toast.error('Failed to create goal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Goals</h1>

      {/* Creation form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-medium text-gray-800 mb-4">Create a new goal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">What are you saving for?</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Goa trip, New bike, Emergency fund..."
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Target amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="30000"
                  className="border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Already saved</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  value={saved}
                  onChange={(e) => setSaved(e.target.value)}
                  placeholder="0"
                  className="border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              Timeline: <span className="text-purple-600 font-semibold">{months} months</span>
            </label>
            <input
              type="range"
              min={3}
              max={120}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>3 months</span>
              <span>120 months</span>
            </div>
          </div>

          {/* Live preview */}
          {liveDaily > 0 && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="text-center mb-3">
                <p className="text-xs text-gray-500 mb-1">Daily savings needed</p>
                <p className="text-3xl font-bold text-purple-700">{formatINR(liveDaily)}/day</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-gray-400">Monthly</p>
                  <p className="font-semibold text-gray-700">{formatINR(liveMonthly)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Deadline</p>
                  <p className="font-semibold text-gray-700">{liveDeadline}</p>
                </div>
                <div>
                  <p className="text-gray-400">% of income</p>
                  <p className="font-semibold text-gray-700">{livePct}%</p>
                </div>
              </div>
              {income > 0 && (
                <div className={`mt-3 text-center text-xs font-medium px-3 py-1.5 rounded-full ${feasible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {feasible ? '✓ Feasible on your income' : '⚠ Stretch goal — consider longer timeline'}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Creating with AI...' : 'Create Goal'}
          </button>
        </form>
      </div>

      {/* Existing goals */}
      <h2 className="text-base font-medium text-gray-800 mb-3">Your Goals</h2>
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-32" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <p className="text-sm">No goals yet. Create your first goal above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((g) => <GoalCard key={g.id} goal={g} />)}
        </div>
      )}
    </div>
  )
}
