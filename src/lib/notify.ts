// src/lib/notify.ts
//
// Email + SMS helpers. Drop this file into src/lib/notify.ts in your project.
// Requires: npm install resend
// Requires env vars: RESEND_API_KEY, RESEND_FROM_EMAIL, SENDPK_API_KEY, SENDPK_SENDER_ID

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// -------------------- Email --------------------

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("Resend email error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("sendEmail failed:", err);
    return { success: false, error: "Failed to send email" };
  }
}

// -------------------- SMS (SendPK) --------------------
// NOTE: Confirm the exact endpoint + param names in your SendPK dashboard/docs
// after signup — providers occasionally differ in field naming
// (e.g. "to" vs "number", "message" vs "sms"). Adjust the fetch body below
// to match what your SendPK account docs show.

const SENDPK_API_URL = "https://api.sendpk.com/api/v3/sms/send"; // confirm exact URL in SendPK dashboard

export async function sendSMS(params: {
  to: string; // e.g. "923001234567" (country code, no leading +)
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(SENDPK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SENDPK_API_KEY}`,
      },
      body: JSON.stringify({
        sender_id: process.env.SENDPK_SENDER_ID,
        to: params.to,
        message: params.message,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("SendPK SMS error:", data);
      return { success: false, error: data?.message || "SMS send failed" };
    }

    return { success: true };
  } catch (err) {
    console.error("sendSMS failed:", err);
    return { success: false, error: "Failed to send SMS" };
  }
}

// -------------------- Convenience wrappers --------------------

export async function sendOtpEmail(to: string, code: string) {
  return sendEmail({
    to,
    subject: "Your login verification code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verification Code</h2>
        <p>Use the code below to complete your login:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p style="color: #666; font-size: 13px;">This code expires in a few minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendOtpSMS(to: string, code: string) {
  return sendSMS({
    to,
    message: `Your verification code is ${code}. It expires shortly. Do not share this code with anyone.`,
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  return sendEmail({
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}" style="color: #2f7dd6;">Reset Password</a></p>
        <p style="color: #666; font-size: 13px;">If you didn't request this, you can ignore this email. This link will expire soon.</p>
      </div>
    `,
  });
}