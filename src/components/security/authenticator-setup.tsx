"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, CheckCircle2, X } from "lucide-react";
import {
  startTotpSetup,
  confirmTotpSetup,
  disableTotp,
  getTotpStatus,
  type TotpSetupData,
} from "@/lib/actions/totp-setup";

export function AuthenticatorSetup() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setupData, setSetupData] = useState<TotpSetupData | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTotpStatus().then((s) => setEnabled(s.enabled));
  }, []);

  async function handleStartSetup() {
    setPending(true);
    setError(null);
    const res = await startTotpSetup();
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setSetupData(res);
  }

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const res = await confirmTotpSetup(code);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSetupData(null);
    setCode("");
    setEnabled(true);
    router.refresh();
  }

  async function handleDisable() {
    setPending(true);
    setError(null);
    const res = await disableTotp(code);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDisabling(false);
    setCode("");
    setEnabled(false);
    router.refresh();
  }

  function cancelSetup() {
    setSetupData(null);
    setCode("");
    setError(null);
  }

  const codeFieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-center text-lg font-mono tracking-[0.4em] outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Smartphone className="h-4 w-4 text-indigo-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Authenticator app</p>
        </div>
        {enabled && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Enabled
          </span>
        )}
      </div>

      <p className="mb-4 text-xs text-slate-500">
        Use Google Authenticator, Authy, or a similar app to sign in with a rotating 6-digit code instead of an
        emailed one.
      </p>

      {enabled === null && <p className="text-sm text-slate-400">Loading...</p>}

      {enabled === false && !setupData && (
        <button
          onClick={handleStartSetup}
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Setting up..." : "Set up authenticator app"}
        </button>
      )}

      {setupData && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setupData.qrCodeDataUrl} alt="Scan with your authenticator app" className="h-44 w-44" />
            <p className="text-center text-xs text-slate-500">
              Scan this with your authenticator app, or enter the key manually:
            </p>
            <p className="break-all rounded-lg bg-white px-3 py-1.5 text-center font-mono text-xs text-slate-700">
              {setupData.secret}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Enter the 6-digit code from your app
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              className={codeFieldClass}
              placeholder="••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirm}
              disabled={pending || code.length !== 6}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {pending ? "Verifying..." : "Confirm & enable"}
            </button>
            <button
              onClick={cancelSetup}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {enabled === true && !disabling && (
        <button
          onClick={() => setDisabling(true)}
          className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <X className="h-3.5 w-3.5" /> Disable authenticator app
        </button>
      )}

      {disabling && (
        <div className="space-y-3">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Enter your current 6-digit code to confirm
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            className={codeFieldClass}
            placeholder="••••••"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDisable}
              disabled={pending || code.length !== 6}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "Disabling..." : "Confirm disable"}
            </button>
            <button
              onClick={() => {
                setDisabling(false);
                setCode("");
                setError(null);
              }}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}