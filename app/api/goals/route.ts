import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return Response.json({ error: 'user_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return Response.json(data ?? [])
  } catch (error) {
    console.error('goals GET error:', error)
    return Response.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, title, target_amount, current_savings, deadline_months } = body

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id,
        title,
        target_amount,
        current_savings: current_savings ?? 0,
        deadline_months,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error
    return Response.json(data)
  } catch (error) {
    console.error('goals POST error:', error)
    return Response.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
