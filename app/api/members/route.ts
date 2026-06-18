import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  const members = await prisma.member.findMany({
    where: search ? {
      OR: [
        { fullName: { contains: search } },
        { panNumber: { contains: search } },
        { mobile: { contains: search } },
      ]
    } : {},
    include: {
      upiIds: true,
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(members)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { fullName, panNumber, mobile, notes } = body

  if (!fullName || !panNumber || !mobile) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  try {
    const member = await prisma.member.create({
      data: { fullName, panNumber: panNumber.toUpperCase(), mobile, notes },
    })
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'MEMBER_ADDED',
        details: `Added member: ${fullName} (${panNumber})`,
      },
    })
    return NextResponse.json(member)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'PAN number already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}
