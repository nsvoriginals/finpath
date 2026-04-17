import type { Transaction, TransactionCategory } from '@/types'
import { formatINR } from '@/lib/utils/formatCurrency'

interface Props {
  transaction: Transaction
}

const categoryColors: Record<TransactionCategory, string> = {
  'Food & Dining': 'bg-orange-100 text-orange-700',
  Transport: 'bg-blue-100 text-blue-700',
  Entertainment: 'bg-pink-100 text-pink-700',
  Subscriptions: 'bg-purple-100 text-purple-700',
  Shopping: 'bg-amber-100 text-amber-700',
  Utilities: 'bg-gray-100 text-gray-700',
  Healthcare: 'bg-green-100 text-green-700',
  Other: 'bg-slate-100 text-slate-700',
}

export default function TransactionRow({ transaction }: Props) {
  const color =
    categoryColors[transaction.category as TransactionCategory] ??
    'bg-slate-100 text-slate-700'

  const dateStr = new Date(transaction.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{transaction.merchant}</p>
        <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
      </div>

      <span className={`text-xs font-medium px-2.5 py-1 rounded-full mx-3 shrink-0 ${color}`}>
        {transaction.category}
      </span>

      <span className="text-sm font-bold text-red-500 shrink-0">
        -{formatINR(transaction.amount)}
      </span>
    </div>
  )
}
