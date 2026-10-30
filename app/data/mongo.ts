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
  await db.collection<StaffChatMessage>('staff_chat_messages').createIndex({ conversationId: 1, createdAt: 1 })
  await db.collection<StaffConversation>('staff_conversations').createIndex({ participantIds: 1, updatedAt: -1 })
  await db.collection<StaffChatStoredFile>('staff_chat_files').createIndex({ conversationId: 1, createdAt: -1 })
  await db.collection<StaffPresence>('staff_presence').createIndex({ lastSeenAt: -1 })
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

  if (!db) throw new Error('Contact inbox is unavailable because MongoDB is not connected.')

  await db.collection<ContactMessage>('messages').insertOne(doc)
}



export async function listContactMessages() {
  if (!db) throw new Error('MongoDB is not connected.')
  return db.collection<ContactMessage & { _id: import('mongodb').ObjectId }>('messages').find({}).sort({ createdAt: -1 }).toArray()
}


export interface StaffChatMessage {
  _id?: import('mongodb').ObjectId
  conversationId: import('mongodb').ObjectId
  senderId: string
  senderName: string
  body: string
  replyToId?: string
  replyPreview?: { senderName: string; body: string }
  mentions?: string[]
  attachments?: StaffChatAttachment[]
  createdAt: Date
}
export interface StaffConversation {
  _id?: import('mongodb').ObjectId
  participantIds: string[]
  participantNames: Record<string, string>
  title: string
  isGroup: boolean
  createdAt: Date
  updatedAt: Date
  lastMessage?: string
  lastSenderName?: string
  createdBy?: string
  description?: string
  icon?: string
  unreadCounts?: Record<string, number>
  mentionUnreadCounts?: Record<string, number>
  pinnedMessageIds?: string[]
}
export async function createStaffConversation(input: { creatorId: string; creatorName: string; participantIds: string[]; participantNames: Record<string,string>; title?: string; description?: string; icon?: string }): Promise<string> {
  if (!db) throw new Error('MongoDB is not connected.')
  const ids = [...new Set([input.creatorId, ...input.participantIds])]
  if (ids.length < 2 || ids.length > 20) throw new Error('Choose between 1 and 19 other staff members.')
  const isGroup = ids.length > 2
  const title = (input.title || '').trim().slice(0, 80) || (isGroup ? 'Group conversation' : input.participantNames[ids.find(id => id !== input.creatorId)!] || 'Direct message')
  const now = new Date()
  const result = await db.collection<StaffConversation>('staff_conversations').insertOne({
    participantIds: ids, participantNames: { ...input.participantNames, [input.creatorId]: input.creatorName },
    title, isGroup, createdBy: input.creatorId, description: (input.description || '').trim().slice(0, 240), icon: (input.icon || '').trim().slice(0, 8), unreadCounts: Object.fromEntries(ids.map(id => [id, 0])), mentionUnreadCounts: Object.fromEntries(ids.map(id => [id, 0])), pinnedMessageIds: [], createdAt: now, updatedAt: now,
  })
  return String(result.insertedId)
}
export async function listStaffConversations(userId: string) {
  if (!db) throw new Error('MongoDB is not connected.')
  return db.collection<StaffConversation>('staff_conversations').find({ participantIds: userId }).sort({ updatedAt: -1 }).toArray()
}
export async function getStaffConversation(id: string, userId: string) {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(id)) return null
  return db.collection<StaffConversation>('staff_conversations').findOne({ _id: new ObjectId(id), participantIds: userId })
}
export async function listStaffChatMessages(conversationId: string, userId: string) {
  if (!db) throw new Error('MongoDB is not connected.')
  const conversation = await getStaffConversation(conversationId, userId)
  if (!conversation?._id) return null
  return db.collection<StaffChatMessage>('staff_chat_messages').find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(500).toArray()
}
export async function saveStaffChatMessage(input: { conversationId: string; senderId: string; senderName: string; body: string; replyToId?: string; mentions?: string[]; attachments?: Array<{ name: string; mimeType: string; data: Buffer }> }) {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(input.conversationId)) throw new Error('Invalid conversation.')
  const conversations = db.collection<StaffConversation>('staff_conversations')
  const conversation = await conversations.findOne({ _id: new ObjectId(input.conversationId), participantIds: input.senderId })
  if (!conversation?._id) throw new Error('You are not a participant in this conversation.')
  const body = input.body.trim()
  if ((!body && !input.attachments?.length) || body.length > 4000) throw new Error('Add a message (up to 4000 characters) or an attachment.')
  const now = new Date()
  let replyPreview: StaffChatMessage['replyPreview']
  if (input.replyToId) {
    if (!ObjectId.isValid(input.replyToId)) throw new Error('Invalid reply target.')
    const parent = await db.collection<StaffChatMessage>('staff_chat_messages').findOne({ _id: new ObjectId(input.replyToId), conversationId: conversation._id })
    if (!parent) throw new Error('The message you replied to could not be found.')
    replyPreview = { senderName: parent.senderName, body: parent.body.slice(0, 180) }
  }
  const allowedMentions = [...new Set((input.mentions || []).filter(id => conversation.participantIds.includes(id) && id !== input.senderId))]
  const messageId = new ObjectId()
  const attachments: StaffChatAttachment[] = []
  const files = input.attachments || []
  if (files.length > 5) throw new Error('Attach up to 5 files per message.')
  for (const file of files) {
    if (file.data.length > 5 * 1024 * 1024) throw new Error('Each attachment must be 5 MB or smaller.')
    if (!/^(image\/(png|jpeg|gif|webp)|application\/pdf|text\/plain|application\/zip|application\/vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation))$/.test(file.mimeType)) throw new Error('That file type is not supported.')
    const fileId = new ObjectId()
    attachments.push({ id: String(fileId), name: file.name.slice(0, 180), mimeType: file.mimeType, size: file.data.length })
    await db.collection<StaffChatStoredFile>('staff_chat_files').insertOne({ _id: fileId, conversationId: conversation._id, messageId, name: file.name.slice(0, 180), mimeType: file.mimeType, size: file.data.length, data: file.data, uploadedBy: input.senderId, createdAt: now })
  }
  await db.collection<StaffChatMessage>('staff_chat_messages').insertOne({
    _id: messageId, conversationId: conversation._id, senderId: input.senderId, senderName: input.senderName,
    body, ...(input.replyToId ? { replyToId: input.replyToId } : {}), ...(replyPreview ? { replyPreview } : {}),
    mentions: allowedMentions, attachments, createdAt: now,
  })
  const inc: Record<string, number> = {}
  for (const participantId of conversation.participantIds) {
    if (participantId !== input.senderId) inc['unreadCounts.' + participantId] = 1
    if (allowedMentions.includes(participantId)) inc['mentionUnreadCounts.' + participantId] = 1
  }
  await conversations.updateOne({ _id: conversation._id }, {
    $set: { lastMessage: body.slice(0, 180) || (attachments.length ? '📎 Attachment' : ''), lastSenderName: input.senderName, updatedAt: now, ['unreadCounts.' + input.senderId]: 0, ['mentionUnreadCounts.' + input.senderId]: 0 },
    ...(Object.keys(inc).length ? { $inc: inc } : {}),
  })
  return String(messageId)
}

