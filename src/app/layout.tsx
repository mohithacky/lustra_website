import type { Metadata } from 'next'
import './globals.css'

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
      <body className="light">{children}</body>
    </html>
  )
}
