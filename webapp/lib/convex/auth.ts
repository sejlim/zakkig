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

export async function requireOwner(organizationId: string) {
  const user = await getUser();
  if (!user) {
    throw new Error("Nicht authentifiziert.");
  }

  const org = await convexServer.query(api.organizations.get, {
    id: organizationId as any,
  });

  if (!org) {
    throw new Error("Betrieb nicht gefunden.");
  }

  const ownerId = String(org.ownerId);
  const userId = String(user._id || user.$id);

  if (ownerId !== userId) {
    throw new Error("Nicht autorisiert: Du bist nicht der Inhaber dieses Betriebs.");
  }

  return { user, org };
}

export async function requireKitchenOrOwner(organizationId: string) {
  const user = await getUser();
  if (user) {
    const org = await convexServer.query(api.organizations.get, {
      id: organizationId as any,
    });
    const ownerId = org ? String(org.ownerId) : "";
    const userId = String(user._id || user.$id);
    if (ownerId === userId) {
      return { type: "owner" as const, user, org };
    }
  }

  const cookieStore = await cookies();
  const cookieName = `order_session_${organizationId}`;
  const cookieToken = cookieStore.get(cookieName)?.value;

  if (cookieToken) {
    const sessions = await convexServer.query(api.sessions.getOrderSessions, {
      organizationId: organizationId as any,
    });
    if (sessions.some((s: any) => s.token === cookieToken)) {
      return { type: "kitchen" as const };
    }
  }

  throw new Error("Nicht autorisiert: Keine gültige Küchen-Sitzung.");
}

export async function requireStaffOrOwner(organizationId: string) {
  const user = await getUser();
  if (user) {
    const org = await convexServer.query(api.organizations.get, {
      id: organizationId as any,
    });
    const ownerId = org ? String(org.ownerId) : "";
    const userId = String(user._id || user.$id);
    if (ownerId === userId) {
      return { type: "owner" as const, user, org };
    }
  }

  const cookieStore = await cookies();
  const cookieName = `availability_session_${organizationId}`;
  const cookieToken = cookieStore.get(cookieName)?.value;

  if (cookieToken) {
    const sessions = await convexServer.query(api.sessions.getAvailabilitySessions, {
      organizationId: organizationId as any,
    });
    if (sessions.some((s: any) => s.token === cookieToken)) {
      return { type: "staff" as const };
    }
  }

  throw new Error("Nicht autorisiert: Keine gültige Mitarbeiter-Sitzung.");
}

