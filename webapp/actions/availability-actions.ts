"use server";

import { revalidatePath } from "next/cache";
import {
  createAvailabilitySession,
  deleteAvailabilitySession,
  getAvailabilitySessions,
} from "@/lib/convex/database";
import { getUser } from "@/lib/convex/auth";

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
