import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTripSummaryData } from "@/lib/trip-summary-data";
import { TripSummary } from "@/components/invoice/trip-summary";
import { PrintButton } from "@/components/invoice/print-button";

export default async function TripSummaryPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser) redirect("/login");

  const data = await getTripSummaryData(type, id, currentUser);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto mb-4 flex max-w-xl justify-end">
        <PrintButton />
      </div>
      <TripSummary data={data} />
    </div>
  );
}