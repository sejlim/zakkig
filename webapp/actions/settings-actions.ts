"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { after } from "next/server";
import { updateOrganization } from "@/lib/appwrite/database";
import { uploadMenuImage, deleteMenuImage } from "@/lib/appwrite/storage";
import { getUser, createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { ID, Functions, Client, Account, Users, ExecutionMethod } from "node-appwrite";
import crypto from "crypto";

export interface SettingsActionState {
  error?: string;
  success?: boolean;
}

import { redirect } from "next/navigation";

export async function logoutAllDevicesAction(): Promise<void> {
  const user = await getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { users } = createAdminClient();
  try {
    await users.deleteSessions(user.$id);
  } catch (error) {
    console.error("Failed to delete all sessions:", error);
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  
  redirect("/");
}

async function updateUserNameAction(
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
  const organizationName = formData.get("organizationName") as string;
  const userName = formData.get("userName") as string;
  const address = formData.get("address") as string;
  const logoFile = formData.get("logo") as File | null;
  const existingLogoId = formData.get("existingLogoId") as string;

  if (!organizationName) return { error: "Name des Betriebs ist erforderlich." };
  if (!userName) return { error: "Vertretername ist erforderlich." };

  try {
    const { users } = createAdminClient();
    await users.updateName(user.$id, userName);

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
      name: organizationName,
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

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error("Missing NEXT_PUBLIC_APP_URL");
    }

    const { client } = await createAdminClient();
    const functions = new Functions(client);

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

export async function requestEmailChangeAction() {
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

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error("Missing NEXT_PUBLIC_APP_URL");
    }

    const { client } = await createAdminClient();
    const functions = new Functions(client);

    await functions.createExecution(
      "changeEmail",
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
    console.error("Email change request failed:", error);
    return { success: false, error: "Failed to request email change" };
  }
}

export async function sendEmailChangeOtpAction(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  try {
    const userId = formData.get("userId") as string;
    const token = formData.get("token") as string;
    const newEmail = formData.get("newEmail") as string;

    if (!userId || !token || !newEmail) {
      return { success: false, error: "Missing required fields" };
    }

    const { client } = await createAdminClient();
    const users = new Users(client);
    const functions = new Functions(client);

    const user = await users.get(userId);
    if (user.email === newEmail) {
      return { success: false, error: "Die E-Mail-Adresse ist bereits mit diesem Konto verknüpft." };
    }

    const res = await functions.createExecution(
      "changeEmail",
      JSON.stringify({
        action: "sendOtp",
        userId,
        token,
        newEmail,
        locale: (await cookies()).get("NEXT_LOCALE")?.value || "de",
      }),
      false, // async
      "/", // path
      ExecutionMethod.POST // method
    );
    
    // Check if function failed
    const responseBody = JSON.parse(res.responseBody);
    if (!responseBody.success) {
       return { success: false, error: responseBody.error || "Failed to send OTP" };
    }

    return { success: true, email: newEmail, userId, token };
  } catch (error) {
    console.error("Email change send OTP failed:", error);
    return { success: false, error: "Fehler beim Senden des Bestätigungscodes." };
  }
}

export async function confirmEmailChangeOtpAction(
  prevState: { success?: boolean; error?: string },
  formData: FormData
) {
  try {
    const userId = formData.get("userId") as string;
    const token = formData.get("token") as string;
    const email = formData.get("email") as string;
    const otp = formData.get("otp") as string;

    if (!userId || !token || !email || !otp) {
      return { success: false, error: "Missing required fields" };
    }

    const currentUser = await getUser();
    if (!currentUser || currentUser.$id !== userId) {
      return { success: false, error: "Nicht authentifiziert." };
    }

    const { client } = await createAdminClient();
    const users = new Users(client);

    const user = await users.get(userId);
    const prefs = user.prefs || {};

    if (!prefs.changeEmailToken || prefs.changeEmailToken !== token) {
      return { success: false, error: "Token ist ungültig oder abgelaufen." };
    }
    
    if (!prefs.newEmailOtp || prefs.newEmailOtp !== otp) {
      return { success: false, error: "Falscher Bestätigungscode." };
    }

    if (!prefs.newEmailOtpExpires || Date.now() > prefs.newEmailOtpExpires) {
      return { success: false, error: "Der Code ist abgelaufen." };
    }
    
    if (prefs.pendingNewEmail !== email) {
      return { success: false, error: "Email stimmt nicht überein." };
    }

    // 1. Update the Email and set it as verified
    await users.updateEmail(userId, email);
    await users.updateEmailVerification(userId, true);

    // 2. Clear prefs
    delete prefs.changeEmailToken;
    delete prefs.changeEmailTokenExpires;
    delete prefs.newEmailOtp;
    delete prefs.newEmailOtpExpires;
    delete prefs.pendingNewEmail;
    await users.updatePrefs(userId, prefs);

    // 3. Authenticate User (log them in)
    const customToken = await users.createToken(userId);
    const sessionClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
    const sessionAccount = new Account(sessionClient);
    const session = await sessionAccount.createSession(userId, customToken.secret);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.secret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: new Date(session.expire),
      path: "/",
    });

    return { success: true };
  } catch (error: any) {
    console.error("Email change confirm OTP failed:", error);
    return { success: false, error: error?.message || "Fehler beim Bestätigen der Email-Adresse." };
  }
}

export async function confirmAccountDeletionAction(
  userId: string,
  token: string
) {
  try {
    const { client } = await createAdminClient();
    const functions = new Functions(client);

    const result = await functions.createExecution(
      "deleteAccount",
      JSON.stringify({
        action: "confirm",
        userId,
        token
      }),
      false, // async
      "/", // path
      ExecutionMethod.POST // method
    );

    const response = JSON.parse(result.responseBody);
    if (!response.success) {
      return { success: false, error: response.error || "Failed to confirm deletion" };
    }

    const { signOut } = await import("@/lib/appwrite/auth");
    await signOut();

    return { success: true };
  } catch (error: any) {
    console.error("Account deletion confirm failed:", error);
    return { success: false, error: error.message || "Failed to confirm deletion" };
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
