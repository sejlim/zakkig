'use server'

import { redirect } from 'next/navigation'
import { verifyCredentials, signUp, signOut, sendEmailOtp, verifyOtp, resetPassword, confirmPasswordReset } from '@/lib/appwrite/auth'
import { createOrganization, getOrganizationByOwner } from '@/lib/appwrite/database'
import { getUser, createAdminClient } from '@/lib/appwrite/server'
export interface AuthActionState {
  error?: string
  success?: boolean
  requiresOtp?: boolean
  userId?: string
  email?: string
  pendingOrgData?: { restaurantName: string, name: string }
}

export async function resendOtpAction(userId: string, email: string) {
  try {
    await sendEmailOtp(userId, email)
    return { success: true }
  } catch (error) {
    return { error: 'authError' }
  }
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'missingFields' }
  }

  try {
    const userId = await verifyCredentials(email, password)
    await sendEmailOtp(userId, email)
    return { requiresOtp: true, userId, email }
  } catch (error: any) {
    return { error: 'authError' }
  }
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const name = formData.get('name') as string
  const restaurantName = formData.get('restaurantName') as string

  if (!email || !password || !restaurantName) {
    return { error: 'missingFields' }
  }

  if (password !== confirmPassword) {
    return { error: 'passwordMismatch' }
  }

  const hasLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumberOrSpecial = /[0-9]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (!hasLength || !hasUpperCase || !hasLowerCase || !hasNumberOrSpecial) {
    return { error: 'passwordInvalid' }
  }

  try {
    const user = await signUp(email, password, name)
    await sendEmailOtp(user.$id, email)
    return { 
      requiresOtp: true, 
      userId: user.$id, 
      email, 
      pendingOrgData: { restaurantName, name } 
    }
  } catch (error: any) {
    if (error?.code === 409) {
      return { error: 'authErrorUserExists' }
    }
    return { error: 'signUpFailed' }
  }
}

export async function verifyOtpAction(
  userId: string,
  otp: string,
  pendingOrgData?: { restaurantName: string, name: string }
): Promise<{ error?: string }> {
  if (!otp || otp.length !== 6) {
    return { error: 'invalidOtpLength' }
  }

  try {
    await verifyOtp(userId, otp)
    
    // Mark user as email verified since they successfully verified OTP
    const { users } = createAdminClient()
    await users.updateEmailVerification(userId, true)
  } catch (error) {
    return { error: 'invalidOtp' }
  }

  let orgId = '';
  try {
    if (pendingOrgData) {
      const org = await createOrganization({
        name: pendingOrgData.restaurantName || pendingOrgData.name,
        ownerId: userId,
      })
      orgId = org.$id
    } else {
      const org = await getOrganizationByOwner(userId)
      if (org) {
        orgId = org.$id
      }
    }
  } catch (error) {
    console.error("Failed to create/get organization:", error)
    return { error: 'databaseError' }
  }

  if (orgId) {
    redirect(`/dashboard/${orgId}/overview`)
  } else {
    redirect('/dashboard/new/overview')
  }
}

export async function signOutAction(): Promise<void> {
  const user = await getUser()
  if (user) {
    await signOut()
  }
  redirect('/sign-in')
}
export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'missingFields' }
  }

  try {
    await resetPassword(email)
    return { success: true }
  } catch (error) {
    // Return success to avoid email enumeration
    return { success: true }
  }
}

export async function confirmPasswordResetAction(
  userId: string,
  secret: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'missingFields' }
  }

  if (password !== confirmPassword) {
    return { error: 'passwordMismatch' }
  }

  const hasLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumberOrSpecial = /[0-9]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (!hasLength || !hasUpperCase || !hasLowerCase || !hasNumberOrSpecial) {
    return { error: 'passwordInvalid' }
  }

  try {
    await confirmPasswordReset(userId, secret, password)
    return { success: true }
  } catch (error) {
    return { error: 'resetFailed' }
  }
}
