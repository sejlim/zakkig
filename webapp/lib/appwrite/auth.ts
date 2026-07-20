import "server-only";

import { ID, Client, Account, Models } from "node-appwrite";
import { cookies, headers } from "next/headers";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "@/lib/constants";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { createAdminClient } from "@/lib/appwrite/server";

async function createPublicClient() {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "de";
  const userAgent = headersList.get("user-agent") || "";

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setLocale(locale);

  if (userAgent) {
    client.setForwardedUserAgent(userAgent);
  }

  return {
    account: new Account(client),
    client,
  };
}

/**
 * Create a new user account without logging in.
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<any> {
  const { account } = await createPublicClient();

  return await account.create(ID.unique(), email, password, name);
}

/**
 * Verify credentials by creating a session, then immediately deleting it.
 * This is used to validate passwords before sending an OTP.
 */
export async function verifyCredentials(email: string, password: string) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

  if (userAgent) {
    client.setForwardedUserAgent(userAgent);
  }

  const account = new Account(client);

  const session = await account.createEmailPasswordSession(email, password);

  // Use admin client to delete the session since secret is not returned for server SDKs
  const { users } = createAdminClient();
  await users.deleteSession(session.userId, session.$id);

  return session.userId;
}

/**
 * Send an OTP to the user's email.
 */
export async function sendEmailOtp(userId: string, email: string) {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "de";
  const userAgent = headersList.get("user-agent") || "";

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setLocale(locale);

  if (userAgent) {
    client.setForwardedUserAgent(userAgent);
  }

  const account = new Account(client);

  return await account.createEmailToken(userId, email);
}

/**
 * Verify the OTP and create a final session.
 */
export async function verifyOtp(userId: string, secret: string) {
  const { account } = createAdminClient();

  const session = await account.createSession(userId, secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(session.expire),
    path: "/",
  });

  return session;
}

/**
 * Destroy the current session and clear the auth cookie.
 */
export async function signOut() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionValue) {
    try {
      // We can't delete a session via admin client without the session ID,
      // so we use the session client approach
      const [
        { Client, Account },
        { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID },
        headersList,
      ] = await Promise.all([
        import("node-appwrite"),
        import("@/lib/constants"),
        headers(),
      ]);
      const userAgent = headersList.get("user-agent") || "";

      const sessionClient = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setSession(sessionValue);

      if (userAgent) {
        sessionClient.setForwardedUserAgent(userAgent);
      }

      const sessionAccount = new Account(sessionClient);
      await sessionAccount.deleteSession("current");
    } catch {
      // Session may already be invalid — that's fine
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Send a password recovery email.
 */
export async function resetPassword(email: string) {
  const { account } = await createPublicClient();

  await account.createRecovery(
    email,
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password/confirm`,
  );
}

/**
 * Confirm password reset using secret.
 */
export async function confirmPasswordReset(
  userId: string,
  secret: string,
  password: string,
) {
  const { account } = await createPublicClient();

  await account.updateRecovery(userId, secret, password);
}
