import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { suggestPortfolio } from '@/lib/agents/portfolio'

export async function POST(req: NextRequest) {
  try {
    const { user_id, risk_score, monthly_income } = await req.json()

    const result = await suggestPortfolio(risk_score, monthly_income)

    const { error } = await supabase.from('portfolio_profiles').upsert(
      {
        user_id,
        risk_score,
        allocation: result.allocation,
        instruments: result.instruments,
        sip_amount: result.sip_amount,
        reasoning: result.reasoning,
        macro_note: result.macro_note,
      },
      { onConflict: 'user_id' }
    )

    if (error) throw error

    return Response.json(result)
  } catch (error) {
    console.error('portfolio-suggest error:', error)
    return Response.json({ error: 'Portfolio suggestion failed' }, { status: 500 })
  }
}
