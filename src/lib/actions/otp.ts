"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  TRUSTED_DEVICE_COOKIE,
  TRUSTED_DEVICE_DAYS,
  generateDeviceToken,
  hashDeviceToken,
} from "@/lib/trusted-device";
import { verifyTotpCode } from "@/lib/totp";

export type OtpRequestResult = {
  success: boolean;
  error?: string;
  otpCode?: string;
  skipOtp?: boolean;
  method?: "email" | "totp";
};
export type OtpVerifyResult = { success: boolean; error?: string };

function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function describeUserAgent(ua: string | undefined) {
  if (!ua) return "an unknown device";
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Chrome/")
      ? "Chrome"
      : ua.includes("Firefox/")
        ? "Firefox"
        : ua.includes("Safari/")
          ? "Safari"
          : "a browser";
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac OS")
      ? "macOS"
      : ua.includes("Android")
        ? "Android"
        : ua.includes("iPhone") || ua.includes("iPad")
          ? "iOS"
          : "an unknown OS";
  return `${browser} on ${os}`;
}

const FAILED_LOGIN_WINDOW_MINUTES = 15;
const FAILED_LOGIN_THRESHOLD = 3;

/**
 * Step 1 of login: verify email+password, and if valid, either skip OTP
 * (if this browser is a trusted device) or issue a fresh OTP. No SMS/email
 * provider is configured in this demo, so the code is returned directly
 * (otpCode) to be shown on screen — in production this would be sent via
 * SMS/email instead and NOT returned from this function.
 */
export async function requestLoginOtp(email: string, password: string): Promise<OtpRequestResult> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? undefined;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    await prisma.loginEvent.create({ data: { email, success: false, userAgent } });
    return { success: false, error: "Invalid email or password." };
  }

  if (user.status !== "ACTIVE") {
    return {
      success: false,
      error:
        user.status === "PENDING"
          ? "Your account is awaiting admin approval."
          : "Account is not active. Contact your agency admin.",
    };
  }

  // Agencies need platform approval (new self-registered agencies) and can
  // be suspended by the Super Admin — either blocks every user in them.
  if (user.agencyId) {
    const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });
    if (agency) {
      if (!agency.approvedAt) {
        return { success: false, error: "Your agency is pending platform approval." };
      }
      if (!agency.isActive) {
        return { success: false, error: "Your agency has been suspended. Contact platform support." };
      }
    }
  }

  // Auto-lock: if this account has already hit the failed-attempt threshold
  // within the window, refuse the attempt outright — don't even check the
  // password — until the window rolls past the most recent failure.
  const lockWindowStart = new Date(Date.now() - FAILED_LOGIN_WINDOW_MINUTES * 60 * 1000);
  const recentFailureEvents = await prisma.loginEvent.findMany({
    where: { userId: user.id, success: false, createdAt: { gte: lockWindowStart } },
    orderBy: { createdAt: "desc" },
    take: FAILED_LOGIN_THRESHOLD,
  });
  if (recentFailureEvents.length >= FAILED_LOGIN_THRESHOLD) {
    const mostRecentFailure = recentFailureEvents[0].createdAt;
    const unlocksAt = new Date(mostRecentFailure.getTime() + FAILED_LOGIN_WINDOW_MINUTES * 60 * 1000);
    const minutesLeft = Math.max(1, Math.ceil((unlocksAt.getTime() - Date.now()) / 60000));
    return {
      success: false,
      error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
    };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    await prisma.loginEvent.create({ data: { userId: user.id, email, success: false, userAgent } });

    // Alert agency admins after repeated failures in a short window.
    const since = new Date(Date.now() - FAILED_LOGIN_WINDOW_MINUTES * 60 * 1000);
    const recentFailures = await prisma.loginEvent.count({
      where: { userId: user.id, success: false, createdAt: { gte: since } },
    });

    if (recentFailures === FAILED_LOGIN_THRESHOLD && user.agencyId) {
      const admins = await prisma.user.findMany({
        where: { agencyId: user.agencyId, role: { in: ["SUPER_ADMIN", "AGENCY_ADMIN"] } },
        select: { id: true },
      });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "SYSTEM",
            title: "Repeated failed login attempts",
            message: `${user.name} (${email}) has had ${recentFailures} failed login attempts in the last ${FAILED_LOGIN_WINDOW_MINUTES} minutes.`,
            link: "/admin/sub-agents",
          },
        });
      }
    }

    return { success: false, error: "Invalid email or password." };
  }

  await prisma.loginEvent.create({ data: { userId: user.id, email, success: true, userAgent } });

  // Trusted device? Skip OTP entirely.
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (deviceToken) {
    const tokenHash = hashDeviceToken(deviceToken);
    const trusted = await prisma.trustedDevice.findUnique({ where: { tokenHash } });
    if (trusted && trusted.userId === user.id && trusted.expiresAt > new Date()) {
      await prisma.trustedDevice.update({ where: { id: trusted.id }, data: { lastUsedAt: new Date() } });
      return { success: true, skipOtp: true };
    }
  }

  // Authenticator app enabled? Skip generating/storing an email code
  // entirely — the login page will prompt for the app's rotating code
  // instead, verified live in verifyLoginOtp() against no DB record.
  if (user.totpEnabled) {
    return { success: true, method: "totp" };
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.otpCode.create({
    data: { userId: user.id, code, purpose: "LOGIN", expiresAt },
  });

  return { success: true, otpCode: code, method: "email" };
}

/**
 * Step 2 of login: verify the OTP code matches, isn't expired, and hasn't
 * already been used. Does NOT establish the session itself — the caller
 * (login page) still calls next-auth's signIn() with the same credentials
 * once this returns success, so bcrypt password verification happens again
 * on the real login, keeping this a pure second factor.
 *
 * If rememberDevice is set, also marks this browser as trusted for
 * TRUSTED_DEVICE_DAYS so future logins skip OTP.
 */
export async function verifyLoginOtp(
  email: string,
  code: string,
  rememberDevice?: boolean
): Promise<OtpVerifyResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "Invalid or expired code." };
  }

  if (user.totpEnabled && user.totpSecret) {
    const valid = verifyTotpCode(user.email, user.totpSecret, code);
    if (!valid) {
      return { success: false, error: "Incorrect authenticator code." };
    }
  } else {
    const otp = await prisma.otpCode.findFirst({
      where: { userId: user.id, code, purpose: "LOGIN", usedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otp || otp.expiresAt < new Date()) {
      return { success: false, error: "Invalid or expired code. Request a new one." };
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  }

  // Reaching here always means this was NOT a trusted device (those skip
  // OTP entirely in requestLoginOtp) — so this is exactly a "new device"
  // login, worth alerting the account owner about.
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? undefined;
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "SYSTEM",
      title: "New login to your account",
      message: `A new sign-in was verified from ${describeUserAgent(userAgent)}. If this wasn't you, change your password right away.`,
    },
  });

  if (rememberDevice) {
    const rawToken = generateDeviceToken();
    const tokenHash = hashDeviceToken(rawToken);
    const expiresAt = new Date(Date.now() + TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000);

    await prisma.trustedDevice.create({
      data: { userId: user.id, tokenHash, userAgent, expiresAt },
    });

    const cookieStore = await cookies();
    cookieStore.set(TRUSTED_DEVICE_COOKIE, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  }

  return { success: true };
}