"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { updateOrganization } from "@/lib/convex/database";
import { uploadFileToConvex } from "@/lib/convex/storage";
import { getUser, getAuthenticatedConvexClient, requireOwner } from "@/lib/convex/auth";
import { convexServer } from "@/lib/convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { redirect } from "next/navigation";
import {
  sendDeleteAccountEmail,
  sendChangeEmailLink,
  sendEmailOtp,
} from "@/lib/email";
import { SESSION_COOKIE_NAME, MAX_IMAGE_SIZE_BYTES, isAllowedImageFile } from "@/lib/constants";

export interface SettingsActionState {
  error?: string;
  success?: boolean;
}

export async function logoutAllDevicesAction(): Promise<void> {
  redirect("/sign-in");
}

export async function updateBusinessAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const organizationId = formData.get("organizationId") as string;
  if (!organizationId) return { error: "Betriebs-ID fehlt." };

  try {
    const { user } = await requireOwner(organizationId);
    const organizationName = formData.get("organizationName") as string;
    const userName = formData.get("userName") as string;
    const address = formData.get("address") as string;
    const logoFile = formData.get("logo") as File | null;
    const existingLogoId = formData.get("existingLogoId") as string;
    const removeLogo = formData.get("removeLogo") === "true";
    const bannerFile = formData.get("banner") as File | null;
    const existingBannerId = formData.get("existingBannerId") as string;
    const removeBanner = formData.get("removeBanner") === "true";

    if (!organizationName) return { error: "Name des Betriebs ist erforderlich." };
    if (organizationName.length > 100) return { error: "Der Name des Betriebs darf maximal 100 Zeichen lang sein." };
    if (!userName) return { error: "Vertretername ist erforderlich." };
    if (userName.length > 100) return { error: "Der Name darf maximal 100 Zeichen lang sein." };
    if (address && address.length > 200) return { error: "Die Adresse darf maximal 200 Zeichen lang sein." };

    if (logoFile && logoFile.size > 0) {
      if (!isAllowedImageFile(logoFile)) {
        return { error: "Nur Bilder im JPG- oder PNG-Format sind für das Logo erlaubt." };
      }
      if (logoFile.size > MAX_IMAGE_SIZE_BYTES) {
        return { error: "Das Logo darf maximal 10 MB groß sein." };
      }
    }

    if (bannerFile && bannerFile.size > 0) {
      if (!isAllowedImageFile(bannerFile)) {
        return { error: "Nur Bilder im JPG- oder PNG-Format sind für das Banner erlaubt." };
      }
      if (bannerFile.size > MAX_IMAGE_SIZE_BYTES) {
        return { error: "Das Banner darf maximal 10 MB groß sein." };
      }
    }

  const client = await getAuthenticatedConvexClient();
    try {
      await client.mutation(api.users.updateName, { name: userName });
    } catch {
      // ignore if auth context is separate
    }

    let logoStorageId: string | undefined = existingLogoId || undefined;
    if (removeLogo) {
      logoStorageId = undefined;
    } else if (logoFile && logoFile.size > 0) {
      logoStorageId = await uploadFileToConvex(logoFile);
    }

    let bannerStorageId: string | undefined = existingBannerId || undefined;
    if (removeBanner) {
      bannerStorageId = undefined;
    } else if (bannerFile && bannerFile.size > 0) {
      bannerStorageId = await uploadFileToConvex(bannerFile);
    }

    await updateOrganization(organizationId, {
      name: organizationName,
      address,
      logoStorageId,
      clearLogo: removeLogo,
      bannerStorageId,
      clearBanner: removeBanner,
    });

    revalidatePath(`/dashboard/${organizationId}/settings`);
    revalidatePath(`/dashboard/${organizationId}/overview`);
    revalidatePath(`/to-go/${organizationId}`);
    revalidatePath(`/to-stay/${organizationId}`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Daten konnten nicht gespeichert werden.";
    return { error: message };
  }
}

export async function requestAccountDeletionAction() {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Nicht authentifiziert." };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("Missing required environment variable: NEXT_PUBLIC_APP_URL is not set");
    }
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const locale = cookieStore.get("NEXT_LOCALE")?.value || "de";

    const res = await convexServer.mutation(api.users.createAccountDeletionToken, {
      userId: user._id,
      sessionToken,
    });

    if (!res.success || !res.token || !res.email) {
      return { success: false, error: res.error || "Token konnte nicht erstellt werden." };
    }

    const deleteUrl = `${appUrl}/delete-account?userId=${user._id}&token=${res.token}`;
    const emailResult = await sendDeleteAccountEmail({
      to: res.email,
      deleteUrl,
      locale,
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || "Bestätigungs-E-Mail konnte nicht gesendet werden." };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Account deletion request failed:", error);
    return { success: false, error: error.message || "Fehler beim Anfordern der Kontolöschung." };
  }
}

