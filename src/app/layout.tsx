import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CustomerProvider } from '@/contexts/CustomerContext'

export const metadata: Metadata = {
  title: 'Lustra AI - Beautiful Jewelry Websites',
  description: 'Create stunning jewelry websites with Lustra AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="light">
        <AuthProvider>
          <CustomerProvider>
            {children}
          </CustomerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}