import crypto from "crypto";

export const TRUSTED_DEVICE_COOKIE = "trusted_device";
export const TRUSTED_DEVICE_DAYS = 30;

export function generateDeviceToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashDeviceToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}