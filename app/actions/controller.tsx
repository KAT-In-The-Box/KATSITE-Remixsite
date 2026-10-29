import { createController } from 'remix/router'
import { createRedirectResponse } from 'remix/response/redirect'

import { assets } from '../assets.ts'
import { config } from '../config.ts'
import { beginRobloxLogin, endStaffSession, finishRobloxLogin, getStaffSession } from '../auth/roblox.ts'
import { createManagedGame, deleteManagedGame, hasDb, listManagedGames, moveManagedGame, pingDb, saveContactMessage, updateManagedGameMetadata, updateManagedGameStatus, setFeaturedManagedGame, type GameStatus } from '../data/mongo.ts'
import { fetchRobloxGame } from '../data/roblox-games.ts'
import { routes } from '../routes.ts'
import { CareersPage, GamesPage, HomePage, type ContactValues } from './home-page.tsx'

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
.columns{display:grid;grid-template-columns:minmax(255px,.7fr) minmax(0,1.8fr);gap:28px;align-items:start}.collection{min-width:0}.collection-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:0 0 28px}.collection-heading h2{font:400 38px var(--display);margin:5px 0 0}.collection-heading .sub{margin:5px 0 0}.library-count,.slot-count{white-space:nowrap;border:1px solid var(--line);border-radius:999px;padding:7px 11px;color:#a9c8e8;font-size:10px;font-weight:700;letter-spacing:.08em}.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin:30px 0 14px}.section-head h3{font-size:19px;margin:5px 0 2px}.section-head p{font-size:11px;color:var(--muted);margin:0}.section-index{font-size:9px;letter-spacing:.16em;font-weight:700;color:#7f93ab}.featured-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.featured-card,.featured-empty{min-width:0;border:1px solid var(--line);border-radius:15px;background:linear-gradient(145deg,#151e2a,#0b1017);padding:15px;overflow:hidden}.featured-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:17px}.slot-label{font-size:9px;letter-spacing:.1em;font-weight:700;color:#a9c8e8}.featured-card .status,.game-row .status{margin:0;font-size:9px;padding:4px 7px}.row-main{display:flex;align-items:center;gap:10px;min-width:0}.icon-wrap{width:48px;height:48px;flex-shrink:0;overflow:hidden;border-radius:12px;border:1px solid #344356;background:#182536;display:grid;place-items:center}.icon-wrap.small{width:52px;height:52px}.game-icon{width:100%;height:100%;object-fit:cover;display:block}.icon-fallback{width:100%;height:100%;place-items:center;background:linear-gradient(145deg,#263a50,#111925);font:28px var(--display);color:#a9c8e8}.game-title{min-width:0}.game-title h3{font:400 21px var(--display);line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0}.game-title p{font-size:10px;color:#8e9bad;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:5px 0 0}.quick-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:17px 0 14px}.quick-stats span{min-width:0;padding:8px 5px;border:1px solid rgba(190,211,235,.1);border-radius:9px;background:#fff2;font-size:8px;color:#8d9bad;text-align:center;overflow:hidden}.quick-stats strong{display:block;color:#eef5ff;font-size:12px;overflow-wrap:anywhere}.card-actions{display:flex;flex-direction:column;gap:7px}.card-actions .button{width:100%;font-size:10px;padding:9px}.slot-form{display:flex;gap:6px;min-width:0}.slot-form select{flex:1;min-width:0;width:40%;border:1px solid #29384a;border-radius:999px;background:#080d14;color:#d4e3f5;padding:7px;font-size:10px}.slot-form .button{width:auto;flex:1}.featured-empty{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;min-height:240px;border-style:dashed;background:linear-gradient(145deg,#111923,#090d13)}.empty-number{color:#52657c;font-size:10px;font-weight:700;letter-spacing:.12em}.empty-symbol{font-size:30px;color:#a9c8e8;margin-top:12px}.featured-empty h3{margin:8px 0 4px;font-size:13px}.featured-empty p{color:#8593a4;font-size:10px;margin:0 0 15px}.library-head{margin-top:40px;padding-top:26px;border-top:1px solid var(--line)}.game-list{display:grid;gap:8px}.game-row{display:grid;grid-template-columns:42px 52px minmax(0,1fr) auto;gap:12px;align-items:center;padding:13px;border:1px solid var(--line);border-radius:13px;background:#101722a8;min-width:0;transition:border-color .15s ease,background .15s ease}.game-row:hover{border-color:#344a63;background:#131d2a}.row-order{display:grid;gap:4px;justify-items:center}.row-order form{margin:0}.order-button{width:26px;height:24px;border:1px solid #29384a;border-radius:7px;background:#0b1119;color:#b7c9dd;cursor:pointer}.order-button:hover:not(:disabled){background:#223247;border-color:#58708a}.order-button:disabled{opacity:.25;cursor:default}.row-info{min-width:0}.row-title-line{display:flex;align-items:center;gap:9px;min-width:0}.row-title-line h3{font-size:13px;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.row-info p{font-size:10px;color:#91a0b2;margin:4px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.row-info p span{color:#4c5c70;padding:0 3px}.row-info .description{color:#748399}.row-menu{position:relative;align-self:center}.row-menu summary{cursor:pointer;list-style:none;border:1px solid #2a394b;border-radius:999px;padding:8px 11px;color:#b8c8da;font-size:10px;white-space:nowrap}.row-menu summary::-webkit-details-marker{display:none}.row-menu[open] summary{border-color:#718ba8}.row-menu-content{position:absolute;right:0;top:calc(100% + 8px);z-index:4;display:grid;gap:8px;width:min(260px,75vw);padding:12px;border:1px solid #304156;border-radius:12px;background:#0b1119;box-shadow:0 18px 40px #000b}.row-menu-content .inline{display:flex;flex-wrap:wrap}.row-menu-content .button{font-size:10px;padding:8px 10px}.row-menu-content select{min-width:0;max-width:120px;background:#080d14;color:#d4e3f5;border:1px solid #29384a;border-radius:9px;padding:7px;font-size:10px}.list-empty{padding:24px;border:1px dashed var(--line);border-radius:12px;color:#8593a4;font-size:12px;text-align:center}.add-panel{position:sticky;top:20px}.add-panel h2{font-size:27px}.field label span{color:#708197;font-size:9px;margin-left:5px}.footer{margin-top:45px}.button.secondary{background:#131d29;color:#d4e3f5;border-color:#33465d}.button.featured{background:#a9c8e8;color:#0b1119;border-color:#a9c8e8}.nav{border-color:#27364a;background:#0d131df2}.notice{border-color:#405b78;background:#a9c8e810;color:#d5e4f5}.panel{background:linear-gradient(145deg,#121a25,#0b1018);border-color:var(--line)}.field input,.field textarea,.inline select{border-color:#29384a;background:#080d14}.field input:focus,.field textarea:focus,.inline select:focus{border-color:#a9c8e8}@media(max-width:1050px){.columns{grid-template-columns:1fr}.add-panel{position:static}.featured-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){.featured-grid{grid-template-columns:1fr}.featured-empty{min-height:170px}.game-row{grid-template-columns:28px 44px minmax(0,1fr);gap:9px;padding:10px}.icon-wrap.small{width:44px;height:44px}.row-menu{grid-column:3;justify-self:start}.row-info p{white-space:normal}.collection-heading{align-items:flex-start;flex-direction:column}.section-head{align-items:flex-start;flex-direction:column}.quick-stats{margin:12px 0}.featured-card{padding:13px}}.columns{grid-template-columns:minmax(0,1.12fr) minmax(300px,.88fr);gap:18px}.columns>.collection{grid-column:1;grid-row:1;min-width:0}.columns>.profile-preview{grid-column:2;grid-row:1;position:sticky;top:18px;align-self:start;min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:18px;background:#0d0d0f}.columns>.add-panel{grid-column:2;grid-row:2;align-self:start}.collection{min-width:0}.collection-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.collection-heading h2{font:400 34px var(--display);margin:5px 0}.collection-heading .sub{margin:0}.featured-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}.featured-card{padding:13px 14px;border:1px solid var(--line);border-radius:13px;background:#131416;min-width:0}.featured-top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.slot-label,.section-index{font-size:9px;font-weight:700;letter-spacing:.14em;color:var(--accent)}.row-main{display:flex;align-items:center;gap:11px;min-width:0}.icon-wrap{width:46px;height:46px;display:grid;place-items:center;flex-shrink:0;border-radius:12px;background:#1b2736;border:1px solid var(--line);color:var(--accent);font:24px var(--display)}.icon-wrap.small{width:44px;height:44px}.icon-fallback{display:grid!important;place-items:center;width:100%;height:100%;font:24px var(--display);color:var(--accent)}.game-title{min-width:0;flex:1}.game-title h3{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px}.game-title p{margin:3px 0 0;color:var(--muted);font-size:10px}.quick-stats{display:flex;gap:14px;flex-wrap:wrap;margin:11px 0;color:var(--muted);font-size:10px}.quick-stats strong{color:var(--ink)}.card-actions{display:flex;flex-wrap:wrap;gap:7px}.card-actions .button,.card-actions select{font-size:10px;padding:7px 10px}.slot-form{display:flex;gap:5px;align-items:center}.slot-form select{border:1px solid var(--line);border-radius:8px;background:#080d14;color:#dce8f6}.featured-empty{min-height:100px;padding:15px;display:grid;grid-template-columns:36px minmax(0,1fr);column-gap:10px;align-items:center;border:1px dashed #344153;border-radius:13px;background:#ffffff02}.empty-number{grid-row:span 3;color:var(--accent);font:24px var(--display)}.featured-empty .empty-symbol{display:none}.featured-empty h3{margin:0;font-size:13px}.featured-empty p{margin:2px 0;color:var(--muted);font-size:10px}.featured-empty .button{grid-column:2;justify-self:start;padding:6px 9px;font-size:10px}.section-head{margin:23px 0 11px}.section-head h3{font-size:18px;margin:4px 0}.section-head p{margin:3px 0}.game-list{display:grid;gap:7px}.game-row{display:grid;grid-template-columns:35px 44px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 11px;border:1px solid var(--line);border-radius:12px;background:#131416;min-width:0}.row-order{display:flex;flex-direction:column;gap:2px}.order-button{width:26px;height:22px;border:0;border-radius:6px;background:#ffffff08;color:#a9c8e8;cursor:pointer}.order-button:disabled{opacity:.22;cursor:default}.row-info{min-width:0}.row-title-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.row-title-line h3{margin:0;font-size:13px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}.row-title-line .status{margin:0;padding:3px 7px;font-size:9px}.row-info>p{margin:3px 0 0;color:#8c96a4;font-size:10px;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.row-info>p.description{display:none}.row-menu summary{list-style:none;cursor:pointer;border:1px solid var(--line);border-radius:8px;padding:7px 8px;color:#bfcddd;font-size:10px;white-space:nowrap}.row-menu summary::-webkit-details-marker{display:none}.row-menu-content{position:absolute;z-index:5;right:12px;display:grid;gap:7px;min-width:190px;padding:10px;border:1px solid #344153;border-radius:12px;background:#0c1119;box-shadow:0 15px 40px #000b}.row-menu-content .inline{display:flex;flex-wrap:wrap}.row-menu-content .button,.row-menu-content select{font-size:10px;padding:7px 9px}.row-menu-content select{max-width:100%;background:#080d14;color:#e5edf7;border:1px solid var(--line);border-radius:8px}.profile-preview{box-shadow:0 20px 50px #0004}.preview-top{display:flex;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line);font-size:9px;letter-spacing:.12em;color:#8d9aac}.preview-banner{height:130px;background:radial-gradient(ellipse at 70% 30%,#a9c8e83d,transparent 45%),linear-gradient(135deg,#25384d,#101722 65%,#0a0d12);border-bottom:1px solid var(--line)}.preview-profile{display:flex;align-items:center;gap:12px;padding:0 16px;margin-top:-24px;position:relative}.preview-avatar{width:62px;height:62px;display:grid;place-items:center;flex-shrink:0;border:3px solid #0d0d0f;border-radius:50%;background:linear-gradient(145deg,#24364a,#101722);font:30px var(--display);color:var(--accent)}.preview-name{min-width:0;flex:1;padding-top:26px}.preview-name .eyebrow{font-size:8px}.preview-name h2{font:400 24px var(--display);margin:3px 0;overflow-wrap:anywhere}.preview-name p{margin:0;color:var(--muted);font-size:11px}.preview-profile>.status{margin-top:28px}.preview-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:18px;border-block:1px solid var(--line)}.preview-stats div{display:grid;gap:3px;justify-items:center;padding:14px 5px;border-right:1px solid var(--line);min-width:0}.preview-stats div:last-child{border:0}.preview-stats strong{font-size:15px;overflow-wrap:anywhere}.preview-stats span{font-size:9px;color:var(--muted)}.preview-about{padding:16px}.preview-about h3{font-size:13px;margin:0 0 7px}.preview-about p{margin:0 0 16px;color:#aeb9c8;font-size:11px;line-height:1.7;overflow-wrap:anywhere}.preview-about .button{display:flex}.preview-empty{padding:32px;text-align:center}.preview-empty h2{font:400 28px var(--display)}.preview-empty p{color:var(--muted);font-size:12px}@media(max-width:950px){.columns{grid-template-columns:minmax(0,1fr)}.columns>.collection,.columns>.profile-preview,.columns>.add-panel{grid-column:1;grid-row:auto}.columns>.profile-preview{position:relative;top:auto;order:2}.columns>.add-panel{order:3}}@media(max-width:580px){.game-row{grid-template-columns:24px 38px minmax(0,1fr);gap:8px}.game-row .icon-wrap.small{width:38px;height:38px}.row-menu{grid-column:3;justify-self:start}.row-info>p{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.featured-card .card-actions{gap:5px}.slot-form{flex-wrap:wrap}.collection-heading{align-items:flex-start}.library-count{display:none}}</style></head><body>
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
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https: data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" },
  })
}


