import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

async function seed() {
  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({
      name: 'Arjun Mehta',
      email: 'arjun@demo.com',
      monthly_income: 75000,
      risk_appetite: 3,
      phone: '+919876543210',
    })
    .select()
    .single()

  if (userErr) { console.error('User creation failed:', userErr); process.exit(1) }
  console.log('Created user:', user.id)

  const transactions = [
    // Swiggy/Zomato — 8 orders, clustered on weekends and after 10pm
    { merchant: 'Swiggy', amount: 320, category: 'Food & Dining', date: daysAgo(2), note: 'Late night order' },
    { merchant: 'Zomato', amount: 450, category: 'Food & Dining', date: daysAgo(4), note: 'Weekend dinner' },
    { merchant: 'Swiggy', amount: 280, category: 'Food & Dining', date: daysAgo(7), note: 'Weekend lunch' },
    { merchant: 'Zomato', amount: 390, category: 'Food & Dining', date: daysAgo(9), note: 'Late night order' },
    { merchant: 'Swiggy', amount: 210, category: 'Food & Dining', date: daysAgo(11), note: 'Saturday night' },
    { merchant: 'Zomato', amount: 380, category: 'Food & Dining', date: daysAgo(14), note: 'Sunday lunch' },
    { merchant: 'Swiggy', amount: 240, category: 'Food & Dining', date: daysAgo(16), note: 'Late night order' },
    { merchant: 'Zomato', amount: 420, category: 'Food & Dining', date: daysAgo(18), note: 'Weekend special' },

    // Subscriptions — 1st of month
    { merchant: 'Netflix', amount: 499, category: 'Subscriptions', date: daysAgo(16), note: 'Monthly subscription' },
    { merchant: 'Spotify', amount: 299, category: 'Subscriptions', date: daysAgo(16), note: 'Monthly subscription' },

    // Transport — Ola/Uber
    { merchant: 'Uber', amount: 220, category: 'Transport', date: daysAgo(3), note: 'Office commute' },
    { merchant: 'Ola', amount: 180, category: 'Transport', date: daysAgo(8), note: 'Airport drop' },
    { merchant: 'Rapido', amount: 150, category: 'Transport', date: daysAgo(12), note: 'Quick ride' },

    // Grocery
    { merchant: 'Reliance Fresh', amount: 1450, category: 'Food & Dining', date: daysAgo(5), note: 'Weekly groceries' },
    { merchant: 'BigBasket', amount: 980, category: 'Food & Dining', date: daysAgo(10), note: 'Online grocery' },
    { merchant: 'DMart', amount: 2100, category: 'Food & Dining', date: daysAgo(20), note: 'Monthly stock-up' },
    { merchant: 'Reliance Fresh', amount: 850, category: 'Food & Dining', date: daysAgo(32), note: 'Weekly groceries' },

    // Amazon/Flipkart — impulse shopping spike
    { merchant: 'Amazon', amount: 1200, category: 'Shopping', date: daysAgo(6), note: 'Impulse buy' },
    { merchant: 'Flipkart', amount: 3400, category: 'Shopping', date: daysAgo(15), note: 'Sale purchase' },

    // Utilities
    { merchant: 'BESCOM Electricity', amount: 1200, category: 'Utilities', date: daysAgo(13), note: 'Monthly bill' },
    { merchant: 'Airtel Broadband', amount: 599, category: 'Utilities', date: daysAgo(13), note: 'Internet bill' },

    // Healthcare
    { merchant: 'Apollo Pharmacy', amount: 680, category: 'Healthcare', date: daysAgo(22), note: 'Medicines' },

    // Small daily expenses
    { merchant: 'Chai Thela', amount: 30, category: 'Food & Dining', date: daysAgo(1), note: 'Morning tea' },
    { merchant: 'Canteen', amount: 85, category: 'Food & Dining', date: daysAgo(1), note: 'Lunch' },
    { merchant: 'Petrol Pump', amount: 500, category: 'Transport', date: daysAgo(3), note: 'Fuel' },
    { merchant: 'D-Mart', amount: 340, category: 'Shopping', date: daysAgo(4), note: 'Household items' },
    { merchant: 'PVR Cinemas', amount: 580, category: 'Entertainment', date: daysAgo(6), note: 'Movie night' },
    { merchant: 'Stationery Shop', amount: 120, category: 'Other', date: daysAgo(8), note: 'Office supplies' },
    { merchant: 'Swiggy Instamart', amount: 195, category: 'Food & Dining', date: daysAgo(9), note: 'Quick delivery' },
    { merchant: 'Jio Recharge', amount: 299, category: 'Utilities', date: daysAgo(25), note: 'Monthly recharge' },
  ]

  const txInserts = transactions.map((t) => ({ ...t, user_id: user.id }))
  const { error: txErr } = await supabase.from('transactions').insert(txInserts)
  if (txErr) { console.error('Transactions failed:', txErr); process.exit(1) }
  console.log(`Created ${transactions.length} transactions`)

  const { error: goalErr } = await supabase.from('goals').insert({
    user_id: user.id,
    title: 'Goa Trip',
    target_amount: 30000,
    current_savings: 6000,
    deadline_months: 6,
    daily_save_required: 156,
    narrative: 'Save ₹156/day for 6 months and you will be sipping cocktails in Goa by October!',
    status: 'active',
  })

  if (goalErr) { console.error('Goal creation failed:', goalErr); process.exit(1) }
  console.log('Created goal: Goa Trip')

  console.log('\n✅ Seed complete!')
  console.log(`\nPaste this into .env.local:\nNEXT_PUBLIC_DEMO_USER_ID=${user.id}`)
}

seed()
