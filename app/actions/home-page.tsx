import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'

import { routes } from '../routes.ts'
import { Document } from './document.tsx'
import type { ManagedGame } from '../data/mongo.ts'

export interface ContactValues {
  name: string
  email: string
  message: string
}

export interface HomePageProps {
  bladesOfChanceUrl?: string
  managedGames?: ManagedGame[]
  values?: ContactValues
  errors?: Partial<Record<keyof ContactValues, string>>
  sent?: boolean
  failed?: boolean
}

const BODY_FONT = "'Space Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif"
const DISPLAY_FONT = "'Pirata One', 'Space Grotesk', Georgia, serif"
const BRAND_FONT = "'Pirata One', 'Space Grotesk', serif"

export function HomePage(handle: Handle<HomePageProps>) {
  return () => (
    <Document head={<HomeHead />} title="KaTBox Interactives | Roblox game studio">
      <div
        mix={css({
          '--bg': '#05070b',
          '--surface': 'rgba(18, 23, 31, 0.82)',
          '--line': 'rgba(190, 211, 235, 0.14)',
          '--ink': '#f8fbff',
          '--muted': '#aab5c3',
          '--accent': '#a9c8e8',
          '--on-accent': '#080d14',
          '& *, & *::before, & *::after': { boxSizing: 'border-box' },
          minHeight: '100vh',
          background: 'var(--bg)',
          color: 'var(--ink)',
          fontFamily: BODY_FONT,
          fontSize: '17px',
          lineHeight: 1.6,
          WebkitFontSmoothing: 'antialiased',
          '& a': { color: 'inherit' },
          '& :focus-visible': { outline: '2px solid var(--accent)', outlineOffset: '3px' },
          '@keyframes katbox-pill-float': {
            '0%, 100%': { transform: 'translate3d(var(--follow-x, 0px), var(--follow-y, 0px), 0) translateY(0px)' },
            '50%': { transform: 'translate3d(var(--follow-x, 0px), var(--follow-y, 0px), 0) translateY(-5px)' },
          },
          '@keyframes katbox-pill-stroke': {
            '0%': { '--stroke-angle': '0deg', '--particle-shift': '0px 0px' },
            '100%': { '--stroke-angle': '360deg', '--particle-shift': '47px 31px' },
          },
        })}
      >
        <SiteHeader />
        <main>
          <Hero />
          <Games bladesOfChanceUrl={handle.props.bladesOfChanceUrl} managedGames={handle.props.managedGames} />
          <About />
          <Contact
            values={handle.props.values}
            errors={handle.props.errors}
            sent={handle.props.sent}
            failed={handle.props.failed}
          />
        </main>
        <SiteFooter />
      </div>
    </Document>
  )
}

function HomeHead() {
  return () => (
    <>
      <meta
        name="description"
        content="KaTBox Interactives is a Roblox game development studio."
      />
      <meta name="theme-color" content="#05070b" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Pirata+One&family=Space+Grotesk:wght@400;500;700&display=swap"
      />
    </>
  )
}

const wrap = css({
  width: '100%',
  maxWidth: '1120px',
  margin: '0 auto',
  padding: '0 24px',
})

