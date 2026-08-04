"use server";

import { redirect } from "next/navigation";
import { isDisposableEmail } from "@/lib/disposable-domains";
import {
  verifyCredentials,
  signUp,
  signOut,
  sendEmailOtp,
  verifyOtp,
  resetPassword,
  confirmPasswordReset,
} from "@/lib/appwrite/auth";
import {
  createOrganization,
  getOrganizationByOwner,
  createAvailabilitySession,
  createOrderSession,
} from "@/lib/appwrite/database";
import { getUser, createAdminClient } from "@/lib/appwrite/server";
import { cookies } from "next/headers";
import { Query } from "node-appwrite";
export interface AuthActionState {
  error?: string;
  success?: boolean;
  requiresOtp?: boolean;
  userId?: string;
  email?: string;
  pendingOrgData?: { restaurantName: string; name: string };
}

export async function resendOtpAction(userId: string, email: string) {
  try {
    await sendEmailOtp(userId, email);
    return { success: true };
  } catch (error) {
    return { error: "authError" };
  }
}

export async function checkEmailExistsAction(
  email: string,
): Promise<{ exists: boolean }> {
  try {
    const { users } = createAdminClient();
    const response = await users.list([Query.equal("email", [email])]);
    return { exists: response.total > 0 };
  } catch (error) {
    console.error("Failed to check email:", error);
    return { exists: false };
  }
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "missingFields" };
  }

  try {
    const userId = await verifyCredentials(email, password);
    await sendEmailOtp(userId, email);
    return { requiresOtp: true, userId, email };
  } catch (error: any) {
    return { error: "authError" };
  }
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const name = formData.get("name") as string;
  const restaurantName = formData.get("restaurantName") as string;

  if (!email || !password || !restaurantName) {
    return { error: "missingFields" };
  }

  if (isDisposableEmail(email)) {
    return { error: "disposableEmail" };
  }

  if (password !== confirmPassword) {
    return { error: "passwordMismatch" };
  }

  const hasLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumberOrSpecial =
    /[0-9]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasLength || !hasUpperCase || !hasLowerCase || !hasNumberOrSpecial) {
    return { error: "passwordInvalid" };
  }

  try {
    const user = await signUp(email, password, name);
    await sendEmailOtp(user.$id, email);
    return {
      requiresOtp: true,
      userId: user.$id,
      email,
      pendingOrgData: { restaurantName, name },
    };
  } catch (error: any) {
    if (error?.code === 409) {
      return { error: "authErrorUserExists" };
    }
    return { error: "signUpFailed" };
  }
}

export async function verifyOtpAction(
  userId: string,
  otp: string,
  pendingOrgData?: { restaurantName: string; name: string },
): Promise<{ error?: string }> {
  if (!otp || otp.length !== 6) {
    return { error: "invalidOtpLength" };
  }

  try {
    await verifyOtp(userId, otp);

    // Mark user as email verified since they successfully verified OTP
    const { users } = createAdminClient();
    await users.updateEmailVerification(userId, true);
  } catch (error) {
    return { error: "invalidOtp" };
  }

  let orgId = "";
  try {
    if (pendingOrgData) {
      const org = await createOrganization({
        name: pendingOrgData.restaurantName || pendingOrgData.name,
        ownerId: userId,
      });
      orgId = org.$id;
      
      // Initialize default sessions to avoid SSR race conditions later
      try {
        await Promise.all([
          createAvailabilitySession(orgId, userId),
          createOrderSession(orgId, userId)
        ]);
      } catch (e) {
        console.error("Failed to create initial sessions", e);
      }
    } else {
      const org = await getOrganizationByOwner(userId);
      if (org) {
        orgId = org.$id;
      }
    }
  } catch (error) {
    console.error("Failed to create/get organization:", error);
    return { error: "databaseError" };
  }

  if (orgId) {
    redirect(`/dashboard/${orgId}/overview`);
  } else {
    redirect("/dashboard/new/overview");
  }
}

export async function signOutAction(): Promise<void> {
  const user = await getUser();
  if (user) {
    await signOut();
  }
  redirect("/sign-in");
}
export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "missingFields" };
  }

  // Check if email exists
  const check = await checkEmailExistsAction(email);
  if (!check.exists) {
    return { error: "emailNotFound" };
  }

  try {
    await resetPassword(email);
    return { success: true };
  } catch (error) {
    // Return success to avoid email enumeration if something else goes wrong
    // (though we already checked existence, it's safer for generic errors)
    return { success: true };
  }
}

export async function confirmPasswordResetAction(
  userId: string,
  secret: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "missingFields" };
  }

  if (password !== confirmPassword) {
    return { error: "passwordMismatch" };
  }

  const hasLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumberOrSpecial =
    /[0-9]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasLength || !hasUpperCase || !hasLowerCase || !hasNumberOrSpecial) {
    return { error: "passwordInvalid" };
  }

  try {
    await confirmPasswordReset(userId, secret, password);
    return { success: true };
  } catch (error) {
    return { error: "resetFailed" };
  }
}

export async function verifySessionAction() {
  const user = await getUser();
  return { isValid: !!user };
}

export async function verifyTerminalSessionAction(organizationId: string, type: "orders" | "availability") {
  const cookieStore = await cookies();
  const cookieName = type === "orders" ? `order_session_${organizationId}` : `availability_session_${organizationId}`;
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return { isValid: false };

  try {
    if (type === "orders") {
      const { getOrderSessions } = await import("@/lib/appwrite/database");
      const sessions = await getOrderSessions(organizationId);
      return { isValid: sessions.some((s) => s.token === token) };
    } else {
      const { getAvailabilitySessions } = await import("@/lib/appwrite/database");
      const sessions = await getAvailabilitySessions(organizationId);
      return { isValid: sessions.some((s) => s.token === token) };
    }
  } catch (e) {
    return { isValid: false };
  }
}
