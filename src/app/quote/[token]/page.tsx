import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FileText, PlaneTakeoff } from "lucide-react";
import { PrintButton } from "@/components/invoice/print-button";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-sky-50 text-sky-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-red-50 text-red-700",
};

// Public — this is the link shared with the customer over WhatsApp/email.
export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const quote = await prisma.quote.findUnique({
    where: { shareToken: token },
    include: { user: { include: { agency: { select: { name: true } } } } },
  });

  if (!quote) notFound();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto mb-4 flex max-w-xl justify-end print:hidden">
        <PrintButton />
      </div>
      <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 print:border-0 print:shadow-none">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white print:bg-indigo-600">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-indigo-100">Quote</p>
              <p className="text-sm font-semibold">{quote.user.agency?.name ?? "Travel Agency"}</p>
            </div>
          </div>
          <p className="mt-6 text-2xl font-bold leading-snug tracking-tight">{quote.title}</p>
          <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[quote.status] ?? "bg-white/20"}`}>
            {quote.status}
          </span>
        </div>

        <div className="p-8">
          {quote.description && (
            <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-slate-600">{quote.description}</p>
          )}

          <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
            <span className="text-sm font-semibold text-indigo-700">Quoted price</span>
            <span className="text-lg font-bold text-indigo-700">PKR {Number(quote.amount).toLocaleString("en-PK")}</span>
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-slate-500">
            <PlaneTakeoff className="h-4 w-4" />
            Prepared by {quote.user.name}
            {quote.user.agency?.name && ` · ${quote.user.agency.name}`}
          </p>
        </div>
      </div>
    </div>
  );
}