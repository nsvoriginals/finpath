import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateNudge } from '@/lib/agents/nudge'

export async function POST(req: NextRequest) {
  try {
    const { user_id, merchant, amount, category, goal_id } = await req.json()

    const { data: goal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goal_id)
      .single()

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentTxns } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user_id)
      .eq('category', category)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])

    const weeklyCategorySpend = (recentTxns ?? []).reduce(
      (sum, t) => sum + Number(t.amount),
      0
    )

    const dailySaveRequired = goal?.daily_save_required ?? 0
    const daysBehind = goal
      ? Math.round(
          (goal.target_amount - goal.current_savings) / (dailySaveRequired || 1) -
            goal.deadline_months * 30
        )
      : 0

    const nudge = await generateNudge(
      merchant,
      amount,
      category,
      goal?.title ?? 'your goal',
      dailySaveRequired,
      weeklyCategorySpend,
      daysBehind
    )

    if (nudge.show_nudge) {
      const { data: logEntry } = await supabase
        .from('nudge_log')
        .insert({
          user_id,
          merchant,
          amount,
          category,
          nudge_message: nudge.message ?? '',
          user_action: 'pending',
        })
        .select()
        .single()

      return Response.json({ ...nudge, nudge_log_id: logEntry?.id })
    }

    return Response.json(nudge)
  } catch (error) {
    console.error('nudge error:', error)
    return Response.json({ show_nudge: false })
  }
}
