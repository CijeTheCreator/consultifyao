export const config = {
  // APUS HyperBEAM Node Configuration
  apusHyperbeamNodeUrl: 'http://72.46.85.207:8734',

  // App Configuration
  appName: 'ConsultifyAO',
  appLogo: undefined,

  // Attestation Configuration
  defaultAttestedBy: ['NVIDIA', 'AMD'],

  // UI Configuration
  theme: {
    accent: { r: 9, g: 29, b: 255 },
  },

  // Wallet Configuration
  walletPermissions: ['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH'] as const,
  ensurePermissions: true,
} as const; 
