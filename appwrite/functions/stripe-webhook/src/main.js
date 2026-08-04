import { Client, Databases, ID } from 'node-appwrite';
import Stripe from 'stripe';

export default async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID_WEBAPP;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpoint || !projectId || !apiKey || !databaseId || !stripeSecretKey || !stripeWebhookSecret) {
    error('Missing required server configuration.');
    return res.json({ error: 'Server configuration error' }, 500);
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    error('Missing stripe-signature header.');
    return res.json({ error: 'Missing stripe-signature header' }, 400);
  }

  const stripe = new Stripe(stripeSecretKey);
  let event;

  // 1. Verify Webhook Signature
  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
  } catch (err) {
    error(`Webhook signature verification failed: ${err.message}`);
    return res.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  log(`Webhook received event type: ${event.type}`);

  // 2. Handle payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata || {};

    try {
      const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
      const databases = new Databases(client);

      const organizationId = metadata.organizationId;
      const tableNumber = metadata.tableNumber || null;
      const type = metadata.type;
      const items = metadata.items;
      const email = metadata.email;
      const total = parseInt(metadata.total || String(paymentIntent.amount), 10);
      const currency = metadata.currency || paymentIntent.currency.toUpperCase();
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

      const zakkigFee = Math.round(total * 0.01);

      // Create Document in orders collection
      const orderDoc = await databases.createDocument(
        databaseId,
        'orders',
        ID.unique(),
        {
          organizationId,
          tableNumber: tableNumber ?? "",
          type,
          items,
          total,
          status: 'in_progress', // paid and ready for kitchen
          email,
          orderNumber,
          stripePaymentId: paymentIntent.id,
          currency,
          zakkigFee,
          stripeFee: 0, // Stripe deducts this directly from the merchant
          netAmount: total - zakkigFee
        }
      );

      log(`Order created successfully: ${orderDoc.$id} for orderNumber: ${orderNumber}`);
      return res.json({ success: true, orderId: orderDoc.$id });
    } catch (err) {
      error(`Error creating order document: ${err.message}`);
      return res.json({ error: `Database error: ${err.message}` }, 500);
    }
  }

  return res.json({ received: true });
};
