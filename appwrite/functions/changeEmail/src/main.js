import { Client, Users, Messaging, ID } from 'node-appwrite';
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!endpoint) throw new Error("Missing APPWRITE_FUNCTION_ENDPOINT or NEXT_PUBLIC_APPWRITE_ENDPOINT");
  if (!projectId) throw new Error("Missing APPWRITE_FUNCTION_PROJECT_ID or NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  if (!apiKey) throw new Error("Missing API Key");
  if (!appUrl) throw new Error("Missing NEXT_PUBLIC_APP_URL");

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const users = new Users(client);
  const messaging = new Messaging(client);

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
          appUrl: body.appUrl,
          newEmail: body.newEmail
        };
      } catch (e) {
        return {};
      }
    }
    return {};
  };

  const params = getAction();
  log(`Action received: ${params.action}`);

  const getProviderId = (locale) => {
    const providerIdDe = process.env.APPWRITE_PROVIDER_ID_DE;
    const providerIdEn = process.env.APPWRITE_PROVIDER_ID_EN;
    if (!providerIdDe || !providerIdEn) {
      throw new Error("Missing APPWRITE_PROVIDER_ID_DE or APPWRITE_PROVIDER_ID_EN");
    }
    return locale === 'de' ? providerIdDe : providerIdEn;
  };

  if (params.action === 'request') {
    try {
      const { userId, locale, appUrl } = params;
      if (!userId) throw new Error('Missing userId');

      const user = await users.get(userId);
      const token = crypto.randomUUID();
      const expires = Date.now() + 15 * 60 * 1000; // 15 mins

      const prefs = user.prefs || {};
      prefs.changeEmailToken = token;
      prefs.changeEmailTokenExpires = expires;
      // Clear any pending email states
      delete prefs.pendingNewEmail;
      delete prefs.newEmailOtp;
      delete prefs.newEmailOtpExpires;
      await users.updatePrefs(userId, prefs);

      const changeLink = `${appUrl}/change-email/confirm?userId=${userId}&token=${token}`;
      
      const subject = locale === 'de' ? 'Email-Adresse ändern bestätigen' : 'Confirm email change';
      
      const templateName = locale === 'de' ? 'change-email-de.html' : 'change-email-en.html';
      const templatePath = path.join(__dirname, 'email-templates', templateName);
      let htmlContent = fs.readFileSync(templatePath, 'utf8');
      
      htmlContent = htmlContent.replace(/{{changeLink}}/g, changeLink);

      const providerId = getProviderId(locale);
      const userTargets = await users.listTargets(userId);
      let targetId;
      const existingEmailTarget = userTargets.targets.find(t => t.providerType === 'email');
      
      if (existingEmailTarget) {
        targetId = existingEmailTarget.$id;
        await users.updateTarget(userId, targetId, existingEmailTarget.identifier, providerId);
      } else {
        targetId = ID.unique();
        await users.createTarget(userId, targetId, 'email', user.email, providerId, `Email Change ${locale}`);
      }

      await messaging.createEmail(
        ID.unique(),
        subject,
        htmlContent,
        [], [], [targetId], [], [], [], false, true
      );

      return res.json({ success: true, message: 'Change requested and email sent' });
    } catch (err) {
      error(`Error requesting email change: ${err.message}`);
      return res.json({ success: false, error: err.message }, 500);
    }
  }

  if (params.action === 'sendOtp') {
    try {
      const { userId, token, newEmail, locale } = params;
      if (!userId || !token || !newEmail) throw new Error('Missing userId, token, or newEmail');

      const user = await users.get(userId);
      const prefs = user.prefs || {};

      if (!prefs.changeEmailToken || prefs.changeEmailToken !== token) {
        throw new Error('Invalid token');
      }
      if (!prefs.changeEmailTokenExpires || Date.now() > prefs.changeEmailTokenExpires) {
        throw new Error('Token expired');
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
      const otpExpires = Date.now() + 15 * 60 * 1000;

      prefs.pendingNewEmail = newEmail;
      prefs.newEmailOtp = otp;
      prefs.newEmailOtpExpires = otpExpires;
      await users.updatePrefs(userId, prefs);

      const subject = locale === 'de' ? 'Anmeldecode zur Bestätigung' : 'Confirmation sign in code';
      
      const templateName = locale === 'de' ? 'otp-de.html' : 'otp-en.html';
      const templatePath = path.join(__dirname, 'email-templates', templateName);
      let htmlContent = fs.readFileSync(templatePath, 'utf8');
      
      htmlContent = htmlContent.replace(/{{otp}}/g, otp);

      const providerId = getProviderId(locale);
      
      const tempTargetId = ID.unique();
      await users.createTarget(
        userId,
        tempTargetId,
        'email',
        newEmail,
        providerId,
        'Temporary OTP Target'
      );

      await messaging.createEmail(
        ID.unique(),
        subject,
        htmlContent,
        [], // topics
        [], // users
        [tempTargetId], // targets
        [], // cc
        [], // bcc
        [], // attachments
        false, // draft
        true // html
      );

      // Clean up the temporary target to keep things neat
      try {
        await users.deleteTarget(userId, tempTargetId);
      } catch (e) {
        log(`Failed to delete temp target: ${e.message}`);
      }

      return res.json({ success: true, message: 'OTP sent' });
    } catch (err) {
      error(`Error sending OTP: ${err.message}`);
      return res.json({ success: false, error: err.message }, 400);
    }
  }

  return res.json({ success: false, message: 'Invalid action' }, 400);
};
