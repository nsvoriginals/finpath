import { NextRequest } from 'next/server'
import type { TransactionCategory } from '@/types'

function guessCategory(description: string): TransactionCategory {
  const d = description.toLowerCase()
  if (/swiggy|zomato|food|restaurant|cafe|dining|lunch|dinner|breakfast/.test(d))
    return 'Food & Dining'
  if (/uber|ola|fuel|petrol|diesel|cab|taxi|metro|bus|train|rapido/.test(d))
    return 'Transport'
  if (/netflix|hotstar|prime|spotify|youtube premium|zee5|sonyliv|entertainment/.test(d))
    return 'Subscriptions'
  if (/amazon|flipkart|myntra|meesho|nykaa|ajio|shopping/.test(d)) return 'Shopping'
  if (/hospital|pharmacy|apollo|medical|clinic|doctor|health|medicine|chemist/.test(d))
    return 'Healthcare'
  if (/electricity|bescom|water|gas|bsnl|airtel|jio|utility|broadband/.test(d))
    return 'Utilities'
  if (/pvr|inox|cinema|movie|concert|event|theatre/.test(d)) return 'Entertainment'
  return 'Other'
}

function parseDate(raw: string): string {
  raw = raw.trim()
  const ddmmyyyy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
  const ddmmyy = raw.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
  if (ddmmyy) return `20${ddmmyy[3]}-${ddmmyy[2]}-${ddmmyy[1]}`
  const yyyymmdd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (yyyymmdd) return raw
  return new Date().toISOString().split('T')[0]
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter((l) => l.trim())

    if (lines.length < 2) {
      return Response.json({ error: 'CSV file is empty or invalid' }, { status: 400 })
    }

    const header = lines[0].toLowerCase()
    const isHDFC = header.includes('withdrawal') || header.includes('debit')
    const isSBI = header.includes('debit') && header.includes('balance')

    const transactions: Array<{
      merchant: string
      amount: number
      date: string
      category: TransactionCategory
    }> = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/"/g, ''))
      if (cols.length < 3) continue

      let date = ''
      let description = ''
      let amount = 0

      if (isHDFC || isSBI) {
        date = parseDate(cols[0])
        description = cols[1] ?? ''
        const debit = parseFloat(cols[3]?.replace(/,/g, '') ?? '0')
        amount = isNaN(debit) ? 0 : debit
      } else {
        date = parseDate(cols[0])
        description = cols[1] ?? ''
        const rawAmt = cols[2]?.replace(/,/g, '') ?? '0'
        amount = Math.abs(parseFloat(rawAmt) || 0)
      }

      if (!description || amount <= 0) continue

      const merchant = description.length > 40 ? description.slice(0, 40) : description
      transactions.push({
        merchant,
        amount,
        date,
        category: guessCategory(description),
      })
    }

    return Response.json(transactions)
  } catch (error) {
    console.error('parse-csv error:', error)
    return Response.json({ error: 'CSV parsing failed' }, { status: 500 })
  }
}
