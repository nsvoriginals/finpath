import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  monthly_income: z.number().positive(),
  risk_appetite: z.number().int().min(1).max(5).optional(),
  phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid data' },
        { status: 400 }
      )
    }

    const { name, email, password, monthly_income, risk_appetite, phone } = parsed.data

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        monthly_income,
        risk_appetite: risk_appetite ?? 3,
        phone,
        auth_provider: 'credentials',
        onboarding_complete: false,
      })
      .select('id, name, email, monthly_income, risk_appetite, avatar_url, onboarding_complete')
      .single()

    if (error) throw error

    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error('register error:', error)
    return Response.json({ error: 'Registration failed' }, { status: 500 })
  }
}
