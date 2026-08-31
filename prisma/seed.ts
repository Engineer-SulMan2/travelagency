import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 1. Super Admin (platform owner)
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@travelsaas.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@travelsaas.com",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  // 2. Demo Agency
  const agency = await prisma.agency.upsert({
    where: { slug: "skyway-travels" },
    update: {},
    create: {
      name: "Skyway Travels",
      slug: "skyway-travels",
      email: "info@skywaytravels.com",
    },
  });

  // 3. Agency Admin
  const agencyAdmin = await prisma.user.upsert({
    where: { email: "admin@skywaytravels.com" },
    update: {},
    create: {
      name: "Agency Admin",
      email: "admin@skywaytravels.com",
      password: hashedPassword,
      role: Role.AGENCY_ADMIN,
      agencyId: agency.id,
      walletBalance: 1000000, // seed float so demo bookings work immediately
    },
  });

  // 4. Sub-Agent under the Agency Admin
  await prisma.user.upsert({
    where: { email: "subagent@skywaytravels.com" },
    update: {},
    create: {
      name: "Ali (Sub Agent)",
      email: "subagent@skywaytravels.com",
      password: hashedPassword,
      role: Role.SUB_AGENT,
      agencyId: agency.id,
      parentId: agencyAdmin.id,
      defaultMarkupPct: 3.5,
      commissionPct: 70, // Ali keeps 70% of the markup, agency keeps 30%
      walletBalance: 200000, // seed float so demo bookings work immediately
    },
  });

  // 5. Demo packages — Tour, Umrah, Group categories
  await prisma.package.upsert({
    where: { id: "seed-pkg-hunza" },
    update: {},
    create: {
      id: "seed-pkg-hunza",
      title: "5-Day Hunza & Skardu Tour",
      destination: "Hunza & Skardu",
      durationDays: 5,
      description:
        "A scenic 5-day journey through the northern valleys, covering Hunza, Skardu and Attabad Lake.",
      inclusions: ["Return flights", "4-star hotel", "Daily breakfast", "Private transport"],
      basePrice: 65000,
      category: "TOUR",
      agencyId: agency.id,
    },
  });

  await prisma.package.upsert({
    where: { id: "seed-pkg-dubai" },
    update: {},
    create: {
      id: "seed-pkg-dubai",
      title: "4-Night Dubai Getaway",
      destination: "Dubai, UAE",
      durationDays: 4,
      description: "City tour, desert safari and free time to explore Dubai Mall and the Marina.",
      inclusions: ["Return flights", "3-star hotel", "Desert safari", "Airport transfers"],
      basePrice: 145000,
      category: "TOUR",
      agencyId: agency.id,
    },
  });

  await prisma.package.upsert({
    where: { id: "seed-pkg-umrah-economy" },
    update: {},
    create: {
      id: "seed-pkg-umrah-economy",
      title: "10-Day Umrah Package (Economy)",
      destination: "Makkah & Madinah",
      durationDays: 10,
      description:
        "10 nights covering Makkah and Madinah, 3-star hotels within walking distance of the Haramain, group ziyarat included.",
      inclusions: ["Return flights", "3-star hotel", "Ziyarat tour", "Visa processing"],
      basePrice: 210000,
      category: "UMRAH",
      agencyId: agency.id,
    },
  });

  await prisma.package.upsert({
    where: { id: "seed-pkg-umrah-deluxe" },
    update: {},
    create: {
      id: "seed-pkg-umrah-deluxe",
      title: "14-Day Umrah Package (Deluxe)",
      destination: "Makkah & Madinah",
      durationDays: 14,
      description:
        "14 nights, 5-star hotels adjacent to the Haram, private transport, and a dedicated group leader.",
      inclusions: ["Return flights", "5-star hotel", "Private transport", "Visa processing", "Group leader"],
      basePrice: 385000,
      category: "UMRAH",
      agencyId: agency.id,
    },
  });

  await prisma.package.upsert({
    where: { id: "seed-pkg-group-thailand" },
    update: {},
    create: {
      id: "seed-pkg-group-thailand",
      title: "6-Day Group Tour — Bangkok & Pattaya",
      destination: "Thailand",
      durationDays: 6,
      description: "Group departure, minimum 10 travelers, escorted throughout with a fixed itinerary.",
      inclusions: ["Return flights", "4-star hotel", "Group transport", "City tours", "Tour guide"],
      basePrice: 175000,
      category: "GROUP",
      agencyId: agency.id,
    },
  });

  console.log("Seed complete:");
  console.log({ superAdmin: superAdmin.email, agencyAdmin: agencyAdmin.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
