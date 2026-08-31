import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvoiceData } from "@/lib/invoice-data";
import { InvoiceDocument } from "@/components/invoice/invoice-document";
import { PrintButton } from "@/components/invoice/print-button";
import { FileWarning } from "lucide-react";

// Expects ?items=TYPE:id,TYPE:id,... e.g. FLIGHT:abc123,HOTEL:def456
function parseItems(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => {
      const [type, id] = entry.split(":");
      return type && id ? { type: type.toLowerCase(), id } : null;
    })
    .filter((x): x is { type: string; id: string } => x !== null)
    .slice(0, 50); // sane upper bound for a single print batch
}

export default async function BulkInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string }>;
}) {
  const { items: itemsParam } = await searchParams;
  const session = await auth();
  if (!session) redirect("/login");

  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser) redirect("/login");

  const items = parseItems(itemsParam);
  const results = await Promise.all(items.map((item) => getInvoiceData(item.type, item.id, currentUser)));
  const invoices = results.filter((d): d is NonNullable<typeof d> => d !== null);
  const skipped = results.length - invoices.length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto mb-4 flex max-w-2xl items-center justify-between print:hidden">
        <p className="text-sm text-slate-500">
          {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} ready to print
          {skipped > 0 ? ` (${skipped} skipped — not found or not authorized)` : ""}
        </p>
        {invoices.length > 0 && <PrintButton />}
      </div>

      {invoices.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <FileWarning className="h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No invoices to show. Select some bookings and try again.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {invoices.map((inv, i) => (
            <div key={`${inv.bookingRef}-${i}`} className="break-after-page">
              <InvoiceDocument data={inv} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}