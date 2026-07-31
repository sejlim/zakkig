"use server";

import { z } from "zod";
import { db, WEBSITE_DB_ID } from "@/lib/appwrite";
import { ID, Query } from "node-appwrite";

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

type WaitlistResponse =
  | { success: true }
  | {
      success: false;
      errorCode: "EMAIL_ALREADY_EXISTS" | "DATABASE_ERROR";
      error?: string;
    };

export async function addToWaitlist(data: {
  email: string;
}): Promise<WaitlistResponse> {
  const parsed = waitlistSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      errorCode: "DATABASE_ERROR",
      error: "Invalid email",
    };
  }

  const { email } = parsed.data;

  try {
    const existing = await db.listDocuments(WEBSITE_DB_ID, "leads", [
      Query.equal("email", email),
      Query.limit(1),
    ]);

    if (existing.total > 0) {
      return { success: false, errorCode: "EMAIL_ALREADY_EXISTS" };
    }

    await db.createDocument(WEBSITE_DB_ID, "leads", ID.unique(), {
      email,
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      errorCode: "DATABASE_ERROR",
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}
