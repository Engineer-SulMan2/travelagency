"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { PlaneTakeoff, Mail, Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { requestLoginOtp, verifyLoginOtp } from "@/lib/actions/otp";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpMethod, setOtpMethod] = useState<"email" | "totp">("email");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function completeSignIn() {
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Something went wrong signing you in. Please try again.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await requestLoginOtp(email, password);

    if (!result.success) {
      setLoading(false);
      setError(result.error ?? "Invalid email or password.");
      return;
    }

    // This browser is already trusted — go straight in, no OTP needed.
    if (result.skipOtp) {
      await completeSignIn();
      return;
    }

    setLoading(false);
    setOtpMethod(result.method === "totp" ? "totp" : "email");
    // No SMS/email provider configured in this demo — show the code
    // directly instead of sending it, so the flow is still testable.
    setDevOtp(result.otpCode ?? null);
    setStep("otp");
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const verify = await verifyLoginOtp(email, otp, rememberDevice);
    if (!verify.success) {
      setLoading(false);
      setError(verify.error ?? "Invalid or expired code.");
      return;
    }

    await completeSignIn();
  }

  function backToCredentials() {
    setStep("credentials");
    setOtp("");
    setDevOtp(null);
    setError(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200">
            {step === "credentials" ? (
              <PlaneTakeoff className="h-6 w-6 text-white" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-white" />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
          {step === "credentials" ? (
            <>
              <h1 className="mb-1 text-xl font-semibold text-slate-900">Sign in</h1>
              <p className="mb-6 text-sm text-slate-500">Access your agency dashboard</p>

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      placeholder="you@agency.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-600">Password</label>
                    <Link href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Continue"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                New agency?{" "}
                <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
                  Create an account
                </Link>
              </p>
              <p className="mt-2 text-center text-sm text-slate-500">
                Joining an existing agency?{" "}
                <Link href="/register-agent" className="font-medium text-indigo-600 hover:text-indigo-700">
                  Sign up as a sub-agent
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                onClick={backToCredentials}
                className="mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>

              <h1 className="mb-1 text-xl font-semibold text-slate-900">
                {otpMethod === "totp" ? "Enter authenticator code" : "Enter verification code"}
              </h1>
              <p className="mb-4 text-sm text-slate-500">
                {otpMethod === "totp" ? (
                  "Open your authenticator app and enter the current 6-digit code."
                ) : (
                  <>
                    We&apos;ve sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>.
                  </>
                )}
              </p>

              {devOtp && otpMethod === "email" && (
                <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                  No SMS/email provider is configured in this demo — your code is{" "}
                  <span className="font-mono font-semibold">{devOtp}</span>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">6-digit code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-center text-lg font-mono tracking-[0.5em] outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    placeholder="••••••"
                  />
                </div>

                <label className="flex items-center gap-2.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                  />
                  Remember this device for 30 days
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Verify & sign in"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}