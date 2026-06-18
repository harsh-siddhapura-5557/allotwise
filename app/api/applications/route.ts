import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const memberId = searchParams.get('memberId') || ''
  const ipoId = searchParams.get('ipoId') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (memberId) where.memberId = memberId
  if (ipoId) where.ipoId = ipoId
  if (search) {
    where.OR = [
      { member: { fullName: { contains: search } } },
      { ipo: { name: { contains: search } } },
    ]
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        ipo: { select: { name: true, ipoType: true, issuePrice: true, lotSize: true } },
        member: { select: { fullName: true, panNumber: true } },
        upiId: { select: { upiId: true } },
        allotment: true,
      },
      orderBy: { applicationDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.application.count({ where }),
  ])

  return NextResponse.json({ applications, total, page, limit })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ipoId, memberId, upiIdId, appliedAmount, lotQuantity, applicationDate } = body

  if (!ipoId || !memberId || !upiIdId || !appliedAmount || !lotQuantity) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  const application = await prisma.application.create({
    data: {
      ipoId,
      memberId,
      upiIdId,
      appliedAmount: parseFloat(appliedAmount),
      lotQuantity: parseInt(lotQuantity),
      applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
      status: 'APPLIED',
    },
    include: {
      ipo: true,
      member: true,
      upiId: true,
    },
  })

  await prisma.activityLog.create({
    data: {
      userId: session.id,
      applicationId: application.id,
      action: 'APPLICATION_ADDED',
      details: `Added application for ${application.ipo.name} — ${application.member.fullName}`,
    },
  })

  return NextResponse.json(application)
}
