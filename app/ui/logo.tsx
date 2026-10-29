// INTRIX wordmark and X symbol. Ink uses currentColor; the accent stroke uses --accent,
// and --bg cuts the small gap where the two X strokes cross.

export function Wordmark() {
  return () => (
    <svg viewBox="0 20 500 100" role="img" aria-label="INTRIX" style={{ display: 'block', height: '100%', width: 'auto' }}>
      <g fill="currentColor">
        <rect x="0" y="20" width="18" height="100" />
        <polygon points="42,20 62,20 104,87.5 104,20 122,20 122,120 104,120 60,50.4 60,120 42,120" />
        <rect x="146" y="20" width="76" height="18" />
        <rect x="175" y="38" width="18" height="82" />
        <rect x="246" y="20" width="18" height="100" />
        <polygon points="278,77 302,77 338,120 314,120" />
        <rect x="360" y="20" width="18" height="100" />
        <polygon points="404,20 427,20 500,120 477,120" />
      </g>
      <path d="M255 29H292A24 24 0 0 1 292 77H255" fill="none" stroke="currentColor" stroke-width="18" />
      <polygon
        points="477,20 500,20 427,120 404,120"
        style={{ fill: 'var(--accent)', stroke: 'var(--bg)', strokeWidth: 5, paintOrder: 'stroke' }}
      />
    </svg>
  )
}

export function Symbol() {
  return () => (
    <svg viewBox="404 20 96 100" aria-hidden="true" style={{ display: 'block', height: '100%', width: 'auto' }}>
      <polygon points="404,20 427,20 500,120 477,120" fill="currentColor" />
      <polygon
        points="477,20 500,20 427,120 404,120"
        style={{ fill: 'var(--accent)', stroke: 'var(--bg)', strokeWidth: 5, paintOrder: 'stroke' }}
      />
    </svg>
  )
}
