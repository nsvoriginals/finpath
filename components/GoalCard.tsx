import type { Goal } from '@/types'
import { formatINR } from '@/lib/utils/formatCurrency'
import { progressPercent } from '@/lib/utils/goalMath'

interface Props {
  goal: Goal
}

export default function GoalCard({ goal }: Props) {
  const pct = progressPercent(goal.current_savings, goal.target_amount)

  const deadline = new Date(goal.created_at)
  deadline.setMonth(deadline.getMonth() + goal.deadline_months)
  const daysLeft = Math.max(
    0,
    Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-medium text-gray-800">{goal.title}</h3>
        {goal.daily_save_required && (
          <span className="bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-xl shrink-0 ml-2">
            {formatINR(goal.daily_save_required)}/day
          </span>
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
        <span>{formatINR(goal.current_savings)} saved</span>
        <span>{formatINR(goal.target_amount)} goal</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-400">{pct}% complete</span>
        <span className="text-xs text-gray-400">{daysLeft} days left</span>
      </div>

      {goal.narrative && (
        <p className="text-xs italic text-gray-500 mt-3 leading-relaxed">
          {goal.narrative}
        </p>
      )}
    </div>
  )
}
