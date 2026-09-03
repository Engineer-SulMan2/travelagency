"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Plane,
  Users,
  Percent,
  LogOut,
  Building2,
  Package as PackageIcon,
  FileText,
  BarChart3,
  Wallet as WalletIcon,
  Menu,
  X,
  Briefcase,
  ChevronDown,
  PlaneTakeoff,
  Settings,
  History,
  Contact,
  ClipboardCheck,
  ShieldCheck,
  Globe,
  ClipboardList,
  Bell,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { GlobalSearch } from "@/components/search/global-search";
import { InactivityTimeout } from "@/components/security/inactivity-timeout";

type SubLink = { label: string; href: string };
type NavEntry =
  | { type: "link"; label: string; href: string; icon: React.ElementType }
  | { type: "group"; label: string; icon: React.ElementType; children: SubLink[] };

const BOOKINGS_CHILDREN_ADMIN: SubLink[] = [
  { label: "Flights", href: "/admin/flights" },
  { label: "Hotels", href: "/admin/hotels" },
  { label: "Holiday Packages", href: "/admin/packages" },
  { label: "Tour Bookings", href: "/admin/tours" },
  { label: "Umrah Bookings", href: "/admin/umrah" },
  { label: "Group Bookings", href: "/admin/group" },
  { label: "Visa Bookings", href: "/admin/visa" },
  { label: "All Bookings", href: "/admin/bookings" },
];

const BOOKINGS_CHILDREN_AGENT: SubLink[] = [
  { label: "Flights", href: "/agent/flights" },
  { label: "Hotels", href: "/agent/hotels" },
  { label: "Holiday Packages", href: "/agent/packages" },
  { label: "Tour Bookings", href: "/agent/tours" },
  { label: "Umrah Bookings", href: "/agent/umrah" },
  { label: "Group Bookings", href: "/agent/group" },
  { label: "Visa Bookings", href: "/agent/visa" },
  { label: "My Bookings", href: "/agent/bookings" },
];

const ADMIN_NAV: NavEntry[] = [
  { type: "link", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { type: "link", label: "Sub-Agents", href: "/admin/sub-agents", icon: Users },
  { type: "link", label: "Customers", href: "/admin/customers", icon: Contact },
  { type: "link", label: "Inquiries", href: "/admin/inquiries", icon: ClipboardList },
  { type: "link", label: "Reminders", href: "/admin/reminders", icon: Bell },
  { type: "link", label: "Upcoming Travel", href: "/admin/upcoming", icon: CalendarClock },
  { type: "group", label: "Bookings", icon: Briefcase, children: BOOKINGS_CHILDREN_ADMIN },
  { type: "link", label: "Approvals", href: "/admin/approvals", icon: ClipboardCheck },
  { type: "link", label: "Wallet", href: "/admin/wallet", icon: WalletIcon },
  { type: "link", label: "Payouts", href: "/admin/payouts", icon: WalletIcon },
  { type: "link", label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { type: "link", label: "Markup & Commission", href: "/admin/markup", icon: Percent },
  { type: "link", label: "Activity Log", href: "/admin/activity", icon: History },
  { type: "link", label: "Settings", href: "/admin/settings", icon: Settings },
  { type: "link", label: "Security", href: "/admin/security", icon: ShieldCheck },
];

const AGENT_NAV: NavEntry[] = [
  { type: "link", label: "Dashboard", href: "/agent", icon: LayoutDashboard },
  { type: "link", label: "Customers", href: "/agent/customers", icon: Contact },
  { type: "link", label: "Inquiries", href: "/agent/inquiries", icon: ClipboardList },
  { type: "link", label: "Reminders", href: "/agent/reminders", icon: Bell },
  { type: "link", label: "Quotes", href: "/agent/quotes", icon: FileText },
  { type: "link", label: "Upcoming Travel", href: "/agent/upcoming", icon: CalendarClock },
  { type: "group", label: "Bookings", icon: Briefcase, children: BOOKINGS_CHILDREN_AGENT },
    { type: "link", label: "Wallet", href: "/agent/wallet", icon: WalletIcon },
  { type: "link", label: "My Summary", href: "/agent/summary", icon: BarChart3 },
  { type: "link", label: "Settings", href: "/agent/settings", icon: Settings },
  { type: "link", label: "Security", href: "/agent/security", icon: ShieldCheck },
];

// Platform owner — deliberately does NOT include any agency-scoped links
// (Sub-Agents, Bookings, Wallet, Reports, etc.). Those are for Agency
// Admins managing their own agency; the Super Admin operates one level up.
const SUPER_ADMIN_NAV: NavEntry[] = [
  { type: "link", label: "Platform", href: "/admin/platform", icon: Globe },
  { type: "link", label: "Sub-Agents", href: "/admin/platform/sub-agents", icon: Users },
  { type: "link", label: "Security", href: "/admin/security", icon: ShieldCheck },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />
      )}
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
      {label}
    </Link>
  );
}

