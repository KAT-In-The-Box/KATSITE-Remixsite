export interface RobloxGameMetadata {
  placeId: number
  universeId: number
  name: string
  description: string
  creatorName: string
  creatorType: string
  iconUrl: string
  bannerUrl: string
  playing: number
  visits: number
  favorites: number
  maxPlayers: number
  genre: string
  created: string
  updated: string
  lastSyncedAt: Date
}

type RobloxPlaceDetails = {
  placeId?: number
  universeId?: number
  name?: string
  description?: string
  creator?: { name?: string; type?: string }
}

type RobloxGameDetails = {
  id?: number
  universeId?: number
  name?: string
  description?: string
  creator?: { name?: string; type?: string }
  playing?: number
  visits?: number
  favoritedCount?: number
  maxPlayers?: number
  genre?: string
  created?: string
  updated?: string
}

async function robloxJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'KaTBoxInteractives/1.0' },
    signal: AbortSignal.timeout(9000),
  })
  if (!response.ok) throw new Error(`Roblox API returned ${response.status} for game metadata.`)
  return response.json() as Promise<T>
}

function firstId(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) return null
  return value
}

export function getRobloxPlaceId(value: string): number | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !/(^|\\.)roblox\\.com$/i.test(url.hostname)) return null
    const match = url.pathname.match(/^\\/games\\/(\\d+)/i)
    return match ? firstId(Number(match[1])) : null
  } catch {
    return null
  }
}

export async function fetchRobloxGame(value: string): Promise<RobloxGameMetadata> {
  const placeId = getRobloxPlaceId(value)
  if (!placeId) throw new Error('Paste a valid Roblox experience URL, such as https://www.roblox.com/games/123456789.')

  const placeRows = await robloxJson<RobloxPlaceDetails[]>(
    `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`,
  )
  const place = Array.isArray(placeRows) ? placeRows.find((row) => row.placeId === placeId) ?? placeRows[0] : undefined
  const universeId = firstId(place?.universeId)
  if (!universeId) throw new Error('Roblox did not return an experience ID. Check that the game URL is correct and publicly accessible.')

  const [gameResponse, iconResponse, bannerResponse] = await Promise.all([
    robloxJson<{ data?: RobloxGameDetails[] }>(`https://games.roblox.com/v1/games?universeIds=${universeId}`),
    robloxJson<{ data?: Array<{ imageUrl?: string }> }>(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`),
    robloxJson<{ data?: Array<{ thumbnails?: Array<{ imageUrl?: string }> }> }>(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`),
  ])
  const game = gameResponse.data?.[0]
  if (!game) throw new Error('Roblox found the place but did not return its experience details. Try again in a moment.')
  const iconUrl = iconResponse.data?.[0]?.imageUrl ?? ''
  const bannerUrl = bannerResponse.data?.[0]?.thumbnails?.[0]?.imageUrl ?? ''
  return {
    placeId,
    universeId,
    name: game.name || place?.name || 'Untitled Roblox experience',
    description: game.description || place?.description || '',
    creatorName: game.creator?.name || place?.creator?.name || 'Unknown creator',
    creatorType: game.creator?.type || place?.creator?.type || 'User',
    iconUrl,
    bannerUrl,
    playing: game.playing ?? 0,
    visits: game.visits ?? 0,
    favorites: game.favoritedCount ?? 0,
    maxPlayers: game.maxPlayers ?? 0,
    genre: game.genre || 'Genre not listed',
    created: game.created || '',
    updated: game.updated || '',
    lastSyncedAt: new Date(),
  }
}
