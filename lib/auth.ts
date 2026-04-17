import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      onboarding_complete?: boolean
      monthly_income?: number
      risk_appetite?: number
    }
  }
  interface User {
    id: string
    onboarding_complete?: boolean
    monthly_income?: number
    risk_appetite?: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    onboarding_complete?: boolean
    monthly_income?: number
    risk_appetite?: number
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (!user || !user.password_hash) return null

        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar_url,
          onboarding_complete: user.onboarding_complete,
          monthly_income: user.monthly_income,
          risk_appetite: user.risk_appetite,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const { data: existing } = await supabase
          .from('users')
          .select('id, onboarding_complete')
          .eq('email', user.email!)
          .single()

        if (existing) {
          await supabase
            .from('users')
            .update({
              avatar_url: user.image,
              google_id: profile?.sub,
              auth_provider: 'google',
            })
            .eq('id', existing.id)
          user.id = existing.id
          user.onboarding_complete = existing.onboarding_complete
        } else {
          const { data: created } = await supabase
            .from('users')
            .insert({
              name: user.name ?? 'User',
              email: user.email,
              avatar_url: user.image,
              google_id: profile?.sub,
              auth_provider: 'google',
              monthly_income: 0,
              onboarding_complete: false,
            })
            .select('id')
            .single()

          if (created) {
            user.id = created.id
            user.onboarding_complete = false
          }
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.onboarding_complete = user.onboarding_complete
        token.monthly_income = user.monthly_income
        token.risk_appetite = user.risk_appetite
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = token.id
      session.user.onboarding_complete = token.onboarding_complete
      session.user.monthly_income = token.monthly_income
      session.user.risk_appetite = token.risk_appetite
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}
