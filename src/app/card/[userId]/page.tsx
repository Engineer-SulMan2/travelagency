import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlaneTakeoff, Mail, Building2 } from "lucide-react";
import { PrintButton } from "@/components/invoice/print-button";

// Public by design — a digital business card is meant to be shared
// externally (WhatsApp, email signature, etc). Only non-sensitive fields
// are shown: name, role, agency name/logo, and work email.
export default async function DigitalCardPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { agency: { select: { name: true, logoUrl: true } } },
  });

  if (!user || user.status !== "ACTIVE") notFound();

  const roleLabel = user.role === "AGENCY_ADMIN" ? "Agency Admin" : user.role === "SUB_AGENT" ? "Travel Consultant" : "Team Member";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end print:hidden">
          <PrintButton />
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-center text-white">
            {user.agency?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.agency.logoUrl}
                alt=""
                className="mx-auto mb-3 h-14 w-14 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
                <PlaneTakeoff className="h-7 w-7" />
              </div>
            )}
            <p className="text-xl font-bold">{user.name}</p>
            <p className="text-sm text-indigo-100">{roleLabel}</p>
          </div>

          <div className="space-y-3 p-6">
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
              {user.agency?.name ?? "Independent Agent"}
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              {user.email}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}