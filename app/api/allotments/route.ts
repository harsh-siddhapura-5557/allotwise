import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { applicationId, sharesAllotted, issuePrice, listingPrice, sellPrice } = body

  if (!applicationId || !sharesAllotted || !issuePrice) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  const shares = parseInt(sharesAllotted)
  const issue = parseFloat(issuePrice)
  const sell = sellPrice ? parseFloat(sellPrice) : null
  const listing = listingPrice ? parseFloat(listingPrice) : null

  let profit = null
  let loss = null
  if (sell !== null) {
    const pnl = (sell - issue) * shares
    if (pnl >= 0) profit = pnl
    else loss = Math.abs(pnl)
  }

  try {
    const allotment = await prisma.allotment.upsert({
      where: { applicationId },
      create: {
        applicationId,
        sharesAllotted: shares,
        issuePrice: issue,
        listingPrice: listing,
        sellPrice: sell,
        profit,
        loss,
      },
      update: {
        sharesAllotted: shares,
        issuePrice: issue,
        listingPrice: listing,
        sellPrice: sell,
        profit,
        loss,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        applicationId,
        action: 'ALLOTMENT_UPDATED',
        details: `Updated allotment: ${shares} shares @ ₹${issue}${sell ? `, sold @ ₹${sell}` : ''}`,
      },
    })

    return NextResponse.json(allotment)
  } catch {
    return NextResponse.json({ error: 'Failed to save allotment' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const applicationId = searchParams.get('applicationId')

  if (applicationId) {
    const allotment = await prisma.allotment.findUnique({ where: { applicationId } })
    return NextResponse.json(allotment)
  }

  const allotments = await prisma.allotment.findMany({
    include: {
      application: {
        include: {
          ipo: { select: { name: true, ipoType: true } },
          member: { select: { fullName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(allotments)
}
