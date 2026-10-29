// Read configuration once, fail fast in production when required values are missing.

const nodeEnv = process.env.NODE_ENV ?? 'development'

export const isProduction = nodeEnv === 'production'

function optional(name: string): string | undefined {
  let value = process.env[name]?.trim()
  return value ? value : undefined
}

export const config = {
  nodeEnv,
  port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 44100,
  // Set TRUST_PROXY=1 on Railway so request URLs and IPs come from the proxy headers.
  trustProxy: process.env.TRUST_PROXY === '1',
  mongodbUri: optional('MONGODB_URI'),
  mongodbDb: optional('MONGODB_DB') ?? 'katbox',
  // Public link to the game on Roblox. Leave unset until the game page is final.
  bladesOfChanceUrl: optional('BLADES_OF_CHANCE_URL'),
  // Public origin of the site, e.g. https://katbox.org. Used to reject cross-site form posts.
  siteOrigin: optional('SITE_ORIGIN'),
}

export function assertProductionConfig(): void {
  if (!isProduction) return

  let missing: string[] = []
  if (!config.mongodbUri) missing.push('MONGODB_URI')

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
