import { Client, Databases } from 'node-appwrite';
import Stripe from 'stripe';

export default async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY || req.headers['x-appwrite-key'];
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  log('env keys: ' + Object.keys(process.env).join(', '));
  if (!endpoint || !projectId || !apiKey || !databaseId || !stripeSecretKey) {
    error(`Missing config: endpoint=${!!endpoint}, projectId=${!!projectId}, apiKey=${!!apiKey}, databaseId=${!!databaseId}, stripeSecretKey=${!!stripeSecretKey}`);
    return res.json({ error: 'Server configuration error' }, 500);
  }

  // Parse request body
  let body = {};
  if (req.body) {
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      error(`Failed to parse request body: ${e.message}`);
      return res.json({ error: 'Invalid JSON body' }, 400);
    }
  }

  const { organizationId, type, tableNumber, items, total, email, currency = 'eur', stripeAccountId } = body;

  if (!organizationId || !type || typeof total !== 'number' || !email || !stripeAccountId) {
    error('Missing required fields: organizationId, type, total, email, stripeAccountId');
    return res.json({ error: 'Missing required fields' }, 400);
  }

  try {
    log(`1. Initializing Appwrite Client with endpoint: ${endpoint}, project: ${projectId}`);
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    const databases = new Databases(client);

    log(`2. Received stripeAccountId: ${stripeAccountId}`);
    
    log('3. Initializing Stripe');
    const stripe = new Stripe(stripeSecretKey);

    // Platform margin: 1% of total
    const platformMargin = Math.round(total * 0.01);

    log(`4. Preparing PaymentIntent options with platform margin: ${platformMargin}`);
    // 4. Prepare PaymentIntent options
    const paymentIntentParams = {
      amount: Math.round(total), // total in cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      application_fee_amount: platformMargin,
      metadata: {
        organizationId,
        tableNumber: tableNumber || '',
        type,
        items: typeof items === 'string' ? items : JSON.stringify(items),
        email,
        total: String(Math.round(total)),
        currency: currency.toUpperCase()
      }
    };

    // Use Direct Charge via Stripe Connect account
    const requestOptions = { stripeAccount: stripeAccountId };

    log(`5. Calling Stripe API with options: ${JSON.stringify(requestOptions)}`);
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, requestOptions);

    log(`6. PaymentIntent created: ${paymentIntent.id}`);

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    error(`Error creating PaymentIntent: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
};
