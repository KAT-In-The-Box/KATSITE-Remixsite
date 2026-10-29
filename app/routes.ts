import { get, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  health: get('/health'),
  contact: { method: 'POST', pattern: '/contact' },
  robloxLogin: get('/auth/roblox/login'),
  robloxCallback: get('/auth/roblox/callback'),
  staff: get('/staff'),
  staffLogout: { method: 'POST', pattern: '/auth/roblox/logout' },
})
