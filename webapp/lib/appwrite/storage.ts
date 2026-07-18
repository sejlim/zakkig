import 'server-only'

import { createAdminClient } from './server'
import { BUCKETS } from '@/lib/constants'

/**
 * Upload a menu image file. Returns the file ID.
 */
export async function uploadMenuImage(file: File, userId: string): Promise<string> {
  const { storage } = createAdminClient()
  const { ID, Permission, Role } = await import('node-appwrite')

  const result = await storage.createFile({
    bucketId: BUCKETS.MENU_IMAGES,
    fileId: ID.unique(),
    file,
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ],
  })

  return result.$id
}

/**
 * Delete a menu image.
 */
export async function deleteMenuImage(fileId: string) {
  const { storage } = createAdminClient()

  await storage.deleteFile({
    bucketId: BUCKETS.MENU_IMAGES,
    fileId,
  })
}
