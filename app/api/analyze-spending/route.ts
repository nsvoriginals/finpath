import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { analyzeBehavior } from '@/lib/agents/behavioral'

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json()

    if (!user_id) {
      return Response.json({ error: 'user_id required' }, { status: 400 })
    }

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .order('date', { ascending: false })
      .limit(50)

    const result = await analyzeBehavior(data ?? [])
    return Response.json(result)
  } catch (error) {
    console.error('analyze-spending error:', error)
    return Response.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
