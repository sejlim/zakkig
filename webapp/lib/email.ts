import nodemailer from "nodemailer";

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  locale?: string;
}

export async function sendMail({
  to,
  subject,
  html,
  text,
  locale,
}: SendMailParams): Promise<{ success: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const senderEmail = process.env.EMAIL_FROM;
  const replyToEmail = process.env.EMAIL_REPLY_TO;

  if (!host || !portStr || !user || !pass || !senderEmail || !replyToEmail) {
    const missing = [
      !host && "SMTP_HOST",
      !portStr && "SMTP_PORT",
      !user && "SMTP_USER",
      !pass && "SMTP_PASS",
      !senderEmail && "EMAIL_FROM",
      !replyToEmail && "EMAIL_REPLY_TO",
    ]
      .filter(Boolean)
      .join(", ");
    const errorMsg = `Missing required SMTP environment variables: ${missing}`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  const port = Number(portStr);
  if (isNaN(port)) {
    const errorMsg = `Invalid SMTP_PORT: "${portStr}" is not a valid number`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  const isEn = locale === "en";
  const senderName = isEn ? "Selim at zakkig" : "Selim von zakkig";
  const fromHeader = `"${senderName}" <${senderEmail}>`;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: fromHeader,
      replyTo: replyToEmail,
      envelope: {
        from: user,
        to,
      },
      to,
      subject,
      html,
      text: text || subject,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send email via SMTP:", err);
    return { success: false, error: err?.message || "Failed to send email" };
  }
}

export async function sendDeleteAccountEmail({
  to,
  deleteUrl,
  locale = "de",
}: {
  to: string;
  deleteUrl: string;
  locale?: string;
}) {
  const isDe = locale !== "en";
  const subject = isDe ? "Konto löschen bestätigen" : "Confirm account deletion";
  const intro = isDe
    ? "Bitte klicke auf die folgende Schaltfläche, um dein Konto bei zakkig endgültig zu löschen. Dieser Link ist 30 Minuten gültig."
    : "Please click the button below to permanently delete your zakkig account. This link is valid for 30 minutes.";
  const btnText = isDe ? "Konto unwiderruflich löschen" : "Delete account permanently";
  const fallback = isDe
    ? "Falls die Schaltfläche nicht funktioniert, kopiere diesen Link in deinen Browser:"
    : "If the button doesn't work, copy and paste this link into your browser:";
  const ignoreHint = isDe
    ? "Falls du diese Löschung nicht angefragt hast, kannst du diese E-Mail einfach ignorieren."
    : "If you didn't request this deletion, you can safely ignore this email.";
  const footerText = isDe
    ? 'Diese E-Mail wurde automatisch von <a href="https://www.zakkig.de" style="color: #09090b; text-decoration: underline; font-weight: 600;">zakkig.de</a> gesendet.<br/>Bitte antworte nicht auf diese E-Mail.'
    : 'This email was automatically sent by <a href="https://www.zakkig.de" style="color: #09090b; text-decoration: underline; font-weight: 600;">zakkig.de</a>.<br/>Please do not reply to this email.';

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
        <a href="${deleteUrl}" target="_blank" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 16px 32px; border-radius: 12px;">${btnText}</a>
      </div>
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a; line-height: 1.6;">${fallback}</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #09090b; line-height: 1.6; word-break: break-all;">
        <a href="${deleteUrl}" style="color: #09090b; text-decoration: underline;">${deleteUrl}</a>
      </p>
      <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.6;">${ignoreHint}</p>
    </div>
    <div style="padding: 24px 40px; border-top: 1px solid #f4f4f5; background-color: #fafafa;">
      <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center;">
        ${footerText}
      </p>
    </div>
  </div>
</div>
</body>
</html>`;

  return await sendMail({
    to,
    subject,
    html,
    text: `${subject}: ${deleteUrl}`,
    locale,
  });
}

export async function sendChangeEmailLink({
  to,
  changeUrl,
  locale = "de",
}: {
  to: string;
  changeUrl: string;
  locale?: string;
}) {
  const isDe = locale !== "en";
  const subject = isDe ? "Email-Adresse ändern bestätigen" : "Confirm email change";
  const intro = isDe
    ? "Bitte klicke auf die folgende Schaltfläche, um die Änderung deiner Email-Adresse bei zakkig zu bestätigen. Dieser Link ist 30 Minuten gültig."
    : "Please click the button below to confirm the change of your zakkig email address. This link is valid for 30 minutes.";
  const btnText = isDe ? "Email-Adresse ändern" : "Change email address";
  const fallback = isDe
    ? "Falls die Schaltfläche nicht funktioniert, kopiere diesen Link in deinen Browser:"
    : "If the button doesn't work, copy and paste this link into your browser:";
  const ignoreHint = isDe
    ? "Falls du diese Änderung nicht angefragt hast, kannst du diese E-Mail einfach ignorieren."
    : "If you didn't request this change, you can safely ignore this email.";
  const footerText = isDe
    ? 'Diese E-Mail wurde automatisch von <a href="https://www.zakkig.de" style="color: #09090b; text-decoration: underline; font-weight: 600;">zakkig.de</a> gesendet.<br/>Bitte antworte nicht auf diese E-Mail.'
    : 'This email was automatically sent by <a href="https://www.zakkig.de" style="color: #09090b; text-decoration: underline; font-weight: 600;">zakkig.de</a>.<br/>Please do not reply to this email.';

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
        <a href="${changeUrl}" target="_blank" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 16px 32px; border-radius: 12px;">${btnText}</a>
      </div>
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a; line-height: 1.6;">${fallback}</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #09090b; line-height: 1.6; word-break: break-all;">
        <a href="${changeUrl}" style="color: #09090b; text-decoration: underline;">${changeUrl}</a>
      </p>
      <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.6;">${ignoreHint}</p>
    </div>
    <div style="padding: 24px 40px; border-top: 1px solid #f4f4f5; background-color: #fafafa;">
      <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center;">
        ${footerText}
      </p>
    </div>
  </div>
</div>
</body>
</html>`;

  return await sendMail({
    to,
    subject,
    html,
    text: `${subject}: ${changeUrl}`,
    locale,
  });
}

export async function sendEmailOtp({
  to,
  code,
  locale = "de",
}: {
  to: string;
  code: string;
  locale?: string;
}) {
  const isDe = locale !== "en";
  const subject = isDe ? "Dein Anmeldecode" : "Your Login Code";
  const intro = isDe
    ? "Verwende den folgenden Code, um deine Anmeldung zu bestätigen. Der Code ist 30 Minuten gültig."
    : "Use the following code to confirm your login. The code is valid for 30 minutes.";
  const hint1 = isDe
    ? "Bitte gib diesen Code in dem geöffneten Browserfenster ein, um fortzufahren. Teile diesen Code niemals mit anderen Personen."
    : "Please enter this code in the open browser window to continue. Never share this code with anyone else.";
  const hint2 = isDe
    ? "Falls du diese E-Mail nicht angefordert hast, kannst du sie einfach ignorieren."
    : "If you did not request this email, you can safely ignore it.";
  const footerText = isDe
    ? 'Diese E-Mail wurde automatisch von <a href="https://www.zakkig.de" style="color: #09090b; text-decoration: underline; font-weight: 600;">zakkig.de</a> gesendet.<br/>Bitte antworte nicht auf diese E-Mail.'
    : 'This email was automatically sent by <a href="https://www.zakkig.de" style="color: #09090b; text-decoration: underline; font-weight: 600;">zakkig.de</a>.<br/>Please do not reply to this email.';

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
      <div style="background-color: #09090b; border-radius: 16px; padding: 32px 24px; text-align: center; margin-bottom: 32px;">
        <p style="margin: 0; font-size: 48px; font-weight: 800; letter-spacing: 16px; color: #ffffff; padding-left: 16px;">${code}</p>
      </div>
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a; line-height: 1.6;">${hint1}</p>
      <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.6;">${hint2}</p>
    </div>
    <div style="padding: 24px 40px; border-top: 1px solid #f4f4f5; background-color: #fafafa;">
      <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center;">
        ${footerText}
      </p>
    </div>
  </div>
</div>
</body>
</html>`;

  return await sendMail({
    to,
    subject,
    html,
    text: `${subject}: ${code}`,
    locale,
  });
}

