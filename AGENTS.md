# FinPath — AI Coding Agent Guide

## What this project is
FinPath is an AI-powered personal finance web app built with Next.js 14.
It has 4 AI agents powered by Claude API:
1. Behavioral Analysis Agent — categorizes spending, finds leakage patterns
2. Goal Modeling Agent — calculates daily savings needed for goals
3. Portfolio Agent — suggests Indian market investment allocation
4. Nudge Agent — warns users before a purchase hurts their goal

---

## Tech stack (never deviate from this)
- Framework: Next.js 14 with App Router
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS only — no CSS modules, no styled-components
- Charts: Recharts only
- Database: Supabase (Postgres)
- AI: @anthropic-ai/sdk — model is always claude-sonnet-4-20250514
- Notifications: react-hot-toast
- SMS: twilio
- PDF: jspdf + html2canvas

---

## Folder structure — follow this exactly

```
app/
  (auth)/
    onboarding/
      page.tsx          ← 3-step onboarding wizard
  dashboard/
    page.tsx            ← main home screen
  transactions/
    page.tsx            ← full transaction list with search/filter
  goals/
    page.tsx            ← goal creation and progress tracking
  portfolio/
    page.tsx            ← investment allocation and fund suggestions
  api/
    analyze-spending/
      route.ts          ← POST: runs Behavioral Agent
    calculate-goal/
      route.ts          ← POST: runs Goal Agent
    portfolio-suggest/
      route.ts          ← POST: runs Portfolio Agent
    nudge/
      route.ts          ← POST: runs Nudge Agent
    transactions/
      route.ts          ← GET all, POST new transaction
    goals/
      route.ts          ← GET all, POST new goal
    dashboard/
      route.ts          ← GET aggregated dashboard data
    parse-csv/
      route.ts          ← POST: parses uploaded bank CSV
  layout.tsx
  page.tsx              ← landing page, redirects to /onboarding or /dashboard

components/
  Sidebar.tsx           ← left nav with 5 links
  charts/
    SpendingPie.tsx     ← Recharts PieChart for category breakdown
    PortfolioDonut.tsx  ← Recharts PieChart with innerRadius for allocation
    GoalProgress.tsx    ← progress bar component per goal
  AddExpenseDrawer.tsx  ← slide-in form, triggers nudge before saving
  NudgePopup.tsx        ← orange warning modal with proceed/skip buttons
  LeakageCard.tsx       ← red-bordered card showing one leakage pattern
  GoalCard.tsx          ← goal card with progress bar and daily save badge
  HealthScore.tsx       ← large animated score number with color coding

lib/
  claude.ts             ← Anthropic client singleton
  supabase.ts           ← Supabase client (browser + server versions)
  agents/
    behavioral.ts       ← analyzeBehavior(transactions[]) → SpendingAnalysis
    goal.ts             ← buildGoalPlan(...) → GoalCalculation
    portfolio.ts        ← suggestPortfolio(risk, income) → PortfolioSuggestion
    nudge.ts            ← generateNudge(...) → NudgeResponse
  utils/
    goalMath.ts         ← pure math functions, no AI, no imports
    exportPDF.ts        ← jsPDF + html2canvas export function
    formatCurrency.ts   ← ₹ formatting helpers

types/
  index.ts              ← all shared TypeScript interfaces

prisma/                 ← only if using Prisma ORM (optional)
  schema.prisma
```

---

## App Router rules — always follow these

### Server vs client components
- Every file is a Server Component by default
- Only add `'use client'` at the top when the component uses:
  - useState, useEffect, useCallback, useMemo
  - onClick, onChange, or any event handler
  - react-hot-toast
  - Recharts (all Recharts components need 'use client')
- Never add `'use client'` to API route files — they are always server-side

### API routes
- Always export named functions: `export async function GET()`, `export async function POST()`
- Never use `export default` in API routes
- Always return `NextResponse.json(data)` — never `res.json()`
- Always wrap in try/catch and return a fallback on error
- Read request body with `await req.json()` — never `req.body`

Example correct API route:
```typescript
// app/api/analyze-spending/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { analyzeBehavior } from '@/lib/agents/behavioral'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json()
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
    const result = await analyzeBehavior(data ?? [])
    return NextResponse.json(result)
  } catch (error) {
    console.error('analyze-spending error:', error)
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}
```

### Routing and navigation
- Use `<Link href="/dashboard">` from `next/link` — never `<a href>`
- Use `useRouter()` from `next/navigation` — never from `next/router`
- Use `redirect()` from `next/navigation` in server components
- Dynamic routes go in folders like `app/goals/[id]/page.tsx`

### Data fetching
- Fetch data in Server Components when possible — no useEffect needed
- Use `fetch()` with `{ cache: 'no-store' }` for always-fresh data
- Use React Server Actions for form submissions when possible
- Client components fetch via `axios` or `fetch` to `/api/...` routes

---

## Claude API rules — critical

### Always use this exact setup
```typescript
// lib/claude.ts
import Anthropic from '@anthropic-ai/sdk'

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})
```

### Always use this model
```
claude-sonnet-4-20250514
```
Never use claude-3, claude-instant, or any other model string.

### Always wrap in try/catch with typed fallback
Every agent function must return a hardcoded fallback object if Claude fails.
Never let a Claude error crash the endpoint. Never return raw error messages to the client.

### Always ask Claude for JSON output
- Set the system prompt to say "Return ONLY valid JSON. No markdown. No explanation."
- Parse with `JSON.parse(response.content[0].text)` inside try/catch
- If JSON.parse fails, return the fallback — never throw

