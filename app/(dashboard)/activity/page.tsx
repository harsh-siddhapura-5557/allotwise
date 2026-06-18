'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatDateTime, cn } from '@/lib/utils'
import { Activity, ChevronLeft, ChevronRight, User, Clock } from 'lucide-react'

interface Log {
  id: string
  action: string
  details: string
  createdAt: string
  user?: { name: string; email: string; role: string }
  application?: {
    ipo?: { name: string }
    member?: { fullName: string }
  }
}

const ACTION_COLORS: Record<string, string> = {
  APPLICATION_ADDED: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  STATUS_UPDATED: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  MEMBER_ADDED: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  MEMBER_UPDATED: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  MEMBER_DELETED: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  IPO_ADDED: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  ALLOTMENT_UPDATED: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
}

const ACTION_LABELS: Record<string, string> = {
  APPLICATION_ADDED: 'Application Added',
  STATUS_UPDATED: 'Status Updated',
  MEMBER_ADDED: 'Member Added',
  MEMBER_UPDATED: 'Member Updated',
  MEMBER_DELETED: 'Member Deleted',
  IPO_ADDED: 'IPO Added',
  ALLOTMENT_UPDATED: 'Allotment Updated',
}

export default function ActivityPage() {
  const [data, setData] = useState<{ logs: Log[]; total: number }>({ logs: [], total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 25

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/activity?page=${page}&limit=${limit}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(data.total / limit)

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
          <p className="text-sm text-muted-foreground">{data.total} events recorded</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-48 h-4 bg-muted rounded" />
                  <div className="w-64 h-3 bg-muted rounded" />
                  <div className="w-32 h-3 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : data.logs.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No activity recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.logs.map(log => (
              <div key={log.id} className="px-5 py-4 flex items-start gap-3 hover:bg-accent/20 transition-colors">
                {/* Icon */}
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600')}>
                  <Activity className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600')}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-1 font-medium">{log.details}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {log.user && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            {log.user.name}
                            <span className={cn('ml-1 px-1.5 py-0.5 rounded text-xs', log.user.role === 'ADMIN' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400')}>
                              {log.user.role}
                            </span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total}
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-md border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)} className={cn('w-8 h-8 rounded-md text-sm transition-colors', i + 1 === page ? 'bg-blue-600 text-white' : 'hover:bg-accent')}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-md border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
