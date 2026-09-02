"use client";

export function getImagePreviewUrl(fileIdOrUrl: string): string {
  if (!fileIdOrUrl) return "";
  if (
    fileIdOrUrl.startsWith("http://") ||
    fileIdOrUrl.startsWith("https://") ||
    fileIdOrUrl.startsWith("/") ||
    fileIdOrUrl.startsWith("data:") ||
    fileIdOrUrl.startsWith("blob:")
  ) {
    return fileIdOrUrl;
  }
  return `/api/storage/${fileIdOrUrl}`;
}
