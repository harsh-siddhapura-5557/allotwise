import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  try {
    const app = await prisma.application.update({
      where: { id },
      data: {
        ipoId: body.ipoId,
        memberId: body.memberId,
        upiIdId: body.upiIdId,
        appliedAmount: parseFloat(body.appliedAmount),
        lotQuantity: parseInt(body.lotQuantity),
        status: body.status,
        applicationDate: body.applicationDate ? new Date(body.applicationDate) : undefined,
      },
      include: { ipo: true, member: true },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.id,
        applicationId: id,
        action: 'STATUS_UPDATED',
        details: `Updated status to ${body.status} for ${app.ipo.name} — ${app.member.fullName}`,
      },
    })

    return NextResponse.json(app)
  } catch {
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  try {
    await prisma.application.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
