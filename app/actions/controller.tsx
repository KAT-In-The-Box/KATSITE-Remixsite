import { createController } from 'remix/router'
import { createRedirectResponse } from 'remix/response/redirect'

import { assets } from '../assets.ts'
import { config } from '../config.ts'
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

    async contact(context) {
      if (!isSameOrigin(context.request)) {
        return new Response('Forbidden', { status: 403 })
      }

      let formData = context.formData

      // Honeypot filled in: pretend it worked and drop it.
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
