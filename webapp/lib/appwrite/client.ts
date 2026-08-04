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

export function getImagePreviewUrl(fileId: string): string {
  if (!fileId) return "";
  try {
    const preview = storage.getFilePreview(BUCKETS.MENU_IMAGES, fileId);
    return String(preview);
  } catch {
    return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.MENU_IMAGES}/files/${fileId}/preview?project=${APPWRITE_PROJECT_ID}`;
  }
}
