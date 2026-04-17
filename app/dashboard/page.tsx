'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Zap, Plus, FileDown, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import HealthScore from '@/components/HealthScore'
import LeakageCard from '@/components/LeakageCard'
import GoalCard from '@/components/GoalCard'
import TransactionRow from '@/components/TransactionRow'
import AddExpenseDrawer from '@/components/AddExpenseDrawer'
import SpendingPie from '@/components/charts/SpendingPie'
import GoalProgress from '@/components/charts/GoalProgress'
import PortfolioDonut from '@/components/charts/PortfolioDonut'
import { formatINR } from '@/lib/utils/formatCurrency'
import type { DashboardData, User } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const fetchDashboard = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/dashboard?user_id=${userId}`)
      if (!res.ok) throw new Error('Dashboard fetch failed')
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('finpath_user')
    if (!stored) { router.replace('/'); return }
    const u = JSON.parse(stored) as User
    setUser(u)
    fetchDashboard(u.id)
  }, [router, fetchDashboard])

  async function handleExportPDF() {
    const { default: jsPDF } = await import('jspdf')
    const { default: html2canvas } = await import('html2canvas')
    const el = document.getElementById('dashboard-export')
    if (!el) return
    toast.loading('Generating PDF...')
    const canvas = await html2canvas(el, { scale: 1.5 })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const w = pdf.internal.pageSize.getWidth()
    const h = (canvas.height * w) / canvas.width
    pdf.addImage(img, 'PNG', 0, 0, w, h)
    pdf.save('finpath-report.pdf')
    toast.dismiss()
    toast.success('PDF downloaded!')
  }

  const activeGoalId = data?.goals?.[0]?.id ?? ''

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-32" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const pieData = Object.entries(data.analysis.categories)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="p-6 md:p-8" id="dashboard-export">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {greeting}, {data.user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s your financial snapshot</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <FileDown size={15} />
          Export PDF
        </button>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">Financial Health</p>
          <HealthScore score={data.analysis.health_score} label={data.analysis.health_label} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Monthly Spend</p>
          <p className="text-3xl font-bold text-gray-900">{formatINR(data.analysis.monthly_total)}</p>
          <p className="text-xs text-gray-400 mt-1">Across {Object.keys(data.analysis.categories).length} categories</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Saved by Guardian</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-green-500">{formatINR(data.money_saved_by_guardian)}</p>
            <Shield size={20} className="text-green-400" />
          </div>
          <p className="text-xs text-gray-400 mt-1">By reconsidering nudged purchases</p>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-base font-medium text-gray-800 mb-4">Spending Breakdown</p>
          <SpendingPie data={pieData} />
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-purple-600" />
            <p className="text-base font-medium text-gray-800">Top Insight</p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{data.analysis.top_insight}</p>
        </div>
      </div>

      {/* Row 3 — Leakage */}
      {data.analysis.leakage_patterns.length > 0 && (
        <div className="mb-6">
          <p className="text-base font-medium text-gray-800 mb-3">Spending Leaks</p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data.analysis.leakage_patterns.map((p, i) => (
              <LeakageCard
                key={i}
                pattern={p.pattern}
                amount={p.amount}
                frequency={p.frequency}
                suggestion={p.suggestion}
              />
            ))}
          </div>
        </div>
      )}

      {/* Row 4 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-base font-medium text-gray-800 mb-4">Goal Progress</p>
          <GoalProgress goals={data.goals} />
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-base font-medium text-gray-800 mb-2">Portfolio</p>
          {data.portfolio ? (
            <>
              <PortfolioDonut allocation={data.portfolio.allocation} />
              <p className="text-xs text-center text-gray-500 mt-1">
                SIP: <span className="font-semibold text-purple-700">{formatINR(data.portfolio.sip_amount)}/mo</span>
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">No portfolio yet</p>
              <Link href="/portfolio" className="text-xs text-purple-600 mt-2 underline">
                Set up portfolio →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Row 5 — Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-24">
        <div className="flex items-center justify-between mb-3">
          <p className="text-base font-medium text-gray-800">Recent Transactions</p>
          <Link href="/transactions" className="text-xs text-purple-600 hover:underline">
            See all →
          </Link>
        </div>
        {data.recent_transactions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No transactions yet</p>
        ) : (
          data.recent_transactions.map((t) => <TransactionRow key={t.id} transaction={t} />)
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl px-5 py-3.5 shadow-lg shadow-purple-200 flex items-center gap-2 text-sm font-medium transition-colors z-30"
      >
        <Plus size={18} />
        Add Expense
      </button>

      <AddExpenseDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeGoalId={activeGoalId}
        userId={user?.id ?? ''}
        onSuccess={() => user && fetchDashboard(user.id)}
      />
    </div>
  )
}
