import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { analyzeBehavior } from '@/lib/agents/behavioral'
import type { DashboardData } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return Response.json({ error: 'user_id required' }, { status: 400 })
    }

    const [userRes, txnsRes, goalsRes, portfolioRes, nudgeRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', user_id).single(),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user_id)
        .order('date', { ascending: false })
        .limit(50),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('portfolio_profiles')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('nudge_log')
        .select('amount')
        .eq('user_id', user_id)
        .eq('user_action', 'skipped'),
    ])

    const transactions = txnsRes.data ?? []
    const analysis = await analyzeBehavior(transactions)

    const moneySaved = (nudgeRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0
    )

    const portfolio = portfolioRes.data?.[0]
      ? {
          allocation: portfolioRes.data[0].allocation,
          instruments: portfolioRes.data[0].instruments,
          sip_amount: portfolioRes.data[0].sip_amount,
          reasoning: portfolioRes.data[0].reasoning,
          macro_note: portfolioRes.data[0].macro_note,
        }
      : null

    const dashboardData: DashboardData = {
      user: userRes.data!,
      analysis,
      goals: goalsRes.data ?? [],
      portfolio,
      recent_transactions: transactions.slice(0, 5),
      money_saved_by_guardian: moneySaved,
    }

    return Response.json(dashboardData)
  } catch (error) {
    console.error('dashboard error:', error)
    return Response.json({ error: 'Dashboard fetch failed' }, { status: 500 })
  }
}
