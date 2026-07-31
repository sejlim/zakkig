"use server";

import { revalidatePath } from "next/cache";
import { updateOrganization } from "@/lib/appwrite/database";
import { uploadMenuImage, deleteMenuImage } from "@/lib/appwrite/storage";
import { getUser } from "@/lib/appwrite/server";

export interface SettingsActionState {
  error?: string;
  success?: boolean;
}

export async function updateBusinessAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  const organizationId = formData.get("organizationId") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const logoFile = formData.get("logo") as File | null;
  const existingLogoId = formData.get("existingLogoId") as string;

  if (!name) return { error: "Name ist erforderlich." };

  try {
    let logoFileId = existingLogoId;

    if (formData.get("removeLogo") === "true") {
      if (existingLogoId) {
        try {
          await deleteMenuImage(existingLogoId);
        } catch {
          /* ignore */
        }
      }
      logoFileId = "";
    } else if (logoFile && logoFile.size > 0) {
      if (existingLogoId) {
        try {
          await deleteMenuImage(existingLogoId);
        } catch {
          /* ignore */
        }
      }
      logoFileId = await uploadMenuImage(logoFile, user.$id);
    }

    await updateOrganization(organizationId, {
      name,
      address,
      logoFileId,
    });

    revalidatePath(`/dashboard/${organizationId}/settings`);
    revalidatePath(`/dashboard/${organizationId}/overview`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Daten konnten nicht gespeichert werden.";
    return { error: message };
  }
}

export async function requestAccountDeletionAction(): Promise<SettingsActionState> {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  // Placeholder: In production, this would send an email to support
  // or create a deletion request in the database
  return { success: true };
}

export async function toggleFeatureAction(
  organizationId: string,
  feature: "to-go" | "to-stay",
  value: boolean,
): Promise<SettingsActionState> {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    const updateData =
      feature === "to-go"
        ? { isToGoEnabled: value }
        : { isToStayEnabled: value };

    await updateOrganization(organizationId, updateData);

    revalidatePath(`/dashboard/${organizationId}/overview`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Feature konnte nicht umgeschaltet werden.";
    return { error: message };
  }
}

export async function updateTablesAction(
  organizationId: string,
  tables: string[],
): Promise<SettingsActionState> {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    await updateOrganization(organizationId, { tables });
    revalidatePath(`/dashboard/${organizationId}/overview`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Tische konnten nicht aktualisiert werden.";
    return { error: message };
  }
}
