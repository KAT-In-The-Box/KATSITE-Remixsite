import { MongoClient, type Db } from 'mongodb'

import { config } from '../config.ts'
import type { RobloxGameMetadata } from './roblox-games.ts'

let client: MongoClient | null = null
let db: Db | null = null

export interface ContactMessage {
  name: string
  email: string
  message: string
  createdAt: Date
}

// Connect once before the server starts listening. Without MONGODB_URI (local dev only)
// the site still runs and contact messages are logged to the console instead.
export async function connectDb(): Promise<void> {
  if (db || !config.mongodbUri) return

  client = new MongoClient(config.mongodbUri, { serverSelectionTimeoutMS: 8000 })
  await client.connect()
  db = client.db(config.mongodbDb)
  await db.collection<ContactMessage>('messages').createIndex({ createdAt: -1 })
}

export async function closeDb(): Promise<void> {
  let current = client
  client = null
  db = null
  await current?.close()
}

export function hasDb(): boolean {
  return db !== null
}

export async function pingDb(): Promise<boolean> {
  if (!db) return false
  try {
    await db.command({ ping: 1 })
    return true
  } catch {
    return false
  }
}

export async function saveContactMessage(input: Omit<ContactMessage, 'createdAt'>): Promise<void> {
  let doc: ContactMessage = { ...input, createdAt: new Date() }

  if (!db) {
    console.log('[contact] MongoDB not configured, message not stored:', doc)
    return
  }

  await db.collection<ContactMessage>('messages').insertOne(doc)
}


export type GameStatus = 'In development' | 'Live' | 'Paused' | 'Archived'

export interface ManagedGame extends RobloxGameMetadata {
  _id?: import('mongodb').ObjectId
  placeUrl: string
  status: GameStatus
  featured?: boolean
  createdAt: Date
  updatedAt: Date
}

export async function listManagedGames(): Promise<ManagedGame[]> {
  if (!db) return []
  return db.collection<ManagedGame>(config.mongodbGamesCollection).find({}).sort({ updatedAt: -1, name: 1 }).toArray()
}

export async function createManagedGame(input: Pick<ManagedGame, 'placeUrl' | 'status'> & RobloxGameMetadata): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected. Configure MONGODB_URI to save games.')
  const now = new Date()
  await db.collection<ManagedGame>(config.mongodbGamesCollection).insertOne({ ...input, createdAt: now, updatedAt: now })
}

export async function updateManagedGameMetadata(id: string, metadata: RobloxGameMetadata): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(id)) throw new Error('Invalid game ID.')
  await db.collection<ManagedGame>(config.mongodbGamesCollection).updateOne({ _id: new ObjectId(id) }, { $set: { ...metadata, updatedAt: new Date() } })
}

export async function setFeaturedManagedGame(id: string): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(id)) throw new Error('Invalid game ID.')
  const collection = db.collection<ManagedGame>(config.mongodbGamesCollection)
  const selected = await collection.findOne({ _id: new ObjectId(id) })
  if (!selected) throw new Error('Game was not found.')
  await collection.updateMany({}, { $set: { featured: false } })
  await collection.updateOne({ _id: new ObjectId(id) }, { $set: { featured: true, updatedAt: new Date() } })
}

export async function updateManagedGameStatus(id: string, status: GameStatus): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(id)) throw new Error('Invalid game ID.')
  await db.collection<ManagedGame>(config.mongodbGamesCollection).updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } })
}

export async function deleteManagedGame(id: string): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(id)) throw new Error('Invalid game ID.')
  await db.collection<ManagedGame>(config.mongodbGamesCollection).deleteOne({ _id: new ObjectId(id) })
}
