import { groq, MODEL } from '@/lib/groq'
import type { Transaction, SpendingAnalysis } from '@/types'

const FALLBACK: SpendingAnalysis = {
  categories: {},
  leakage_patterns: [],
  health_score: 50,
  health_label: 'Needs Attention',
  top_insight: 'Connect your transactions to get personalized insights.',
  monthly_total: 0,
}

export async function analyzeBehavior(
  transactions: Transaction[]
): Promise<SpendingAnalysis> {
  if (transactions.length === 0) return FALLBACK

  const summary = transactions.map((t) => ({
    amount: t.amount,
    merchant: t.merchant,
    category: t.category,
    date: t.date,
  }))

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content:
            'You are a behavioral finance AI for Indian users. Analyze the spending data and return ONLY raw valid JSON — no markdown, no backticks, no explanation. Return exactly this shape: {"categories":{"Food & Dining":0,"Transport":0,"Entertainment":0,"Subscriptions":0,"Shopping":0,"Utilities":0,"Healthcare":0,"Other":0},"leakage_patterns":[{"pattern":"string","amount":0,"frequency":"string","suggestion":"string"}],"health_score":75,"health_label":"Healthy","top_insight":"string","monthly_total":0}. health_score rules: above 75 = Healthy, 50-75 = Needs Attention, below 50 = At Risk.',
        },
        {
          role: 'user',
          content: `Analyze these ${transactions.length} transactions: ${JSON.stringify(summary)}`,
        },
      ],
    })

    const text = response.choices[0]?.message?.content ?? ''
    const parsed = JSON.parse(text) as SpendingAnalysis
    return parsed
  } catch {
    return FALLBACK
  }
}
