import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('memberId')

  const upis = await prisma.upiId.findMany({
    where: memberId ? { memberId } : {},
    include: { member: { select: { fullName: true, panNumber: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(upis)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId, upiId } = await req.json()
  if (!upiId) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  try {
    const newUpi = await prisma.upiId.create({ data: { memberId: memberId || null, upiId } })
    return NextResponse.json(newUpi)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'UPI ID already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create UPI ID' }, { status: 500 })
  }
}
