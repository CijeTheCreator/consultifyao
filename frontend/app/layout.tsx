import type { Metadata } from 'next'
import './globals.css'
import { ArweaveProvider } from '@/components/providers/arweave-provider'
import NavbarWrapper from '@/components/navbar-wrapper'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Consultify - Multilingual Doctor Consultations',
  description: 'Connect with doctors, no matter the language. Built on AO.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ArweaveProvider>
          <NavbarWrapper />
          {children}
          <Toaster />
        </ArweaveProvider>
      </body>
    </html>
  )
}
