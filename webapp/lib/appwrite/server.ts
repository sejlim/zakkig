import "server-only";

import {
  Client,
  Account,
  Databases,
  Storage,
  Users,
  type Models,
} from "node-appwrite";
import { cookies, headers } from "next/headers";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  SESSION_COOKIE_NAME,
} from "@/lib/constants";

/**
 * Admin client — uses API key, singleton.
 * Use for creating sessions, admin operations.
 */
export function createAdminClient() {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  return {
    client,
    account: new Account(client),
    tablesDB: new Databases(client),
    storage: new Storage(client),
    users: new Users(client),
  };
}

/**
 * Session client — uses session cookie, per-request.
 * Use for acting on behalf of the logged-in user.
 * Returns null if no session cookie exists.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    return null;
  }

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setSession(session);

  if (userAgent) {
    client.setForwardedUserAgent(userAgent);
  }

  return {
    client,
    account: new Account(client),
    tablesDB: new Databases(client),
    storage: new Storage(client),
  };
}

/**
 * Get the current logged-in user, or null if not authenticated.
 */
export async function getUser(): Promise<Models.User<Models.Preferences> | null> {
  const sessionClient = await createSessionClient();
  if (!sessionClient) return null;

  try {
    return await sessionClient.account.get();
  } catch (error) {
    console.error("getUser error:", error);
    return null;
  }
}