function NavGroup({
  label,
  icon: Icon,
  children,
  pathname,
  onNavigate,
}: {
  label: string;
  icon: React.ElementType;
  children: SubLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const hasActiveChild = children.some((c) => pathname === c.href);
  const [open, setOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
          hasActiveChild ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm",
            hasActiveChild ? "bg-indigo-600" : "bg-white ring-1 ring-slate-200"
          )}
        >
          <Icon className={cn("h-4 w-4", hasActiveChild ? "text-white" : "text-slate-500")} />
        </span>
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="ml-10 mt-1 space-y-0.5 border-l-2 border-indigo-100 pl-3">
          {children.map((child) => {
            const active = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-indigo-50 font-medium text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span className={cn("h-1 w-1 shrink-0 rounded-full", active ? "bg-indigo-600" : "bg-transparent")} />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  nav,
  role,
  userName,
  pathname,
  avatarUrl,
  logoUrl,
  onNavigate,
}: {
  nav: NavEntry[];
  role: string;
  userName: string;
  pathname: string;
  avatarUrl?: string | null;
  logoUrl?: string | null;
  onNavigate?: () => void;
}) {
  const roleLabel = role === "SUPER_ADMIN" ? "Platform Admin" : role === "AGENCY_ADMIN" ? "Agency Admin" : "Sub-Agent";
  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Agency logo"
            className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-100"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-200">
            <PlaneTakeoff className="h-[18px] w-[18px] text-white" />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-900">Travel Agency</p>
          <p className="text-xs leading-tight text-slate-400">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((item) =>
          item.type === "link" ? (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href}
              onNavigate={onNavigate}
            />
          ) : (
            <NavGroup
              key={item.label}
              label={item.label}
              icon={item.icon}
              children={item.children}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          )
        )}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="truncate text-xs font-medium text-slate-600">{userName}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </>
  );
}

export function DashboardShell({
  role,
  userName,
  avatarUrl,
  logoUrl,
  children,
}: {
  role: string;
  userName: string;
  avatarUrl?: string | null;
  logoUrl?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = role === "SUPER_ADMIN" || role === "AGENCY_ADMIN";
  const nav: NavEntry[] =
    role === "SUPER_ADMIN" ? SUPER_ADMIN_NAV : role === "AGENCY_ADMIN" ? ADMIN_NAV : AGENT_NAV;
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <InactivityTimeout />
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Agency logo" className="h-7 w-7 rounded-lg object-cover" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <PlaneTakeoff className="h-3.5 w-3.5 text-white" />
            </div>
          )}
          <p className="text-sm font-semibold text-slate-900">Travel Agency</p>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-end px-3 pt-3">
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              nav={nav}
              role={role}
              userName={userName}
              pathname={pathname}
              avatarUrl={avatarUrl}
              logoUrl={logoUrl}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white md:flex">
        <SidebarContent nav={nav} role={role} userName={userName} pathname={pathname} avatarUrl={avatarUrl} logoUrl={logoUrl} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden items-center justify-between border-b border-slate-100 bg-white px-6 py-3 md:flex">
          <GlobalSearch />
          <NotificationBell />
        </div>
        <main className="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}