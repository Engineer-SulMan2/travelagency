import { prisma } from "@/lib/prisma";
import { RegisterAgentForm } from "@/components/auth/register-agent-form";

export default async function RegisterAgentPage() {
  const agencies = await prisma.agency.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <RegisterAgentForm agencies={agencies} />;
}