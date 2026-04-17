'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Upload, CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import TransactionRow from '@/components/TransactionRow'
import { formatINR } from '@/lib/utils/formatCurrency'
import type { Transaction, TransactionCategory, User } from '@/types'

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

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [userId, setUserId] = useState('')
  const [csvParsed, setCsvParsed] = useState<unknown[]>([])
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvSaving, setCsvSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const fetchTransactions = useCallback(async (uid: string, cat?: string) => {
    const url = new URL('/api/transactions', window.location.origin)
    url.searchParams.set('user_id', uid)
    if (cat && cat !== 'All') url.searchParams.set('category', cat)
    const res = await fetch(url.toString())
    const data = await res.json()
    setTransactions(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('finpath_user')
    if (!stored) { router.replace('/'); return }
    const u = JSON.parse(stored) as User
    setUserId(u.id)
    fetchTransactions(u.id).finally(() => setLoading(false))
  }, [router, fetchTransactions])

  useEffect(() => {
    if (!userId) return
    fetchTransactions(userId, activeCategory)
  }, [activeCategory, userId, fetchTransactions])

  const filtered = transactions.filter((t) =>
    t.merchant.toLowerCase().includes(search.toLowerCase())
  )

  const total = filtered.reduce((s, t) => s + Number(t.amount), 0)

  async function handleCSV(file: File) {
    setCsvLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/parse-csv', { method: 'POST', body: fd })
      const data = await res.json()
      setCsvParsed(data)
      toast.success(`${data.length} transactions parsed`)
    } catch {
      toast.error('CSV parsing failed')
    } finally {
      setCsvLoading(false)
    }
  }

  async function saveCSVTransactions() {
    setCsvSaving(true)
    try {
      await Promise.all(
        csvParsed.slice(0, 100).map((tx: unknown) => {
          const t = tx as { merchant: string; amount: number; date: string; category: string }
          return fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, ...t }),
          })
        })
      )
      toast.success(`Saved ${csvParsed.length} transactions!`)
      setCsvParsed([])
      fetchTransactions(userId)
    } catch {
      toast.error('Failed to save transactions')
    } finally {
      setCsvSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} entries · Total: {formatINR(total)}
          </p>
        </div>
      </div>

      {/* CSV Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-sm font-medium text-gray-700 mb-3">Import Bank CSV</p>
        <div
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCSV(f) }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${dragOver ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}
        >
          {csvLoading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Parsing...
            </div>
          ) : csvParsed.length > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle size={16} />
                {csvParsed.length} transactions ready to import
              </div>
              <button
                onClick={saveCSVTransactions}
                disabled={csvSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-1.5 text-xs font-medium disabled:opacity-40"
              >
                {csvSaving ? 'Saving...' : 'Confirm Import'}
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600">
              <Upload size={16} />
              <span>Drop CSV or <span className="text-purple-600 underline">browse</span></span>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCSV(e.target.files[0])} />
            </label>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by merchant..."
          className="border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 w-full bg-white"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {['All', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p className="text-sm">No transactions found</p>
            <p className="text-xs mt-1">Try a different search or category</p>
          </div>
        ) : (
          filtered.map((t) => <TransactionRow key={t.id} transaction={t} />)
        )}
      </div>
    </div>
  )
}
