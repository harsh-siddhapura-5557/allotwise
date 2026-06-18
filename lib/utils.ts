import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useEffect, useState } from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    APPLIED: 'badge-applied',
    ALLOTTED: 'badge-allotted',
    NOT_ALLOTTED: 'badge-not-allotted',
    REFUNDED: 'badge-refunded',
    SOLD: 'badge-sold',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    APPLIED: 'Applied',
    ALLOTTED: 'Allotted',
    NOT_ALLOTTED: 'Not Allotted',
    REFUNDED: 'Refunded',
    SOLD: 'Sold',
  }
  return labels[status] || status
}

export function getIPOTypeColor(type: string): string {
  return type === 'SME'
    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h]
        if (val === null || val === undefined) return ''
        const str = String(val)
        return str.includes(',') ? `"${str}"` : str
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function useClientOnlyFormat() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return {
    isClient,
    formatDate: (date: Date | string) =>
      isClient ? formatDate(date) : '',
    formatDateTime: (date: Date | string) =>
      isClient ? formatDateTime(date) : '',
  }
}
