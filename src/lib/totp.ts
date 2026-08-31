import * as OTPAuth from "otpauth";

const ISSUER = "Travel Agency SaaS";

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

function buildTotp(email: string, secretBase32: string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function getOtpauthUri(email: string, secretBase32: string): string {
  return buildTotp(email, secretBase32).toString();
}

// window: 1 allows the previous/next 30s step too, so a slightly clock-drifted
// phone (or someone entering the code as it's about to roll over) still works.
export function verifyTotpCode(email: string, secretBase32: string, code: string): boolean {
  const totp = buildTotp(email, secretBase32);
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}