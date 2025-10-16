import type { Transporter } from "nodemailer";
 
export type MailOptions = {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
};
 
function guessSmtpHost(email: string | undefined) {
  if (!email || !email.includes("@")) return undefined;
  const domain = email.split("@")[1];
  if (!domain) return undefined;
  return `smtp.${domain}`; // e.g. smtp.hariteq.com
}
 
export async function sendMail(opts: MailOptions): Promise<{ ok: boolean; error?: string }> {
  try {
    const nodemailer = await import("nodemailer").catch(() => null as any);
    if (!nodemailer) {
      return { ok: false, error: "nodemailer not installed" };
    }
 
    const user = process.env.MAIL_USERNAME || process.env.SMTP_USER;
    const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
    const host = process.env.MAIL_HOST || guessSmtpHost(user);
    const port = Number(process.env.MAIL_PORT || 465);
    const enc = String(process.env.MAIL_ENCRYPTION || '').toLowerCase(); // '', 'ssl', 'tls', 'starttls'
 
    if (!user || !pass || !host) {
      return { ok: false, error: "mailer env not configured" };
    }
 
    const secure = port === 465 || enc === 'ssl' || enc === 'tls';
    const requireTLS = enc === 'starttls';
 
    const transporter: Transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS,
      auth: { user, pass },
    });
 
    const fromAddr = process.env.MAIL_FROM_ADDRESS || user;
    const fromName = process.env.MAIL_FROM_NAME;
    const from = opts.from || (fromName ? `${fromName} <${fromAddr}>` : fromAddr);
    const info = await transporter.sendMail({
      from,
      to: opts.to.join(","),
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      replyTo: opts.replyTo,
    });
 
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "send error" };
  }
}