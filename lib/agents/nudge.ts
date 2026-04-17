import { claude } from '@/lib/claude'
import type { NudgeResponse } from '@/types'

export async function generateNudge(
  merchant: string,
  amount: number,
  category: string,
  goalTitle: string,
  dailySaveRequired: number,
  weeklyCategorySpend: number,
  daysBehind: number
): Promise<NudgeResponse> {
  if (amount < 100 && daysBehind <= 0) {
    return { show_nudge: false }
  }

  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system:
        'You are a friendly but firm financial guardian for an Indian user. Return ONLY raw valid JSON — no markdown, no backticks. Return: {"show_nudge":true,"severity":"warning","message":"1-2 sentences with exact rupees and goal impact","impact":"Goal delayed by X days","proceed_text":"string","reconsider_text":"string"}. Severity rules: info if amount < 300, warning if 300-1000, danger if > 1000. show_nudge false only if amount < 100 AND daysBehind <= 0.',
      messages: [
        {
          role: 'user',
          content: `Purchase: ₹${amount} at ${merchant} (${category}). Goal: "${goalTitle}", daily save needed: ₹${dailySaveRequired}. Weekly spend in ${category}: ₹${weeklyCategorySpend}. Days behind goal: ${daysBehind}. Should user be nudged?`,
        },
      ],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text) as NudgeResponse
    return parsed
  } catch {
    return { show_nudge: false }
  }
}
