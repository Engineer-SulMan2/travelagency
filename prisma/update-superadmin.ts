import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const NEW_EMAIL = "admin@thegmtportal.com";
const NEW_PASSWORD = "Ghmt@2026Secure!";

async function main() {
  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

  const updated = await prisma.user.update({
    where: { email: "superadmin@travelsaas.com" },
    data: {
      name: "Super Admin",
      email: NEW_EMAIL,
      password: hashedPassword,
    },
  });

  console.log("Super Admin updated:", updated.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });