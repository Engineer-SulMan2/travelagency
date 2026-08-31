import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddCustomerForm } from "@/components/customers/add-customer-form";
import { CustomersTable } from "@/components/customers/customers-table";
import { getRepeatCustomerNames } from "@/lib/repeat-customers";
import type { CustomerSummary } from "@/types/customer";

export default async function AgentCustomersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const [customers, repeatNames] = await Promise.all([
    prisma.customer.findMany({
      where: { createdById: user.id },
      orderBy: { createdAt: "desc" },
    }),
    getRepeatCustomerNames({ userId: user.id }),
  ]);

  const rows: CustomerSummary[] = customers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    phone: c.phone,
    email: c.email,
    passportNumber: c.passportNumber,
    notes: c.notes,
    tags: c.tags,
    loyaltyPoints: c.loyaltyPoints,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Customers</h1>
      <p className="mb-6 text-sm text-slate-500">
        Save customer details once, reuse them across future bookings. Only visible to you.
      </p>

      <div className="mb-5">
        <AddCustomerForm />
      </div>

      <CustomersTable customers={rows} repeatNames={repeatNames} />
    </div>
  );
}