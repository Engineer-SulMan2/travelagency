import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Deletes the demo agency ("Skyway Travels") and everything tied to its
// users, in FK-safe order. Anything with onDelete: Cascade on the User/
// Agency relation (wallet transactions, notifications, OTP codes, trusted
// devices, login events, documents, saved routes, goals, quotes, activity
// log, commission tiers) is cleaned up automatically when the user/agency
// row is deleted — only the onDelete: Restrict relations need manual
// deletion first, which is what most of this script does.
async function main() {
  const agency = await prisma.agency.findUnique({ where: { slug: "skyway-travels" } });

  if (!agency) {
    console.log("No demo agency found (slug 'skyway-travels') — nothing to remove.");
    return;
  }

  const users = await prisma.user.findMany({ where: { agencyId: agency.id }, select: { id: true, email: true } });
  const userIds = users.map((u) => u.id);

  console.log(`Found demo agency "${agency.name}" with ${userIds.length} user(s):`, users.map((u) => u.email));

  if (userIds.length > 0) {
    // These block user deletion (onDelete: Restrict) — must go first.
    const commissionEntries = await prisma.commissionEntry.deleteMany({ where: { userId: { in: userIds } } });
    const flightBookings = await prisma.booking.deleteMany({ where: { userId: { in: userIds } } });
    const hotelBookings = await prisma.hotelBooking.deleteMany({ where: { userId: { in: userIds } } });
    const packageBookings = await prisma.packageBooking.deleteMany({ where: { userId: { in: userIds } } });
    const visaBookings = await prisma.visaBooking.deleteMany({ where: { userId: { in: userIds } } });
    const customers = await prisma.customer.deleteMany({ where: { createdById: { in: userIds } } });
    const inquiries = await prisma.inquiry.deleteMany({ where: { createdById: { in: userIds } } });
    const reminders = await prisma.reminder.deleteMany({ where: { userId: { in: userIds } } });

    console.log("Deleted:", {
      commissionEntries: commissionEntries.count,
      flightBookings: flightBookings.count,
      hotelBookings: hotelBookings.count,
      packageBookings: packageBookings.count,
      visaBookings: visaBookings.count,
      customers: customers.count,
      inquiries: inquiries.count,
      reminders: reminders.count,
    });

    // Now safe to delete the users themselves — everything else cascades.
    const deletedUsers = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    console.log(`Deleted ${deletedUsers.count} demo user(s).`);
  }

  // Packages are safe to delete now that PackageBooking rows referencing
  // them are gone.
  const deletedPackages = await prisma.package.deleteMany({ where: { agencyId: agency.id } });
  console.log(`Deleted ${deletedPackages.count} demo package(s).`);

  // Commission tiers cascade automatically, but this confirms the agency
  // itself is now safe to remove.
  await prisma.agency.delete({ where: { id: agency.id } });
  console.log(`Deleted demo agency "${agency.name}".`);

  console.log("\nDemo data removed successfully. Super Admin account is untouched.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });