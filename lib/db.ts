'use client'

import Dexie, { type Table } from 'dexie'

export type Session = {
  id: string
  title: string
  mp3: string
  createdAt: number
}

class SessionDatabase extends Dexie {
  sessions!: Table<Session>

  constructor() {
    super('PodcastSessions')
    this.version(2).stores({
      sessions: '++id, title, mp3, createdAt',
    })
  }
}

const db = new SessionDatabase()

export const save = async (session: Omit<Session, 'createdAt' | 'id'>) => {
  await db.sessions.add({
    ...session,
    id: Date.now().toString(),
    createdAt: Date.now(),
  })
}

export const getAll = async () => {
  const sessions = await db.sessions.toArray()
  return sessions.sort((prev, next) => next.createdAt - prev.createdAt)
}

export const remove = async (id: string) => {
  await db.sessions.delete(id)
}
