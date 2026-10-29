import { MongoClient, type Db } from 'mongodb'

import { config } from '../config.ts'

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
