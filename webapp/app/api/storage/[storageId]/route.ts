import { NextRequest, NextResponse } from "next/server";
import { convexServer } from "@/lib/convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storageId: string }> }
) {
  const { storageId } = await params;
  if (!storageId) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const url = await convexServer.query(api.storage.getUrl, {
      storageId: storageId as Id<"_storage">,
    });
    if (!url) {
      return new NextResponse("File not found", { status: 404 });
    }

    const imageRes = await fetch(url);
    if (!imageRes.ok) {
      return new NextResponse("Failed to fetch image", {
        status: imageRes.status,
      });
    }

    return new NextResponse(imageRes.body, {
      headers: {
        "Content-Type":
          imageRes.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Invalid storage ID", { status: 400 });
  }
}
