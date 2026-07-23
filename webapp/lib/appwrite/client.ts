"use client";

import { Client, Storage } from "appwrite";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  BUCKETS,
} from "@/lib/constants";

export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const storage = new Storage(client);

export function getImagePreviewUrl(
  fileId: string,
  width = 400,
  height = 400,
): string {
  if (!fileId) return "";
  try {
    const preview = storage.getFilePreview(BUCKETS.MENU_IMAGES, fileId, width, height);
    return String(preview);
  } catch {
    return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.MENU_IMAGES}/files/${fileId}/preview?width=${width}&height=${height}&project=${APPWRITE_PROJECT_ID}`;
  }
}