export async function confirmAccountDeletionAction(
  userId: string,
  token: string
) {
  try {
    const res = await convexServer.mutation(api.users.confirmAccountDeletion, {
      userId: userId as Id<"users">,
      token,
    });

    if (res.error) {
      return { success: false, error: res.error };
    }

    // Sign out user by clearing the session cookie
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    return { success: true };
  } catch (error: any) {
    console.error("Account deletion confirm failed:", error);
    return { success: false, error: error.message || "Fehler beim Löschen des Kontos." };
  }
}

export async function requestEmailChangeAction() {
  try {
    const user = await getUser();
    if (!user) return { success: false, error: "Nicht authentifiziert." };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("Missing required environment variable: NEXT_PUBLIC_APP_URL is not set");
    }
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const locale = cookieStore.get("NEXT_LOCALE")?.value || "de";

    const res = await convexServer.mutation(api.users.createEmailChangeToken, {
      userId: user._id,
      sessionToken,
    });

    if (!res.success || !res.token || !res.email) {
      return { success: false, error: res.error || "Token konnte nicht erstellt werden." };
    }

    const changeUrl = `${appUrl}/change-email/confirm?userId=${user._id}&token=${res.token}`;
    const emailResult = await sendChangeEmailLink({
      to: res.email,
      changeUrl,
      locale,
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || "Bestätigungs-E-Mail konnte nicht gesendet werden." };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Email change request failed:", error);
    return { success: false, error: error.message || "Fehler beim Anfordern der E-Mail-Änderung." };
  }
}

export async function sendEmailChangeOtpAction(
  _prevState: { success?: boolean; error?: string; email?: string; userId?: string; token?: string },
  formData: FormData
) {
  try {
    const userId = formData.get("userId") as string;
    const token = formData.get("token") as string;
    const newEmail = formData.get("newEmail") as string;

    if (!userId || !token || !newEmail) {
      return { success: false, error: "Bitte fülle alle Pflichtfelder aus." };
    }

    const cookieStore = await cookies();
    const locale = cookieStore.get("NEXT_LOCALE")?.value || "de";

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const res = await convexServer.mutation(api.users.storeNewEmailOtp, {
      userId: userId as Id<"users">,
      token,
      newEmail,
      otp,
    });

    if (!res.success) {
      return { success: false, error: res.error || "Token ist ungültig oder abgelaufen." };
    }

    const emailRes = await sendEmailOtp({
      to: newEmail,
      code: otp,
      locale,
    });

    if (!emailRes.success) {
      return { success: false, error: emailRes.error || "Fehler beim Senden des Bestätigungscodes." };
    }

    return { success: true, email: newEmail, userId, token };
  } catch (error: any) {
    console.error("Email change send OTP failed:", error);
    return { success: false, error: error.message || "Fehler beim Senden des Bestätigungscodes." };
  }
}

export async function confirmEmailChangeOtpAction(
  _prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  try {
    const userId = formData.get("userId") as string;
    const token = formData.get("token") as string;
    const email = formData.get("email") as string;
    const otp = formData.get("otp") as string;

    if (!userId || !token || !email || !otp) {
      return { success: false, error: "Bitte fülle alle Pflichtfelder aus." };
    }

    const res = await convexServer.mutation(api.users.confirmEmailChangeWithOtp, {
      userId: userId as Id<"users">,
      token,
      newEmail: email,
      otp,
    });

    if (!res.success) {
      return { success: false, error: res.error || "Fehler beim Bestätigen der E-Mail-Adresse." };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Email change confirm OTP failed:", error);
    return { success: false, error: error?.message || "Fehler beim Bestätigen der E-Mail-Adresse." };
  }
}

export async function toggleFeatureAction(
  organizationId: string,
  feature: "to-go" | "to-stay",
  value: boolean,
): Promise<SettingsActionState> {
  try {
    await requireOwner(organizationId);

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
  try {
    await requireOwner(organizationId);

    // Validate tables array: max 100 tables, each between 1 and 10 characters
    if (!Array.isArray(tables) || tables.length > 100) {
      return { error: "Ungültige Tischanzahl (maximal 100 Tische)." };
    }
    const cleanTables: string[] = [];
    for (const t of tables) {
      const trimmed = String(t).trim();
      if (trimmed.length < 1 || trimmed.length > 10) {
        return {
          error: "Tischnummern müssen zwischen 1 und 10 Zeichen lang sein.",
        };
      }
      cleanTables.push(trimmed);
    }

    await updateOrganization(organizationId, { tables: cleanTables });
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
