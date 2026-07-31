import { Client, Users, Databases, Messaging, ID } from 'node-appwrite';
import crypto from 'crypto';

export default async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT;
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const apiKey = req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY;
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!endpoint) throw new Error("Missing APPWRITE_FUNCTION_ENDPOINT");
  if (!projectId) throw new Error("Missing APPWRITE_FUNCTION_PROJECT_ID");
  if (!apiKey) throw new Error("Missing API Key");
  if (!databaseId) throw new Error("Missing NEXT_PUBLIC_APPWRITE_DATABASE_ID");
  if (!appUrl) throw new Error("Missing NEXT_PUBLIC_APP_URL");

  // Initialize Appwrite Client
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const users = new Users(client);
  const databases = new Databases(client);
  const messaging = new Messaging(client);

  const orgCollectionId = 'organizations';

  // Helper to parse payload/query
  const getAction = () => {
    if (req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers['host'] || 'localhost'}`);
      return {
        action: url.searchParams.get('action'),
        userId: url.searchParams.get('userId'),
        token: url.searchParams.get('token'),
        locale: url.searchParams.get('locale') || 'de'
      };
    }
    
    if (req.body) {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        return {
          action: body.action,
          userId: body.userId,
          token: body.token,
          locale: body.locale || 'de',
          appUrl: body.appUrl
        };
      } catch (e) {
        return {};
      }
    }
    return {};
  };

  const params = getAction();
  log(`Action received: ${params.action}`);

  if (params.action === 'request') {
    try {
      const { userId, locale, appUrl } = params;
      if (!userId) throw new Error('Missing userId');

      const user = await users.get(userId);
      const token = crypto.randomUUID();
      const expires = Date.now() + 15 * 60 * 1000;

      // Update user preferences
      const prefs = user.prefs || {};
      prefs.deleteToken = token;
      prefs.deleteTokenExpires = expires;
      await users.updatePrefs(userId, prefs);

      // We need the function's own execution URL to put in the email!
      // In Appwrite 1.4+, you can execute a function via GET using its domain.
      // Since we don't dynamically know the domain here easily unless configured, 
      // we can construct the API execution URL, OR require a domain to be passed.
      // But Appwrite Functions can't easily be triggered by GET without a custom domain.
      // So we will pass the Next.js app URL and use a Next.js route? 
      // The user strictly said "keine api routen in unserer next js app".
      // Let's assume the user has bound a domain to the function, or we use the project endpoint.
      // Actually, if we use the Appwrite Function Domain, it usually looks like:
      // https://<FUNCTION_ID>.<PROJECT_ID>.appwrite.global/
      // Wait, let's use the req.headers['host'] if available, or fallback.
      if (!req.headers['host']) {
        throw new Error("Missing host header to construct delete link");
      }
      const host = `https://${req.headers['host']}`;
      const deleteLink = `${host}/?action=confirm&userId=${userId}&token=${token}`;
      
      const subject = locale === 'de' ? 'Konto löschen bestätigen' : 'Confirm account deletion';
      const content = locale === 'de'
        ? `Hallo,\n\nbitte klicke auf den folgenden Link, um dein Konto bei zakkig endgültig zu löschen. Dieser Link ist 15 Minuten gültig.\n\n${deleteLink}\n\nFalls du diese Löschung nicht angefragt hast, ignoriere diese E-Mail.`
        : `Hello,\n\nplease click the following link to permanently delete your zakkig account. This link is valid for 15 minutes.\n\n${deleteLink}\n\nIf you did not request this deletion, please ignore this email.`;

      // Use Messaging to send email
      // We assume there is a topic or we just send directly to the user
      await messaging.createEmail(
        ID.unique(),
        subject,
        content,
        [], // topics
        [userId], // users
        [], // targets
        [], // cc
        [], // bcc
        [], // attachments
        false, // draft
        content // html
      );

      return res.json({ success: true, message: 'Deletion requested and email sent' });
    } catch (err) {
      error(`Error requesting deletion: ${err.message}`);
      return res.json({ success: false, error: err.message }, 500);
    }
  }

  if (params.action === 'confirm') {
    try {
      const { userId, token } = params;
      if (!userId || !token) throw new Error('Missing userId or token');

      const user = await users.get(userId);
      const prefs = user.prefs || {};

      if (!prefs.deleteToken || prefs.deleteToken !== token) {
        throw new Error('Invalid token');
      }
      if (!prefs.deleteTokenExpires || Date.now() > prefs.deleteTokenExpires) {
        throw new Error('Token expired');
      }

      // Delete Organization Document
      try {
        const { documents } = await databases.listDocuments(databaseId, orgCollectionId, [
          `equal("ownerId", "${userId}")`
        ]);
        if (documents.length > 0) {
          await databases.deleteDocument(databaseId, orgCollectionId, documents[0].$id);
          log(`Organization ${documents[0].$id} deleted.`);
        }
      } catch (dbErr) {
        error(`Failed to delete organization: ${dbErr.message}`);
      }

      // Delete User
      await users.delete(userId);
      log(`User ${userId} deleted.`);

      // Redirect to the webapp (assuming localhost:3001 or domain)
      // Since it's an HTTP GET from an email, we redirect them to the sign-in page
      return res.redirect(`${appUrl}/sign-in?deleted=true`, 302);
    } catch (err) {
      error(`Error confirming deletion: ${err.message}`);
      // Redirect to an error page or just send text
      return res.redirect(`${appUrl}/sign-in?error=Invalid_or_expired_token`, 302);
    }
  }

  return res.json({ success: false, message: 'Invalid action' }, 400);
};
