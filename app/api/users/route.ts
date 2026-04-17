import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, monthly_income, risk_appetite, phone, email } = await req.json()

    const { data, error } = await supabase
      .from('users')
      .insert({ name, monthly_income, risk_appetite, phone, email, onboarding_complete: true })
      .select()
      .single()

    if (error) throw error
    return Response.json(data)
  } catch (error) {
    console.error('users POST error:', error)
    return Response.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user_id, monthly_income, risk_appetite, phone } = await req.json()

    const { data, error } = await supabase
      .from('users')
      .update({ monthly_income, risk_appetite, phone, onboarding_complete: true })
      .eq('id', user_id)
      .select()
      .single()

    if (error) throw error
    return Response.json(data)
  } catch (error) {
    console.error('users PATCH error:', error)
    return Response.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
