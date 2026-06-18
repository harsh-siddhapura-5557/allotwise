import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AllotWise — IPO Portfolio Management',
  description: 'Professional IPO and SME IPO portfolio management for families and groups',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
