import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const type = searchParams.get('type') || ''
  const status = searchParams.get('status') || ''

  const ipos = await prisma.iPO.findMany({
    where: {
      ...(search && { name: { contains: search } }),
      ...(type && { ipoType: type }),
      ...(status && { status }),
    },
    include: {
      _count: { select: { applications: true } },
    },
    orderBy: { openDate: 'desc' },
  })

  return NextResponse.json(ipos)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, ipoType, issuePrice, lotSize, openDate, closeDate, status } = body

  if (!name || !ipoType || !issuePrice || !lotSize || !openDate || !closeDate) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  const ipo = await prisma.iPO.create({
    data: {
      name,
      ipoType,
      issuePrice: parseFloat(issuePrice),
      lotSize: parseInt(lotSize),
      openDate: new Date(openDate),
      closeDate: new Date(closeDate),
      status: status || 'UPCOMING',
    },
  })

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      action: 'IPO_ADDED',
      details: `Added IPO: ${name}`,
    },
  })

  return NextResponse.json(ipo)
}
