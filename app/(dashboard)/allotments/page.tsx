'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate, getIPOTypeColor, exportToCSV, cn } from '@/lib/utils'
import { Download, BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

interface Allotment {
  id: string
  sharesAllotted: number
  issuePrice: number
  listingPrice?: number
  sellPrice?: number
  profit?: number
  loss?: number
  createdAt: string
  application: {
    id: string
    status: string
    ipo: { name: string; ipoType: string }
    member: { fullName: string }
  }
}

export default function AllotmentsPage() {
  const [allotments, setAllotments] = useState<Allotment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/allotments')
      .then(r => r.json())
      .then(setAllotments)
      .finally(() => setLoading(false))
  }, [])

  const totalProfit = allotments.reduce((s, a) => s + (a.profit || 0), 0)
  const totalLoss = allotments.reduce((s, a) => s + (a.loss || 0), 0)
  const netPnL = totalProfit - totalLoss
  const totalInvested = allotments.reduce((s, a) => s + a.sharesAllotted * a.issuePrice, 0)

  function handleExport() {
    exportToCSV(allotments.map(a => ({
      IPO: a.application.ipo.name,
      Type: a.application.ipo.ipoType,
      Member: a.application.member.fullName,
      Shares: a.sharesAllotted,
      'Issue Price': a.issuePrice,
      'Listing Price': a.listingPrice || '',
      'Sell Price': a.sellPrice || '',
      Profit: a.profit || 0,
      Loss: a.loss || 0,
      'Net P&L': (a.profit || 0) - (a.loss || 0),
      Date: formatDate(a.createdAt),
    })), 'allotments')
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Allotments</h1>
          <p className="text-sm text-muted-foreground">{allotments.length} allotment records</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-accent transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 w-fit mb-3">
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">{allotments.length}</p>
          <p className="text-sm text-muted-foreground">Total Allotments</p>
        </div>
        <div className="stat-card">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 w-fit mb-3">
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
          <p className="text-sm text-muted-foreground">Total Invested</p>
        </div>
        <div className="stat-card">
          <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 w-fit mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold profit-text">{formatCurrency(totalProfit)}</p>
          <p className="text-sm text-muted-foreground">Total Profit</p>
        </div>
        <div className="stat-card">
          <div className={cn('p-2.5 rounded-xl w-fit mb-3', netPnL >= 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400')}>
            {netPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          <p className={cn('text-2xl font-bold', netPnL >= 0 ? 'profit-text' : 'loss-text')}>{formatCurrency(Math.abs(netPnL))}</p>
          <p className="text-sm text-muted-foreground">Net P&L {netPnL >= 0 ? '(Profit)' : '(Loss)'}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="table-head">#</th>
                <th className="table-head">IPO</th>
                <th className="table-head">Member</th>
                <th className="table-head">Shares</th>
                <th className="table-head">Issue Price</th>
                <th className="table-head">Listing Price</th>
                <th className="table-head">Sell Price</th>
                <th className="table-head">Investment</th>
                <th className="table-head">P&L</th>
                <th className="table-head">Return %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>{[...Array(10)].map((_, j) => <td key={j} className="table-cell"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>
                ))
              ) : allotments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No allotment records yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Mark applications as Allotted and add allotment details from the Applications page</p>
                  </td>
                </tr>
              ) : (
                allotments.map((a, i) => {
                  const investment = a.sharesAllotted * a.issuePrice
                  const pnl = (a.profit || 0) - (a.loss || 0)
                  const returnPct = a.sellPrice ? ((a.sellPrice - a.issuePrice) / a.issuePrice * 100).toFixed(1) : null

                  return (
                    <tr key={a.id} className="hover:bg-accent/30 transition-colors">
                      <td className="table-cell text-muted-foreground text-xs">{i + 1}</td>
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-sm text-foreground whitespace-nowrap">{a.application.ipo.name}</p>
                          <span className={cn('text-xs px-1.5 py-0.5 rounded-full', getIPOTypeColor(a.application.ipo.ipoType))}>
                            {a.application.ipo.ipoType}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell text-sm font-medium text-foreground">{a.application.member.fullName}</td>
                      <td className="table-cell text-sm text-center font-mono">{a.sharesAllotted}</td>
                      <td className="table-cell text-sm font-mono">{formatCurrency(a.issuePrice)}</td>
                      <td className="table-cell text-sm font-mono">
                        {a.listingPrice ? (
                          <span className={cn(a.listingPrice > a.issuePrice ? 'profit-text' : 'loss-text')}>
                            {formatCurrency(a.listingPrice)}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="table-cell text-sm font-mono">
                        {a.sellPrice ? formatCurrency(a.sellPrice) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="table-cell text-sm font-medium">{formatCurrency(investment)}</td>
                      <td className="table-cell">
                        {pnl !== 0 ? (
                          <span className={cn('text-sm font-semibold', pnl > 0 ? 'profit-text' : 'loss-text')}>
                            {pnl > 0 ? '+' : ''}{formatCurrency(pnl)}
                          </span>
                        ) : <span className="text-muted-foreground text-sm">Pending</span>}
                      </td>
                      <td className="table-cell">
                        {returnPct ? (
                          <span className={cn('text-sm font-semibold', parseFloat(returnPct) >= 0 ? 'profit-text' : 'loss-text')}>
                            {parseFloat(returnPct) >= 0 ? '+' : ''}{returnPct}%
                          </span>
                        ) : <span className="text-muted-foreground text-sm">—</span>}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {allotments.length > 0 && (
              <tfoot>
                <tr className="bg-muted/30 font-semibold">
                  <td colSpan={7} className="table-cell text-right text-sm">Totals</td>
                  <td className="table-cell text-sm">{formatCurrency(totalInvested)}</td>
                  <td className="table-cell">
                    <span className={cn('text-sm font-bold', netPnL >= 0 ? 'profit-text' : 'loss-text')}>
                      {netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL)}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-muted-foreground">
                    {totalInvested > 0 ? `${((netPnL / totalInvested) * 100).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
