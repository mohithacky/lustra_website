import type { Metadata } from 'next'
import { Lato, Playfair_Display } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CustomerProvider } from '@/contexts/CustomerContext'

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  display: 'swap',
  variable: '--font-lato',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-playfair',
})

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
    <html lang="en" className={`${lato.variable} ${playfairDisplay.variable}`}>
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