import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  try {
    const ipo = await prisma.iPO.update({
      where: { id },
      data: {
        name: body.name,
        ipoType: body.ipoType,
        issuePrice: parseFloat(body.issuePrice),
        lotSize: parseInt(body.lotSize),
        openDate: new Date(body.openDate),
        closeDate: new Date(body.closeDate),
        status: body.status,
      },
    })
    return NextResponse.json(ipo)
  } catch {
    return NextResponse.json({ error: 'Failed to update IPO' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  try {
    await prisma.iPO.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Cannot delete IPO with applications' }, { status: 400 })
  }
}
