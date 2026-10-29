import { get, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  games: get('/games'),
  careers: get('/careers'),
  health: get('/health'),
  contact: { method: 'POST', pattern: '/contact' },
  robloxLogin: get('/auth/roblox/login'),
  robloxCallback: get('/auth/roblox/callback'),
  staff: get('/staff'),
  gameManager: get('/staff/games'),
  gameCreate: { method: 'POST', pattern: '/staff/games/create' },
  gameStatus: { method: 'POST', pattern: '/staff/games/status' },
  gameFeature: { method: 'POST', pattern: '/staff/games/feature' },
  gameRefresh: { method: 'POST', pattern: '/staff/games/refresh' },
  gameDelete: { method: 'POST', pattern: '/staff/games/delete' },
  staffLogout: { method: 'POST', pattern: '/auth/roblox/logout' },
})
