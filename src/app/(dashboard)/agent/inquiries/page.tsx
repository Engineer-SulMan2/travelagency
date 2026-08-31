import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddInquiryForm } from "@/components/inquiries/add-inquiry-form";
import { InquiriesTable } from "@/components/inquiries/inquiries-table";
import type { InquirySummary } from "@/types/inquiry";

export default async function AgentInquiriesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const inquiries = await prisma.inquiry.findMany({
    where: { createdById: user.id },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows: InquirySummary[] = inquiries.map((i) => ({
    id: i.id,
    customerName: i.customerName,
    phone: i.phone,
    email: i.email,
    productType: i.productType,
    details: i.details,
    status: i.status,
    createdBy: i.createdBy.name,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Inquiries</h1>
      <p className="mb-6 text-sm text-slate-500">
        Log customer interest here before it becomes a real booking. Only visible to you.
      </p>

      <div className="mb-5">
        <AddInquiryForm />
      </div>

      <InquiriesTable inquiries={rows} showCreatedBy={false} />
    </div>
  );
}