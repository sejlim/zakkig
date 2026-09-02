import { convexServer } from "./server";
import { api } from "@/convex/_generated/api";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";

export async function getUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      const user = await convexServer.query(api.authQueries.getUserBySession, {
        sessionToken,
      });
      if (user) {
        return {
          ...user,
          $id: user._id,
          $createdAt: new Date(user._creationTime).toISOString(),
        };
      }
    }

    // Fallback to Convex Auth Nextjs JWT token
    const token = await convexAuthNextjsToken();
    if (token) {
      convexServer.setAuth(token);
      const user = await convexServer.query(api.users.currentUser, {});
      if (user) {
        return {
          ...user,
          $id: user._id,
          $createdAt: new Date(user._creationTime).toISOString(),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedConvexClient() {
  const token = await convexAuthNextjsToken();
  const client = convexServer;
  if (token) {
    client.setAuth(token);
  }
  return client;
}
