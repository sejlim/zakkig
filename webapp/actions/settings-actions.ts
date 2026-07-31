"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { after } from "next/server";
import { updateOrganization } from "@/lib/appwrite/database";
import { uploadMenuImage, deleteMenuImage } from "@/lib/appwrite/storage";
import { getUser, createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { ID, Functions } from "node-appwrite";
import crypto from "crypto";

export interface SettingsActionState {
  error?: string;
  success?: boolean;
}

export async function updateUserNameAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  const name = formData.get("name") as string;
  if (!name) return { error: "Name ist erforderlich." };

  try {
    const { users } = createAdminClient();
    await users.updateName(user.$id, name);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Fehler beim Speichern des Namens.";
    return { error: message };
  }
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

import { ExecutionMethod } from "node-appwrite";

export async function requestAccountDeletionAction() {
  try {
    const session = await createSessionClient();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }
    const { account } = session;
    const user = await account.get();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { client } = await createAdminClient();
    const functions = new Functions(client);

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error("Missing NEXT_PUBLIC_APP_URL");
    }

    // Call the Appwrite function to handle the token generation and email sending
    await functions.createExecution(
      "deleteAccount",
      JSON.stringify({
        action: "request",
        userId: user.$id,
        locale: (await cookies()).get("NEXT_LOCALE")?.value || "de",
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      }),
      false, // async
      "/", // path
      ExecutionMethod.POST // method
    );

    return { success: true };
  } catch (error) {
    console.error("Account deletion request failed:", error);
    return { success: false, error: "Failed to request deletion" };
  }
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
