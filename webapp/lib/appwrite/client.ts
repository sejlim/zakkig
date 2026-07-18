'use client'

import { Client, Account, Databases, Storage } from 'appwrite'
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, BUCKETS } from '@/lib/constants'

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)

export const account = new Account(client)
export const tablesDB = new Databases(client)
export const storage = new Storage(client)
export const realtime = new Realtime(client)

export function getImagePreviewUrl(fileId: string, width = 400, height = 400): string {
  if (!fileId) return ''
  return storage.getFilePreview(
    BUCKETS.MENU_IMAGES,
    fileId,
    width,
    height
  ).toString()
}

export { client }
