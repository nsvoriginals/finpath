import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { nudge_log_id, user_action } = await req.json()

    const { error } = await supabase
      .from('nudge_log')
      .update({ user_action })
      .eq('id', nudge_log_id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('nudge log error:', error)
    return Response.json({ error: 'Failed to log nudge action' }, { status: 500 })
  }
}
