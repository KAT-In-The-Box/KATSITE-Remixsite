import { createController } from 'remix/router'
import { createRedirectResponse } from 'remix/response/redirect'

import { assets } from '../assets.ts'
import { config } from '../config.ts'
import { beginRobloxLogin, endStaffSession, finishRobloxLogin, getStaffSession } from '../auth/roblox.ts'
import { createManagedGame, deleteManagedGame, hasDb, listManagedGames, pingDb, saveContactMessage, updateManagedGameStatus, type GameStatus } from '../data/mongo.ts'
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
<div class="topline"><div><p class="eyebrow">KaTBox internal · Staff workspace</p><h1 class="heading">Welcome back, ${safeName}.</h1><p class="intro">Your home base for studio operations, game management, and the tools that keep our worlds running.</p></div><div class="welcome-side"><div class="avatar" aria-hidden="true">${safeName.charAt(0).toUpperCase()}</div><div><small>Signed in as</small><strong>${safeName}</strong></div></div></div>
<section class="statusbar" aria-label="Account status"><span class="status-dot" aria-hidden="true"></span><div><strong>Roblox account verified</strong><p>Your account is approved for the KaTBox staff portal.</p></div><span class="status-label">Access active</span></section>
<div class="section-head" id="tools"><div><h2>Your workspace</h2><p>Quick access to staff areas and studio systems.</p></div><span class="section-kicker">01 / Overview</span></div>
<div class="cards">
<a class="card" href="/staff/games"><div class="card-top"><div class="icon-box" aria-hidden="true">⌘</div><span class="tag"><span class="tiny-dot"></span>Available</span></div><h3>Game Manager</h3><p>Add Roblox experiences, manage their status, and keep your studio game list in one place.</p><span class="card-link">Open Game Manager <span aria-hidden="true">→</span></span></a>
<a class="card" href="/staff/games"><div class="card-top"><div class="icon-box" aria-hidden="true">♙</div><span class="tag">Staff area</span></div><h3>Team &amp; access</h3><p>A future home for team roles, staff access, and permission management.</p><span class="card-link">View team area <span aria-hidden="true">→</span></span></a>
<a class="card" href="/staff/games"><div class="card-top"><div class="icon-box" aria-hidden="true">↗</div><span class="tag">Integrations</span></div><h3>Connected services</h3><p>Keep Roblox and other studio integrations organized as tools are connected.</p><span class="card-link">View integrations <span aria-hidden="true">→</span></span></a>
</div>
<div class="lower-grid">
<section class="panel"><h2>Workspace activity</h2><p class="panel-sub">A snapshot of what’s currently available in the portal.</p>
<div class="activity-row"><div class="activity-icon" aria-hidden="true">✓</div><div><strong>Roblox authentication</strong><p>Sign-in and staff allowlist checks are enabled.</p></div><span class="activity-state">Active</span></div>
<div class="activity-row"><div class="activity-icon" aria-hidden="true">◈</div><div><strong>Game Manager</strong><p>Manage the experiences listed in your staff workspace.</p></div><span class="activity-state">Available</span></div>
<div class="activity-row"><div class="activity-icon" aria-hidden="true">⚙</div><div><strong>Studio integrations</strong><p>More services can be connected as needed.</p></div><span class="activity-state">Planned</span></div>
</section>
<section class="panel" id="account"><h2>Account &amp; security</h2><p class="panel-sub">Your current portal access.</p>
<div class="permission"><span>Identity provider</span><strong>ROBLOX</strong></div><div class="permission"><span>Staff approval</span><strong>VERIFIED</strong></div><div class="permission"><span>Session</span><strong>8 HOUR SESSION</strong></div>
<form method="post" action="/auth/roblox/logout" style="margin-top:20px"><button class="logout" type="submit">Sign out securely ↗</button></form>
</section>
</div>
<footer class="footer"><span class="footer-brand">KaTBox Interactives</span><span>Internal staff workspace · Keep it in the box.</span></footer>
</main></body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" },
  })
}


