import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    totalApplications,
    totalAllotments,
    allotmentData,
    activeIPOs,
    recentActivities,
    monthlyData,
    memberStats,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { status: 'ALLOTTED' } }),
    prisma.allotment.findMany({ select: { profit: true, loss: true, sharesAllotted: true, issuePrice: true } }),
    prisma.iPO.count({ where: { status: { in: ['OPEN', 'UPCOMING'] } } }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        application: {
          include: {
            ipo: { select: { name: true } },
            member: { select: { fullName: true } },
          },
        },
      },
    }),
    // Monthly applications for chart
    prisma.application.findMany({
      select: { applicationDate: true, appliedAmount: true, status: true },
      orderBy: { applicationDate: 'asc' },
    }),
    // Top members
    prisma.member.findMany({
      include: {
        applications: {
          include: { allotment: true },
        },
      },
      take: 5,
    }),
  ])

  const totalInvestment = allotmentData.reduce(
    (sum, a) => sum + a.sharesAllotted * a.issuePrice,
    0
  )
  const totalProfit = allotmentData.reduce((sum, a) => sum + (a.profit || 0), 0)
  const totalLoss = allotmentData.reduce((sum, a) => sum + (a.loss || 0), 0)

  // Group monthly data
  const monthMap = new Map<string, { applications: number; investment: number; profit: number }>()
  monthlyData.forEach(app => {
    const key = new Date(app.applicationDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    const existing = monthMap.get(key) || { applications: 0, investment: 0, profit: 0 }
    existing.applications += 1
    existing.investment += app.appliedAmount
    monthMap.set(key, existing)
  })

  const chartData = Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    ...data,
  }))

  // Status breakdown
  const statusBreakdown = await prisma.application.groupBy({
    by: ['status'],
    _count: true,
  })

  return NextResponse.json({
    stats: {
      totalApplications,
      totalAllotments,
      totalInvestment,
      totalProfit,
      totalLoss,
      netPnL: totalProfit - totalLoss,
      activeIPOs,
    },
    recentActivities,
    chartData,
    statusBreakdown: statusBreakdown.map(s => ({ status: s.status, count: s._count })),
  })
}
