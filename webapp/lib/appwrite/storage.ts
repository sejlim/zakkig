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
  const [[{ ID, Permission, Role }, { InputFile }], arrayBuffer] =
    await Promise.all([
      Promise.all([import("node-appwrite"), import("node-appwrite/file")]),
      file.arrayBuffer(),
    ]);

  const buffer = Buffer.from(arrayBuffer);
  const fileName = file.name || "image.png";
  const inputFile = InputFile.fromBuffer(buffer, fileName);

  const result = await storage.createFile(
    BUCKETS.MENU_IMAGES,
    ID.unique(),
    inputFile,
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
