"use server";

import { revalidatePath } from "next/cache";
import {
  createOrder,
  updateOrderStatus,
  getOrders,
  createOrderSession,
  deleteOrderSession,
  getOrderSessions,
} from "@/lib/convex/database";
import { createPaymentPlaceholder } from "@/lib/stripe/placeholder";
import { getUser, requireOwner, requireKitchenOrOwner } from "@/lib/convex/auth";
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
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const itemsJson = formData.get("items") as string;
  const total = parseInt(formData.get("total") as string, 10);

  if (!organizationId || !email || !itemsJson || isNaN(total) || total <= 0) {
    return { error: "Pflichtfelder fehlen oder sind ungültig." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
    return { error: "Ungültige E-Mail-Adresse." };
  }

  if (tableNumber && tableNumber.length > 20) {
    return { error: "Tischnummer darf maximal 20 Zeichen lang sein." };
  }

  let items: OrderItem[];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Ungültige Artikeldaten." };
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return { error: "Der Warenkorb muss zwischen 1 und 100 Artikel enthalten." };
  }

  // Verify item prices and quantities
  let calculatedTotal = 0;
  for (const item of items) {
    if (!item.quantity || item.quantity <= 0 || item.quantity > 50) {
      return { error: "Ungültige Artikelanzahl." };
    }
    if (typeof item.price !== "number" || item.price < 0) {
      return { error: "Ungültiger Artikelpreis." };
    }
    calculatedTotal += item.price * item.quantity;
  }

  if (Math.round(calculatedTotal) !== Math.round(total)) {
    return { error: "Gesamtbetrag stimmt nicht mit den Artikeln überein." };
  }

  try {
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

export async function updateOrderStatusAction(
  orderId: string,
  status: "in_progress" | "completed" | "cancelled",
  organizationId: string,
) {
  try {
    await requireKitchenOrOwner(organizationId);

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
  try {
    await requireOwner(organizationId);

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
        new Date(order.$createdAt || order._creationTime).toLocaleDateString("de-DE"),
        order.$id || order._id,
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

export async function generateOrderSessionAction(organizationId: string) {
  try {
    const { user } = await requireOwner(organizationId);

    const existing = await getOrderSessions(organizationId);
    await Promise.all(existing.map((s) => deleteOrderSession(s.$id)));
    const session = await createOrderSession(organizationId, user.$id || user._id);
    revalidatePath(`/dashboard/${organizationId}/overview`);
    return { success: true, session: structuredClone(session) };
  } catch (error: unknown) {
    console.error("Fehler beim Neu-Generieren der Order Session:", error);
    return {
      error: "Sitzungen konnten nicht neu generiert werden.",
    };
  }
}
