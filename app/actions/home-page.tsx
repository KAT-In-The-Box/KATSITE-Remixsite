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
          '--bg': '#000000',
          '--surface': '#0e0e0e',
          '--line': '#2a2a2a',
          '--ink': '#ffffff',
          '--muted': '#b3b3b3',
          '--accent': '#cf9066',
          '--on-accent': '#000000',
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
      <meta name="theme-color" content="#000000" />
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
          width: '100%',
          maxWidth: '1120px',
          minHeight: '64px',
          margin: '0 auto',
          padding: '8px 10px 8px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          border: '1px solid rgba(207, 144, 102, 0.25)',
          borderRadius: '999px',
          background: 'rgba(16, 12, 10, 0.94)',
          boxShadow: '0 10px 32px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.025)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
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
              color: '#160d08',
              background: 'var(--accent)',
              border: '1px solid rgba(255, 218, 190, 0.16)',
              fontWeight: 700,
              '@media (max-width: 560px)': { minHeight: '36px', padding: '0 11px', fontSize: '9px' },
            },
            '& a.nav-cta:hover': { color: '#160d08', background: '#e0a27a' },
            '@media (max-width: 560px)': { '& a.hide-sm': { display: 'none' } },
          })}
        >
          <a href="#games" class="hide-sm">Games</a>
          <a href="#about" class="hide-sm">About</a>
          <a href="#contact" class="nav-cta">Get in touch <span aria-hidden="true" mix={css({ marginLeft: '7px', fontSize: '15px', lineHeight: 1 })}>↗</span></a>
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
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
          alignItems: 'center',
          gap: '40px',
          padding: '80px 24px 88px',
          '@media (max-width: 860px)': {
            gridTemplateColumns: 'minmax(0, 1fr)',
            padding: '48px 24px 64px',
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
            margin: 0,
            fontFamily: DISPLAY_FONT,
            fontSize: 'clamp(48px, 8vw, 96px)',
            lineHeight: 1,
            fontWeight: 400,
            letterSpacing: '0.01em',
          })}
        >
          Games worth climbing into.
        </h1>
        <p mix={css({ margin: '28px 0 0', maxWidth: '50ch', fontSize: '20px', color: 'var(--muted)' })}>
          KaTBox Interactive makes games under the Roblox Metaverse, from the first prototype through live
          updates.
        </p>
        <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '40px' })}>
          <a href="#games" mix={[button, css({ background: 'var(--accent)', color: 'var(--on-accent)' })]}>
            See our games
          </a>
          <a href="#contact" mix={[button, css({ border: '1px solid var(--line)' })]}>
            Get in touch
          </a>
        </div>
      </div>
      <img
        src="/katbox-mascot.png"
        alt="The KaTBox mascot: a cat in sunglasses sitting in a cardboard box"
        width="900"
        height="981"
        mix={css({
          display: 'block',
          width: '100%',
          maxWidth: '420px',
          height: 'auto',
          justifySelf: 'center',
          '@media (max-width: 860px)': { maxWidth: '260px', justifySelf: 'start' },
        })}
      />
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
    let url = handle.props.bladesOfChanceUrl
    let managedGames = (handle.props.managedGames ?? []).filter((game) => game.status !== 'Archived' && game.status !== 'Paused')
    return (
      <section
        id="games"
        aria-labelledby="games-title"
        mix={[wrap, css({ padding: '72px 24px', borderTop: '1px solid var(--line)' })]}
      >
        <SectionHeading id="games-title" kicker="Our games">
          Experiences
        </SectionHeading>
        <div mix={css({ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px', '@media (max-width: 760px)': { gridTemplateColumns: 'minmax(0, 1fr)' } })}>
          {managedGames.length > 0 ? managedGames.map((game) => (
            <article key={String(game._id ?? game.name)} mix={[card, css({ overflow: 'hidden', padding: 0 })]}>
              <div mix={css({ position: 'relative', height: 'clamp(170px, 25vw, 260px)', background: 'linear-gradient(135deg, #3a2819 0%, #17100a 100%)', overflow: 'hidden' })}>
                {game.bannerUrl ? (
                  <img src={game.bannerUrl} alt={game.name + ' banner'} loading="lazy" mix={css({ width: '100%', height: '100%', objectFit: 'cover', display: 'block' })} />
                ) : (
                  <div mix={css({ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: DISPLAY_FONT, fontSize: 'clamp(30px, 4vw, 48px)', textAlign: 'center', lineHeight: 1.1 })}>{game.name}</div>
                )}
                <span mix={css({ position: 'absolute', left: '16px', bottom: '14px', padding: '6px 10px', borderRadius: '999px', background: 'rgba(0,0,0,.82)', color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,.18)' })}>{game.status}</span>
              </div>
              <div mix={css({ padding: '20px' })}>
                <div mix={css({ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '-42px', position: 'relative', marginBottom: '14px' })}>
                  {game.iconUrl ? <img src={game.iconUrl} alt={game.name + ' icon'} loading="lazy" mix={css({ width: '76px', height: '76px', objectFit: 'cover', borderRadius: '18px', border: '3px solid var(--surface)', background: 'var(--surface)', boxShadow: '0 8px 25px rgba(0,0,0,.45)' })} /> : <div aria-hidden="true" mix={css({ width: '76px', height: '76px', borderRadius: '18px', border: '3px solid var(--surface)', background: '#21160f' })} />}
                  <div mix={css({ paddingTop: '38px', minWidth: 0 })}>
                    <p mix={css({ margin: 0, color: 'var(--accent)', fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' })}>{game.genre || 'Roblox experience'}</p>
                    <h3 mix={css({ margin: '3px 0 0', fontSize: 'clamp(21px, 3vw, 27px)', lineHeight: 1.15, overflowWrap: 'anywhere' })}>{game.name}</h3>
                  </div>
                </div>
                <p mix={css({ margin: '0 0 18px', color: 'var(--muted)', fontSize: '14px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' })}>{game.description || 'A Roblox experience developed by the KaTBox team.'}</p>
                <div mix={css({ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', margin: '0 0 18px' })}>
                  {[
                    { label: 'Playing', value: formatGameNumber(game.playing ?? 0) },
                    { label: 'Visits', value: formatGameNumber(game.visits ?? 0) },
                    { label: 'Favorites', value: formatGameNumber(game.favorites ?? 0) },
                  ].map((stat) => (
                    <div key={stat.label} mix={css({ minWidth: 0, padding: '12px 10px', border: '1px solid var(--line)', borderRadius: '12px', background: 'rgba(255,255,255,.02)' })}>
                      <div mix={css({ fontSize: 'clamp(16px, 2.5vw, 22px)', fontWeight: 700, lineHeight: 1.2, overflowWrap: 'anywhere' })}>{stat.value}</div>
                      <div mix={css({ marginTop: '4px', color: 'var(--muted)', fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase' })}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <dl mix={css({ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 16px', margin: '0 0 20px', fontSize: '12px' })}>
                  <div><dt mix={css({ color: 'var(--muted)', marginBottom: '2px' })}>Creator</dt><dd mix={css({ margin: 0, overflowWrap: 'anywhere' })}>{game.creatorName || 'KaTBox Interactives'}</dd></div>
                  <div><dt mix={css({ color: 'var(--muted)', marginBottom: '2px' })}>Max players</dt><dd mix={css({ margin: 0 })}>{formatGameNumber(game.maxPlayers ?? 0)}</dd></div>
                  <div><dt mix={css({ color: 'var(--muted)', marginBottom: '2px' })}>Created</dt><dd mix={css({ margin: 0 })}>{formatGameDate(game.created)}</dd></div>
                  <div><dt mix={css({ color: 'var(--muted)', marginBottom: '2px' })}>Last updated</dt><dd mix={css({ margin: 0 })}>{formatGameDate(game.updated)}</dd></div>
                </dl>
                <div mix={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' })}>
                  <span mix={css({ color: 'var(--muted)', fontSize: '11px' })}>Live Roblox stats · refresh automatically</span>
                  {game.status === 'Live' ? <a href={game.placeUrl} target="_blank" rel="noopener noreferrer" mix={[button, css({ background: 'var(--accent)', color: 'var(--on-accent)' })]}>Play on Roblox ↗</a> : <span mix={css({ color: 'var(--muted)', fontSize: '13px' })}>In development</span>}
                </div>
              </div>
            </article>
          )) : (
            <>
              <article mix={card}>
                <div aria-hidden="true" mix={css({ height: '200px', borderRadius: '12px', background: 'linear-gradient(135deg, #3a2819 0%, #17100a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
                  <img src="/katbox-mascot.png" alt="" width="900" height="981" mix={css({ display: 'block', height: '150px', width: 'auto' })} />
                </div>
                <h3 mix={css({ margin: '20px 0 8px', fontSize: '26px' })}>Blades of Chance</h3>
                <p mix={css({ margin: 0, color: 'var(--muted)' })}>A Roblox experience developed by the KaTBox team.</p>
                <div mix={css({ marginTop: '24px' })}>{url ? <a href={url} rel="noopener" mix={[button, css({ background: 'var(--accent)', color: 'var(--on-accent)' })]}>Play on Roblox</a> : <span mix={css({ color: 'var(--muted)', fontSize: '15px' })}>Link coming soon</span>}</div>
              </article>
              <article mix={[card, css({ borderStyle: 'dashed', justifyContent: 'center', alignItems: 'flex-start', minHeight: '280px' })]}>
                <p mix={css({ margin: 0, fontSize: '13px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)' })}>In development</p>
                <h3 mix={css({ margin: '12px 0 8px', fontSize: '26px' })}>Your next favorite game</h3>
                <p mix={css({ margin: 0, color: 'var(--muted)' })}>More from KaTBox is on the way.</p>
              </article>
            </>
          )}
        </div>
      </section>
    )
  }
}

const card = css({
  display: 'flex',
  flexDirection: 'column',
  padding: '20px',
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '20px',
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
