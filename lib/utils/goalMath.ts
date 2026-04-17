export function calculateDailySave(
  target: number,
  savings: number,
  months: number
): number {
  const inflationAdjusted = (target - savings) * Math.pow(1.06, months / 12)
  const daily = Math.ceil(inflationAdjusted / (months * 30))
  return daily
}

export function goalDeadlineDate(months: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}
