# FinPath — AI-Powered Personal CFO for Indian Users

FinPath is an AI-powered personal finance app that closes the gap between daily spending and generational wealth. It runs 4 Claude-powered agents: Behavioral Analysis, Goal Modeling, Portfolio Intelligence, and a real-time Nudge Guardian that warns you before a purchase hurts your financial goals. Built for Indian users with ₹ formatting, Indian fund recommendations, and SEBI-aligned portfolio suggestions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Database | Supabase (Postgres) |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Notifications | react-hot-toast |
| Icons | lucide-react |
| PDF Export | jsPDF + html2canvas |
| SMS | Twilio |

---

## Setup

### Prerequisites
- Node.js >= 20.9.0
- Supabase project
- Anthropic API key

### Steps

```bash
# 1. Clone and install
git clone <repo>
cd finpath
npm install

# 2. Fill environment variables
# Edit .env.local with your actual keys:
#   ANTHROPIC_API_KEY=sk-ant-...
#   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
#   SUPABASE_SERVICE_ROLE_KEY=eyJ...
#   TWILIO_ACCOUNT_SID=AC...
#   TWILIO_AUTH_TOKEN=...
#   TWILIO_PHONE_NUMBER=+1...

# 3. Set up database
# Open your Supabase project → SQL Editor
# Paste and run the contents of SUPABASE_SCHEMA.sql

# 4. Seed demo data (optional)
npx ts-node --project tsconfig.json -r tsconfig-paths/register scripts/seed.ts
# Copy the printed UUID into .env.local as NEXT_PUBLIC_DEMO_USER_ID

# 5. Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Hackathon Demo Flow (8 steps)

1. **Landing page** — Show the hero headline and 3 feature cards. Click "Start for free →"
2. **Onboarding Step 1** — Enter name "Arjun Mehta", income ₹75,000, and phone number
3. **Onboarding Step 2** — Answer the 3 risk questions. Pick "Buy more — it's a discount!" to show risk score 5
4. **Onboarding Step 3** — Drag and drop a sample bank CSV to show auto-parsing and category detection
5. **Dashboard** — Show the animated health score, spending pie chart, and leakage cards (e.g., Swiggy weekend pattern)
6. **Add Expense** — Click "+ Add Expense", enter "Swiggy ₹450, Food & Dining". Watch the Nudge Guardian popup appear with the orange warning, impact line, and two buttons
7. **Goals page** — Create "Goa Trip ₹30,000 in 6 months". Watch the live preview calculate ₹156/day instantly as you type. Submit to trigger the AI narrative
8. **Portfolio page** — Show the donut chart with allocation, SIP amount, and real Indian fund names like "Parag Parikh Flexi Cap" and "Sovereign Gold Bond"

---

## AI Agents

| Agent | Function | Max Tokens |
|---|---|---|
| Behavioral Analysis | Categorizes spend, finds leakage patterns, scores health | 1000 |
| Goal Modeling | Calculates inflation-adjusted daily savings, writes narrative | 120 |
| Portfolio Intelligence | SEBI-aligned allocation with real Indian funds | 800 |
| Nudge Guardian | Warns before goal-hurting purchases with exact impact | 200 |

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API access |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only full-access key |
| `TWILIO_ACCOUNT_SID` | SMS alerts |
| `TWILIO_AUTH_TOKEN` | SMS alerts |
| `TWILIO_PHONE_NUMBER` | SMS sender number |
| `NEXT_PUBLIC_DEMO_USER_ID` | Pre-seeded demo user UUID |