function gameManagerPage(name: string, games: Awaited<ReturnType<typeof listManagedGames>>, message = ''): Response {
  const safeName = escapeHtml(name)
  const dbReady = hasDb()
  const gameCards = games.length ? games.map((game) => {
    const id = String(game._id ?? '')
    const safeId = escapeHtml(id)
    const safeGameName = escapeHtml(game.name)
    const safeDescription = escapeHtml(game.description)
    const safeUrl = /^https:\/\/(www\.)?roblox\.com\//i.test(game.placeUrl) ? game.placeUrl : ''
    const safeGameUrl = escapeHtml(safeUrl)
    const statuses: GameStatus[] = ['In development', 'Live', 'Paused', 'Archived']
    return `<article class="game"><div class="game-head"><div><span class="eyebrow">Experience</span><h2>${safeGameName}</h2></div><span class="status">${escapeHtml(game.status)}</span></div><p>${safeDescription || 'No description added yet.'}</p><div class="game-actions">${safeGameUrl ? `<a class="button secondary" href="${safeGameUrl}" target="_blank" rel="noopener noreferrer">Open on Roblox ↗</a>` : '<span class="muted">No Roblox link added</span>'}<form method="post" action="/staff/games/status" class="inline"><input type="hidden" name="id" value="${safeId}"><label class="sr-only" for="status-${safeId}">Game status</label><select id="status-${safeId}" name="status">${statuses.map((status) => `<option value="${status}" ${status === game.status ? 'selected' : ''}>${status}</option>`).join('')}</select><button class="button secondary" type="submit">Save status</button></form><form method="post" action="/staff/games/delete" onsubmit="return confirm('Delete this game from the portal?')" class="inline"><input type="hidden" name="id" value="${safeId}"><button class="button danger" type="submit">Delete</button></form></div></article>`
  }).join('') : '<div class="empty"><span class="empty-icon">⌘</span><h2>No games added yet</h2><p>Add your first Roblox experience using the form. It will appear here for the whole staff team.</p></div>'
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#000000"><title>Game Manager | KaTBox Interactives</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Pirata+One&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{color-scheme:dark;--bg:#000;--panel:#0e0e0e;--line:#2a2a2a;--ink:#fff;--muted:#aaa;--accent:#cf9066;--body:'Space Grotesk',system-ui,sans-serif;--display:'Pirata One',Georgia,serif}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 50% -20%,#cf90661c,transparent 48%),var(--bg);color:var(--ink);font:15px/1.6 var(--body)}a{color:inherit;text-decoration:none}button,input,select,textarea{font:inherit}.wrap{width:min(1050px,calc(100% - 40px));margin:auto}.top{padding:18px 20px}.nav{width:min(1200px,100%);margin:auto;display:flex;justify-content:space-between;align-items:center;gap:16px;border:1px solid #cf906640;border-radius:999px;background:#100c0af2;padding:10px 14px 10px 20px}.brand{font:400 25px var(--display)}.brand span{color:var(--accent)}.nav-links{display:flex;gap:10px;align-items:center}.nav-links a{font-size:12px;color:#bbb;padding:10px 14px;border-radius:999px}.nav-links a:hover{background:#ffffff0b;color:#fff}.main{padding:48px 0 80px}.eyebrow{color:var(--accent);font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}.title-row{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:28px}.title{font:400 clamp(42px,6vw,64px)/1 var(--display);margin:8px 0 12px}.intro{max-width:660px;color:#aaa;margin:0}.who{border:1px solid var(--line);border-radius:12px;padding:10px 14px;color:#aaa;font-size:12px;white-space:nowrap}.who strong{color:#fff}.notice{padding:14px 16px;margin:0 0 20px;border:1px solid #cf90664d;border-radius:12px;background:#cf906610;color:#e5c1a8}.notice.warning{border-color:#805d3d;color:#e4bd96}.columns{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:20px;align-items:start}.panel,.game,.empty{border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,#111 0%,#080808 100%);padding:22px}.panel h2,.game h2,.empty h2{font:400 28px var(--display);margin:0 0 6px}.sub{color:#929292;font-size:12px;margin:0 0 20px}.field{display:grid;gap:7px;margin:0 0 15px}.field label{font-size:11px;color:#c7c7c7;font-weight:700;letter-spacing:.05em}.field input,.field textarea,.inline select{width:100%;min-width:0;border:1px solid #333;border-radius:10px;background:#050505;color:#fff;padding:12px 13px;outline:none}.field textarea{min-height:90px;resize:vertical}.field input:focus,.field textarea:focus,.inline select:focus{border-color:var(--accent)}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--accent);border-radius:999px;background:var(--accent);color:#120b07;font-weight:700;font-size:12px;padding:11px 16px;cursor:pointer}.button:hover{filter:brightness(1.1)}.button.secondary{background:#17120f;color:#e7c2a9;border-color:#594131}.button.danger{background:#170c0c;color:#e8a4a4;border-color:#643535}.full{width:100%}.games{display:grid;gap:14px}.game-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.game h2{overflow-wrap:anywhere}.game p{color:#aaa;font-size:13px;margin:8px 0 18px;white-space:pre-wrap}.status{flex-shrink:0;border:1px solid #594131;border-radius:999px;padding:5px 9px;color:#e7c2a9;font-size:10px}.game-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.inline{display:flex;align-items:center;gap:7px}.inline select{width:auto;max-width:145px;padding:9px;font-size:11px}.inline .button{padding:9px 12px}.empty{text-align:center;padding:34px 24px}.empty-icon{font-size:30px;color:var(--accent)}.empty p,.muted{color:#929292;font-size:12px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.section-head{display:flex;justify-content:space-between;align-items:end;margin:34px 0 14px}.section-head h2{font:400 32px var(--display);margin:0}.section-head p{color:#999;font-size:12px;margin:4px 0 0}.footer{margin-top:36px;padding-top:18px;border-top:1px solid #222;display:flex;justify-content:space-between;gap:12px;color:#666;font-size:11px}@media(max-width:760px){.columns{grid-template-columns:1fr}.title-row{align-items:flex-start;flex-direction:column}.who{white-space:normal}.top{padding:12px}.nav{border-radius:18px;align-items:flex-start;flex-direction:column}.nav-links{flex-wrap:wrap}.main{padding-top:30px}.wrap{width:min(100% - 28px,1050px)}.game-actions{align-items:stretch}.inline{flex-wrap:wrap}.inline select{max-width:100%}.footer{flex-direction:column}}
</style></head><body><header class="top"><nav class="nav"><a class="brand" href="/staff">KaTBox <span>Interactives</span></a><div class="nav-links"><a href="/staff">Portal overview</a><a href="/staff/games">Game Manager</a><form method="post" action="/auth/roblox/logout"><button class="button secondary" type="submit">Sign out</button></form></div></nav></header><main class="wrap main">
<div class="title-row"><div><div class="eyebrow">Studio workspace / 01</div><h1 class="title">Game Manager</h1><p class="intro">Keep your Roblox experiences organized in one place. Add games, open their Roblox pages, and track their current development status.</p></div><div class="who">Signed in as <strong>${safeName}</strong></div></div>
${message ? `<div class="notice">${escapeHtml(message)}</div>` : ''}
${!dbReady ? '<div class="notice warning">Database is not connected. Add MONGODB_URI to your local .env and restart the server to save game entries.</div>' : ''}
<div class="columns"><section class="panel"><div class="eyebrow">New entry</div><h2>Add an experience</h2><p class="sub">Create a shared listing for a Roblox game your team manages.</p><form method="post" action="/staff/games/create">
<div class="field"><label for="name">GAME NAME</label><input id="name" name="name" maxlength="80" placeholder="e.g. Blades of Chance" required></div>
<div class="field"><label for="placeUrl">ROBLOX GAME URL</label><input id="placeUrl" name="placeUrl" type="url" maxlength="300" placeholder="https://www.roblox.com/games/..." required></div>
<div class="field"><label for="description">DESCRIPTION</label><textarea id="description" name="description" maxlength="500" placeholder="Short description or internal note"></textarea></div>
<div class="field"><label for="status">CURRENT STATUS</label><select id="status" name="status"><option>In development</option><option>Live</option><option>Paused</option><option>Archived</option></select></div>
<button class="button full" type="submit" ${dbReady ? '' : 'disabled'}>Add game to workspace ↗</button></form></section>
<section><div class="eyebrow">Your collection</div><h2 style="font:400 32px var(--display);margin:6px 0 4px">Managed games</h2><p class="sub">${games.length} ${games.length === 1 ? 'experience' : 'experiences'} in your workspace</p><div class="games">${gameCards}</div></section></div>
<footer class="footer"><span>KaTBox Interactives</span><span>Internal staff workspace · Keep it in the box.</span></footer></main></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" } })
}

