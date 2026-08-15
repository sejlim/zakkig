import { Client, Databases, ID, Query } from 'node-appwrite';
import Stripe from 'stripe';

export default async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpoint || !projectId || !apiKey || !databaseId || !stripeSecretKey || !stripeWebhookSecret) {
    error('Missing required server configuration.');
    return res.json({ error: 'Server configuration error' }, 500);
  }

  const stripe = new Stripe(stripeSecretKey);

  let event;
  try {
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(
      req.bodyRaw || req.body,
      signature,
      stripeWebhookSecret
    );
  } catch (err) {
    error(`Webhook signature verification failed: ${err.message}`);
    return res.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  log(`Received event: ${event.type}`);

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

      // Generate rolling 3-digit order number (001-999)
      let nextNum = 1;
      try {
        const lastOrders = await databases.listDocuments(
          databaseId,
          'orders',
          [
            Query.equal('organizationId', organizationId),
            Query.orderDesc('$createdAt'),
            Query.limit(1)
          ]
        );
        if (lastOrders.documents.length > 0) {
          const lastNum = parseInt(lastOrders.documents[0].orderNumber, 10);
          if (!isNaN(lastNum) && lastNum >= 1) {
            nextNum = (lastNum % 999) + 1;
          }
        }
      } catch (e) {
        log(`Failed to fetch last order number, using 001: ${e.message}`);
      }
      const orderNumber = String(nextNum).padStart(3, '0');

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
