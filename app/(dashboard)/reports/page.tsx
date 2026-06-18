'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, exportToCSV, cn } from '@/lib/utils'
import { Download, BarChart3, TrendingUp, TrendingDown, Users, FileText, CreditCard } from 'lucide-react'

type ReportType = 'member' | 'ipo' | 'upi'

interface MemberReport {
  id: string; name: string; panNumber: string; mobile: string
  totalApplications: number; totalAllotments: number
  totalInvestment: number; totalProfit: number; totalLoss: number; netPnL: number
}
interface IPOReport {
  id: string; name: string; ipoType: string; issuePrice: number; status: string
  totalApplications: number; totalAllotments: number
  totalProfit: number; totalLoss: number; netPnL: number
}
interface UPIReport {
  id: string; upiId: string; memberName: string
  totalApplications: number; totalAllotments: number
}

const tabs: { key: ReportType; label: string; icon: React.ElementType }[] = [
  { key: 'member', label: 'Member Wise', icon: Users },
  { key: 'ipo', label: 'IPO Wise', icon: FileText },
  { key: 'upi', label: 'UPI Wise', icon: CreditCard },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('member')
  const [memberData, setMemberData] = useState<MemberReport[]>([])
  const [ipoData, setIpoData] = useState<IPOReport[]>([])
  const [upiData, setUpiData] = useState<UPIReport[]>([])
  const [loading, setLoading] = useState(false)

  function load(type: ReportType) {
    setLoading(true)
    fetch(`/api/reports?type=${type}`)
      .then(r => r.json())
      .then(d => {
        if (type === 'member') setMemberData(d)
        if (type === 'ipo') setIpoData(d)
        if (type === 'upi') setUpiData(d)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(activeTab) }, [activeTab])

  function handleExport() {
    if (activeTab === 'member') exportToCSV(memberData.map(m => ({ Name: m.name, PAN: m.panNumber, Applications: m.totalApplications, Allotments: m.totalAllotments, Investment: m.totalInvestment, Profit: m.totalProfit, Loss: m.totalLoss, 'Net P&L': m.netPnL })), 'member-report')
    if (activeTab === 'ipo') exportToCSV(ipoData.map(i => ({ Name: i.name, Type: i.ipoType, Price: i.issuePrice, Status: i.status, Applications: i.totalApplications, Allotments: i.totalAllotments, Profit: i.totalProfit, Loss: i.totalLoss, 'Net P&L': i.netPnL })), 'ipo-report')
    if (activeTab === 'upi') exportToCSV(upiData.map(u => ({ UPI: u.upiId, Member: u.memberName, Applications: u.totalApplications, Allotments: u.totalAllotments })), 'upi-report')
  }

  const Skeleton = () => (
    <tbody>
      {[...Array(5)].map((_, i) => (
        <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="table-cell"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>
      ))}
    </tbody>
  )

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Detailed analytics and summaries</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-accent transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Member Wise Report */}
      {activeTab === 'member' && (
        <div className="space-y-4">
          {/* Summary row */}
          {memberData.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 w-fit mb-3"><Users className="w-4 h-4" /></div>
                <p className="text-xl font-bold">{memberData.length}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
              <div className="stat-card">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 w-fit mb-3"><FileText className="w-4 h-4" /></div>
                <p className="text-xl font-bold">{memberData.reduce((s, m) => s + m.totalApplications, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </div>
              <div className="stat-card">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 w-fit mb-3"><TrendingUp className="w-4 h-4" /></div>
                <p className="text-xl font-bold profit-text">{formatCurrency(memberData.reduce((s, m) => s + m.totalProfit, 0))}</p>
                <p className="text-sm text-muted-foreground">Total Profit</p>
              </div>
              <div className="stat-card">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 w-fit mb-3"><BarChart3 className="w-4 h-4" /></div>
                <p className={cn('text-xl font-bold', memberData.reduce((s, m) => s + m.netPnL, 0) >= 0 ? 'profit-text' : 'loss-text')}>
                  {formatCurrency(Math.abs(memberData.reduce((s, m) => s + m.netPnL, 0)))}
                </p>
                <p className="text-sm text-muted-foreground">Net P&L</p>
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="table-head">#</th>
                    <th className="table-head">Member</th>
                    <th className="table-head">PAN</th>
                    <th className="table-head">Applications</th>
                    <th className="table-head">Allotments</th>
                    <th className="table-head">Investment</th>
                    <th className="table-head">Profit</th>
                    <th className="table-head">Loss</th>
                    <th className="table-head">Net P&L</th>
                  </tr>
                </thead>
                {loading ? <Skeleton /> : (
                  <tbody>
                    {memberData.map((m, i) => (
                      <tr key={m.id} className="hover:bg-accent/30 transition-colors">
                        <td className="table-cell text-muted-foreground text-xs">{i + 1}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 text-sm font-semibold">
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-foreground">{m.name}</p>
                              <p className="text-xs text-muted-foreground">{m.mobile}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell font-mono text-sm text-muted-foreground">{m.panNumber}</td>
                        <td className="table-cell text-center text-sm font-medium">{m.totalApplications}</td>
                        <td className="table-cell text-center text-sm font-medium">{m.totalAllotments}</td>
                        <td className="table-cell text-sm">{m.totalInvestment > 0 ? formatCurrency(m.totalInvestment) : '—'}</td>
                        <td className="table-cell">{m.totalProfit > 0 ? <span className="profit-text text-sm">+{formatCurrency(m.totalProfit)}</span> : <span className="text-muted-foreground text-sm">—</span>}</td>
                        <td className="table-cell">{m.totalLoss > 0 ? <span className="loss-text text-sm">-{formatCurrency(m.totalLoss)}</span> : <span className="text-muted-foreground text-sm">—</span>}</td>
                        <td className="table-cell">
                          {m.netPnL !== 0 ? (
                            <span className={cn('text-sm font-semibold', m.netPnL > 0 ? 'profit-text' : 'loss-text')}>
                              {m.netPnL > 0 ? '+' : ''}{formatCurrency(m.netPnL)}
                            </span>
                          ) : <span className="text-muted-foreground text-sm">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* IPO Wise Report */}
      {activeTab === 'ipo' && (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-head">#</th>
                  <th className="table-head">IPO Name</th>
                  <th className="table-head">Type</th>
                  <th className="table-head">Issue Price</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Applications</th>
                  <th className="table-head">Allotments</th>
                  <th className="table-head">Allot Rate</th>
                  <th className="table-head">Profit</th>
                  <th className="table-head">Net P&L</th>
                </tr>
              </thead>
              {loading ? <Skeleton /> : (
                <tbody>
                  {ipoData.map((ipo, i) => {
                    const allotRate = ipo.totalApplications > 0 ? ((ipo.totalAllotments / ipo.totalApplications) * 100).toFixed(0) : '0'
                    return (
                      <tr key={ipo.id} className="hover:bg-accent/30 transition-colors">
                        <td className="table-cell text-muted-foreground text-xs">{i + 1}</td>
                        <td className="table-cell font-medium text-foreground whitespace-nowrap">{ipo.name}</td>
                        <td className="table-cell">
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', ipo.ipoType === 'SME' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400')}>
                            {ipo.ipoType}
                          </span>
                        </td>
                        <td className="table-cell font-mono text-sm">{formatCurrency(ipo.issuePrice)}</td>
                        <td className="table-cell">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{ipo.status}</span>
                        </td>
                        <td className="table-cell text-center text-sm">{ipo.totalApplications}</td>
                        <td className="table-cell text-center text-sm">{ipo.totalAllotments}</td>
                        <td className="table-cell text-center text-sm">
                          <span className={cn('font-medium', parseInt(allotRate) > 50 ? 'text-green-600' : 'text-muted-foreground')}>
                            {allotRate}%
                          </span>
                        </td>
                        <td className="table-cell">{ipo.totalProfit > 0 ? <span className="profit-text text-sm">+{formatCurrency(ipo.totalProfit)}</span> : <span className="text-muted-foreground text-sm">—</span>}</td>
                        <td className="table-cell">
                          {ipo.netPnL !== 0 ? (
                            <span className={cn('text-sm font-semibold', ipo.netPnL > 0 ? 'profit-text' : 'loss-text')}>
                              {ipo.netPnL > 0 ? '+' : ''}{formatCurrency(ipo.netPnL)}
                            </span>
                          ) : <span className="text-muted-foreground text-sm">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              )}
            </table>
          </div>
        </div>
      )}

      {/* UPI Wise Report */}
      {activeTab === 'upi' && (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-head">#</th>
                  <th className="table-head">UPI ID</th>
                  <th className="table-head">Member</th>
                  <th className="table-head">Applications</th>
                  <th className="table-head">Allotments</th>
                  <th className="table-head">Allotment Rate</th>
                </tr>
              </thead>
              {loading ? <Skeleton /> : (
                <tbody>
                  {upiData.map((u, i) => {
                    const rate = u.totalApplications > 0 ? ((u.totalAllotments / u.totalApplications) * 100).toFixed(0) : '0'
                    return (
                      <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                        <td className="table-cell text-muted-foreground text-xs">{i + 1}</td>
                        <td className="table-cell">
                          <span className="font-mono text-sm bg-muted/50 px-2 py-0.5 rounded">{u.upiId}</span>
                        </td>
                        <td className="table-cell text-sm font-medium text-foreground">{u.memberName}</td>
                        <td className="table-cell text-center text-sm">{u.totalApplications}</td>
                        <td className="table-cell text-center text-sm">{u.totalAllotments}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[80px]">
                              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-sm font-medium">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
