import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Plane,
  Building2,
  Package,
  Users,
  Wallet,
  BarChart3,
  PlaneTakeoff,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["SUPER_ADMIN", "AGENCY_ADMIN"] as const;

const FEATURES = [
  {
    icon: Plane,
    title: "Flights, hotels & packages",
    desc: "Search and book all three from one place, with your markup applied automatically.",
  },
  {
    icon: Users,
    title: "Sub-agent management",
    desc: "Add sub-agents, set individual markup and commission rates, and track what they sell.",
  },
  {
    icon: Wallet,
    title: "Wallet & payments",
    desc: "Every booking debits net cost and credits commission — no manual reconciliation.",
  },
  {
    icon: BarChart3,
    title: "Reports & invoices",
    desc: "Revenue, markup and commission breakdowns, plus a printable invoice for every booking.",
  },
  {
    icon: ClipboardCheck,
    title: "Approval workflows",
    desc: "Set a threshold — bigger bookings wait for admin sign-off before they confirm.",
  },
  {
    icon: ShieldCheck,
    title: "Built-in security",
    desc: "2-step OTP login, trusted devices, and a full activity log across your agency.",
  },
];

export default async function HomePage() {
  const session = await auth();

  if (session) {
    if ((ADMIN_ROLES as readonly string[]).includes(session.user.role)) {
      redirect("/admin");
    }
    redirect("/agent");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-200">
              <PlaneTakeoff className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Travel Agency SaaS</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
            >
              Create an agency
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div className="text-center">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-medium text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            Built for agencies with sub-agent networks
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Run your travel agency
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              from one dashboard
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-500">
            Flights, hotels and packages, sub-agent markup &amp; commission, wallets, invoices
            and reports — built for agencies selling through a network of sub-agents.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Already part of an agency?{" "}
            <Link href="/register-agent" className="font-medium text-indigo-600 hover:text-indigo-700">
              Join as a sub-agent
            </Link>
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <f.icon className="h-5 w-5 text-indigo-600" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-900">{f.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 text-slate-300">
          <Building2 className="h-6 w-6" />
          <Package className="h-6 w-6" />
          <Plane className="h-6 w-6" />
          <Wallet className="h-6 w-6" />
          <BarChart3 className="h-6 w-6" />
        </div>
      </main>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        Travel Agency SaaS — a demo build.
      </footer>
    </div>
  );
}