export default createController(routes, {
  actions: {
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
    },

    async home(context) {
      let sent = new URL(context.request.url).searchParams.get('sent') === '1'
      let games = []
      try {
        games = await listManagedGames()
      } catch (error) {
        console.error('Failed to load public game list:', error)
      }
      return context.render(<HomePage bladesOfChanceUrl={config.bladesOfChanceUrl} managedGames={games} sent={sent} />)
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

    async gameManager(context) {
      const user = getStaffSession(context.request)
      if (!user) return createRedirectResponse('/auth/roblox/login', { status: 303 })
      let games = []
      let message = ''
      try {
        games = await listManagedGames()
      } catch (error) {
        console.error('Failed to load managed games:', error)
        message = 'Could not load the game list. Check the database connection and try again.'
      }
      return gameManagerPage(user.name, games, message)
    },

    async gameCreate(context) {
      if (!isSameOrigin(context.request)) return new Response('Forbidden', { status: 403 })
      const user = getStaffSession(context.request)
      if (!user) return createRedirectResponse('/auth/roblox/login', { status: 303 })
      const form = context.formData
      const name = readText(form, 'name')
      const placeUrl = readText(form, 'placeUrl')
      const description = readText(form, 'description')
      const status = readText(form, 'status') as GameStatus
      const allowedStatuses: GameStatus[] = ['In development', 'Live', 'Paused', 'Archived']
      let message = ''
      if (!name || name.length > 80) message = 'Enter a game name between 1 and 80 characters.'
      else if (description.length > 500) message = 'Description must be 500 characters or fewer.'
      else if (!/^https:\/\/(www\.)?roblox\.com\/games\/\d+/i.test(placeUrl)) message = 'Enter a valid Roblox game URL, such as https://www.roblox.com/games/123456789.'
      else if (!allowedStatuses.includes(status)) message = 'Choose a valid game status.'
      if (!message) {
        try {
          await createManagedGame({ name, placeUrl, description, status })
          message = 'Game added to your workspace.'
        } catch (error) {
          console.error('Failed to create managed game:', error)
          message = 'Could not save the game. Make sure MongoDB is configured and connected.'
        }
      }
      let games = []
      try { games = await listManagedGames() } catch { /* Show the form and actionable error. */ }
      return gameManagerPage(user.name, games, message)
    },

    async gameStatus(context) {
      if (!isSameOrigin(context.request)) return new Response('Forbidden', { status: 403 })
      const user = getStaffSession(context.request)
      if (!user) return createRedirectResponse('/auth/roblox/login', { status: 303 })
      const form = context.formData
      const id = readText(form, 'id')
      const status = readText(form, 'status') as GameStatus
      const allowedStatuses: GameStatus[] = ['In development', 'Live', 'Paused', 'Archived']
      let message = ''
      if (!allowedStatuses.includes(status)) message = 'Choose a valid game status.'
      else {
        try { await updateManagedGameStatus(id, status); message = 'Game status updated.' }
        catch (error) { console.error('Failed to update game status:', error); message = 'Could not update this game. Check the database connection and try again.' }
      }
      let games = []
      try { games = await listManagedGames() } catch { /* Keep the error visible. */ }
      return gameManagerPage(user.name, games, message)
    },

    async gameDelete(context) {
      if (!isSameOrigin(context.request)) return new Response('Forbidden', { status: 403 })
      const user = getStaffSession(context.request)
      if (!user) return createRedirectResponse('/auth/roblox/login', { status: 303 })
      const id = readText(context.formData, 'id')
      let message = ''
      try { await deleteManagedGame(id); message = 'Game removed from your workspace.' }
      catch (error) { console.error('Failed to delete managed game:', error); message = 'Could not delete this game. Check the database connection and try again.' }
      let games = []
      try { games = await listManagedGames() } catch { /* Keep the error visible. */ }
      return gameManagerPage(user.name, games, message)
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
