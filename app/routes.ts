import { get, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  health: get('/health'),
  contact: { method: 'POST', pattern: '/contact' },
})
