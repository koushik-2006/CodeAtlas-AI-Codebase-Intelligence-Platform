import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface DevMailboxItem {
  id: string;
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  otp: string;
  purpose: "verification" | "password_reset";
  expiresAt: string;
  sentAt: string;
  provider: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DEV_MAILBOX_FILE = path.join(DATA_DIR, "dev-mailbox.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function maskEmailForLogs(email: string): string {
  const [local, domain] = email.trim().toLowerCase().split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  const visibleStart = local[0];
  const visibleEnd = local[local.length - 1];
  const stars = "*".repeat(Math.min(local.length - 2, 4));
  return `${visibleStart}${stars}${visibleEnd}@${domain}`;
}

export class EmailService {
  private getFromAddress(): string {
    return (
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      "CodeAtlas <no-reply@codeatlas.dev>"
    );
  }

  /**
   * Dispatches an email using the best configured provider:
   * 1. Resend API (if RESEND_API_KEY is present)
   * 2. SendGrid API (if SENDGRID_API_KEY is present)
   * 3. SMTP Transport (if SMTP_HOST is present)
   * 4. Development Sandbox (if local dev / test and no provider configured)
   * 5. Honest failure if in production with no configured provider
   */
  async sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
    otp?: string;
    purpose?: "verification" | "password_reset";
    expiresAt?: number;
  }): Promise<EmailSendResult> {
    const from = this.getFromAddress();
    const to = options.to.trim();
    const maskedTo = maskEmailForLogs(to);

    // 1. Resend REST API
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [to],
            subject: options.subject,
            text: options.text,
            html: options.html,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.id) {
          console.log(`[EmailService] Dispatched email to ${maskedTo} via Resend (id: ${data.id})`);
          return { success: true, messageId: data.id, provider: "resend" };
        }

        const errMsg = data.message || `Resend HTTP ${res.status}`;
        console.error(`[EmailService] Resend delivery error for ${maskedTo}: ${errMsg}`);
        return { success: false, error: `Email delivery failed: ${errMsg}`, provider: "resend" };
      } catch (err: any) {
        console.error(`[EmailService] Resend connection error for ${maskedTo}:`, err?.message);
        return { success: false, error: `Resend connection error: ${err?.message || "Unknown error"}`, provider: "resend" };
      }
    }

    // 2. SendGrid REST API
    if (process.env.SENDGRID_API_KEY) {
      try {
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.SENDGRID_API_KEY.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: from.includes("<") ? from.split("<")[1].replace(">", "").trim() : from },
            subject: options.subject,
            content: [
              { type: "text/plain", value: options.text },
              { type: "text/html", value: options.html },
            ],
          }),
        });

        if (res.ok || res.status === 202) {
          console.log(`[EmailService] Dispatched email to ${maskedTo} via SendGrid`);
          return { success: true, messageId: `sg-${Date.now()}`, provider: "sendgrid" };
        }

        const data = await res.json().catch(() => ({}));
        const errMsg = (data.errors && data.errors[0]?.message) || `SendGrid HTTP ${res.status}`;
        console.error(`[EmailService] SendGrid delivery error for ${maskedTo}: ${errMsg}`);
        return { success: false, error: `Email delivery failed: ${errMsg}`, provider: "sendgrid" };
      } catch (err: any) {
        console.error(`[EmailService] SendGrid connection error for ${maskedTo}:`, err?.message);
        return { success: false, error: `SendGrid connection error: ${err?.message || "Unknown error"}`, provider: "sendgrid" };
      }
    }

    // 3. SMTP Transport
    if (process.env.SMTP_HOST) {
      try {
        const port = Number(process.env.SMTP_PORT || 587);
        const secure = process.env.SMTP_SECURE === "true" || port === 465;
        const user = process.env.SMTP_USER?.trim();
        const pass = process.env.SMTP_PASS?.trim();

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST.trim(),
          port,
          secure,
          auth: user && pass ? { user, pass } : undefined,
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === "production",
          },
        });

        const info = await transporter.sendMail({
          from,
          to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });

        console.log(`[EmailService] Dispatched email to ${maskedTo} via SMTP (${info.messageId})`);
        return { success: true, messageId: info.messageId, provider: "smtp" };
      } catch (err: any) {
        console.error(`[EmailService] SMTP delivery error for ${maskedTo}:`, err?.message);
        return {
          success: false,
          error: `SMTP delivery error: ${err?.message || "Failed to communicate with SMTP server"}`,
          provider: "smtp",
        };
      }
    }

    // 4. Development Sandbox Mailbox (Fallback for local testing without external credentials)
    if (process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_MAILBOX === "true") {
      const devItem: DevMailboxItem = {
        id: `mail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        to,
        from,
        subject: options.subject,
        text: options.text,
        html: options.html,
        otp: options.otp || "",
        purpose: options.purpose || "verification",
        expiresAt: options.expiresAt ? new Date(options.expiresAt).toISOString() : new Date(Date.now() + 600000).toISOString(),
        sentAt: new Date().toISOString(),
        provider: "development-sandbox",
      };

      this.saveToDevMailbox(devItem);
      console.log(
        `[EmailService] Simulated delivery to ${maskedTo} via Development Sandbox (saved to data/dev-mailbox.json).`
      );

      return {
        success: true,
        messageId: devItem.id,
        provider: "development-sandbox",
      };
    }

    // 5. Production without configured provider: Honest refusal
    console.error(
      `[EmailService] Cannot send email to ${maskedTo}: No email transport configured in production (missing SMTP_HOST or RESEND_API_KEY).`
    );
    return {
      success: false,
      error:
        "Email delivery service is not configured on this server. Please contact administrator to configure SMTP or Resend credentials.",
      provider: "none",
    };
  }

  /**
   * Sends the 6-digit email verification code with branded HTML & plain-text templates
   */
  async sendVerificationEmail(
    to: string,
    name: string,
    code: string,
    expiresAt: number
  ): Promise<EmailSendResult> {
    const safeName = name ? name.trim() : "Developer";
    const expirationMinutes = Math.max(1, Math.round((expiresAt - Date.now()) / 60000));
    const expiresFormatted = new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const subject = `${code} is your CodeAtlas verification code`;

    const text = `CodeAtlas — Verify Your Email Address

Hello ${safeName},

Thank you for creating your account on CodeAtlas — AI-Powered Codebase Intelligence Platform.

Your 6-digit email verification code is:

  ${code}

This code will expire in ${expirationMinutes} minutes (around ${expiresFormatted}).

SECURITY NOTICE:
Never share this verification code with anyone. CodeAtlas staff and automated support will NEVER ask for your code. If you did not create a CodeAtlas account, you can safely ignore this email.

— The CodeAtlas Team
https://codeatlas.dev
`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your CodeAtlas account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B1020; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B1020; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #111827; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, rgba(124, 92, 252, 0.15) 0%, rgba(34, 211, 238, 0.05) 100%); border-bottom: 1px solid #1E293B;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <div style="display: inline-block; font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                      <span style="color: #7C5CFC;">Code</span>Atlas
                    </div>
                    <div style="font-size: 11px; font-family: monospace; color: #94A3B8; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">
                      AI Codebase Intelligence Platform
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.3px;">
                Verify your email address
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                Hello <strong style="color: #F8FAFC;">${safeName}</strong>, thank you for joining CodeAtlas. Please enter the verification code below to activate your account:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background-color: #0B1020; border: 1px solid #7C5CFC; border-radius: 14px; padding: 22px 16px; box-shadow: 0 0 25px -5px rgba(124, 92, 252, 0.3);">
                    <div style="font-size: 11px; font-family: monospace; font-weight: 700; color: #7C5CFC; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                      Verification Code
                    </div>
                    <div style="font-family: 'JetBrains Mono', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #FFFFFF; text-indent: 10px;">
                      ${code}
                    </div>
                    <div style="font-size: 12px; color: #64748B; margin-top: 8px;">
                      Expires in <strong style="color: #94A3B8;">${expirationMinutes} minutes</strong> (at ${expiresFormatted})
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice Callout -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(124, 92, 252, 0.08); border-left: 3px solid #7C5CFC; border-radius: 0 8px 8px 0; margin: 24px 0 16px 0;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <div style="font-size: 12px; font-weight: 700; color: #F8FAFC; margin-bottom: 3px;">
                      Security Warning
                    </div>
                    <div style="font-size: 12px; line-height: 1.5; color: #94A3B8;">
                      Never share this 6-digit code with anyone. CodeAtlas team members will never ask for your code via chat, email, or telephone.
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.5; color: #64748B;">
                If you did not initiate this registration, no further action is required. This account request will safely expire automatically.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0B1020; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                &copy; ${new Date().getFullYear()} CodeAtlas Platform Inc. All rights reserved.
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748B;">
                Understand any codebase. Trace every connection.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return this.sendMail({
      to,
      subject,
      text,
      html,
      otp: code,
      purpose: "verification",
      expiresAt,
    });
  }

  /**
   * Sends the 6-digit password reset recovery code
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    code: string,
    expiresAt: number
  ): Promise<EmailSendResult> {
    const safeName = name ? name.trim() : "Developer";
    const expirationMinutes = Math.max(1, Math.round((expiresAt - Date.now()) / 60000));
    const expiresFormatted = new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const subject = `${code} is your CodeAtlas password recovery code`;

    const text = `CodeAtlas — Password Recovery Request

Hello ${safeName},

We received a request to reset your CodeAtlas account password. Use the following 6-digit recovery code to complete the reset:

  ${code}

This recovery code will expire in ${expirationMinutes} minutes (around ${expiresFormatted}).

SECURITY NOTICE:
If you did not request a password reset, please ignore this email or review your account security immediately. Never share this code with anyone.

— The CodeAtlas Team
https://codeatlas.dev
`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your CodeAtlas password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B1020; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B1020; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #111827; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, rgba(124, 92, 252, 0.15) 0%, rgba(34, 211, 238, 0.05) 100%); border-bottom: 1px solid #1E293B;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <div style="display: inline-block; font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                      <span style="color: #7C5CFC;">Code</span>Atlas
                    </div>
                    <div style="font-size: 11px; font-family: monospace; color: #94A3B8; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">
                      Password Recovery
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.3px;">
                Reset your password
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                Hello <strong style="color: #F8FAFC;">${safeName}</strong>, we received a request to reset your password. Use the code below to choose a new password:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background-color: #0B1020; border: 1px solid #7C5CFC; border-radius: 14px; padding: 22px 16px; box-shadow: 0 0 25px -5px rgba(124, 92, 252, 0.3);">
                    <div style="font-size: 11px; font-family: monospace; font-weight: 700; color: #7C5CFC; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                      Password Recovery Code
                    </div>
                    <div style="font-family: 'JetBrains Mono', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #FFFFFF; text-indent: 10px;">
                      ${code}
                    </div>
                    <div style="font-size: 12px; color: #64748B; margin-top: 8px;">
                      Expires in <strong style="color: #94A3B8;">${expirationMinutes} minutes</strong> (at ${expiresFormatted})
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice Callout -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: rgba(239, 68, 68, 0.08); border-left: 3px solid #EF4444; border-radius: 0 8px 8px 0; margin: 24px 0 16px 0;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <div style="font-size: 12px; font-weight: 700; color: #F8FAFC; margin-bottom: 3px;">
                      Important Security Notice
                    </div>
                    <div style="font-size: 12px; line-height: 1.5; color: #94A3B8;">
                      If you did not request this password reset, please ensure your account credentials are safe. Do not forward this email to anyone.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0B1020; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                &copy; ${new Date().getFullYear()} CodeAtlas Platform Inc. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return this.sendMail({
      to,
      subject,
      text,
      html,
      otp: code,
      purpose: "password_reset",
      expiresAt,
    });
  }

  /**
   * Reads development mailbox items from disk (development / testing only)
   */
  getDevMailbox(): DevMailboxItem[] {
    ensureDataDir();
    if (!fs.existsSync(DEV_MAILBOX_FILE)) return [];
    try {
      const raw = fs.readFileSync(DEV_MAILBOX_FILE, "utf-8");
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Appends an item to the dev mailbox file
   */
  private saveToDevMailbox(item: DevMailboxItem) {
    ensureDataDir();
    const list = this.getDevMailbox();
    list.unshift(item);
    // Keep max 50 items
    const truncated = list.slice(0, 50);
    try {
      fs.writeFileSync(DEV_MAILBOX_FILE, JSON.stringify(truncated, null, 2), "utf-8");
    } catch (e) {
      // Ignore disk write errors
    }
  }

  /**
   * Clears the development mailbox (for testing cleanup)
   */
  clearDevMailbox() {
    ensureDataDir();
    try {
      fs.writeFileSync(DEV_MAILBOX_FILE, "[]", "utf-8");
    } catch {}
  }
}

export const emailService = new EmailService();
