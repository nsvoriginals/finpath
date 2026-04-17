'use client'

import type { Goal } from '@/types'
import { formatINR } from '@/lib/utils/formatCurrency'
import { progressPercent } from '@/lib/utils/goalMath'

interface Props {
  goals: Goal[]
}

export default function GoalProgress({ goals }: Props) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <p className="text-sm">No goals yet</p>
        <p className="text-xs mt-1">Create your first goal to track progress</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {goals.map((goal) => {
        const pct = progressPercent(goal.current_savings, goal.target_amount)
        return (
          <div key={goal.id}>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-sm font-medium text-gray-800">{goal.title}</span>
              <span className="text-xs text-gray-400">{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-purple-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">{formatINR(goal.current_savings)}</span>
              <span className="text-xs text-gray-400">{formatINR(goal.target_amount)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
