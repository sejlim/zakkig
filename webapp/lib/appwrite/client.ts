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
  return storage
    .getFilePreview(BUCKETS.MENU_IMAGES, fileId, width, height)
    .toString();
}
