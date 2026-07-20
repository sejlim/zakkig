import "server-only";

import { createAdminClient } from "./server";
import { BUCKETS } from "@/lib/constants";

/**
 * Upload a menu image file. Returns the file ID.
 */
export async function uploadMenuImage(
  file: File,
  userId: string,
): Promise<string> {
  const { storage } = createAdminClient();
  const { ID, Permission, Role } = await import("node-appwrite");

  const result = await storage.createFile(
    BUCKETS.MENU_IMAGES,
    ID.unique(),
    file as any, // File is a standard browser File object, works with node-appwrite using InputFile
    [
      Permission.read(Role.any()),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ],
  );

  return result.$id;
}

/**
 * Delete a menu image.
 */
export async function deleteMenuImage(fileId: string) {
  const { storage } = createAdminClient();

  await storage.deleteFile(BUCKETS.MENU_IMAGES, fileId);
}
