import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { router } from '../router.ts'
import { routes } from '../routes.ts'

function post(fields: Record<string, string>, headers: Record<string, string> = {}) {
  return router.fetch(
    new Request('http://localhost/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
      body: new URLSearchParams(fields),
    }),
  )
}

describe('root controller', () => {
  it('GET / returns the home page', async () => {
    let response = await router.fetch(new URL(routes.home.href(), 'http://localhost'))
    let html = await response.text()

    assert.equal(response.status, 200)
    assert.match(response.headers.get('Content-Type') ?? '', /text\/html/)
    assert.match(html, /KaTBox Interactives/)
    assert.match(html, /Blades of Chance/)
  })

  it('GET /health reports ok without a database configured', async () => {
    let response = await router.fetch(new URL('/health', 'http://localhost'))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { ok: true, db: null })
  })

  it('POST /contact with valid data redirects to the thank-you state', async () => {
    let response = await post({ name: 'Ada', email: 'ada@example.com', message: 'Hello KaTBox team' })
    assert.equal(response.status, 303)
    assert.match(response.headers.get('Location') ?? '', /sent=1/)
  })

  it('POST /contact with bad data re-renders with errors', async () => {
    let response = await post({ name: '', email: 'nope', message: 'short' })
    let html = await response.text()
    assert.equal(response.status, 400)
    assert.match(html, /Enter a valid email address/)
  })

  it('POST /contact from another origin is rejected', async () => {
    let response = await post(
      { name: 'Eve', email: 'eve@example.com', message: 'Cross-site attempt here' },
      { Origin: 'https://evil.example' },
    )
    assert.equal(response.status, 403)
  })
})