export interface StaffChatAttachment { id: string; name: string; mimeType: string; size: number }
interface StaffChatStoredFile {
  _id: import('mongodb').ObjectId; conversationId: import('mongodb').ObjectId; messageId: import('mongodb').ObjectId;
  name: string; mimeType: string; size: number; data: Buffer | { buffer: Uint8Array; position?: number }; uploadedBy: string; createdAt: Date
}
interface StaffPresence { _id: string; name: string; lastSeenAt: Date }


export async function markStaffConversationRead(conversationId: string, userId: string): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(conversationId)) return
  await db.collection<StaffConversation>('staff_conversations').updateOne(
    { _id: new ObjectId(conversationId), participantIds: userId },
    { $set: { ['unreadCounts.' + userId]: 0, ['mentionUnreadCounts.' + userId]: 0, ['lastReadAtByUser.' + userId]: new Date() } },
  )
}
export async function touchStaffPresence(userId: string, name: string): Promise<void> {
  if (!db) return
  await db.collection<StaffPresence>('staff_presence').updateOne({ _id: userId }, { $set: { name, lastSeenAt: new Date() } }, { upsert: true })
}
export async function listStaffPresence(userIds: string[]) {
  if (!db || !userIds.length) return []
  return db.collection<StaffPresence>('staff_presence').find({ _id: { $in: userIds } }).toArray()
}
export async function listStaffChatMessagesAfter(conversationId: string, userId: string, afterId = '') {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(conversationId)) return null
  const conversation = await getStaffConversation(conversationId, userId)
  if (!conversation?._id) return null
  const collection = db.collection<StaffChatMessage>('staff_chat_messages')
  const filter = afterId && ObjectId.isValid(afterId)
    ? { conversationId: conversation._id, _id: { $gt: new ObjectId(afterId) } }
    : { conversationId: conversation._id }
  return collection.find(filter).sort({ _id: 1 }).limit(100).toArray()
}
export async function searchStaffChatMessages(conversationId: string, userId: string, query: string) {
  if (!db) throw new Error('MongoDB is not connected.')
  const conversation = await getStaffConversation(conversationId, userId)
  if (!conversation?._id) return null
  const escaped = query.replace(/[.*+?^()|[\]{}$]/g, (character) => '\\' + character).slice(0, 80)
  if (!escaped.trim()) return []
  return db.collection<StaffChatMessage>('staff_chat_messages').find({ conversationId: conversation._id, body: { $regex: escaped, $options: 'i' } }).sort({ createdAt: -1 }).limit(100).toArray()
}
export async function setStaffChatMessagePinned(conversationId: string, messageId: string, userId: string, pinned: boolean): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(conversationId) || !ObjectId.isValid(messageId)) throw new Error('Invalid message.')
  const conversation = await getStaffConversation(conversationId, userId)
  if (!conversation?._id) throw new Error('Conversation was not found.')
  const message = await db.collection<StaffChatMessage>('staff_chat_messages').findOne({ _id: new ObjectId(messageId), conversationId: conversation._id })
  if (!message) throw new Error('Message was not found.')
  await db.collection<StaffConversation>('staff_conversations').updateOne({ _id: conversation._id, participantIds: userId }, pinned ? { $addToSet: { pinnedMessageIds: messageId } } : { $pull: { pinnedMessageIds: messageId } })
}
export async function updateStaffConversationDetails(conversationId: string, userId: string, input: { title: string; description: string; icon: string }): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(conversationId)) throw new Error('Invalid conversation.')
  const collection = db.collection<StaffConversation>('staff_conversations')
  const conversation = await collection.findOne({ _id: new ObjectId(conversationId), participantIds: userId })
  if (!conversation) throw new Error('Conversation was not found.')
  if (!conversation.isGroup) throw new Error('Only group conversations have editable details.')
  if ((conversation.createdBy || conversation.participantIds[0]) !== userId) throw new Error('Only the group creator can edit group details.')
  const title = input.title.trim().slice(0, 80)
  if (!title) throw new Error('Group name is required.')
  await collection.updateOne({ _id: conversation._id }, { $set: { title, description: input.description.trim().slice(0, 240), icon: input.icon.trim().slice(0, 8), updatedAt: new Date() } })
}
export async function addStaffConversationMembers(conversationId: string, userId: string, additions: Array<{ id: string; name: string }>): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(conversationId)) throw new Error('Invalid conversation.')
  const collection = db.collection<StaffConversation>('staff_conversations')
  const conversation = await collection.findOne({ _id: new ObjectId(conversationId), participantIds: userId })
  if (!conversation || !conversation.isGroup) throw new Error('Group conversation was not found.')
  if ((conversation.createdBy || conversation.participantIds[0]) !== userId) throw new Error('Only the group creator can manage members.')
  const newMembers = additions.filter(item => /^\d+$/.test(item.id) && !conversation.participantIds.includes(item.id))
  if (!newMembers.length) return
  if (conversation.participantIds.length + newMembers.length > 20) throw new Error('Groups can have up to 20 members.')
  const participantNames = { ...(conversation.participantNames || {}) }
  const updates: Record<string, number> = {}
  for (const member of newMembers) {
    participantNames[member.id] = member.name
    updates['unreadCounts.' + member.id] = 0
    updates['mentionUnreadCounts.' + member.id] = 0
  }
  await collection.updateOne({ _id: conversation._id }, { $addToSet: { participantIds: { $each: newMembers.map(item => item.id) } }, $set: { participantNames, ...updates, updatedAt: new Date() } })
}
export async function removeStaffConversationMember(conversationId: string, actorId: string, memberId: string): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(conversationId)) throw new Error('Invalid conversation.')
  const collection = db.collection<StaffConversation>('staff_conversations')
  const conversation = await collection.findOne({ _id: new ObjectId(conversationId), participantIds: actorId })
  if (!conversation || !conversation.isGroup) throw new Error('Group conversation was not found.')
  const creatorId = conversation.createdBy || conversation.participantIds[0]
  const isSelfLeaving = memberId === actorId
  if (!isSelfLeaving && creatorId !== actorId) throw new Error('Only the group creator can remove other members.')
  if (memberId === creatorId) throw new Error('The group creator cannot leave or be removed. Transfer group ownership first.')
  if (!conversation.participantIds.includes(memberId)) throw new Error('That member is not in this group.')
  const participantIds = conversation.participantIds.filter(id => id !== memberId)
  if (participantIds.length < 2) throw new Error('A group needs at least two members.')
  await collection.updateOne({ _id: conversation._id }, { $set: { participantIds, updatedAt: new Date() }, $unset: { ['unreadCounts.' + memberId]: '', ['mentionUnreadCounts.' + memberId]: '', ['lastReadAtByUser.' + memberId]: '' } })
}

