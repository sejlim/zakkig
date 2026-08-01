import { Client, Users, Databases, Messaging, Storage, Query, ID } from 'node-appwrite';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY || req.headers['x-appwrite-key'];
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID_WEBAPP || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID_WEBSITE || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!endpoint) throw new Error("Missing APPWRITE_FUNCTION_ENDPOINT or NEXT_PUBLIC_APPWRITE_ENDPOINT");
  if (!projectId) throw new Error("Missing APPWRITE_FUNCTION_PROJECT_ID or NEXT_PUBLIC_APPWRITE_PROJECT_ID");
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
  const storage = new Storage(client);

  const orgCollectionId = 'organizations';
  const bucketId = 'menu-images';

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

      const deleteLink = `${appUrl}/delete-account?userId=${userId}&token=${token}`;
      
      const subject = locale === 'de' ? 'Konto löschen bestätigen' : 'Confirm account deletion';
      
      // Read HTML template from file system
      const templateName = locale === 'de' ? 'delete-account-de.html' : 'delete-account-en.html';
      const templatePath = path.join(__dirname, 'email-templates', templateName);
      let htmlContent = fs.readFileSync(templatePath, 'utf8');
      
      // Inject variables
      htmlContent = htmlContent.replace(/{{deleteLink}}/g, deleteLink);

      const providerIdDe = process.env.APPWRITE_PROVIDER_ID_DE;
      const providerIdEn = process.env.APPWRITE_PROVIDER_ID_EN;
      if (!providerIdDe || !providerIdEn) {
        throw new Error("Missing APPWRITE_PROVIDER_ID_DE or APPWRITE_PROVIDER_ID_EN");
      }
      
      const providerId = locale === 'de' ? providerIdDe : providerIdEn;
      const userTargets = await users.listTargets(userId);
      let targetId;
      const existingEmailTarget = userTargets.targets.find(t => t.providerType === 'email');
      
      if (existingEmailTarget) {
        targetId = existingEmailTarget.$id;
        await users.updateTarget(userId, targetId, existingEmailTarget.identifier, providerId);
      } else {
        targetId = ID.unique();
        await users.createTarget(
          userId,
          targetId,
          'email',
          user.email,
          providerId,
          `Delete Account ${locale}`
        );
      }

      await messaging.createEmail(
        ID.unique(),
        subject,
        htmlContent,
        [], // topics
        [], // users
        [targetId], // targets
        [], // cc
        [], // bcc
        [], // attachments
        false, // draft
        true // html
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

      // Delete Organization Data
      try {
        const { documents } = await databases.listDocuments(databaseId, orgCollectionId, [
          Query.equal("ownerId", userId)
        ]);
        if (documents.length > 0) {
          const org = documents[0];
          const orgId = org.$id;
          
          // Delete organization logo
          if (org.logoFileId) {
            try {
              await storage.deleteFile(bucketId, org.logoFileId);
              log(`Logo ${org.logoFileId} deleted.`);
            } catch(e) {
              error(`Failed to delete logo: ${e.message}`);
            }
          }

          // Collections to clean up
          const collections = [
            'menu_items',
            'menu_categories',
            'orders',
            'orders_sessions',
            'availability_sessions'
          ];

          for (const collectionId of collections) {
            let hasMore = true;
            while (hasMore) {
              try {
                const { documents: relatedDocs } = await databases.listDocuments(databaseId, collectionId, [
                  Query.equal("organizationId", orgId),
                  Query.limit(100)
                ]);
                
                if (relatedDocs.length === 0) {
                  hasMore = false;
                  break;
                }

                for (const doc of relatedDocs) {
                  // Delete menu item image if it exists
                  if (collectionId === 'menu_items' && doc.imageId) {
                    try {
                      await storage.deleteFile(bucketId, doc.imageId);
                    } catch(e) {
                      error(`Failed to delete image ${doc.imageId}: ${e.message}`);
                    }
                  }
                  await databases.deleteDocument(databaseId, collectionId, doc.$id);
                }
                log(`Deleted ${relatedDocs.length} documents from ${collectionId}.`);
              } catch(e) {
                error(`Error fetching/deleting from ${collectionId}: ${e.message}`);
                hasMore = false;
              }
            }
          }

          // Finally, delete the organization itself
          await databases.deleteDocument(databaseId, orgCollectionId, orgId);
          log(`Organization ${orgId} deleted.`);
        }
      } catch (dbErr) {
        error(`Failed to delete organization data: ${dbErr.message}`);
      }

      // Delete User
      await users.delete(userId);
      log(`User ${userId} deleted.`);

      return res.json({ success: true, message: 'Account deleted' });
    } catch (err) {
      error(`Error confirming deletion: ${err.message}`);
      return res.json({ success: false, error: err.message }, 400);
    }
  }

  return res.json({ success: false, message: 'Invalid action' }, 400);
};
