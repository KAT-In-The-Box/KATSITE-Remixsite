import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const AUTHORIZE_URL = 'https://apis.roblox.com/oauth/v1/authorize'
const TOKEN_URL = 'https://apis.roblox.com/oauth/v1/token'
const USERINFO_URL = 'https://apis.roblox.com/oauth/v1/userinfo'
const STATE_COOKIE = 'katbox_oauth'
const SESSION_COOKIE = 'katbox_staff'
const COOKIE_TTL_SECONDS = 10 * 60
const SESSION_TTL_SECONDS = 8 * 60 * 60

export interface RobloxStaffUser {
  id: string
  name: string
}

interface SignedPayload {
  value: Record<string, unknown>
  expiresAt: number
}

function secret(): string {
  const value = process.env.ROBLOX_SESSION_SECRET?.trim()
  if (!value || value.length < 32) {
    throw new Error('ROBLOX_SESSION_SECRET must be set to a random secret of at least 32 characters.')
  }
  return value
}

function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

function seal(value: Record<string, unknown>, ttl: number): string {
  const payload = Buffer.from(JSON.stringify({ value, expiresAt: Date.now() + ttl * 1000 } satisfies SignedPayload)).toString('base64url')
  return payload + '.' + sign(payload)
}

function unseal<T extends Record<string, unknown>>(token: string | undefined): T | null {
  if (!token) return null
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra) return null
  const expected = Buffer.from(sign(payload))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SignedPayload
    if (typeof decoded.expiresAt !== 'number' || decoded.expiresAt <= Date.now()) return null
    if (!decoded.value || typeof decoded.value !== 'object') return null
    return decoded.value as T
  } catch {
    return null
  }
}

function cookies(request: Request): Map<string, string> {
  return new Map<string, string>((request.headers.get('Cookie') ?? '').split(';').map((part): [string, string] => {
    const index = part.indexOf('=')
    return index < 0 ? [part.trim(), ''] : [part.slice(0, index).trim(), part.slice(index + 1).trim()]
  }))
}

function cookieHeader(name: string, value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export function clearOAuthCookie(): string {
  return cookieHeader(STATE_COOKIE, '', 0)
}

export function clearSessionCookie(): string {
  return cookieHeader(SESSION_COOKIE, '', 0)
}

export function getStaffSession(request: Request): RobloxStaffUser | null {
  const value = unseal<{ id: string; name: string; kind: string }>(cookies(request).get(SESSION_COOKIE))
  if (!value || value.kind !== 'staff' || !/^\d+$/.test(value.id) || typeof value.name !== 'string') return null
  if (!allowedStaffIds().has(value.id)) return null
  return { id: value.id, name: value.name }
}

function allowedStaffIds(): Set<string> {
  return new Set((process.env.ROBLOX_STAFF_USER_IDS ?? '').split(',').map((id) => id.trim()).filter((id) => /^\d+$/.test(id)))
}

export function beginRobloxLogin(request: Request): Response {
  const clientId = process.env.ROBLOX_OAUTH_CLIENT_ID?.trim()
  if (!clientId) return new Response('Roblox OAuth is not configured: missing ROBLOX_OAUTH_CLIENT_ID.', { status: 503 })
  if (allowedStaffIds().size === 0) return new Response('Staff access is not configured. Add numeric Roblox user IDs to ROBLOX_STAFF_USER_IDS.', { status: 503 })

  const state = randomBytes(32).toString('base64url')
  const verifier = randomBytes(32).toString('base64url')
  const pkceChallenge = createHashChallenge(verifier)
  const callback = new URL('/auth/roblox/callback', process.env.SITE_ORIGIN?.trim() || request.url).toString()
  const url = new URL(AUTHORIZE_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', callback)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid profile')
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', pkceChallenge)
  url.searchParams.set('code_challenge_method', 'S256')

  const headers = new Headers({ Location: url.toString() })
  headers.append('Set-Cookie', cookieHeader(STATE_COOKIE, seal({ state, verifier, callback }, COOKIE_TTL_SECONDS), COOKIE_TTL_SECONDS))
  return new Response(null, { status: 302, headers })
}

function createHashChallenge(verifier: string): string {
  // RFC 7636 requires a SHA-256 digest, encoded as base64url.
  return createHash('sha256').update(verifier).digest('base64url')
}

export async function finishRobloxLogin(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const error = url.searchParams.get('error')
  if (error) return new Response('Roblox sign-in was cancelled or denied.', { status: 400, headers: { 'Set-Cookie': clearOAuthCookie(), 'Cache-Control': 'no-store' } })
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const pending = unseal<{ state: string; verifier: string; callback: string }>(cookies(request).get(STATE_COOKIE))
  const clearCookie = clearOAuthCookie()
  if (!code || !state || !pending || state !== pending.state) {
    return new Response('Invalid or expired Roblox OAuth state. Please try signing in again.', { status: 400, headers: { 'Set-Cookie': clearCookie } })
  }

  const clientId = process.env.ROBLOX_OAUTH_CLIENT_ID?.trim()
  const clientSecret = process.env.ROBLOX_OAUTH_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return new Response('Roblox OAuth client credentials are not configured.', { status: 503, headers: { 'Set-Cookie': clearCookie } })

  try {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: pending.callback,
        code_verifier: pending.verifier,
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!tokenResponse.ok) {
      console.error('Roblox OAuth token exchange failed with status', tokenResponse.status)
      return new Response('Roblox sign-in could not be completed. Please try again.', { status: 502, headers: { 'Set-Cookie': clearCookie } })
    }
    const token = await tokenResponse.json() as { access_token?: string }
    if (!token.access_token) return new Response('Roblox did not return an access token.', { status: 502, headers: { 'Set-Cookie': clearCookie } })

    const userResponse = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (!userResponse.ok) return new Response('Could not verify your Roblox account.', { status: 502, headers: { 'Set-Cookie': clearCookie } })
    const profile = await userResponse.json() as { sub?: string; preferred_username?: string; name?: string; nickname?: string }
    const id = profile.sub ?? ''
    if (!/^\d+$/.test(id) || !allowedStaffIds().has(id)) {
      return new Response('Your Roblox account is not on the approved staff list.', { status: 403, headers: { 'Set-Cookie': clearCookie } })
    }

    const name = (profile.preferred_username ?? profile.nickname ?? profile.name ?? `Roblox user ${id}`).slice(0, 80)
    const headers = new Headers({ Location: '/staff' })
    headers.append('Set-Cookie', cookieHeader(SESSION_COOKIE, seal({ id, name, kind: 'staff' }, SESSION_TTL_SECONDS), SESSION_TTL_SECONDS))
    headers.append('Set-Cookie', clearCookie)
    return new Response(null, { status: 303, headers })
  } catch (cause) {
    console.error('Roblox OAuth callback failed:', cause)
    return new Response('Roblox sign-in failed unexpectedly. Please try again.', { status: 502, headers: { 'Set-Cookie': clearCookie } })
  }
}

export function endStaffSession(): Response {
  return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': clearSessionCookie() } })
}
