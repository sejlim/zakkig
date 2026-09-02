"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";

async function sendMail({
  to,
  subject,
  html,
  text,
  locale,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  locale?: string;
}): Promise<boolean> {
  const isEn = locale === "en";
  const senderName = isEn ? "Selim at zakkig" : "Selim von zakkig";
  const senderEmail = process.env.EMAIL_FROM || "noreply@zakkig.de";
  const fromHeader = `"${senderName}" <${senderEmail}>`;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.error("SMTP configuration missing: SMTP_HOST, SMTP_USER or SMTP_PASS not set");
    return false;
  }

  try {
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: fromHeader,
      envelope: {
        from: user,
        to,
      },
      to,
      subject,
      html,
      text: text || subject,
    });
    return true;
  } catch (err) {
    console.error("Failed to send email via SMTP:", err);
    return false;
  }
}

export const sendEmailOtp = internalAction({
  args: {
    to: v.string(),
    code: v.string(),
    locale: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (_ctx, args) => {
    const isDe = args.locale !== "en";
    const subject = isDe ? "Dein Anmeldecode" : "Your sign-in code";

    const title = isDe ? "Dein Anmeldecode" : "Your sign-in code";
    const intro = isDe
      ? "Verwende den folgenden Code, um deine Anmeldung zu bestätigen. Der Code ist nur für kurze Zeit gültig."
      : "Use the following code to confirm your sign-in. The code is only valid for a short time.";
    const hint1 = isDe
      ? "Bitte gib diesen Code in dem geöffneten Browserfenster ein, um fortzufahren. Teile diesen Code niemals mit anderen Personen."
      : "Please enter this code in the open browser window to proceed. Never share this code with anyone.";
    const hint2 = isDe
      ? "Falls du diese E-Mail nicht angefordert hast, kannst du sie einfach ignorieren."
      : "If you did not request this email, you can safely ignore it.";

    const html = `<!DOCTYPE html>
<html>
<head>
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
</style>
</head>
<body style="margin: 0; padding: 0;">
<div style="font-family: 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 16px;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
    <div style="padding: 32px 40px 24px; border-bottom: 1px solid #f4f4f5;">
      <a href="https://www.zakkig.de" style="display: inline-block; text-decoration: none;">
        <img src="https://www.zakkig.de/full.svg" alt="zakkig" style="height: 56px; width: auto; display: block;" />
      </a>
    </div>
    <div style="padding: 40px;">
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #09090b; letter-spacing: -0.5px;">${title}</h1>
      <p style="margin: 0 0 32px; font-size: 15px; color: #71717a; line-height: 1.6;">${intro}</p>
      <div style="background-color: #09090b; border-radius: 16px; padding: 32px 24px; text-align: center; margin-bottom: 32px;">
        <p style="margin: 0; font-size: 48px; font-weight: 800; letter-spacing: 16px; color: #ffffff; padding-left: 16px;">${args.code}</p>
      </div>
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a; line-height: 1.6;">${hint1}</p>
      <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.6;">${hint2}</p>
    </div>
    <div style="padding: 24px 40px; border-top: 1px solid #f4f4f5; background-color: #fafafa;">
      <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center;">
        Diese E-Mail wurde automatisch von <a href="https://www.zakkig.de" style="color: #09090b; text-decoration: underline; font-weight: 600;">zakkig.de</a> gesendet.<br/>Bitte antworte nicht auf diese E-Mail.
      </p>
    </div>
  </div>
</div>
</body>
</html>`;

    return await sendMail({
      to: args.to,
      subject,
      html,
      text: `${subject}: ${args.code}`,
      locale: args.locale,
    });
  },
});

export const sendPasswordResetEmail = internalAction({
  args: {
    to: v.string(),
    resetUrl: v.string(),
    userName: v.optional(v.string()),
    locale: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (_ctx, args) => {
    const isDe = args.locale !== "en";
    const subject = isDe ? "Passwort zurücksetzen" : "Reset your password";
    const greeting = isDe
      ? `Hallo${args.userName ? " " + args.userName : ""}, klicke auf die folgende Schaltfläche, um dein Passwort vom Konto zurückzusetzen.`
      : `Hello${args.userName ? " " + args.userName : ""}, click the button below to reset your account password.`;
    const btnText = isDe ? "Passwort zurücksetzen" : "Reset Password";

    const html = `<!DOCTYPE html>
<html>
<head>
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
</style>
</head>
<body style="margin: 0; padding: 0;">
<div style="font-family: 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 16px;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
    <div style="padding: 32px 40px 24px; border-bottom: 1px solid #f4f4f5;">
      <a href="https://www.zakkig.de" style="display: inline-block; text-decoration: none;">
        <img src="https://www.zakkig.de/full.svg" alt="zakkig" style="height: 56px; width: auto; display: block;" />
      </a>
    </div>
    <div style="padding: 40px;">
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #09090b; letter-spacing: -0.5px;">${subject}</h1>
      <p style="margin: 0 0 32px; font-size: 15px; color: #71717a; line-height: 1.6;">${greeting}</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${args.resetUrl}" target="_blank" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 16px 32px; border-radius: 12px;">${btnText}</a>
      </div>
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a; line-height: 1.6;">Falls die Schaltfläche nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #09090b; line-height: 1.6; word-break: break-all;">
        <a href="${args.resetUrl}" style="color: #09090b; text-decoration: underline;">${args.resetUrl}</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`;

    return await sendMail({
      to: args.to,
      subject,
      html,
      text: `${subject}: ${args.resetUrl}`,
      locale: args.locale,
    });
  },
});

export const sendDeleteAccountEmail = internalAction({
  args: {
    to: v.string(),
    deleteUrl: v.string(),
    locale: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (_ctx, args) => {
    const isDe = args.locale !== "en";
    const subject = isDe ? "Konto löschen bestätigen" : "Confirm account deletion";
    const intro = isDe
      ? "Bitte klicke auf die folgende Schaltfläche, um dein Konto bei zakkig endgültig zu löschen. Dieser Link ist nur für kurze Zeit gültig."
      : "Please click the button below to permanently delete your account at zakkig. This link is only valid for a short time.";
    const btnText = isDe ? "Konto unwiderruflich löschen" : "Delete account permanently";

    const html = `<!DOCTYPE html>
<html>
<head>
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
</style>
</head>
<body style="margin: 0; padding: 0;">
<div style="font-family: 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 16px;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
    <div style="padding: 32px 40px 24px; border-bottom: 1px solid #f4f4f5;">
      <a href="https://www.zakkig.de" style="display: inline-block; text-decoration: none;">
        <img src="https://www.zakkig.de/full.svg" alt="zakkig" style="height: 56px; width: auto; display: block;" />
      </a>
    </div>
    <div style="padding: 40px;">
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #09090b; letter-spacing: -0.5px;">${subject}</h1>
      <p style="margin: 0 0 32px; font-size: 15px; color: #71717a; line-height: 1.6;">${intro}</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${args.deleteUrl}" target="_blank" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 16px 32px; border-radius: 12px;">${btnText}</a>
      </div>
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a; line-height: 1.6;">Falls die Schaltfläche nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #09090b; line-height: 1.6; word-break: break-all;">
        <a href="${args.deleteUrl}" style="color: #09090b; text-decoration: underline;">${args.deleteUrl}</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`;

    return await sendMail({
      to: args.to,
      subject,
      html,
      text: `${subject}: ${args.deleteUrl}`,
      locale: args.locale,
    });
  },
});

export const sendChangeEmailLink = internalAction({
  args: {
    to: v.string(),
    changeUrl: v.string(),
    locale: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (_ctx, args) => {
    const isDe = args.locale !== "en";
    const subject = isDe ? "E-Mail-Adresse ändern bestätigen" : "Confirm email address change";
    const intro = isDe
      ? "Bitte klicke auf die folgende Schaltfläche, um deine neue E-Mail-Adresse zu bestätigen."
      : "Please click the button below to confirm your new email address.";
    const btnText = isDe ? "E-Mail-Adresse bestätigen" : "Confirm Email Address";

    const html = `<!DOCTYPE html>
<html>
<head>
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
</style>
</head>
<body style="margin: 0; padding: 0;">
<div style="font-family: 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 16px;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
    <div style="padding: 32px 40px 24px; border-bottom: 1px solid #f4f4f5;">
      <a href="https://www.zakkig.de" style="display: inline-block; text-decoration: none;">
        <img src="https://www.zakkig.de/full.svg" alt="zakkig" style="height: 56px; width: auto; display: block;" />
      </a>
    </div>
    <div style="padding: 40px;">
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #09090b; letter-spacing: -0.5px;">${subject}</h1>
      <p style="margin: 0 0 32px; font-size: 15px; color: #71717a; line-height: 1.6;">${intro}</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${args.changeUrl}" target="_blank" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 16px 32px; border-radius: 12px;">${btnText}</a>
      </div>
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a; line-height: 1.6;">Falls die Schaltfläche nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #09090b; line-height: 1.6; word-break: break-all;">
        <a href="${args.changeUrl}" style="color: #09090b; text-decoration: underline;">${args.changeUrl}</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`;

    return await sendMail({
      to: args.to,
      subject,
      html,
      text: `${subject}: ${args.changeUrl}`,
      locale: args.locale,
    });
  },
});
