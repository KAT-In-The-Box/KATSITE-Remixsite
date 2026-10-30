import { createRouter, type RouterContext } from 'remix/router'
import { formData } from 'remix/middleware/form-data'
import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'

import controller from './actions/controller.tsx'
import { assets } from './assets.ts'
import { routes } from './routes.ts'

export const router = createRouter({
  middleware: [
    staticFiles('./public', { index: false }),
    formData({ maxFiles: 5, maxFileSize: 5 * 1024 * 1024, maxParts: 30, maxTotalSize: 13 * 1024 * 1024 }),
    render({ assets }),
  ],
})

export type AppContext = RouterContext<typeof router>

declare module 'remix' {
  interface RouterTypes {
    context: AppContext
  }
}

router.map(routes, controller)
