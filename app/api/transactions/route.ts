import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const user_id = searchParams.get('user_id')
    const category = searchParams.get('category')

    if (!user_id) {
      return Response.json({ error: 'user_id required' }, { status: 400 })
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .order('date', { ascending: false })

    if (category && category !== 'All') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return Response.json(data ?? [])
  } catch (error) {
    console.error('transactions GET error:', error)
    return Response.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, amount, merchant, category, date, note } = body

    const { data, error } = await supabase
      .from('transactions')
      .insert({ user_id, amount, merchant, category, date, note: note ?? '' })
      .select()
      .single()

    if (error) throw error
    return Response.json(data)
  } catch (error) {
    console.error('transactions POST error:', error)
    return Response.json({ error: 'Failed to save transaction' }, { status: 500 })
  }
}
