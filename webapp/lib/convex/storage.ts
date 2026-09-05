import { convexServer } from "@/lib/convex/server";
import { api } from "@/convex/_generated/api";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/constants";

export async function uploadFileToConvex(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`File exceeds maximum allowed size of 10 MB`);
  }
  const uploadUrl = await convexServer.mutation(api.storage.generateUploadUrl, {});
  const arrayBuffer = await file.arrayBuffer();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: arrayBuffer,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload to Convex storage: ${response.statusText}`);
  }

  const { storageId } = await response.json();
  return storageId;
}
