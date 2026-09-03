import { redirect } from "next/navigation";
import Link from "next/link";
import { Newsreader } from "next/font/google";
import {
  Plane,
  Users,
  Wallet,
  BarChart3,
  PlaneTakeoff,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/lib/auth";

const serif = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });

const ADMIN_ROLES = ["SUPER_ADMIN", "AGENCY_ADMIN"] as const;

const FEATURES = [
  {
    icon: Plane,
    title: "Flights, hotels, packages and visas",
    desc: "Search and book all four from one place, with your markup applied automatically at the moment of sale.",
  },
  {
    icon: Users,
    title: "A network of sub-agents, one rate table",
    desc: "Set individual markup and commission per sub-agent, or let revenue tiers raise their rate as they sell more.",
  },
  {
    icon: Wallet,
    title: "A wallet that reconciles itself",
    desc: "Every booking debits its net cost and credits commission the moment it's confirmed — nothing to tally by hand.",
  },
  {
    icon: BarChart3,
    title: "Reports built for a payout run",
    desc: "Revenue, markup and commission broken down by agent and by product, plus a printable invoice for every booking.",
  },
  {
    icon: ClipboardCheck,
    title: "A threshold, not a bottleneck",
    desc: "Set an amount above which a booking waits for your sign-off — everything under it confirms on its own.",
  },
  {
    icon: ShieldCheck,
    title: "Signed in, verified, logged",
    desc: "Two-step OTP or an authenticator app at login, trusted devices, and an activity log across the whole agency.",
  },
];

export default async function HomePage() {
  const session = await auth();

  if (session) {
    if ((ADMIN_ROLES as readonly string[]).includes(session.user.role)) redirect("/admin");
    redirect("/agent");
  }

  return (
    <div className="bg-white">
      {/* ---------- Hero band ---------- */}
      <div className="relative overflow-hidden bg-[#0B1120]">
        {/* Faint converging flight-path lines — grounds the hero in the
            subject without resorting to literal plane clipart. */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <path d="M-50 650 C 250 500, 550 500, 1250 120" stroke="#D4A03C" strokeWidth="1" />
          <path d="M-50 750 C 300 620, 600 600, 1250 260" stroke="#D4A03C" strokeWidth="1" />
          <path d="M-50 500 C 300 420, 650 430, 1250 40" stroke="#4F46E5" strokeWidth="1" />
          <circle cx="1250" cy="120" r="3" fill="#D4A03C" />
          <circle cx="1250" cy="260" r="3" fill="#D4A03C" />
          <circle cx="1250" cy="40" r="3" fill="#4F46E5" />
        </svg>

        <header className="relative border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <PlaneTakeoff className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-medium text-white">Travel Agency</p>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/login" className="text-sm text-white/70 transition hover:text-white">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0B1120] transition hover:bg-white/90"
              >
                Create an agency
              </Link>
            </div>
          </div>
        </header>

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left: headline */}
          <div>
            <h1
              className={`${serif.className} text-[2.75rem] leading-[1.08] tracking-tight text-white sm:text-6xl`}
            >
              Every booking, every sub-agent,
              <br />
              <span className="italic text-[#D4A03C]">one ledger.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/60">
              Flights, hotels, packages and visas, sold through a network of sub-agents — with markup,
              commission and wallet balances that settle themselves on every confirmed booking.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="rounded-lg bg-[#D4A03C] px-6 py-3 text-sm font-medium text-[#0B1120] transition hover:bg-[#e0b158]"
              >
                Create an agency
              </Link>
              <Link href="/login" className="text-sm font-medium text-white/80 transition hover:text-white">
                Sign in
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/40">
              Joining an existing agency?{" "}
              <Link href="/register-agent" className="text-white/70 underline underline-offset-4 hover:text-white">
                Sign up as a sub-agent
              </Link>
            </p>
          </div>

          {/* Right: a stylised ledger stub — the actual mechanic the product
              automates, shown as the hero visual rather than a screenshot. */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-dashed border-white/15 pb-4">
                <div>
                  <p className="font-mono text-xs text-white/40">TRV-8K2N4Q</p>
                  <p className={`${serif.className} mt-1 text-lg text-white`}>KHI → DXB</p>
                </div>
                <PlaneTakeoff className="h-5 w-5 text-[#D4A03C]" />
              </div>
              <div className="space-y-3 py-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Net fare</span>
                  <span className="text-white/80">PKR 68,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Markup (8%)</span>
                  <span className="text-white/80">PKR 5,440</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Sub-agent commission</span>
                  <span className="text-[#D4A03C]">PKR 2,720</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-white/15 pt-4">
                <span className="text-sm text-white/40">Wallet, settled</span>
                <span className={`${serif.className} text-xl text-white`}>PKR 73,440</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Features (list, not a card grid) ---------- */}
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-lg">
          <h2 className={`${serif.className} text-3xl text-slate-900`}>What runs on it</h2>
          <p className="mt-3 text-slate-500">
            Built for an agency selling through sub-agents — not adapted from a generic booking template.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4 border-t border-slate-200 pt-6">
              <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#0B1120]" strokeWidth={1.5} />
              <div>
                <p className="font-medium text-slate-900">{f.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- CTA band ---------- */}
      <div className="bg-[#0B1120]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <h2 className={`${serif.className} max-w-md text-2xl text-white`}>
            Set up your agency this afternoon, not this quarter.
          </h2>
          <Link
            href="/register"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-[#D4A03C] px-6 py-3 text-sm font-medium text-[#0B1120] transition hover:bg-[#e0b158]"
          >
            Create an agency <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-slate-100 py-8">
        <p className="text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Travel Agency. All rights reserved.
        </p>
      </footer>
    </div>
  );
}