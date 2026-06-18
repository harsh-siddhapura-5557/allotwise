import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { fullName, panNumber, mobile, notes } = body

  try {
    const member = await prisma.member.update({
      where: { id },
      data: { fullName, panNumber: panNumber.toUpperCase(), mobile, notes },
    })
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'MEMBER_UPDATED',
        details: `Updated member: ${fullName}`,
      },
    })
    return NextResponse.json(member)
  } catch {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  try {
    const member = await prisma.member.delete({ where: { id } })
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: 'MEMBER_DELETED',
        details: `Deleted member: ${member.fullName}`,
      },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Cannot delete member with applications' }, { status: 400 })
  }
}
