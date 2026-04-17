'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import NudgePopup from './NudgePopup'
import type { NudgeResponse, TransactionCategory } from '@/types'

const CATEGORIES: TransactionCategory[] = [
  'Food & Dining',
  'Transport',
  'Entertainment',
  'Subscriptions',
  'Shopping',
  'Utilities',
  'Healthcare',
  'Other',
]

interface Props {
  isOpen: boolean
  onClose: () => void
  activeGoalId: string
  userId: string
  onSuccess: () => void
}

interface PendingTx {
  user_id: string
  merchant: string
  amount: number
  category: string
  date: string
  note?: string
}

export default function AddExpenseDrawer({
  isOpen,
  onClose,
  activeGoalId,
  userId,
  onSuccess,
}: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<TransactionCategory>('Food & Dining')
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [nudge, setNudge] = useState<(NudgeResponse & { nudge_log_id?: string }) | null>(null)
  const [pending, setPending] = useState<PendingTx | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!merchant || !amount) return
    setLoading(true)

    try {
      const nudgeRes = await fetch('/api/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          merchant,
          amount: parseFloat(amount),
          category,
          goal_id: activeGoalId,
        }),
      })

      const nudgeData = (await nudgeRes.json()) as NudgeResponse & { nudge_log_id?: string }

      if (nudgeData.show_nudge) {
        setPending({ user_id: userId, merchant, amount: parseFloat(amount), category, date, note })
        setNudge(nudgeData)
        onClose()
        return
      }

      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, merchant, amount: parseFloat(amount), category, date, note }),
      })

      toast.success('Expense added!')
      resetForm()
      onSuccess()
      onClose()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setMerchant('')
    setAmount('')
    setCategory('Food & Dining')
    setDate(today)
    setNote('')
  }

  function handleNudgeComplete() {
    setNudge(null)
    setPending(null)
    resetForm()
    onSuccess()
  }

  return (
    <>
      {nudge && pending && (
        <NudgePopup
          nudge={nudge}
          pendingTransaction={pending}
          userId={userId}
          onComplete={handleNudgeComplete}
        />
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <div
            className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Add Expense</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  Merchant / Place
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Swiggy, Big Bazaar"
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min="1"
                    className="border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any note..."
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 w-full"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Checking...' : 'Add Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