function SiteHeader() {
  return () => (
    <header
      mix={css({
        position: 'relative',
        zIndex: 10,
        padding: '18px 24px 0',
        background: 'transparent',
        '@media (max-width: 560px)': { padding: '12px 12px 0' },
      })}
    >
      <div
        mix={css({
          position: 'relative',
          isolation: 'isolate',
          width: '100%',
          maxWidth: '1120px',
          minHeight: '64px',
          margin: '0 auto',
          padding: '8px 10px 8px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          border: '1px solid rgba(190,211,235,.22)',
          borderRadius: '999px',
          background: 'linear-gradient(110deg, rgba(255,255,255,.055) 0%, rgba(255,255,255,.018) 28%, rgba(169,200,232,.035) 52%, rgba(255,255,255,.025) 100%), rgba(8,12,19,.88)',
          boxShadow: '0 10px 30px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.09), inset 0 -1px 0 rgba(169,200,232,.045)',
          backdropFilter: 'blur(24px) saturate(145%)',
          WebkitBackdropFilter: 'blur(24px) saturate(145%)',
          transform: 'translate3d(var(--follow-x, 0px), var(--follow-y, 0px), 0)',
          animation: 'katbox-pill-float 6s ease-in-out infinite',
          transition: 'transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '1px',
            borderRadius: 'inherit',
            background: 'radial-gradient(ellipse at var(--glow-x, 50%) var(--glow-y, 50%), rgba(169,200,232,.10), transparent 46%)',
            pointerEvents: 'none',
            zIndex: -1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: .12,
            backgroundImage: 'radial-gradient(circle, rgba(224,240,255,.9) 0.7px, transparent 1.5px), radial-gradient(circle, rgba(119,177,235,.8) 0.8px, transparent 1.7px)',
            backgroundSize: '47px 31px, 71px 43px',
            backgroundPosition: 'var(--particle-shift, 0px 0px), 18px 13px',
            maskImage: 'linear-gradient(115deg, transparent 5%, black 38%, transparent 68%, black 94%)',
          },
          '&:hover': {
            animationPlayState: 'paused',
            boxShadow: '0 14px 36px rgba(0,0,0,.30), 0 0 16px rgba(116,171,230,.07), inset 0 1px 0 rgba(255,255,255,.13)',
          },
          '&:hover::after': { opacity: .2 },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', transition: 'none' },
          '@media (max-width: 560px)': {
            minHeight: '56px',
            padding: '7px 8px 7px 12px',
            gap: '8px',
          },
        })}
      >
        <a
          href="/"
          aria-label="KaTBox Interactives home"
          mix={css({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
            minWidth: 0,
            textDecoration: 'none',
          })}
        >
          <img
            src="/KITBEMOJILarge.png"
            alt=""
            aria-hidden="true"
            width="160"
            height="160"
            mix={css({
              display: 'block',
              width: '42px',
              height: '42px',
              objectFit: 'contain',
              flexShrink: 0,
              '@media (max-width: 560px)': { width: '34px', height: '34px' },
            })}
          />
          <span mix={css({ display: 'flex', flexDirection: 'column', lineHeight: 1 })}>
            <span
              mix={css({
                fontFamily: BRAND_FONT,
                fontSize: '23px',
                fontWeight: 400,
                letterSpacing: '0.01em',
                color: '#fff',
                whiteSpace: 'nowrap',
                '@media (max-width: 560px)': { fontSize: '19px' },
              })}
            >
              KaTBox
            </span>
            <span
              mix={css({
                marginTop: '4px',
                fontFamily: BODY_FONT,
                fontSize: '8px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                '@media (max-width: 560px)': { fontSize: '7px', letterSpacing: '0.16em' },
              })}
            >
              Interactives
            </span>          </span>
        </a>
        <nav
          aria-label="Primary"
          mix={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px',
            minWidth: 0,
            '& a': {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '42px',
              padding: '0 13px',
              color: 'var(--muted)',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              borderRadius: '999px',
              transition: 'color 160ms ease, background 160ms ease, border-color 160ms ease',
              '@media (max-width: 560px)': {
                minHeight: '36px',
                padding: '0 8px',
                fontSize: '10px',
                letterSpacing: '0.04em',
              },
            },
            '& a:hover': { color: 'var(--ink)', background: 'rgba(255, 255, 255, 0.045)' },
            '& a.nav-cta': {
              minHeight: '42px',
              padding: '0 18px',
              color: '#080d14',
              background: 'var(--accent)',
              border: '1px solid rgba(255, 218, 190, 0.16)',
              fontWeight: 700,
              '@media (max-width: 560px)': { minHeight: '36px', padding: '0 11px', fontSize: '9px' },
            },
            '& a.nav-cta:hover': { color: '#080d14', background: '#b9d6f2' },
            '@media (max-width: 560px)': { '& a.hide-sm': { display: 'none' } },
          })}
        >
          <a href="/games" class="hide-sm">Games</a>
          <a href="/#about" class="hide-sm">About</a>
          <a href="/#contact" class="nav-cta">Get in touch <span aria-hidden="true" mix={css({ marginLeft: '7px', fontSize: '15px', lineHeight: 1 })}>↗</span></a>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return () => (
    <section
      mix={[
        wrap,
        css({
          position: 'relative',
          isolation: 'isolate',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          alignItems: 'center',
          justifyItems: 'center',
          gap: '32px',
          width: '100%',
          maxWidth: 'none',
          minHeight: 'min(820px, calc(100svh - 92px))',
          padding: '110px 24px 120px',
          textAlign: 'center',
          overflow: 'hidden',
          borderBottom: '1px solid var(--line)',
          background: 'radial-gradient(ellipse at 24% 48%, rgba(86, 119, 157, .17), transparent 48%), radial-gradient(ellipse at 76% 52%, rgba(77, 113, 151, .16), transparent 42%), #05070b',
          '@media (max-width: 860px)': {
            gridTemplateColumns: 'minmax(0, 1fr)',
            minHeight: '700px',
            padding: '90px 20px 100px',
          },
        }),
      ]}
    >
      <div>
        <p
          mix={css({
            margin: '0 0 20px',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          })}
        >
          Roblox game studio
        </p>
        <h1
          mix={css({
            fontFamily: DISPLAY_FONT,
            fontSize: 'clamp(56px, 9vw, 118px)',
            lineHeight: 1,
            fontWeight: 400,
            letterSpacing: '0.005em',
            maxWidth: '1100px',
            margin: '0 auto',
            textWrap: 'balance',
            textShadow: '0 4px 32px rgba(0,0,0,.5)',
          })}
        >
          Games worth climbing into.
        </h1>
        <p mix={css({ margin: '24px auto 0', maxWidth: '760px', fontSize: 'clamp(16px, 1.8vw, 21px)', color: '#e4ebf3', textShadow: '0 2px 16px rgba(0,0,0,.8)' })}>
          KaTBox Interactive makes games under the Roblox Metaverse, from the first prototype through live
          updates.
        </p>
        <div mix={css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '36px' })}>
          <a href="#games" mix={[button, css({ background: 'var(--accent)', color: 'var(--on-accent)' })]}>
            See our games
          </a>
          <a href="#contact" mix={[button, css({ border: '1px solid var(--line)' })]}>
            Get in touch
          </a>
        </div>
      </div>
      <img
        src="/7E1E8A66-F75A-422B-A520-3B03A824C8D2.gif"
        alt=""
        aria-hidden="true"
        mix={css({
          position: 'absolute',
          zIndex: -2,
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: '.72',
          filter: 'brightness(.62) saturate(.78)',
          pointerEvents: 'none',
        })}
      />
      <div aria-hidden="true" mix={css({
        position: 'absolute',
        zIndex: -1,
        inset: 0,
        background: 'linear-gradient(90deg, rgba(2,5,10,.60) 0%, rgba(2,5,10,.48) 46%, rgba(2,5,10,.52) 100%)',
        pointerEvents: 'none',
        '@media (max-width: 760px)': { background: 'rgba(2,5,10,.58)' },
      })} />
    </section>
  )
}

