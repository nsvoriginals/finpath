import { claude } from '@/lib/claude'
import { calculateDailySave, goalDeadlineDate } from '@/lib/utils/goalMath'
import type { GoalCalculation } from '@/types'

export async function buildGoalPlan(
  title: string,
  target: number,
  savings: number,
  months: number,
  income: number
): Promise<GoalCalculation> {
  const inflationAdjusted = (target - savings) * Math.pow(1.06, months / 12)
  const daily = calculateDailySave(target, savings, months)
  const monthly = daily * 30
  const feasible = monthly < income * 0.5
  const deadlineDate = goalDeadlineDate(months)
  const percentOfIncome = Math.round((monthly / income) * 100)

  let narrative = `Save ₹${daily}/day for ${months} months to reach your ${title} goal of ₹${target.toLocaleString('en-IN')} by ${deadlineDate}.`

  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 120,
      system:
        'You are a warm, motivating personal finance coach for Indian users. Write exactly one sentence that is specific, warm, and uses exact rupee amounts and deadline. No generic phrases. No markdown.',
      messages: [
        {
          role: 'user',
          content: `Goal: "${title}", Target: ₹${target}, Already saved: ₹${savings}, Timeline: ${months} months, Daily save needed: ₹${daily}, Deadline: ${deadlineDate}, Monthly income: ₹${income}. Write a one-sentence motivational narrative.`,
        },
      ],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    if (text) narrative = text
  } catch {
    // use fallback narrative
  }

  return {
    daily_save: daily,
    monthly_save: monthly,
    feasible,
    inflation_adjusted_target: Math.round(inflationAdjusted + savings),
    deadline_date: deadlineDate,
    percent_of_income: percentOfIncome,
    narrative,
  }
}
