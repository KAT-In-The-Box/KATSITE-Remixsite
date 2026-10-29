import { get, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  health: get('/health'),
  contact: { method: 'POST', pattern: '/contact' },
  robloxLogin: get('/auth/roblox/login'),
  robloxCallback: get('/auth/roblox/callback'),
  staff: get('/staff'),
  gameManager: get('/staff/games'),
  gameCreate: { method: 'POST', pattern: '/staff/games/create' },
  gameStatus: { method: 'POST', pattern: '/staff/games/status' },
  gameDelete: { method: 'POST', pattern: '/staff/games/delete' },
  staffLogout: { method: 'POST', pattern: '/auth/roblox/logout' },
})