function gameManagerPage(name: string, games: Awaited<ReturnType<typeof listManagedGames>>, message = ''): Response {
  const safeName = escapeHtml(name)
  const dbReady = hasDb()
  const sorted = [...games].sort((a, b) => {
    const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER
    const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER
    return ao - bo || a.name.localeCompare(b.name)
  })
  const featuredGames = sorted.filter((game) => game.featuredOrder != null || game.featured).sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99)).slice(0, 3).map((game, index) => game.featuredOrder == null ? { ...game, featuredOrder: index + 1 } : game)
  const previewGame = featuredGames[0] ?? sorted.find((game) => game.status !== 'Archived') ?? sorted[0]
  const featureCard = (game: typeof sorted[number], slot: number) => {
    const id = escapeHtml(String(game._id ?? ''))
    const icon = ''
    const url = /^https:\/\/(www\.)?roblox\.com\//i.test(game.placeUrl) ? escapeHtml(game.placeUrl) : ''
    return `<article class="featured-card"><div class="featured-top"><span class="slot-label">FEATURED SLOT 0${slot}</span><span class="status ${game.status === 'Live' ? 'status-live' : ''}">${escapeHtml(game.status)}</span></div><div class="row-main"><div class="icon-wrap">${icon ? `<img class="game-icon" src="${icon}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : ''}<span class="icon-fallback" ${icon ? 'style="display:none"' : ''}>${escapeHtml((game.name || 'K').slice(0,1).toUpperCase())}</span></div><div class="game-title"><h3>${escapeHtml(game.name)}</h3><p>By ${escapeHtml(game.creatorName || 'Unknown creator')}</p></div></div><div class="quick-stats"><span><strong>${Number(game.visits || 0).toLocaleString()}</strong> visits</span><span><strong>${Number(game.favorites || 0).toLocaleString()}</strong> favorites</span><span><strong>${Number(game.playing || 0).toLocaleString()}</strong> playing</span></div><div class="card-actions">${url ? `<a class="button secondary" href="${url}" target="_blank" rel="noopener noreferrer">View on Roblox ↗</a>` : ''}<form method="post" action="/staff/games/feature" class="slot-form"><input type="hidden" name="id" value="${id}"><input type="hidden" name="slot" value="0"><button class="button secondary" type="submit">Remove feature</button></form><form method="post" action="/staff/games/feature" class="slot-form"><input type="hidden" name="id" value="${id}"><label class="sr-only" for="slot-${id}">Featured slot</label><select id="slot-${id}" name="slot"><option value="1" ${slot === 1 ? 'selected' : ''}>Slot 01</option><option value="2" ${slot === 2 ? 'selected' : ''}>Slot 02</option><option value="3" ${slot === 3 ? 'selected' : ''}>Slot 03</option></select><button class="button secondary" type="submit">Move slot</button></form></div></article>`
  }
  const otherGames = sorted.filter((game) => !featuredGames.some((featured) => String(featured._id) === String(game._id)))
  const gameRow = (game: typeof sorted[number], index: number) => {
    const id = escapeHtml(String(game._id ?? ''))
    const icon = /^https:\/\//i.test(game.iconUrl || '') ? escapeHtml(game.iconUrl) : ''
    const url = /^https:\/\/(www\.)?roblox\.com\//i.test(game.placeUrl) ? escapeHtml(game.placeUrl) : ''
    const statuses: GameStatus[] = ['In development', 'Live', 'Paused', 'Archived']
    return `<article class="game-row"><div class="row-order"><form method="post" action="/staff/games/reorder"><input type="hidden" name="id" value="${id}"><input type="hidden" name="direction" value="up"><button class="order-button" type="submit" aria-label="Move ${escapeHtml(game.name)} up" ${index === 0 ? 'disabled' : ''}>↑</button></form><form method="post" action="/staff/games/reorder"><input type="hidden" name="id" value="${id}"><input type="hidden" name="direction" value="down"><button class="order-button" type="submit" aria-label="Move ${escapeHtml(game.name)} down" ${index === sorted.length - 1 ? 'disabled' : ''}>↓</button></form></div><div class="icon-wrap small">${icon ? `<img class="game-icon" src="${icon}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : ''}<span class="icon-fallback" ${icon ? 'style="display:none"' : ''}>${escapeHtml((game.name || 'K').slice(0,1).toUpperCase())}</span></div><div class="row-info"><div class="row-title-line"><h3>${escapeHtml(game.name)}</h3><span class="status ${game.status === 'Live' ? 'status-live' : ''}">${escapeHtml(game.status)}</span></div><p>${escapeHtml(game.creatorName || 'Unknown creator')} <span>·</span> ${Number(game.visits || 0).toLocaleString()} visits <span>·</span> ${Number(game.favorites || 0).toLocaleString()} favorites <span>·</span> ${Number(game.playing || 0).toLocaleString()} playing</p><p class="description">${escapeHtml(game.description || 'No description available.')}</p></div><details class="row-menu"><summary>Manage <span>⌄</span></summary><div class="row-menu-content">${url ? `<a class="button secondary" href="${url}" target="_blank" rel="noopener noreferrer">Open on Roblox ↗</a>` : ''}<form method="post" action="/staff/games/feature" class="inline"><input type="hidden" name="id" value="${id}"><label class="sr-only" for="slot-select-${id}">Featured slot</label><select id="slot-select-${id}" name="slot"><option value="0">Not featured</option><option value="1">Featured 01</option><option value="2">Featured 02</option><option value="3">Featured 03</option></select><button class="button secondary" type="submit">Set featured</button></form><form method="post" action="/staff/games/refresh" class="inline"><input type="hidden" name="id" value="${id}"><button class="button secondary" type="submit">Refresh info</button></form><form method="post" action="/staff/games/status" class="inline"><input type="hidden" name="id" value="${id}"><label class="sr-only" for="status-${id}">Game status</label><select id="status-${id}" name="status">${statuses.map((status) => `<option value="${status}" ${status === game.status ? 'selected' : ''}>${status}</option>`).join('')}</select><button class="button secondary" type="submit">Save status</button></form><form method="post" action="/staff/games/delete" onsubmit="return confirm('Delete this game from the portal?')" class="inline"><input type="hidden" name="id" value="${id}"><button class="button danger" type="submit">Delete game</button></form></div></details></article>`
  }
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#000000"><title>Game Manager | KaTBox Interactives</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Pirata+One&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{color-scheme:dark;--bg:#070a0f;--panel:#101722;--line:rgba(190,211,235,.14);--ink:#f5f8fc;--muted:#9caabd;--accent:#a9c8e8;--body:'Space Grotesk',system-ui,sans-serif;--display:'Pirata One',Georgia,serif}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 50% -20%,#cf90661c,transparent 48%),var(--bg);color:var(--ink);font:15px/1.6 var(--body)}a{color:inherit;text-decoration:none}button,input,select,textarea{font:inherit}.wrap{width:min(1050px,calc(100% - 40px));margin:auto}.top{padding:18px 20px}.nav{width:min(1200px,100%);margin:auto;display:flex;justify-content:space-between;align-items:center;gap:16px;border:1px solid #cf906640;border-radius:999px;background:#100c0af2;padding:10px 14px 10px 20px}.brand{font:400 25px var(--display)}.brand span{color:var(--accent)}.nav-links{display:flex;gap:10px;align-items:center}.nav-links a{font-size:12px;color:#bbb;padding:10px 14px;border-radius:999px}.nav-links a:hover{background:#ffffff0b;color:#fff}.main{padding:48px 0 80px}.eyebrow{color:var(--accent);font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}.title-row{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:28px}.title{font:400 clamp(42px,6vw,64px)/1 var(--display);margin:8px 0 12px}.intro{max-width:660px;color:#aaa;margin:0}.who{border:1px solid var(--line);border-radius:12px;padding:10px 14px;color:#aaa;font-size:12px;white-space:nowrap}.who strong{color:#fff}.notice{padding:14px 16px;margin:0 0 20px;border:1px solid #cf90664d;border-radius:12px;background:#cf906610;color:#e5c1a8}.notice.warning{border-color:#805d3d;color:#e4bd96}.columns{display:grid;grid-template-columns:minmax(245px,.72fr) minmax(0,1.8fr);gap:22px;align-items:start}.columns>section:last-child{min-width:0;padding:4px 0}.games{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,285px),1fr));gap:16px}.game{padding:0;min-width:0;overflow:hidden;border:1px solid rgba(190,211,235,.14);border-radius:18px;background:linear-gradient(155deg,rgba(22,31,44,.94),rgba(10,14,21,.98));box-shadow:0 12px 35px #0003;transition:transform .18s ease,border-color .18s ease}.game:hover{transform:translateY(-2px);border-color:rgba(169,200,232,.35)}.game-banner{height:96px;margin:0;background-color:#111b29;background-position:center;background-size:cover;border-bottom:1px solid var(--line);position:relative}.game-banner-empty{display:flex;align-items:center;padding:0 18px;background:radial-gradient(ellipse at 75% 25%,#a9c8e822,transparent 40%),linear-gradient(120deg,#182536,#0b111b)}.game-banner-empty span{font-size:9px;font-weight:700;letter-spacing:.2em;color:#a9c8e8aa}.game-head{align-items:center;justify-content:flex-start;padding:0 16px;margin-top:-25px;position:relative}.game-icon-wrap{width:58px;height:58px;flex-shrink:0;display:grid;place-items:center;border:3px solid #0c121b;border-radius:16px;background:#182536;overflow:hidden}.game-icon{width:100%;height:100%;object-fit:cover;border-radius:12px}.game-icon-fallback{width:100%;height:100%;place-items:center;font:400 25px var(--display);color:var(--accent);background:linear-gradient(145deg,#24364a,#101722)}.game-heading{padding-top:25px;flex:1;min-width:0}.game-heading .eyebrow{font-size:9px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.game h2{font-size:23px;line-height:1.08;margin:4px 0 3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.game-heading .muted{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.status{align-self:flex-start;margin-top:31px;border-color:#42536a;background:#1a2635;color:#c8d9ed;white-space:nowrap}.status-live{border-color:#28674f;background:#10291f;color:#8be0b5}.game .game-description{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:42px;margin:14px 16px 12px;color:#aab7c7;font-size:12px;line-height:1.7}.stats{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:0 16px 14px}.stats div{padding:9px 7px;border-color:rgba(190,211,235,.10);background:#ffffff04;text-align:center}.stats strong{font-size:15px;color:#eef5ff}.stats span{font-size:8px;letter-spacing:.04em;color:#8191a5}.game-manage{margin:0 16px 12px;border:1px solid rgba(190,211,235,.12);border-radius:10px;background:#ffffff03}.game-manage summary{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;cursor:pointer;color:#c9d7e7;font-size:11px;font-weight:600;list-style:none}.game-manage summary::-webkit-details-marker{display:none}.game-manage[open] summary{border-bottom:1px solid var(--line)}.game-manage summary span{color:var(--accent)}.game-actions{padding:10px;gap:7px}.game-actions .button{font-size:10px;padding:8px 10px}.game-actions .inline{flex-wrap:wrap}.game-actions .inline select{max-width:130px}.sync-note{margin:0!important;padding:0 16px 14px;font-size:9px;color:#738197}.button{border-color:var(--accent);background:var(--accent);color:#0b1119}.button.secondary{background:#151f2b;color:#d4e3f5;border-color:#33465d}.button.featured{background:#a9c8e8;color:#0b1119;border-color:#a9c8e8}.nav{border-color:#27364a;background:#0d131df2}.notice{border-color:#405b78;background:#a9c8e810;color:#d5e4f5}.panel{background:linear-gradient(145deg,#121a25,#0b1018);border-color:var(--line)}.field input,.field textarea,.inline select{border-color:#29384a;background:#080d14}.field input:focus,.field textarea:focus,.inline select:focus{border-color:var(--accent)}.who{border-color:var(--line)}.panel,.game,.empty{border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,#111 0%,#080808 100%);padding:22px}.panel h2,.game h2,.empty h2{font:400 28px var(--display);margin:0 0 6px}.sub{color:#929292;font-size:12px;margin:0 0 20px}.field{display:grid;gap:7px;margin:0 0 15px}.field label{font-size:11px;color:#c7c7c7;font-weight:700;letter-spacing:.05em}.field input,.field textarea,.inline select{width:100%;min-width:0;border:1px solid #333;border-radius:10px;background:#050505;color:#fff;padding:12px 13px;outline:none}.field textarea{min-height:90px;resize:vertical}.field input:focus,.field textarea:focus,.inline select:focus{border-color:var(--accent)}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--accent);border-radius:999px;background:var(--accent);color:#120b07;font-weight:700;font-size:12px;padding:11px 16px;cursor:pointer}.button:hover{filter:brightness(1.1)}.button.secondary{background:#17120f;color:#e7c2a9;border-color:#594131}.button.danger{background:#170c0c;color:#e8a4a4;border-color:#643535}.button.featured{background:#cf9066;color:#120b07;border-color:#cf9066}.full{width:100%}.games{display:grid;gap:14px}.game-banner{height:130px;margin:-22px -22px 18px;background:#21160f center/cover no-repeat;border-bottom:1px solid var(--line)}.game-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.game-icon{width:64px;height:64px;object-fit:cover;border-radius:14px;border:1px solid #444;flex-shrink:0}.game-heading{flex:1;min-width:0}.game h2{overflow-wrap:anywhere}.game p{color:#aaa;font-size:13px;margin:8px 0 18px;white-space:pre-wrap}.status{flex-shrink:0;border:1px solid #594131;border-radius:999px;padding:5px 9px;color:#e7c2a9;font-size:10px}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}.stats div{padding:10px;border:1px solid var(--line);border-radius:10px;min-width:0}.stats strong,.stats span{display:block}.stats strong{font-size:18px;overflow-wrap:anywhere}.stats span,.sync-note{color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.06em}.sync-note{margin:14px 0 0!important;text-transform:none;letter-spacing:0}.game-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.inline{display:flex;align-items:center;gap:7px}.inline select{width:auto;max-width:145px;padding:9px;font-size:11px}.inline .button{padding:9px 12px}.empty{text-align:center;padding:34px 24px}.empty-icon{font-size:30px;color:var(--accent)}.empty p,.muted{color:#929292;font-size:12px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.section-head{display:flex;justify-content:space-between;align-items:end;margin:34px 0 14px}.section-head h2{font:400 32px var(--display);margin:0}.section-head p{color:#999;font-size:12px;margin:4px 0 0}.footer{margin-top:36px;padding-top:18px;border-top:1px solid #222;display:flex;justify-content:space-between;gap:12px;color:#666;font-size:11px}@media(max-width:760px){.columns{grid-template-columns:1fr}.title-row{align-items:flex-start;flex-direction:column}.who{white-space:normal}.top{padding:12px}.nav{border-radius:18px;align-items:flex-start;flex-direction:column}.nav-links{flex-wrap:wrap}.main{padding-top:30px}.wrap{width:min(100% - 28px,1050px)}.game-actions{align-items:stretch}.inline{flex-wrap:wrap}.inline select{max-width:100%}.footer{flex-direction:column}}
</style></head><body><header class="top"><nav class="nav"><a class="brand" href="/staff">KaTBox <span>Interactives</span></a><div class="nav-links"><a href="/staff">Portal overview</a><a href="/staff/games">Game Manager</a><form method="post" action="/auth/roblox/logout"><button class="button secondary" type="submit">Sign out</button></form></div></nav></header><main class="wrap main">
<div class="title-row"><div><div class="eyebrow">Studio workspace / 01</div><h1 class="title">Game Manager</h1><p class="intro">Keep your Roblox experiences organized in one place. Add games, open their Roblox pages, and track their current development status.</p></div><div class="who">Signed in as <strong>${safeName}</strong></div></div>
${message ? `<div class="notice">${escapeHtml(message)}</div>` : ''}
${!dbReady ? '<div class="notice warning">Database is not connected. Add MONGODB_URI to your local .env and restart the server to save game entries.</div>' : ''}
<div class="columns"><section class="panel add-panel"><div class="eyebrow">Workspace</div><h2>Add an experience</h2><p class="sub">Import a Roblox game to manage its public listing, status and featured placement.</p><form method="post" action="/staff/games/create">
<div class="field"><label for="name">DISPLAY NAME OVERRIDE <span>OPTIONAL</span></label><input id="name" name="name" maxlength="80" placeholder="Use the Roblox title by default"></div>
<div class="field"><label for="placeUrl">ROBLOX GAME URL</label><input id="placeUrl" name="placeUrl" type="url" maxlength="300" placeholder="https://www.roblox.com/games/..." required></div>
<div class="field"><label for="description">DESCRIPTION OVERRIDE <span>OPTIONAL</span></label><textarea id="description" name="description" maxlength="500" placeholder="Use the Roblox description by default"></textarea></div>
<div class="field"><label for="status">DEVELOPMENT STATUS</label><select id="status" name="status"><option>In development</option><option>Live</option><option>Paused</option><option>Archived</option></select></div>
<button class="button full" type="submit" ${dbReady ? '' : 'disabled'}>＋ Add game</button></form></section>
<section class="collection"><div class="collection-heading"><div><div class="eyebrow">Your collection</div><h2>Game library</h2><p class="sub">${games.length} experiences · drag-free manual ordering with arrows</p></div><span class="library-count">${games.length} TOTAL</span></div>
<div class="section-head"><div><span class="section-index">01 / HOMEPAGE</span><h3>Featured experiences</h3><p>Choose up to three games to showcase on the homepage.</p></div><span class="slot-count">${featuredGames.length} / 3 selected</span></div>
<div class="featured-grid">${[1,2,3].map((slot) => { const game = featuredGames.find((entry) => entry.featuredOrder === slot); return game ? featureCard(game,slot) : `<article class="featured-empty"><span class="empty-number">0${slot}</span><div class="empty-symbol">＋</div><h3>Featured slot open</h3><p>Choose a game below to fill this space.</p><form method="get" action="/staff/games"><button class="button secondary" type="button" onclick="document.getElementById('game-library').scrollIntoView({behavior:'smooth'})">Choose a game ↓</button></form></article>` }).join('')}</div>
<div class="section-head library-head" id="game-library"><div><span class="section-index">02 / LIBRARY</span><h3>All other games</h3><p>Use the arrows to change display order. Featured games are listed above.</p></div><span class="slot-count">${otherGames.length} games</span></div>
<div class="game-list">${otherGames.length ? otherGames.map((game) => gameRow(game, sorted.findIndex((entry) => String(entry._id) === String(game._id)))).join('') : '<div class="list-empty">Every game is featured, or your collection is empty.</div>'}</div>
</section><aside class="profile-preview"><div class="preview-top"><span>LIVE PREVIEW</span><span>katbox.studio / games</span></div><div class="preview-banner"></div><div class="preview-profile"><div class="preview-avatar">${escapeHtml((previewGame?.name || "K").slice(0,1).toUpperCase())}</div><div class="preview-name"><span class="eyebrow">KATBOX INTERACTIVES</span><h2>${previewGame ? escapeHtml(previewGame.name) : "Your game title"}</h2><p>${previewGame ? escapeHtml(previewGame.creatorName || "KaTBox Interactives") : "Studio creator"}</p></div>${previewGame ? `<span class="status ${previewGame.status === "Live" ? "status-live" : ""}">${escapeHtml(previewGame.status)}</span>` : ""}</div><div class="preview-stats"><div><strong>${previewGame ? Number(previewGame.visits || 0).toLocaleString() : "—"}</strong><span>Visits</span></div><div><strong>${previewGame ? Number(previewGame.favorites || 0).toLocaleString() : "—"}</strong><span>Favorites</span></div><div><strong>${previewGame ? Number(previewGame.playing || 0).toLocaleString() : "—"}</strong><span>Playing</span></div></div><div class="preview-about"><h3>About this experience</h3><p>${previewGame ? escapeHtml(previewGame.description || "No description added yet.") : "Select a game to preview its public profile layout."}</p>${previewGame && /^https:\/\/(www\.)?roblox\.com\//i.test(previewGame.placeUrl) ? `<a class="button full" href="${escapeHtml(previewGame.placeUrl)}" target="_blank" rel="noopener noreferrer">View on Roblox ↗</a>` : ""}</div></aside></div><footer<span>KaTBox Interactives</span><span>Internal staff workspace · Keep it in the box.</span></footer></main></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https: data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" } })
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
        // Refresh cached public Roblox stats periodically without blocking every page view.
        for (const game of games) {
          const synced = game.lastSyncedAt ? new Date(game.lastSyncedAt).getTime() : 0
          if (Date.now() - synced > 30 * 60 * 1000 && game._id) {
            try {
              const metadata = await fetchRobloxGame(game.placeUrl)
              await updateManagedGameMetadata(String(game._id), metadata)
              Object.assign(game, metadata)
            } catch (error) {
              console.error('Could not refresh Roblox metadata for', game.name, error)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load public game list:', error)
      }
      return context.render(<HomePage bladesOfChanceUrl={config.bladesOfChanceUrl} managedGames={games} sent={sent} />)
    },

    careers(context) {
      return context.render(<CareersPage />)
    },

    async games(context) {
      let games = []
      try {
        games = await listManagedGames()
        // Only display active portfolio entries; the staff portal retains paused and archived records.
        games = games.filter((game) => game.status !== 'Paused' && game.status !== 'Archived')
      } catch (error) {
        console.error('Failed to load public game portfolio:', error)
      }
      return context.render(<GamesPage managedGames={games} />)
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
      const nameOverride = readText(form, 'name')
      const placeUrl = readText(form, 'placeUrl')
      const descriptionOverride = readText(form, 'description')
      const status = readText(form, 'status') as GameStatus
      const allowedStatuses: GameStatus[] = ['In development', 'Live', 'Paused', 'Archived']
      let message = ''
      if (nameOverride.length > 80) message = 'Game name must be 80 characters or fewer.'
      else if (descriptionOverride.length > 500) message = 'Description must be 500 characters or fewer.'
      else if (!/^https:\/\/(www\.)?roblox\.com\/games\/\d+/i.test(placeUrl)) message = 'Enter a valid Roblox game URL, such as https://www.roblox.com/games/123456789.'
      else if (!allowedStatuses.includes(status)) message = 'Choose a valid game status.'
      if (!message) {
        try {
          const metadata = await fetchRobloxGame(placeUrl)
          await createManagedGame({
            ...metadata,
            placeUrl,
            status,
            name: nameOverride || metadata.name,
            description: descriptionOverride || metadata.description,
          })
          message = 'Roblox details imported and game added to your workspace.'
        } catch (error) {
          console.error('Failed to import or create managed game:', error)
          message = error instanceof Error ? error.message : 'Could not import the Roblox game. Check the URL and try again.'
        }
      }
      let games = []
      try { games = await listManagedGames() } catch { /* Show the form and actionable error. */ }
      return gameManagerPage(user.name, games, message)
    },

    async gameRefresh(context) {
      if (!isSameOrigin(context.request)) return new Response('Forbidden', { status: 403 })
      const user = getStaffSession(context.request)
      if (!user) return createRedirectResponse('/auth/roblox/login', { status: 303 })
      const id = readText(context.formData, 'id')
      let message = ''
      try {
        const { ObjectId } = await import('mongodb')
        if (!ObjectId.isValid(id)) throw new Error('Invalid game ID.')
        const games = await listManagedGames()
        const game = games.find((entry) => String(entry._id) === id)
        if (!game) throw new Error('Game was not found in the configured collection.')
        const metadata = await fetchRobloxGame(game.placeUrl)
        await updateManagedGameMetadata(id, metadata)
        message = 'Roblox title, description, images and stats refreshed.'
      } catch (error) {
        console.error('Failed to refresh Roblox game:', error)
        message = error instanceof Error ? error.message : 'Could not refresh Roblox details.'
      }
      let games = []
      try { games = await listManagedGames() } catch { /* Keep the error visible. */ }
      return gameManagerPage(user.name, games, message)
    },

    async gameFeature(context) {
      if (!isSameOrigin(context.request)) return new Response('Forbidden', { status: 403 })
      const user = getStaffSession(context.request)
      if (!user) return createRedirectResponse('/auth/roblox/login', { status: 303 })
      const id = readText(context.formData, 'id')
      let message = ''
      const rawSlot = readText(context.formData, 'slot')
      const slot = rawSlot === '' || rawSlot === '0' ? null : Number(rawSlot)
      try { await setFeaturedManagedGame(id, slot); message = slot === null ? 'Game removed from featured slots.' : `Featured slot 0${slot} updated.` }
      catch (error) { console.error('Failed to set featured game:', error); message = error instanceof Error ? error.message : 'Could not set featured game.' }
      let games = []
      try { games = await listManagedGames() } catch { /* Keep the error visible. */ }
      return gameManagerPage(user.name, games, message)
    },

    async gameReorder(context) {
      if (!isSameOrigin(context.request)) return new Response('Forbidden', { status: 403 })
      const user = getStaffSession(context.request)
      if (!user) return createRedirectResponse('/auth/roblox/login', { status: 303 })
      const id = readText(context.formData, 'id')
      const direction = readText(context.formData, 'direction')
      let message = ''
      if (direction !== 'up' && direction !== 'down') message = 'Choose a valid ordering direction.'
      else {
        try { await moveManagedGame(id, direction); message = 'Game order updated.' }
        catch (error) { console.error('Failed to reorder games:', error); message = error instanceof Error ? error.message : 'Could not reorder games.' }
      }
      let games = []
      try { games = await listManagedGames() } catch { /* Keep the error visible. */ }
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
