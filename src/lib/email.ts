import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Resend's shared onboarding@resend.dev sender works without verifying a
// domain — fine for testing. Set RESEND_FROM_EMAIL once a domain is
// verified in the Resend dashboard for production sending.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Travel Agency SaaS <onboarding@resend.dev>";

export async function sendLoginOtpEmail(to: string, code: string): Promise<{ sent: boolean }> {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — email not sent. OTP for ${to}: ${code}`);
    return { sent: false };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your sign-in code: ${code}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 420px; margin: 0 auto; padding: 24px;">
          <p style="font-size: 14px; color: #475569; margin-bottom: 8px;">Your verification code is:</p>
          <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #4338ca; margin: 0 0 16px;">${code}</p>
          <p style="font-size: 13px; color: #94a3b8;">This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return { sent: false };
  }
}