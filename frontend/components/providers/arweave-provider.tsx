'use client'

import { ArweaveWalletKit } from 'arweave-wallet-kit'
import { config } from '@/ao-config'

export function ArweaveProvider({ children }: { children: React.ReactNode }) {
  return (
    <ArweaveWalletKit
      config={{
        permissions: [...config.walletPermissions],
        ensurePermissions: config.ensurePermissions,
        appInfo: {
          name: config.appName,
          logo: config.appLogo,
        },
      }}
      theme={{
        accent: config.theme.accent,
      }}
    >
      {children}
    </ArweaveWalletKit>
  )
}