import { NextRequest } from 'next/server'
import type { TransactionCategory } from '@/types'

function guessCategory(description: string): TransactionCategory {
  const d = description.toLowerCase()
  if (/swiggy|zomato|food|restaurant|cafe|dining|lunch|dinner|breakfast|chicken|fresh market|grocery|kirana|bigbasket|reliance fresh|dmart|blinkit|zepto/.test(d))
    return 'Food & Dining'
  if (/uber|ola|fuel|petrol|diesel|cab|taxi|metro|bus|train|rapido|bharat petroleum|hp gas|indian oil|hpcl|bpcl|iocl/.test(d))
    return 'Transport'
  if (/netflix|hotstar|prime video|spotify|youtube|zee5|sonyliv|disney/.test(d))
    return 'Subscriptions'
  if (/amazon|flipkart|myntra|meesho|nykaa|ajio|snapdeal|shopping|mall|store/.test(d))
    return 'Shopping'
  if (/hospital|pharmacy|medical|clinic|doctor|health|medicine|chemist|apollo|medplus|wellness|dental/.test(d))
    return 'Healthcare'
  if (/electricity|bescom|water|gas|bsnl|airtel|jio|broadband|bill|utility|recharge|tata power|tneb|mseb/.test(d))
    return 'Utilities'
  if (/pvr|inox|cinema|movie|concert|event|theatre|entertainment|bookmyshow/.test(d))
    return 'Entertainment'
  return 'Other'
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/[₹,\s]/g, '')) || 0
}

function parseDate(raw: string): string {
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  }
  const m = raw.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})/i)
  if (m) {
    const month = months[m[1].toLowerCase()]
    const day = m[2].padStart(2, '0')
    return `${m[3]}-${month}-${day}`
  }
  return new Date().toISOString().split('T')[0]
}

interface ParsedTransaction {
  merchant: string
  amount: number
  date: string
  category: TransactionCategory
  type: 'debit' | 'credit'
}

function parsePhonePeText(text: string): ParsedTransaction[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const transactions: ParsedTransaction[] = []
  const MONTH_RE = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}$/i
  const TIME_RE = /^\d{1,2}:\d{2}\s*(am|pm)$/i
  const SKIP_RE = /^(Transaction ID|UTR No|Paid by|Transaction Statement|Date Transaction|Ref No|UPI)/i
  const AMOUNT_RE = /(?:DEBIT|CREDIT)\s*₹\s*([\d,]+(?:\.\d{1,2})?)/i
  const INLINE_RE = /^Paid\s+(?:to|by)\s+(.+?)\s+(DEBIT|CREDIT)\s*₹\s*([\d,]+(?:\.\d{1,2})?)/i

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (MONTH_RE.test(line)) {
      const date = parseDate(line)
      i++ // skip time line if next
      if (i < lines.length && TIME_RE.test(lines[i])) i++

      let merchantParts: string[] = []
      let amount = 0
      let txType: 'debit' | 'credit' = 'debit'

      while (i < lines.length && !MONTH_RE.test(lines[i])) {
        const cur = lines[i]

        if (SKIP_RE.test(cur)) { i++; continue }

        // "Paid to MERCHANT DEBIT ₹300" — all on one line
        const inlineMatch = cur.match(INLINE_RE)
        if (inlineMatch) {
          merchantParts = [inlineMatch[1].trim()]
          txType = inlineMatch[2].toLowerCase() === 'debit' ? 'debit' : 'credit'
          amount = parseAmount(inlineMatch[3])
          i++
          break
        }

        // Amount line: "DEBIT ₹300" or "CREDIT ₹300"
        const amtMatch = cur.match(AMOUNT_RE)
        if (amtMatch) {
          const typeStr = cur.match(/^(DEBIT|CREDIT)/i)?.[1]?.toLowerCase()
          txType = typeStr === 'credit' ? 'credit' : 'debit'
          amount = parseAmount(amtMatch[1])
          i++
          break
        }

        // Merchant description line — "Paid to MERCHANT" or bare merchant name
        if (/^(Paid to|Received from)/i.test(cur)) {
          const name = cur.replace(/^(Paid to|Received from)\s*/i, '').trim()
          if (name) merchantParts.push(name)
        } else if (cur.length > 0 && cur.length < 60 && !TIME_RE.test(cur)) {
          merchantParts.push(cur)
        }
        i++
      }

      const merchant = merchantParts.join(' ').trim().slice(0, 50)
      if (merchant && amount > 0 && txType === 'debit') {
        transactions.push({ merchant, amount, date, category: guessCategory(merchant), type: 'debit' })
      }
      continue
    }
    i++
  }

  return transactions
}

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const isPDF = file.name.endsWith('.pdf') || file.type === 'application/pdf'

    if (isPDF) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Dynamic import to avoid edge runtime issues
      const pdfParse = (await import('pdf-parse')).default
      const pdfData = await pdfParse(buffer)
      const transactions = parsePhonePeText(pdfData.text)

      if (transactions.length === 0) {
        return Response.json(
          { error: 'No debit transactions found. Ensure this is a PhonePe or UPI statement PDF.' },
          { status: 422 }
        )
      }

      return Response.json(transactions)
    }

    // Fallback: treat as text for debug
    const text = await file.text()
    const transactions = parsePhonePeText(text)
    return Response.json(transactions)
  } catch (error) {
    console.error('parse-pdf error:', error)
    return Response.json({ error: 'PDF parsing failed. Please try again.' }, { status: 500 })
  }
}
