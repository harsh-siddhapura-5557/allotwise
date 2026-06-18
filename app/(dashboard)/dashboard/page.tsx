'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor, cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, FileText, CheckCircle, Activity,
  IndianRupee, BarChart3, Clock
} from 'lucide-react'

const PIE_COLORS: Record<string, string> = {
  APPLIED: '#f59e0b',
  ALLOTTED: '#3b82f6',
  NOT_ALLOTTED: '#ef4444',
  REFUNDED: '#6b7280',
  SOLD: '#22c55e',
}

interface DashboardData {
  stats: {
    totalApplications: number
    totalAllotments: number
    totalInvestment: number
    totalProfit: number
    totalLoss: number
    netPnL: number
    activeIPOs: number
  }
  recentActivities: Array<{
    id: string
    action: string
    details: string
    createdAt: string
    user?: { name: string }
    application?: { ipo?: { name: string }; member?: { fullName: string } }
  }>
  chartData: Array<{ month: string; applications: number; investment: number }>
  statusBreakdown: Array<{ status: string; count: number }>
}

function StatCard({
  title, value, sub, icon: Icon, trend, color = 'blue'
}: {
  title: string
  value: string
  sub?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  }
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl', colorMap[color] || colorMap.blue)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={cn('flex items-center gap-1 text-xs font-medium', trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground')}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    APPLICATION_ADDED: 'Added application',
    STATUS_UPDATED: 'Updated status',
    MEMBER_ADDED: 'Added member',
    MEMBER_UPDATED: 'Updated member',
    MEMBER_DELETED: 'Deleted member',
    IPO_ADDED: 'Added IPO',
    ALLOTMENT_UPDATED: 'Updated allotment',
  }
  return labels[action] || action
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-xl mb-4" />
              <div className="w-24 h-7 bg-muted rounded mb-2" />
              <div className="w-32 h-4 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null
  const { stats, recentActivities, chartData, statusBreakdown } = data

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Overview of your IPO portfolio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Applications" value={String(stats.totalApplications)} icon={FileText} color="blue" />
        <StatCard title="Total Allotments" value={String(stats.totalAllotments)} icon={CheckCircle} color="green" />
        <StatCard title="Active IPOs" value={String(stats.activeIPOs)} icon={TrendingUp} color="purple" />
        <StatCard title="Total Members" value="—" icon={Users} color="amber" />
        <StatCard
          title="Total Investment"
          value={formatCurrency(stats.totalInvestment)}
          icon={IndianRupee}
          color="blue"
          sub="Allotted value"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(stats.totalProfit)}
          icon={TrendingUp}
          color="green"
          trend="up"
        />
        <StatCard
          title="Total Loss"
          value={formatCurrency(stats.totalLoss)}
          icon={TrendingDown}
          color="red"
          trend="down"
        />
        <StatCard
          title="Net P&L"
          value={formatCurrency(stats.netPnL)}
          icon={BarChart3}
          color={stats.netPnL >= 0 ? 'green' : 'red'}
          sub={stats.netPnL >= 0 ? 'Overall profit' : 'Overall loss'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Applications Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Applications Over Time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="bg-card rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Application Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusBreakdown}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {statusBreakdown.map((entry) => (
                  <Cell key={entry.status} fill={PIE_COLORS[entry.status] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, getStatusLabel(String(name))]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value) => getStatusLabel(value)}
                iconSize={8}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border">
          {recentActivities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No recent activity</p>
          ) : (
            recentActivities.map(log => (
              <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-accent/30 transition-colors">
                <div className="mt-0.5 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{getActionLabel(log.action)}</p>
                  <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{log.user?.name || 'System'}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
