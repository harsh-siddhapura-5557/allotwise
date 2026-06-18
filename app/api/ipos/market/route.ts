import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock market IPO data
const mockMarketIpos = [
  {
    source: 'NSE',
    type: 'current',
    symbol: 'INNOVENT',
    companyName: 'Innoventive Industries Limited',
    series: 'EQ',
    issuePrice: 'Rs. 65 to Rs. 70',
    lotSize: '2000 Equity Shares',
    issueStartDate: '18-June-2026',
    issueEndDate: '20-June-2026',
    noOfSharesOffered: '5000000',
    noOfsharesBid: '8500000',
    noOfTime: 1.7
  },
  {
    source: 'NSE',
    type: 'current',
    symbol: 'SHRIRAMP',
    companyName: 'Shriram Properties Limited',
    series: 'EQ',
    issuePrice: 'Rs. 45 to Rs. 50',
    lotSize: '3000 Equity Shares',
    issueStartDate: '17-June-2026',
    issueEndDate: '19-June-2026',
    noOfSharesOffered: '7500000',
    noOfsharesBid: '12000000',
    noOfTime: 1.6
  },
  {
    source: 'NSE',
    type: 'upcoming',
    symbol: 'TATATECH',
    companyName: 'Tata Technologies Limited',
    series: 'EQ',
    issuePrice: 'Rs. 500',
    lotSize: '30 Equity Shares',
    issueStartDate: '22-June-2026',
    issueEndDate: '24-June-2026',
    issueSize: 'Rs. 3000 Cr'
  },
  {
    source: 'NSE',
    type: 'upcoming',
    symbol: 'JYOTICNC',
    companyName: 'Jyoti CNC Automation Limited',
    series: 'EQ',
    issuePrice: 'Rs. 331 to Rs. 349',
    lotSize: '45 Equity Shares',
    issueStartDate: '25-June-2026',
    issueEndDate: '27-June-2026',
    issueSize: 'Rs. 1500 Cr'
  },
  {
    source: 'NSE',
    type: 'upcoming',
    symbol: 'VIBHOR',
    companyName: 'Vibhor Steel Tubes Limited',
    series: 'SME',
    issuePrice: 'Rs. 151',
    lotSize: '8000 Equity Shares',
    issueStartDate: '28-June-2026',
    issueEndDate: '30-June-2026',
    issueSize: 'Rs. 250 Cr'
  }
]

// Helper functions
function parsePriceRange(priceRange: string): number {
  const matches = priceRange.match(/Rs\.?\s*(\d+(\.\d+)?)/g)
  if (matches && matches.length >= 2) {
    const prices = matches.map((m: string) => parseFloat(m.replace(/Rs\.?\s*/, '')))
    return Math.max(...prices)
  } else if (matches && matches.length === 1) {
    return parseFloat(matches[0].replace(/Rs\.?\s*/, ''))
  }
  return 0
}

function parseLotSize(lotSizeStr: string): number {
  const match = lotSizeStr.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}

function parseDates(startStr: string, endStr: string): { openDate: Date; closeDate: Date } {
  const parseDate = (d: string) => {
    const [day, month, year] = d.split('-')
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December']
    const monthIndex = months.indexOf(month)
    return new Date(parseInt(year, 10), monthIndex, parseInt(day, 10))
  }
  return {
    openDate: parseDate(startStr.trim()),
    closeDate: parseDate(endStr.trim())
  }
}

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get existing IPO names from our database
    const existingIpos = await prisma.iPO.findMany({ select: { name: true } })
    const existingNames = new Set(existingIpos.map((ipo: any) => ipo.name))

    const marketIpos = []

    // Process all mock IPOs
    for (const ipo of mockMarketIpos) {
      const parsedDates = parseDates(ipo.issueStartDate, ipo.issueEndDate)
      
      const marketIpo: any = {
        source: ipo.source,
        type: ipo.type,
        symbol: ipo.symbol,
        name: ipo.companyName,
        ipoType: ipo.series === 'SME' ? 'SME' : 'MAINBOARD',
        status: ipo.type === 'current' ? 'OPEN' : 'UPCOMING',
        issuePrice: parsePriceRange(ipo.issuePrice),
        lotSize: parseLotSize(ipo.lotSize),
        openDate: parsedDates.openDate,
        closeDate: parsedDates.closeDate,
        alreadyAdded: existingNames.has(ipo.companyName),
      }

      if (ipo.type === 'current') {
        marketIpo.subscription = {
          noOfSharesOffered: ipo.noOfSharesOffered,
          noOfSharesBid: ipo.noOfsharesBid,
          timesSubscribed: ipo.noOfTime
        }
      } else {
        marketIpo.issueSize = ipo.issueSize
      }

      marketIpos.push(marketIpo)
    }

    return NextResponse.json({ success: true, ipos: marketIpos })
  } catch (error) {
    console.error('Error fetching market IPOs:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch market IPOs', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}