export async function listPinnedStaffChatMessages(conversationId: string, userId: string) {
  if (!db) throw new Error('MongoDB is not connected.')
  const conversation = await getStaffConversation(conversationId, userId)
  if (!conversation?._id || !conversation.pinnedMessageIds?.length) return []
  const { ObjectId } = await import('mongodb')
  const ids = conversation.pinnedMessageIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id))
  if (!ids.length) return []
  return db.collection<StaffChatMessage>('staff_chat_messages').find({ _id: { $in: ids }, conversationId: conversation._id }).sort({ createdAt: -1 }).toArray()
}

export async function getStaffChatFile(fileId: string, userId: string) {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(fileId)) return null
  const file = await db.collection<StaffChatStoredFile>('staff_chat_files').findOne({ _id: new ObjectId(fileId) })
  if (!file) return null
  const conversation = await getStaffConversation(String(file.conversationId), userId)
  return conversation ? file : null
}

export type GameStatus = 'In development' | 'Live' | 'Paused' | 'Archived'

export interface ManagedGame extends RobloxGameMetadata {
  _id?: import('mongodb').ObjectId
  placeUrl: string
  status: GameStatus
  featured?: boolean
  featuredOrder?: number | null
  sortOrder?: number
  createdAt: Date
  updatedAt: Date
}

