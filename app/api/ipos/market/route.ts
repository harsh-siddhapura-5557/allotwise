import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { NSE } from '@bshada/nseapi'
import { prisma } from '@/lib/prisma'

// Helper functions (same as in import-nse)
function extractValue(dataList: any[], title: string): string | null {
  const item = dataList.find((item: any) => item.title === title)
  return item ? item.value : null
}

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

function parseDates(issuePeriod: string): { openDate: Date; closeDate: Date } {
  const [startStr, endStr] = issuePeriod.split(' to ')
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
    const nse = new NSE('./downloads')
    
    // Fetch all current and upcoming IPOs
    const currentIpos = await nse.listCurrentIPO()
    const upcomingIpos = await nse.listUpcomingIPO()

    // Get existing IPO names from our database to check if already added
    const existingIpos = await prisma.iPO.findMany({ select: { name: true } })
    const existingNames = new Set(existingIpos.map((ipo: any) => ipo.name))

    const marketIpos = []

    // Process current IPOs
    for (const ipo of currentIpos) {
      // Get details
      const details = await nse.getIpoDetails({ 
        symbol: ipo.symbol, 
        series: ipo.series as any 
      })
      const issueInfoDataList = details.issueInfo?.dataList || []
      const priceRange = extractValue(issueInfoDataList, 'Price Range') || ''
      const lotSizeStr = extractValue(issueInfoDataList, 'Lot Size') || ''
      const issuePeriod = extractValue(issueInfoDataList, 'Issue Period') || ''
      let openDate = new Date()
      let closeDate = new Date()
      if (issuePeriod) {
        const parsedDates = parseDates(issuePeriod)
        openDate = parsedDates.openDate
        closeDate = parsedDates.closeDate
      }

      marketIpos.push({
        source: 'NSE',
        type: 'current',
        symbol: ipo.symbol,
        name: ipo.companyName,
        ipoType: ipo.series === 'SME' ? 'SME' : 'MAINBOARD',
        status: 'OPEN',
        issuePrice: parsePriceRange(priceRange),
        lotSize: parseLotSize(lotSizeStr),
        openDate,
        closeDate,
        alreadyAdded: existingNames.has(ipo.companyName),
        subscription: {
          noOfSharesOffered: ipo.noOfSharesOffered,
          noOfSharesBid: ipo.noOfsharesBid,
          timesSubscribed: ipo.noOfTime
        }
      })
    }

    // Process upcoming IPOs
    for (const ipo of upcomingIpos) {
      let lotSize = 1
      let priceRange = ipo.issuePrice || ipo.priceBand || ''
      // Try to get details for upcoming IPO if possible
      try {
        const details = await nse.getIpoDetails({ 
          symbol: ipo.symbol, 
          series: ipo.series as any 
        })
        const issueInfoDataList = details.issueInfo?.dataList || []
        priceRange = extractValue(issueInfoDataList, 'Price Range') || priceRange
        const lotSizeStr = extractValue(issueInfoDataList, 'Lot Size') || ''
        if (lotSizeStr) lotSize = parseLotSize(lotSizeStr)
      } catch (e) {
        // If we can't get details, use whatever we have
        if (ipo.lotSize) lotSize = parseInt(ipo.lotSize, 10)
      }

      marketIpos.push({
        source: 'NSE',
        type: 'upcoming',
        symbol: ipo.symbol,
        name: ipo.companyName,
        ipoType: ipo.series === 'SME' || ipo.series === 'BE' ? 'SME' : 'MAINBOARD',
        status: 'UPCOMING',
        issuePrice: parsePriceRange(priceRange),
        lotSize,
        openDate: new Date(ipo.issueStartDate),
        closeDate: new Date(ipo.issueEndDate),
        alreadyAdded: existingNames.has(ipo.companyName),
        issueSize: ipo.issueSize
      })
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
