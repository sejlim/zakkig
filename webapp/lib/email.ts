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
  const isEn = locale === "en";
  const senderName = isEn ? "Selim at zakkig" : "Selim von zakkig";
  const senderEmail = process.env.EMAIL_FROM || "selim@zakkig.de";
  const fromHeader = `"${senderName}" <${senderEmail}>`;

  const host = process.env.SMTP_HOST || "mail.your-server.de";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || "selim@zakkig.de";
  const pass = process.env.SMTP_PASS || "TobiIstCool12.";

  try {
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
        <a href="${deleteUrl}" target="_blank" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 16px 32px; border-radius: 12px;">${btnText}</a>
      </div>
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a; line-height: 1.6;">Falls die Schaltfläche nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #09090b; line-height: 1.6; word-break: break-all;">
        <a href="${deleteUrl}" style="color: #09090b; text-decoration: underline;">${deleteUrl}</a>
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
  const subject = isDe ? "E-Mail-Adresse ändern bestätigen" : "Confirm email address change";
  const intro = isDe
    ? "Bitte klicke auf die folgende Schaltfläche, um deine neue E-Mail-Adresse für dein Konto bei zakkig zu bestätigen. Dieser Link ist nur für kurze Zeit gültig."
    : "Please click the button below to confirm your new email address for your zakkig account. This link is only valid for a short time.";
  const btnText = isDe ? "E-Mail-Adresse ändern" : "Change Email Address";

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
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a; line-height: 1.6;">Falls die Schaltfläche nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #09090b; line-height: 1.6; word-break: break-all;">
        <a href="${changeUrl}" style="color: #09090b; text-decoration: underline;">${changeUrl}</a>
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
  const subject = isDe ? "Dein Bestätigungscode" : "Your verification code";
  const intro = isDe
    ? "Verwende den folgenden Code, um deine neue E-Mail-Adresse zu bestätigen. Der Code ist 15 Minuten lang gültig."
    : "Use the following code to verify your new email address. This code is valid for 15 minutes.";

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
        <div style="display: inline-block; background-color: #f4f4f5; border: 1px dashed #09090b; color: #09090b; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 16px 32px; border-radius: 12px;">${code}</div>
      </div>
      <p style="margin: 0 0 8px; font-size: 14px; color: #71717a; line-height: 1.6;">Gib diesen Code in das geöffnete Formular ein, um die Änderung abzuschließen.</p>
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
