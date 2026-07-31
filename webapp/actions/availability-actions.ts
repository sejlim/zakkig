"use server";

import { revalidatePath } from "next/cache";
import {
  createAvailabilitySession,
  deleteAvailabilitySession,
  getAvailabilitySessions,
} from "@/lib/appwrite/database";
import { getUser } from "@/lib/appwrite/server";

async function createAvailabilitySessionAction(organizationId: string) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    const session = await createAvailabilitySession(organizationId, user.$id);
    revalidatePath(`/dashboard/${organizationId}/overview`);
    return { success: true, session: structuredClone(session) };
  } catch (error: unknown) {
    console.error("Fehler beim Erstellen der Availability Session:", error);
    return {
      error: "Sitzung konnte nicht erstellt werden. Bitte versuche es erneut.",
    };
  }
}

async function deleteAvailabilitySessionAction(
  sessionId: string,
  organizationId: string,
) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    await deleteAvailabilitySession(sessionId);
    revalidatePath(`/dashboard/${organizationId}/overview`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Fehler beim Löschen der Availability Session:", error);
    return {
      error: "Sitzung konnte nicht gelöscht werden. Bitte versuche es erneut.",
    };
  }
}

export async function generateAvailabilitySessionAction(
  organizationId: string,
) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    const existing = await getAvailabilitySessions(organizationId);
    await Promise.all(existing.map((s) => deleteAvailabilitySession(s.$id)));
    const session = await createAvailabilitySession(organizationId, user.$id);
    revalidatePath(`/dashboard/${organizationId}/overview`);
    return { success: true, session: structuredClone(session) };
  } catch (error: unknown) {
    console.error(
      "Fehler beim Neu-Generieren der Availability Session:",
      error,
    );
    return {
      error: "Sitzungen konnten nicht neu generiert werden.",
    };
  }
}