export async function listManagedGames(): Promise<ManagedGame[]> {
  if (!db) return []
  const collection = db.collection<ManagedGame>(config.mongodbGamesCollection)
  // Give existing records a stable order the first time the ordering UI is used.
  const unranked = await collection.find({ sortOrder: { $exists: false } }).sort({ updatedAt: -1, name: 1 }).toArray()
  if (unranked.length) {
    const last = await collection.find({ sortOrder: { $exists: true } }).sort({ sortOrder: -1 }).limit(1).next()
    let nextOrder = (last?.sortOrder ?? -1) + 1
    for (const game of unranked) {
      await collection.updateOne({ _id: game._id }, { $set: { sortOrder: nextOrder++ } })
    }
  }
  return collection.find({}).sort({ sortOrder: 1, name: 1 }).toArray()
}

export async function createManagedGame(input: Pick<ManagedGame, 'placeUrl' | 'status'> & RobloxGameMetadata): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected. Configure MONGODB_URI to save games.')
  const now = new Date()
  const collection = db.collection<ManagedGame>(config.mongodbGamesCollection)
  const last = await collection.find({}).sort({ sortOrder: -1 }).limit(1).next()
  await collection.insertOne({ ...input, sortOrder: (last?.sortOrder ?? -1) + 1, featuredOrder: null, createdAt: now, updatedAt: now })
}

export async function updateManagedGameMetadata(id: string, metadata: RobloxGameMetadata): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(id)) throw new Error('Invalid game ID.')
  await db.collection<ManagedGame>(config.mongodbGamesCollection).updateOne({ _id: new ObjectId(id) }, { $set: { ...metadata, updatedAt: new Date() } })
}

export async function setFeaturedManagedGame(id: string, slot: number | null): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(id)) throw new Error('Invalid game ID.')
  if (slot !== null && (!Number.isInteger(slot) || slot < 1 || slot > 3)) throw new Error('Choose one of the three featured slots.')
  const collection = db.collection<ManagedGame>(config.mongodbGamesCollection)
  const selected = await collection.findOne({ _id: new ObjectId(id) })
  if (!selected) throw new Error('Game was not found.')
  if (slot !== null) await collection.updateMany({ featuredOrder: slot }, { $set: { featuredOrder: null, featured: false } })
  await collection.updateOne({ _id: new ObjectId(id) }, { $set: { featuredOrder: slot, featured: slot !== null, updatedAt: new Date() } })
}

export async function moveManagedGame(id: string, direction: 'up' | 'down'): Promise<void> {
  if (!db) throw new Error('MongoDB is not connected.')
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(id)) throw new Error('Invalid game ID.')
  const collection = db.collection<ManagedGame>(config.mongodbGamesCollection)
  const games = await collection.find({}).sort({ sortOrder: 1, updatedAt: -1, name: 1 }).toArray()
  const index = games.findIndex((game) => String(game._id) === id)
  if (index < 0) throw new Error('Game was not found.')
  const target = index + (direction === 'up' ? -1 : 1)
  if (target < 0 || target >= games.length) return
  const current = games[index]
  const other = games[target]
  const currentOrder = current.sortOrder ?? index
  const otherOrder = other.sortOrder ?? target
  await collection.updateOne({ _id: current._id }, { $set: { sortOrder: otherOrder, updatedAt: new Date() } })
  await collection.updateOne({ _id: other._id }, { $set: { sortOrder: currentOrder, updatedAt: new Date() } })
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