### Token limits per agent
- Behavioral Agent: max_tokens 1000
- Goal Agent narrative: max_tokens 150
- Portfolio Agent: max_tokens 800
- Nudge Agent: max_tokens 200

---

## Supabase rules

### Two clients — use the right one
```typescript
// lib/supabase.ts

// For use in Server Components and API routes (has service role access)
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // server only — never expose to client
)

// For use in Client Components (limited anon access)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Table names (exact, case-sensitive)
- `users`
- `transactions`
- `goals`
- `portfolio_profiles`
- `nudge_log`

### Never write raw SQL — always use Supabase query builder
```typescript
// Correct
const { data } = await supabase.from('transactions').select('*').eq('user_id', id)

// Never do this
const { data } = await supabase.rpc('select * from transactions where...')
```

---

## TypeScript interfaces — use these everywhere

```typescript
// types/index.ts

export interface User {
  id: string
  name: string
  email: string
  monthly_income: number
  risk_appetite: number  // 1–5
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  merchant: string
  category: TransactionCategory
  date: string
  note?: string
  created_at: string
}

export type TransactionCategory =
  | 'Food & Dining'
  | 'Transport'
  | 'Entertainment'
  | 'Subscriptions'
  | 'Shopping'
  | 'Utilities'
  | 'Healthcare'
  | 'Other'

export interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_savings: number
  deadline_months: number
  daily_save_required: number
  narrative: string
  status: 'active' | 'completed' | 'paused'
  created_at: string
}

export interface SpendingAnalysis {
  categories: Record<string, number>
  leakage_patterns: LeakagePattern[]
  health_score: number
  health_label: string
  top_insight: string
  monthly_total: number
}

export interface LeakagePattern {
  pattern: string
  amount: number
  frequency: string
  suggestion: string
}

export interface GoalCalculation {
  daily_save_required: number
  monthly_save_required: number
  inflation_adjusted_target: number
  percent_of_income: number
  feasible: boolean
  narrative: string
}

export interface PortfolioSuggestion {
  allocation: {
    equity: number
    debt: number
    gold: number
    cash: number
  }
  instruments: Record<string, string[]>
  sip_amount: number
  reasoning: string
  macro_note: string
}

export interface NudgeResponse {
  show_nudge: boolean
  severity?: 'info' | 'warning' | 'danger'
  message?: string
  impact?: string
  proceed_text?: string
  reconsider_text?: string
}

export interface DashboardData {
  user: User
  analysis: SpendingAnalysis
  goals: Goal[]
  portfolio: PortfolioSuggestion | null
  recent_transactions: Transaction[]
  money_saved_by_guardian: number
}
```

---

## Environment variables — all required

```
# .env.local

ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
DEMO_USER_ID=paste-uuid-after-seeding
NEXT_PUBLIC_DEMO_USER_ID=paste-uuid-after-seeding
```

Never access `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` in client components.
Only `NEXT_PUBLIC_` prefixed variables are safe on the client.

---

## Tailwind rules

- Use only Tailwind utility classes — no inline styles except for dynamic values
- Dynamic colors must use inline style: `style={{ width: `${percent}%` }}`
- Color palette for FinPath:
  - Primary: purple-600, purple-700, purple-50
  - Success: green-500, green-50
  - Warning: orange-400, orange-50
  - Danger: red-500, red-50
  - Neutral: gray-100, gray-200, gray-500
  - Health score colors: green-500 (>75), amber-500 (50–75), red-500 (<50)

---

## Component rules

### Every chart component needs 'use client'
```typescript
'use client'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
```

### Every form needs controlled inputs with useState
Never use uncontrolled inputs or refs for forms.

### The nudge flow — exact order of operations
```
User fills AddExpenseDrawer and clicks submit
  → POST /api/nudge with { merchant, amount, category, goal_id, user_id }
  → If response.show_nudge === true:
      → Show NudgePopup
      → User clicks "Skip it":
          → POST /api/nudge-log with { action: 'skipped', amount }
          → Show green toast "Goal moved closer ✓"
          → Do NOT save transaction
      → User clicks "Buy anyway":
          → POST /api/transactions to save
          → Close popup
  → If response.show_nudge === false:
      → POST /api/transactions immediately
      → Show small success toast
```

Never save the transaction before checking the nudge. Never show the nudge after saving.

---

## What NOT to do — common mistakes to avoid

- Never use `pages/` directory — this project uses `app/` only
- Never use `getServerSideProps` or `getStaticProps` — those are Pages Router only
- Never use `useRouter` from `next/router` — use `next/navigation`
- Never use `export default` in API route files
- Never hardcode the Anthropic API key — always use `process.env.ANTHROPIC_API_KEY`
- Never call Claude from a Client Component — only from API routes or Server Components
- Never use `any` type in TypeScript — use the interfaces from `types/index.ts`
- Never skip the try/catch on Claude calls — always return a fallback
- Never use `console.log` in production — use `console.error` for actual errors only
- Never import from `react-hot-toast` in a Server Component

---

## Demo user for development

After running the seed script, a demo user is created with:
- Name: Arjun Mehta
- Income: ₹75,000/month
- Risk appetite: 3/5
- 30 pre-seeded transactions with deliberate leakage patterns

Store the returned UUID in `DEMO_USER_ID` and `NEXT_PUBLIC_DEMO_USER_ID` in `.env.local`.
All development and demo runs use this user. Do not create new users during the hackathon demo.