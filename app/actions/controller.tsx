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
  return new Response(\`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#000000">
<title>Staff Portal | KaTBox Interactives</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pirata+One&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{color-scheme:dark;--bg:#000;--surface:#0e0e0e;--line:#2a2a2a;--ink:#fff;--muted:#aaa;--accent:#cf9066;--accent-soft:rgba(207,144,102,.1);--display:'Pirata One','Space Grotesk',Georgia,serif;--body:'Space Grotesk',system-ui,sans-serif}
*{box-sizing:border-box}html{min-height:100%;scroll-behavior:smooth}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 50% -20%,rgba(207,144,102,.11),transparent 48%),var(--bg);color:var(--ink);font:15px/1.6 var(--body);-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
.top-wrap{position:sticky;top:0;z-index:10;padding:16px 24px 0;background:linear-gradient(#000 70%,transparent)}.topbar{max-width:1240px;min-height:66px;margin:auto;padding:8px 10px 8px 18px;display:flex;align-items:center;justify-content:space-between;gap:20px;border:1px solid #cf906640;border-radius:999px;background:rgba(16,12,10,.94);box-shadow:0 10px 32px #0006,inset 0 1px #ffffff06;backdrop-filter:blur(16px)}
.brand{display:flex;align-items:center;gap:10px;min-width:0}.brand img{width:42px;height:42px;object-fit:contain}.brand-name{display:flex;flex-direction:column;line-height:1}.brand-name strong{font:400 24px var(--display);white-space:nowrap}.brand-name span{margin-top:5px;color:var(--accent);font-size:8px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.nav{display:flex;align-items:center;gap:4px}.nav a{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 15px;border-radius:999px;color:#b3b3b3;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;transition:background .16s,color .16s}.nav a:hover,.nav a.active{background:#ffffff0a;color:#fff}.nav .nav-cta{background:var(--accent);color:#100a06;padding:0 18px}.nav .nav-cta:hover{background:#e0a27a;color:#100a06}
.wrap{width:min(1120px,calc(100% - 48px));margin:0 auto}.main{padding:54px 0 80px}.topline{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:36px}.eyebrow{margin:0 0 12px;color:var(--accent);font-size:11px;font-weight:700;letter-spacing:.19em;text-transform:uppercase}.heading{margin:0;font:400 clamp(42px,6vw,66px)/.98 var(--display);letter-spacing:.01em}.intro{max-width:620px;margin:18px 0 0;color:#aaa;font-size:16px}.welcome-side{display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid var(--line);border-radius:16px;background:#0e0e0e}.avatar{width:38px;height:38px;display:grid;place-items:center;border:1px solid #cf90664d;border-radius:50%;background:var(--accent-soft);color:var(--accent);font-size:16px;font-weight:700}.welcome-side small{display:block;color:#888;font-size:10px;letter-spacing:.1em;text-transform:uppercase}.welcome-side strong{display:block;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
.statusbar{display:flex;align-items:center;gap:12px;margin:0 0 30px;padding:15px 18px;border:1px solid #cf90662b;border-radius:14px;background:linear-gradient(100deg,#cf906611,#0e0e0e 65%)}.status-dot{width:8px;height:8px;flex:0 0 auto;border-radius:50%;background:#8fc7a0;box-shadow:0 0 0 4px #8fc7a01a}.statusbar strong{font-size:13px}.statusbar p{margin:2px 0 0;color:#999;font-size:12px}.status-label{margin-left:auto;color:#a7d8b2;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}
.section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:0 0 16px}.section-head h2{margin:0;font-size:19px;font-weight:600;letter-spacing:-.03em}.section-head p{margin:3px 0 0;color:#888;font-size:12px}.section-kicker{color:#777;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.card{position:relative;min-height:222px;overflow:hidden;padding:24px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,#141210,#0a0a0a 78%);transition:transform .18s,border-color .18s}.card:hover{transform:translateY(-3px);border-color:#6a4733}.card:after{position:absolute;right:-45px;top:-55px;width:150px;height:150px;border:1px solid #cf906610;border-radius:50%;content:"";pointer-events:none}.card-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px}.icon-box{width:42px;height:42px;display:grid;place-items:center;border:1px solid #cf906632;border-radius:13px;background:var(--accent-soft);color:var(--accent);font-size:20px}.tag{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border:1px solid #333;border-radius:999px;color:#aaa;font-size:9px;font-weight:700;letter-spacing:.09em;text-transform:uppercase}.tag .tiny-dot{width:5px;height:5px;border-radius:50%;background:var(--accent)}.card h3{margin:0;font-size:18px;font-weight:600;letter-spacing:-.03em}.card p{min-height:46px;margin:8px 0 20px;color:#999;font-size:13px;line-height:1.65}.card-link{display:inline-flex;align-items:center;gap:8px;color:var(--accent);font-size:12px;font-weight:700}.card-link span{transition:transform .18s}.card:hover .card-link span{transform:translateX(3px)}
.lower-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:14px;margin-top:30px}.panel{padding:24px;border:1px solid var(--line);border-radius:18px;background:#0c0c0c}.panel h2{margin:0;font-size:16px;font-weight:600}.panel-sub{margin:5px 0 20px;color:#888;font-size:12px}.activity-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-top:1px solid #222}.activity-icon{width:34px;height:34px;display:grid;place-items:center;flex:0 0 auto;border-radius:10px;background:#ffffff08;color:#c6a18a}.activity-row strong{display:block;font-size:12px}.activity-row p{margin:2px 0 0;color:#888;font-size:11px}.activity-state{margin-left:auto;color:#888;font-size:10px;white-space:nowrap}.permission{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 0;border-top:1px solid #222;font-size:12px}.permission span{color:#999}.permission strong{color:#e3c2aa;font-size:10px;font-weight:600}
.footer{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 0;border-top:1px solid #222;color:#666;font-size:11px}.footer-brand{font:400 18px var(--display);color:#aaa}.logout{font:700 11px var(--body);letter-spacing:.06em;text-transform:uppercase;color:#bbb;background:transparent;border:1px solid #38302b;border-radius:999px;padding:10px 16px;cursor:pointer;transition:all .16s}.logout:hover{color:#fff;border-color:var(--accent);background:var(--accent-soft)}form{margin:0}
@media(max-width:800px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.topline{align-items:flex-start;flex-direction:column}.welcome-side{align-self:flex-start}.lower-grid{grid-template-columns:1fr}.main{padding-top:42px}}
@media(max-width:560px){.top-wrap{padding:10px 10px 0}.topbar{min-height:56px;padding:7px 8px 7px 12px;gap:8px}.brand img{width:34px;height:34px}.brand-name strong{font-size:20px}.brand-name span{font-size:7px;letter-spacing:.16em}.nav a{min-height:36px;padding:0 9px;font-size:9px;letter-spacing:.03em}.nav .nav-cta{padding:0 11px}.nav .hide-sm{display:none}.wrap{width:calc(100% - 32px)}.main{padding-top:36px}.heading{font-size:48px}.intro{font-size:14px}.statusbar{align-items:flex-start;padding:13px}.status-label{font-size:8px}.cards{grid-template-columns:1fr}.card{min-height:0;padding:20px}.card p{min-height:0}.lower-grid{margin-top:22px}.panel{padding:20px}.footer{align-items:flex-start;flex-direction:column}.logout{padding:9px 14px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition:none!important}}
</style></head><body>
<div class="top-wrap"><header class="topbar">
<a class="brand" href="/" aria-label="KaTBox Interactives home"><img src="/KITBEMOJILarge.png" alt=""><span class="brand-name"><strong>KaTBox</strong><span>Interactives</span></span></a>
<nav class="nav" aria-label="Staff navigation"><a class="active" href="/staff">Overview</a><a class="hide-sm" href="#tools">Tools</a><a class="nav-cta" href="/">Main site ↗</a></nav>
</header></div>
<main class="wrap main">
<div class="topline"><div><p class="eyebrow">KaTBox internal · Staff workspace</p><h1 class="heading">Welcome back, \${safeName}.</h1><p class="intro">Your home base for studio operations, game management, and the tools that keep our worlds running.</p></div><div class="welcome-side"><div class="avatar" aria-hidden="true">\${safeName.charAt(0).toUpperCase()}</div><div><small>Signed in as</small><strong>\${safeName}</strong></div></div></div>
<section class="statusbar" aria-label="Account status"><span class="status-dot" aria-hidden="true"></span><div><strong>Roblox account verified</strong><p>Your account is approved for the KaTBox staff portal.</p></div><span class="status-label">Access active</span></section>
<div class="section-head" id="tools"><div><h2>Your workspace</h2><p>Quick access to staff areas and studio systems.</p></div><span class="section-kicker">01 / Overview</span></div>
<div class="cards">
<a class="card" href="#game-manager"><div class="card-top"><div class="icon-box" aria-hidden="true">⌘</div><span class="tag"><span class="tiny-dot"></span>In development</span></div><h3>Game Manager</h3><p>Manage connected Roblox experiences, review game details, and access studio controls.</p><span class="card-link">Explore workspace <span aria-hidden="true">→</span></span></a>
<a class="card" href="#team"><div class="card-top"><div class="icon-box" aria-hidden="true">♙</div><span class="tag">Staff area</span></div><h3>Team &amp; access</h3><p>A future home for team roles, staff access, and permission management.</p><span class="card-link">View team area <span aria-hidden="true">→</span></span></a>
<a class="card" href="#integrations"><div class="card-top"><div class="icon-box" aria-hidden="true">↗</div><span class="tag">Integrations</span></div><h3>Connected services</h3><p>Keep Roblox and other studio integrations organized as tools are connected.</p><span class="card-link">View integrations <span aria-hidden="true">→</span></span></a>
</div>
<div class="lower-grid">
<section class="panel"><h2>Workspace activity</h2><p class="panel-sub">A snapshot of what’s currently available in the portal.</p>
<div class="activity-row"><div class="activity-icon" aria-hidden="true">✓</div><div><strong>Roblox authentication</strong><p>Sign-in and staff allowlist checks are enabled.</p></div><span class="activity-state">Active</span></div>
<div class="activity-row"><div class="activity-icon" aria-hidden="true">◈</div><div><strong>Game Manager</strong><p>Interface and Roblox actions still need to be built.</p></div><span class="activity-state">Planned</span></div>
<div class="activity-row"><div class="activity-icon" aria-hidden="true">⚙</div><div><strong>Studio integrations</strong><p>More services can be connected as needed.</p></div><span class="activity-state">Planned</span></div>
</section>
<section class="panel" id="account"><h2>Account &amp; security</h2><p class="panel-sub">Your current portal access.</p>
<div class="permission"><span>Identity provider</span><strong>ROBLOX</strong></div><div class="permission"><span>Staff approval</span><strong>VERIFIED</strong></div><div class="permission"><span>Session</span><strong>8 HOUR SESSION</strong></div>
<form method="post" action="/auth/roblox/logout" style="margin-top:20px"><button class="logout" type="submit">Sign out securely ↗</button></form>
</section>
</div>
<footer class="footer"><span class="footer-brand">KaTBox Interactives</span><span>Internal staff workspace · Keep it in the box.</span></footer>
</main></body></html>\`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" },
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
