"use server";

import { revalidatePath } from "next/cache";
import {
  createAvailabilitySession,
  deleteAvailabilitySession,
  getAvailabilitySessions,
} from "@/lib/convex/database";
import { requireOwner } from "@/lib/convex/auth";

export async function generateAvailabilitySessionAction(
  organizationId: string,
) {
  try {
    const { user } = await requireOwner(organizationId);

    const existing = await getAvailabilitySessions(organizationId);
    await Promise.all(existing.map((s) => deleteAvailabilitySession(s.$id)));
    const session = await createAvailabilitySession(organizationId, user.$id || user._id);
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
