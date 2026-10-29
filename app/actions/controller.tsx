import { createController } from 'remix/router'
import { createRedirectResponse } from 'remix/response/redirect'

import { assets } from '../assets.ts'
import { config } from '../config.ts'
import { beginRobloxLogin, endStaffSession, finishRobloxLogin, getStaffSession } from '../auth/roblox.ts'
import { hasDb, pingDb, saveContactMessage } from '../data/mongo.ts'
import { routes } from '../routes.ts'
import { HomePage, type ContactValues } from './home-page.tsx'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readText(formData: FormData, name: string): string {
  let value = formData.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

// Reject form posts that come from another site. Browsers always send Origin on POST.
function isSameOrigin(request: Request): boolean {
  let origin = request.headers.get('Origin')
  if (!origin) return true
  let expected = config.siteOrigin ?? new URL(request.url).origin
  return origin === expected
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]!)
}

function staffPage(name: string): Response {
  const safeName = escapeHtml(name)
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Staff Portal | KaTBox Interactives</title>
<style>
:root{color-scheme:dark;--bg:#080706;--panel:#15110e;--line:#38271d;--accent:#cf9066;--muted:#b9aaa0}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at top,#24160f 0,#080706 55%);color:#fff;font:16px/1.5 system-ui,sans-serif;min-height:100vh}
header{padding:22px 5vw;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:16px}
.brand{font-weight:800;letter-spacing:.08em}.brand span{color:var(--accent)}
main{width:min(1000px,90vw);margin:64px auto}.eyebrow{color:var(--accent);text-transform:uppercase;letter-spacing:.18em;font-size:12px;font-weight:800}
h1{font-size:clamp(36px,6vw,60px);line-height:1.05;margin:12px 0}p{color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:34px}
.card{padding:24px;background:linear-gradient(145deg,#1a1410,#100d0b);border:1px solid var(--line);border-radius:16px}
.card h2{margin:0 0 8px;font-size:20px}.tag{display:inline-block;color:var(--accent);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em}
button{font:inherit;font-weight:700;color:#140d08;background:var(--accent);border:0;border-radius:9px;padding:10px 16px;cursor:pointer}
.small{font-size:13px;color:var(--muted)}form{margin:0}
</style></head><body><header><div class="brand">KaTBox <span>Interactives</span></div><form method="post" action="/auth/roblox/logout"><button type="submit">Sign out</button></form></header>
<main><div class="eyebrow">Authorized staff area</div><h1>Welcome, ${safeName}.</h1><p>You’re signed in with Roblox and your account is on the approved staff list.</p>
<div class="grid"><section class="card"><span class="tag">Portal</span><h2>Staff dashboard</h2><p>Your secure entry point for KaTBox internal tools.</p><div class="small">More staff features can be added here.</div></section>
<section class="card"><span class="tag">Game Manager</span><h2>Game management</h2><p>Management actions are not connected yet. We’ll add individual tools with the minimum Roblox permissions they need.</p></section>
<section class="card"><span class="tag">Account</span><h2>Roblox verified</h2><p>Your access is checked against the server-side staff ID allowlist.</p></section></div></main></body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" },
  })
}

export default createController(routes, {
  actions: {
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
    },

    home(context) {
      let sent = new URL(context.request.url).searchParams.get('sent') === '1'
      return context.render(<HomePage bladesOfChanceUrl={config.bladesOfChanceUrl} sent={sent} />)
    },

    async health() {
      let dbOk = hasDb() ? await pingDb() : null
      let healthy = dbOk !== false
      return Response.json({ ok: healthy, db: dbOk }, { status: healthy ? 200 : 503 })
    },

    robloxLogin(context) {
      return beginRobloxLogin(context.request)
    },

    async robloxCallback(context) {
      return finishRobloxLogin(context.request)
    },

    staff(context) {
      const user = getStaffSession(context.request)
      if (!user) return createRedirectResponse('/auth/roblox/login', { status: 303 })
      return staffPage(user.name)
    },

    staffLogout(context) {
      if (!isSameOrigin(context.request)) return new Response('Forbidden', { status: 403 })
      return endStaffSession()
    },

    async contact(context) {
      if (!isSameOrigin(context.request)) {
        return new Response('Forbidden', { status: 403 })
      }

      let formData = context.formData

      if (readText(formData, 'website') !== '') {
        return createRedirectResponse('/?sent=1#contact', { status: 303 })
      }

      let values: ContactValues = {
        name: readText(formData, 'name'),
        email: readText(formData, 'email'),
        message: readText(formData, 'message'),
      }

      let errors: Partial<Record<keyof ContactValues, string>> = {}
      if (values.name.length < 1 || values.name.length > 80) errors.name = 'Enter your name (up to 80 characters).'
      if (!EMAIL.test(values.email) || values.email.length > 200) errors.email = 'Enter a valid email address.'
      if (values.message.length < 10 || values.message.length > 2000) {
        errors.message = 'Write a message between 10 and 2000 characters.'
      }

      if (Object.keys(errors).length > 0) {
        return context.render(
          <HomePage bladesOfChanceUrl={config.bladesOfChanceUrl} values={values} errors={errors} />,
          { status: 400 },
        )
      }

      try {
        await saveContactMessage(values)
      } catch (error) {
        console.error('Failed to save contact message:', error)
        return context.render(
          <HomePage bladesOfChanceUrl={config.bladesOfChanceUrl} values={values} failed />,
          { status: 500 },
        )
      }

      return createRedirectResponse('/?sent=1#contact', { status: 303 })
    },
  },
})
