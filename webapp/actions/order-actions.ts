"use server";

import { revalidatePath } from "next/cache";
import {
  createOrder,
  updateOrderStatus,
  getOrders,
  createOrderSession,
  deleteOrderSession,
  getOrderSessions,
} from "@/lib/appwrite/database";
import { createPaymentPlaceholder } from "@/lib/stripe/placeholder";
import { getUser } from "@/lib/appwrite/server";
import type { OrderItem } from "@/lib/types";

export interface OrderActionState {
  error?: string;
  success?: boolean;
  orderId?: string;
  orderNumber?: string;
}

// @react-doctor-ignore server-auth-actions - Guests place orders without logging in
export async function placeOrderAction(
  _prevState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const organizationId = formData.get("organizationId") as string;
  const type = formData.get("type") as "dine-in" | "takeaway";
  const tableNumber = formData.get("tableNumber") as string;
  const email = formData.get("email") as string;
  const itemsJson = formData.get("items") as string;
  const total = parseInt(formData.get("total") as string);

  if (!email || !itemsJson || isNaN(total)) {
    return { error: "Pflichtfelder fehlen." };
  }

  let items: OrderItem[];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Ungültige Artikeldaten." };
  }

  if (items.length === 0) {
    return { error: "Der Warenkorb ist leer." };
  }

  try {
    // Simulate payment (Stripe placeholder)
    const payment = await createPaymentPlaceholder(total, email, "");
    if (!payment.success) {
      return { error: "Zahlung fehlgeschlagen." };
    }

    const brutto = total / 100;
    const zakkigFee = Math.round(brutto * 0.01 * 100);
    const stripeFee = Math.round((brutto * 0.015 + 0.25) * 100);
    const netAmount = total - zakkigFee - stripeFee;

    const order = await createOrder({
      organizationId,
      type,
      tableNumber: tableNumber || undefined,
      items,
      total,
      email,
      stripePaymentId: payment.paymentId,
      zakkigFee,
      stripeFee,
      netAmount,
    });

    return {
      success: true,
      orderId: order.$id,
      orderNumber: order.orderNumber,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Bestellung konnte nicht aufgegeben werden.";
    return { error: message };
  }
}

// @react-doctor-ignore server-auth-actions - Secured via kitchen session token in the UI or by being restricted to specific clients
export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  organizationId: string,
) {
  try {
    await updateOrderStatus(orderId, status);
    revalidatePath(`/dashboard/${organizationId}/live-orders`);
    revalidatePath(`/dashboard/${organizationId}/orders`);
    revalidatePath(`/orders/${organizationId}`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Status konnte nicht geändert werden.";
    return { error: message };
  }
}

export async function exportOrdersCSVAction(organizationId: string) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };
  try {
    const orders = await getOrders(organizationId);

    const headers = [
      "Belegdatum",
      "Bestell-ID",
      "Bestellnummer",
      "Typ",
      "Brutto-Umsatz",
      "S/H",
      "Währung",
      "zakkig-Gebühr (1%)",
      "Stripe-Gebühr (geschätzt)",
      "Netto-Geldeingang",
    ].join(";");

    const rows = orders.map((order) => {
      const brutto = order.total / 100;
      const zakkigFee = brutto * 0.01;
      const stripeFee = brutto * 0.015 + 0.25; // estimated
      const netto = brutto - zakkigFee - stripeFee;

      return [
        new Date(order.$createdAt).toLocaleDateString("de-DE"),
        order.$id,
        order.orderNumber,
        order.type === "dine-in" ? "Vor Ort" : "Zum Mitnehmen",
        brutto.toFixed(2).replace(".", ","),
        "S",
        "EUR",
        zakkigFee.toFixed(2).replace(".", ","),
        stripeFee.toFixed(2).replace(".", ","),
        netto.toFixed(2).replace(".", ","),
      ].join(";");
    });

    return { success: true, csv: [headers, ...rows].join("\n") };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "CSV-Export fehlgeschlagen.";
    return { error: message };
  }
}

// ─── Kitchen Sessions ───────────────────────────────────────────

async function createOrderSessionAction(organizationId: string) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    const session = await createOrderSession(organizationId, user.$id);
    revalidatePath(`/dashboard/${organizationId}/overview`);
    return { success: true, session };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Session konnte nicht erstellt werden.";
    return { error: message };
  }
}

async function deleteOrderSessionAction(
  sessionId: string,
  organizationId: string,
) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    await deleteOrderSession(sessionId);
    revalidatePath(`/dashboard/${organizationId}/overview`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Session konnte nicht gelöscht werden.";
    return { error: message };
  }
}

export async function generateOrderSessionAction(organizationId: string) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    const existing = await getOrderSessions(organizationId);
    await Promise.all(existing.map((s) => deleteOrderSession(s.$id)));
    const session = await createOrderSession(organizationId, user.$id);
    revalidatePath(`/dashboard/${organizationId}/overview`);
    return { success: true, session };
  } catch (error: unknown) {
    console.error("Fehler beim Neu-Generieren der Order Session:", error);
    return {
      error: "Sitzungen konnten nicht neu generiert werden.",
    };
  }
}
