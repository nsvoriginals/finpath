import { AlertTriangle } from 'lucide-react'
import { formatINR } from '@/lib/utils/formatCurrency'

interface Props {
  pattern: string
  amount: number
  frequency: string
  suggestion: string
}

export default function LeakageCard({ pattern, amount, frequency, suggestion }: Props) {
  return (
    <div className="relative bg-white rounded-2xl border-l-4 border-red-400 border border-gray-100 shadow-sm p-5 min-w-[240px]">
      <AlertTriangle
        size={18}
        className="absolute top-4 right-4 text-red-400"
      />
      <p className="text-red-700 font-bold text-sm pr-6">{pattern}</p>
      <p className="text-red-600 text-xl font-bold mt-1">{formatINR(amount)}</p>
      <p className="text-gray-400 text-xs mt-0.5">{frequency}</p>
      <p className="text-gray-500 text-xs italic mt-2">{suggestion}</p>
    </div>
  )
}
