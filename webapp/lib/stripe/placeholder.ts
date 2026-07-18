/**
 * Stripe Placeholder Module
 *
 * This module simulates Stripe payment operations.
 * Replace with actual Stripe Connect integration when ready.
 */

export interface PaymentResult {
  success: boolean
  paymentId: string
  error?: string
}

/**
 * Simulate creating a payment intent.
 * In production, this would call Stripe's API with the connected account.
 */
export async function createPaymentPlaceholder(
  _amount: number,
  _email: string,
  _organizationStripeAccountId: string,
): Promise<PaymentResult> {
  // Simulate a short processing delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    success: true,
    paymentId: `pi_placeholder_${Date.now().toString(36)}`,
  }
}

/**
 * Check if a Stripe account is connected (always false for placeholder).
 */
export function isStripeConnected(_stripeAccountId: string): boolean {
  return false
}