const button = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '48px',
  padding: '0 24px',
  borderRadius: '12px',
  fontFamily: 'inherit',
  fontSize: '16px',
  fontWeight: 700,
  textDecoration: 'none',
  cursor: 'pointer',
  border: '1px solid transparent',
  '&:hover': { filter: 'brightness(1.1)' },
})

function SectionHeading(handle: Handle<{ id: string; kicker: string; children: RemixNode }>) {
  return () => (
    <div mix={css({ marginBottom: '40px' })}>
      <p
        mix={css({
          margin: '0 0 10px',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        })}
      >
        {handle.props.kicker}
      </p>
      <h2
        id={handle.props.id}
        mix={css({
          margin: 0,
          fontFamily: DISPLAY_FONT,
          fontWeight: 400,
          fontSize: 'clamp(36px, 5vw, 56px)',
          lineHeight: 1.05,
          letterSpacing: '0.01em',
        })}
      >
        {handle.props.children}
      </h2>
    </div>
  )
}

function formatGameNumber(value: number): string {
  return new Intl.NumberFormat('en', { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
}

function formatGameDate(value: string): string {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function Games(handle: Handle<{ bladesOfChanceUrl?: string; managedGames?: ManagedGame[] }>) {
  return () => {
    const url = handle.props.bladesOfChanceUrl
    const managedGames = (handle.props.managedGames ?? []).filter((game) => game.status !== 'Archived')
    const featured = managedGames.find((game) => game.featured) ?? managedGames[0]
    const moreGames = managedGames.filter((game) => game !== featured).slice(0, 3)
    const gameStats = (game: ManagedGame) => [
      { label: 'Playing', value: formatGameNumber(game.playing ?? 0) },
      { label: 'Visits', value: formatGameNumber(game.visits ?? 0) },
    ]
    return (
      <section id="games" aria-labelledby="games-title" mix={[wrap, css({ padding: '60px 24px', borderTop: '1px solid var(--line)' })]}>
        <SectionHeading id="games-title" kicker="Made by KaTBox">Our games</SectionHeading>
        {featured ? (
          <>
            <article mix={[card, css({ overflow: 'hidden', padding: 0, gap: 0, marginBottom: moreGames.length ? '28px' : '0' })]}>
              <div mix={css({ position: 'relative', height: 'clamp(170px, 31vw, 330px)', background: 'linear-gradient(135deg, #111a27 0%, #070b11 100%)', overflow: 'hidden' })}>
                {featured.bannerUrl ? <img src={featured.bannerUrl} alt={featured.name + ' banner'} loading="lazy" mix={css({ width: '100%', height: '100%', objectFit: 'cover', display: 'block' })} /> : <div mix={css({ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY_FONT, fontSize: 'clamp(34px, 6vw, 64px)' })}>{featured.name}</div>}
                <span mix={css({ position: 'absolute', left: '18px', bottom: '16px', padding: '5px 10px', borderRadius: '999px', background: 'rgba(0,0,0,.82)', color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,.18)' })}>{featured.status === 'Live' ? 'Featured experience' : featured.status}</span>
              </div>
              <div mix={css({ padding: 'clamp(16px, 3vw, 26px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '18px', alignItems: 'center', '@media (max-width: 600px)': { gridTemplateColumns: 'minmax(0, 1fr)', gap: '12px' } })}>
                <div mix={css({ minWidth: 0 })}>
                  <div mix={css({ display: 'flex', alignItems: 'center', gap: '13px', marginBottom: '10px' })}>
                    {featured.iconUrl ? <img src={featured.iconUrl} alt="" loading="lazy" mix={css({ width: '54px', height: '54px', flexShrink: 0, objectFit: 'cover', borderRadius: '13px', border: '1px solid var(--line)' })} /> : null}
                    <div mix={css({ minWidth: 0 })}>
                      <p mix={css({ margin: '0 0 2px', color: 'var(--accent)', fontSize: '10px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' })}>{featured.genre || 'Roblox experience'}</p>
                      <h3 mix={css({ margin: 0, fontSize: 'clamp(23px, 3vw, 34px)', lineHeight: 1.15, overflowWrap: 'anywhere' })}>{featured.name}</h3>
                    </div>
                  </div>
                  <p mix={css({ margin: '0 0 12px', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.55, maxWidth: '760px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' })}>{featured.description || 'A Roblox experience from KaTBox Interactives.'}</p>
                  <div mix={css({ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', color: 'var(--muted)', fontSize: '11px' })}>
                    {gameStats(featured).map((stat) => <span key={stat.label}><strong mix={css({ color: 'var(--ink)', fontSize: '13px' })}>{stat.value}</strong> {stat.label}</span>)}
                    <span><strong mix={css({ color: 'var(--ink)', fontSize: '13px' })}>{formatGameNumber(featured.favorites ?? 0)}</strong> Favorites</span>
                  </div>
                </div>
                <div mix={css({ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap', '@media (max-width: 600px)': { justifyContent: 'flex-start' } })}>
                  {featured.status === 'Live' ? <a href={featured.placeUrl} target="_blank" rel="noopener noreferrer" mix={[button, css({ background: 'var(--accent)', color: 'var(--on-accent)', padding: '11px 16px', whiteSpace: 'nowrap' })]}>Play on Roblox ↗</a> : <span mix={css({ color: 'var(--muted)', fontSize: '12px' })}>Coming soon</span>}
                  <details mix={css({ position: 'relative', fontSize: '12px', color: 'var(--muted)' })}>
                    <summary mix={css({ cursor: 'pointer', color: 'var(--ink)', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: '10px', whiteSpace: 'nowrap' })}>Details</summary>
                    <div mix={css({ position: 'absolute', zIndex: 3, right: 0, top: 'calc(100% + 8px)', width: 'min(280px, 80vw)', padding: '14px', border: '1px solid var(--line)', borderRadius: '12px', background: '#111', boxShadow: '0 14px 35px rgba(0,0,0,.5)' })}>
                      <p mix={css({ margin: '0 0 8px', color: 'var(--ink)' })}>By {featured.creatorName || 'KaTBox Interactives'}</p>
                      <p mix={css({ margin: '0 0 8px' })}>Max players: {formatGameNumber(featured.maxPlayers ?? 0)}</p>
                      <p mix={css({ margin: '0 0 8px' })}>Created: {formatGameDate(featured.created)}</p>
                      <p mix={css({ margin: 0 })}>Updated: {formatGameDate(featured.updated)}</p>
                    </div>
                  </details>
                </div>
              </div>
            </article>
            {moreGames.length ? (
              <div>
                <div mix={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' })}>
                  <h3 mix={css({ margin: 0, fontSize: '20px' })}>More experiences</h3>
                  <span mix={css({ color: 'var(--muted)', fontSize: '11px' })}>{managedGames.length - 1} total</span>
                </div>
                <div mix={css({ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', '@media (max-width: 760px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, '@media (max-width: 430px)': { gridTemplateColumns: 'minmax(0, 1fr)' } })}>
                  {moreGames.map((game) => (
                    <article key={String(game._id ?? game.name)} mix={[card, css({ overflow: 'hidden', padding: 0, gap: 0 })]}>
                      <div mix={css({ height: 'clamp(90px, 13vw, 145px)', position: 'relative', background: '#070b11', overflow: 'hidden' })}>
                        {game.bannerUrl ? <img src={game.bannerUrl} alt="" loading="lazy" mix={css({ width: '100%', height: '100%', objectFit: 'cover', display: 'block' })} /> : null}
                        <span mix={css({ position: 'absolute', left: '9px', bottom: '9px', padding: '4px 7px', borderRadius: '999px', background: 'rgba(0,0,0,.82)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.06em' })}>{game.status}</span>
                      </div>
                      <div mix={css({ padding: '12px' })}>
                        <h4 mix={css({ margin: '0 0 5px', fontSize: '16px', lineHeight: 1.2, overflowWrap: 'anywhere' })}>{game.name}</h4>
                        <p mix={css({ margin: '0 0 10px', color: 'var(--muted)', fontSize: '11px' })}>{formatGameNumber(game.playing ?? 0)} playing · {formatGameNumber(game.visits ?? 0)} visits</p>
                        {game.status === 'Live' ? <a href={game.placeUrl} target="_blank" rel="noopener noreferrer" mix={css({ color: 'var(--accent)', fontSize: '12px', fontWeight: 700, textDecoration: 'none' })}>Play ↗</a> : <span mix={css({ color: 'var(--muted)', fontSize: '11px' })}>In development</span>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
            {managedGames.length > 1 ? (
              <div mix={css({ display: 'flex', justifyContent: 'center', marginTop: '26px' })}>
                <a href="/games" mix={css({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '46px', padding: '0 22px', border: '1px solid rgba(169,200,232,.42)', borderRadius: '999px', color: 'var(--ink)', fontSize: '12px', fontWeight: 700, textDecoration: 'none', transition: 'background 160ms ease', '&:hover': { background: 'rgba(169,200,232,.10)' } })}>Explore all games ↗</a>
              </div>
            ) : null}
          </>
        ) : (
          <div mix={css({ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, .8fr)', gap: '18px', '@media (max-width: 650px)': { gridTemplateColumns: 'minmax(0, 1fr)' } })}>
            <article mix={[card, css({ overflow: 'hidden', padding: 0, gap: 0 })]}>
              <div mix={css({ height: 'clamp(160px, 27vw, 280px)', background: 'linear-gradient(135deg, #111a27 0%, #070b11 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' })}><img src="/katbox-mascot.png" alt="" width="900" height="981" mix={css({ height: '125px', width: 'auto' })} /></div>
              <div mix={css({ padding: '20px' })}>
                <p mix={css({ margin: '0 0 5px', color: 'var(--accent)', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em' })}>FEATURED EXPERIENCE</p>
                <h3 mix={css({ margin: '0 0 8px', fontSize: '26px' })}>Blades of Chance</h3>
                <p mix={css({ margin: '0 0 15px', color: 'var(--muted)', fontSize: '14px' })}>A Roblox experience from KaTBox Interactives.</p>
                {url ? <a href={url} target="_blank" rel="noopener noreferrer" mix={[button, css({ background: 'var(--accent)', color: 'var(--on-accent)' })]}>Explore game ↗</a> : <span mix={css({ color: 'var(--muted)', fontSize: '12px' })}>Game link coming soon</span>}
              </div>
            </article>
            <div mix={css({ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 8px' })}>
              <p mix={css({ margin: '0 0 8px', color: 'var(--accent)', fontSize: '11px', fontWeight: 700, letterSpacing: '.12em' })}>INDEPENDENT GAME STUDIO</p>
              <h3 mix={css({ margin: '0 0 12px', fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.1 })}>Worlds worth getting lost in.</h3>
              <p mix={css({ margin: 0, color: 'var(--muted)', fontSize: '14px' })}>We create distinctive games and experiences on Roblox.</p>
            </div>
          </div>
        )}
      </section>
    )
  }
}

const card = css({
  display: 'flex',
  flexDirection: 'column',
  padding: '20px',
  background: 'linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.012) 55%), rgba(14,20,29,.62)',
  border: '1px solid rgba(195,218,245,.14)',
  borderRadius: '20px',
  backdropFilter: 'blur(18px) saturate(135%)',
  WebkitBackdropFilter: 'blur(18px) saturate(135%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.10), 0 12px 32px rgba(0,0,0,.16)',
})

function About() {
  return () => (
    <section
      id="about"
      aria-labelledby="about-title"
      mix={[wrap, css({ padding: '72px 24px', borderTop: '1px solid var(--line)' })]}
    >
      <SectionHeading id="about-title" kicker="The studio">
        Small team, long-term games
      </SectionHeading>
      <div
        mix={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '32px',
          '@media (max-width: 760px)': { gridTemplateColumns: 'minmax(0, 1fr)', gap: '28px' },
          '& h3': { margin: '0 0 8px', fontSize: '20px' },
          '& p': { margin: 0, color: 'var(--muted)' },
        })}
      >
        <div>
          <h3>Built for Roblox</h3>
          <p>Every KaTBox game is designed around how players actually use the platform.</p>
        </div>
        <div>
          <h3>Live from day one</h3>
          <p>We ship, watch how people play, and keep improving after launch.</p>
        </div>
        <div>
          <h3>Open to collaboration</h3>
          <p>Developers, artists and partners are welcome to reach out below.</p>
        </div>
      </div>
    </section>
  )
}

function Contact(handle: Handle<Pick<HomePageProps, 'values' | 'errors' | 'sent' | 'failed'>>) {
  return () => {
    let { values, errors = {}, sent, failed } = handle.props
    return (
      <section
        id="contact"
        aria-labelledby="contact-title"
        mix={[wrap, css({ padding: '72px 24px 96px', borderTop: '1px solid var(--line)' })]}
      >
        <SectionHeading id="contact-title" kicker="Contact">
          Say hello
        </SectionHeading>
        {sent ? (
          <p
            role="status"
            mix={css({
              margin: 0,
              padding: '20px',
              maxWidth: '640px',
              border: '1px solid var(--accent)',
              borderRadius: '12px',
              fontWeight: 500,
            })}
          >
            Thanks, your message was sent. We will get back to you soon.
          </p>
        ) : (
          <form
            method="post"
            action={routes.contact.href()}
            mix={css({
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              maxWidth: '640px',
              '& label': { display: 'block', marginBottom: '6px', fontSize: '15px', fontWeight: 500 },
              '& input, & textarea': {
                width: '100%',
                padding: '12px 14px',
                font: 'inherit',
                color: 'var(--ink)',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '10px',
              },
              '& textarea': { minHeight: '160px', resize: 'vertical' },
              '& .err': { margin: '6px 0 0', color: '#ff9a9a', fontSize: '14px' },
            })}
          >
            {failed && (
              <p role="alert" class="err" mix={css({ margin: 0 })}>
                Something went wrong sending your message. Please try again in a minute.
              </p>
            )}
            <div>
              <label htmlFor="c-name">Name</label>
              <input
                id="c-name"
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                defaultValue={values?.name ?? ''}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? 'c-name-err' : undefined}
              />
              {errors.name && <p id="c-name-err" class="err">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="c-email">Email</label>
              <input
                id="c-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={200}
                defaultValue={values?.email ?? ''}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'c-email-err' : undefined}
              />
              {errors.email && <p id="c-email-err" class="err">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="c-message">Message</label>
              <textarea
                id="c-message"
                name="message"
                required
                maxLength={2000}
                defaultValue={values?.message ?? ''}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={errors.message ? 'c-message-err' : undefined}
              />
              {errors.message && <p id="c-message-err" class="err">{errors.message}</p>}
            </div>
            {/* Honeypot: hidden from people, bots tend to fill it in. */}
            <div
              aria-hidden="true"
              mix={css({ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' })}
            >
              <label htmlFor="c-website">Leave this empty</label>
              <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div>
              <button
                type="submit"
                mix={[button, css({ background: 'var(--accent)', color: 'var(--on-accent)' })]}
              >
                Send message
              </button>
            </div>
          </form>
        )}
      </section>
    )
  }
}

function SiteFooter() {
  return () => (
    <footer mix={css({ borderTop: '1px solid var(--line)' })}>
      <div
        mix={[
          wrap,
          css({
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '32px 24px',
            color: 'var(--muted)',
            fontSize: '15px',
          }),
        ]}
      >
        <img
          src="/katbox-logo.png"
          alt="KaTBox Interactives"
          width="1400"
          height="492"
          mix={css({ display: 'block', height: '44px', width: 'auto' })}
        />
        <span>
          &copy; {new Date().getFullYear()} KaTBox Interactives. Roblox is a trademark of Roblox
          Corporation.
        </span>
      </div>
    </footer>
  )
}


export function GamesPage(handle: Handle<{ managedGames?: ManagedGame[] }>) {
  return () => {
    const games = (handle.props.managedGames ?? []).filter((game) => game.status !== 'Archived')
    const featured = games.find((game) => game.featured) ?? games.find((game) => game.status === 'Live') ?? games[0]
    return (
      <Document head={<HomeHead />} title="Games | KaTBox Interactives">
        <div mix={css({
          '--bg': '#05070b', '--surface': 'rgba(18, 23, 31, 0.82)', '--line': 'rgba(190, 211, 235, 0.14)', '--ink': '#f8fbff',
          '--muted': '#aab5c3', '--accent': '#a9c8e8', '--on-accent': '#080d14',
          '& *, & *::before, & *::after': { boxSizing: 'border-box' }, minHeight: '100vh',
          background: 'var(--bg)', color: 'var(--ink)', fontFamily: BODY_FONT, fontSize: '17px',
          lineHeight: 1.6, WebkitFontSmoothing: 'antialiased',
          '& a': { color: 'inherit' }, '& :focus-visible': { outline: '2px solid var(--accent)', outlineOffset: '3px' },
        })}>
          <SiteHeader />
          <main>
            <section mix={[wrap, css({ paddingTop: '76px', paddingBottom: '84px' })]}>
              <a href="/" mix={css({ display: 'inline-block', marginBottom: '18px', color: 'var(--accent)', fontSize: '12px', fontWeight: 700, letterSpacing: '.12em', textDecoration: 'none', textTransform: 'uppercase' })}>← KaTBox home</a>
              <p mix={css({ margin: '0 0 8px', color: 'var(--accent)', fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase' })}>The portfolio</p>
              <h1 mix={css({ margin: '0 0 14px', fontFamily: DISPLAY_FONT, fontSize: 'clamp(42px, 7vw, 76px)', lineHeight: 1.05, fontWeight: 400 })}>Our Games</h1>
              <p mix={css({ maxWidth: '620px', margin: '0 0 36px', color: 'var(--muted)', fontSize: '17px' })}>Experiences made and managed by KaTBox Interactives.</p>
              {games.length ? (
                <div mix={css({ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px', '@media (max-width: 650px)': { gridTemplateColumns: 'minmax(0, 1fr)' } })}>
                  {games.map((game) => (
                    <article key={String(game._id ?? game.name)} mix={[card, css({ overflow: 'hidden', padding: 0, gap: 0, borderColor: game === featured ? 'rgba(169,200,232,.55)' : 'var(--line)' })]}>
                      <a href={game.placeUrl} target="_blank" rel="noreferrer" aria-label={'Play ' + game.name} mix={css({ display: 'block', position: 'relative', height: 'clamp(170px, 24vw, 260px)', overflow: 'hidden', background: 'linear-gradient(135deg, #111a27, #080c12)', textDecoration: 'none' })}>
                        {game.bannerUrl ? <img src={game.bannerUrl} alt={game.name + ' artwork'} loading="lazy" mix={css({ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 220ms ease', '&:hover': { transform: 'scale(1.025)' } })} /> : <div mix={css({ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: DISPLAY_FONT, fontSize: 'clamp(28px, 4vw, 48px)', textAlign: 'center' })}>{game.name}</div>}
                        <span mix={css({ position: 'absolute', left: '14px', bottom: '14px', padding: '5px 9px', borderRadius: '999px', background: 'rgba(0,0,0,.82)', border: '1px solid rgba(255,255,255,.15)', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' })}>{game === featured ? 'Featured' : game.status}</span>
                      </a>
                      <div mix={css({ padding: '20px' })}>
                        <div mix={css({ display: 'flex', alignItems: 'center', gap: '13px', marginBottom: '12px' })}>
                          {game.iconUrl ? <img src={game.iconUrl} alt="" loading="lazy" mix={css({ width: '56px', height: '56px', borderRadius: '13px', objectFit: 'cover', border: '1px solid var(--line)', flexShrink: 0 })} /> : null}
                          <div mix={css({ minWidth: 0 })}>
                            <p mix={css({ margin: '0 0 2px', color: 'var(--accent)', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' })}>{game.genre || 'Roblox experience'}</p>
                            <h2 mix={css({ margin: 0, fontSize: 'clamp(22px, 3vw, 28px)', lineHeight: 1.2, overflowWrap: 'anywhere' })}>{game.name}</h2>
                          </div>
                        </div>
                        <p mix={css({ margin: '0 0 18px', minHeight: '52px', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6 })}>{game.description || 'A Roblox experience by KaTBox Interactives.'}</p>
                        <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '18px', paddingTop: '14px', borderTop: '1px solid var(--line)', color: 'var(--muted)', fontSize: '12px' })}>
                          <span><strong mix={css({ color: 'var(--ink)' })}>{formatGameNumber(game.visits ?? 0)}</strong> visits</span>
                          <span><strong mix={css({ color: 'var(--ink)' })}>{formatGameNumber(game.playing ?? 0)}</strong> playing</span>
                          <span><strong mix={css({ color: 'var(--ink)' })}>{formatGameNumber(game.favorites ?? 0)}</strong> favorites</span>
                        </div>
                        <a href={game.placeUrl} target="_blank" rel="noreferrer" mix={css({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: '18px', minHeight: '43px', padding: '0 17px', borderRadius: '999px', background: 'var(--accent)', color: '#080d14', fontSize: '12px', fontWeight: 700, textDecoration: 'none' })}>Play on Roblox ↗</a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div mix={[card, css({ padding: '36px', textAlign: 'center' })]}>
                  <h2 mix={css({ margin: '0 0 8px', fontSize: '24px' })}>New experiences are on the way.</h2>
                  <p mix={css({ margin: 0, color: 'var(--muted)' })}>Our game portfolio will appear here as experiences are added.</p>
                </div>
              )}
            </section>
          </main>
          <SiteFooter />
        </div>
      </Document>
    )
  }
}
