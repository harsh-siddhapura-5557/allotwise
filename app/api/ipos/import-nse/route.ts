import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { NSE } from '@bshada/nseapi'

// Helper to extract value from issueInfo.dataList
function extractValue(dataList: any[], title: string): string | null {
  const item = dataList.find((item: any) => item.title === title)
  return item ? item.value : null
}

// Helper to parse price range like "Rs.193 to Rs.203 per equity share"
function parsePriceRange(priceRange: string): number {
  const matches = priceRange.match(/Rs\.?\s*(\d+(\.\d+)?)/g)
  if (matches && matches.length >= 2) {
    // Take the higher price as issuePrice
    const prices = matches.map((m: string) => parseFloat(m.replace(/Rs\.?\s*/, '')))
    return Math.max(...prices)
  } else if (matches && matches.length === 1) {
    return parseFloat(matches[0].replace(/Rs\.?\s*/, ''))
  }
  return 0
}

// Helper to parse lot size like "600 Equity Shares"
function parseLotSize(lotSizeStr: string): number {
  const match = lotSizeStr.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}

// Helper to parse dates like "17-June-2026" or "19-JUN-2026"
function parseDateFromNSE(dateStr: string): Date {
  const parts = dateStr.split('-')
  let [day, monthStr, year] = parts
  if (parts.length < 3) {
    // Handle different formats
    return new Date()
  }
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
  let monthIndex = months.indexOf(monthStr.toUpperCase())
  if (monthIndex === -1) {
    monthIndex = monthNames.indexOf(monthStr)
  }
  return new Date(parseInt(year, 10), monthIndex, parseInt(day, 10))
}

// Helper to add an IPO to database
async function addIpoToDatabase(
  sessionId: string,
  ipoData: any,
  type: 'current' | 'upcoming',
  nse: NSE
) {
  // Get details if possible
  let details
  try {
    details = await nse.getIpoDetails({ 
      symbol: ipoData.symbol, 
      series: ipoData.series as any 
    })
  } catch (e) {} // ignore if details not available

  const issueInfoDataList = details?.issueInfo?.dataList || []
  let priceRange = ''
  let lotSizeStr = ''
  let issuePeriod = ''

  if (details) {
    priceRange = extractValue(issueInfoDataList, 'Price Range') || ''
    lotSizeStr = extractValue(issueInfoDataList, 'Lot Size') || ''
    issuePeriod = extractValue(issueInfoDataList, 'Issue Period') || ''
  }

  // Fallback to data from list
  if (!priceRange) priceRange = ipoData.issuePrice || ipoData.priceBand || ''
  if (!lotSizeStr && ipoData.lotSize) lotSizeStr = ipoData.lotSize

  let openDate: Date
  let closeDate: Date
  if (issuePeriod) {
    const [startStr, endStr] = issuePeriod.split(' to ')
    openDate = parseDateFromNSE(startStr.trim())
    closeDate = parseDateFromNSE(endStr.trim())
  } else if (ipoData.issueStartDate && ipoData.issueEndDate) {
    openDate = parseDateFromNSE(ipoData.issueStartDate)
    closeDate = parseDateFromNSE(ipoData.issueEndDate)
  } else if (ipoData.ipoStartDate && ipoData.ipoEndDate) {
    openDate = parseDateFromNSE(ipoData.ipoStartDate)
    closeDate = parseDateFromNSE(ipoData.ipoEndDate)
  } else {
    openDate = new Date()
    closeDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }

  const issuePrice = parsePriceRange(priceRange)
  const lotSize = parseLotSize(lotSizeStr)
  const series = ipoData.series || ipoData.securityType || 'EQ'
  const ipoType = series === 'SME' || series === 'BE' ? 'SME' : 'MAINBOARD'
  const status = type === 'current' ? 'OPEN' : 'UPCOMING'

  const newIpo = await prisma.iPO.create({
    data: {
      name: ipoData.companyName || ipoData.company,
      ipoType,
      issuePrice,
      lotSize,
      openDate,
      closeDate,
      status,
    }
  })

  await prisma.activityLog.create({
    data: {
      userId: sessionId,
      action: 'IPO_IMPORTED',
      details: `Imported ${type} IPO: ${newIpo.name} (${ipoType})`,
    }
  })

  return newIpo
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const nse = new NSE('./downloads')
    
    const importedIpos = []

    // 1. Import current IPOs
    const currentIpos = await nse.listCurrentIPO()
    for (const ipo of currentIpos) {
      const existing = await prisma.iPO.findFirst({
        where: { name: ipo.companyName }
      })
      if (!existing) {
        const newIpo = await addIpoToDatabase(session.id, ipo, 'current', nse)
        importedIpos.push(newIpo)
      }
    }

    // 2. Import upcoming IPOs
    const upcomingIpos = await nse.listUpcomingIPO()
    for (const ipo of upcomingIpos) {
      const existing = await prisma.iPO.findFirst({
        where: { name: ipo.companyName }
      })
      if (!existing) {
        const newIpo = await addIpoToDatabase(session.id, ipo, 'upcoming', nse)
        importedIpos.push(newIpo)
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported: importedIpos.length,
      ipos: importedIpos 
    })

  } catch (error) {
    console.error('Error importing from NSE:', error)
    return NextResponse.json({ 
      error: 'Failed to import IPOs', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Add single IPO from market
export async function PUT(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { symbol, series, companyName, type } = body

    const existing = await prisma.iPO.findFirst({
      where: { name: companyName }
    })
    if (existing) {
      return NextResponse.json({ success: false, error: 'IPO already added' })
    }

    const nse = new NSE('./downloads')
    const newIpo = await addIpoToDatabase(session.id, { symbol, series, companyName }, type, nse)
    return NextResponse.json({ success: true, ipo: newIpo })

  } catch (error) {
    console.error('Error adding IPO:', error)
    return NextResponse.json({ 
      error: 'Failed to add IPO', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
