import { prisma } from "@/lib/prisma";

export type ReportsData = {
  totals: {
    bookingCount: number;
    revenue: number;
    markup: number;
    commissionPaid: number;
    agencyShare: number;
  };
  byProduct: { type: string; count: number; revenue: number; commission: number }[];
  dailyBookings: { date: string; count: number }[];
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function getReportsData(agencyId: string | null | undefined): Promise<ReportsData> {
  const where = { agencyId };

  const [flights, hotels, packages, visas, commissionEntries] = await Promise.all([
    prisma.booking.findMany({ where, select: { totalAmount: true, createdAt: true, status: true } }),
    prisma.hotelBooking.findMany({ where, select: { totalAmount: true, createdAt: true, status: true } }),
    prisma.packageBooking.findMany({ where, select: { totalAmount: true, createdAt: true, status: true } }),
    prisma.visaBooking.findMany({ where, select: { totalAmount: true, createdAt: true, status: true } }),
    prisma.commissionEntry.findMany({
      where,
      select: { productType: true, markupAmount: true, commissionAmount: true, agencyShare: true },
    }),
  ]);

  const allBookings = [
    ...flights.map((b) => ({ ...b, type: "FLIGHT" })),
    ...hotels.map((b) => ({ ...b, type: "HOTEL" })),
    ...packages.map((b) => ({ ...b, type: "PACKAGE" })),
    ...visas.map((b) => ({ ...b, type: "VISA" })),
  ];

  const activeBookings = allBookings.filter((b) => b.status !== "CANCELLED");
  const revenue = activeBookings.reduce((s, b) => s + Number(b.totalAmount), 0);
  const markup = commissionEntries.reduce((s, c) => s + Number(c.markupAmount), 0);
  const commissionPaid = commissionEntries.reduce((s, c) => s + Number(c.commissionAmount), 0);
  const agencyShare = commissionEntries.reduce((s, c) => s + Number(c.agencyShare), 0);

  const byProductMap = new Map<string, { count: number; revenue: number; commission: number }>();
  for (const type of ["FLIGHT", "HOTEL", "PACKAGE", "VISA"]) {
    byProductMap.set(type, { count: 0, revenue: 0, commission: 0 });
  }
  for (const b of activeBookings) {
    const entry = byProductMap.get(b.type)!;
    entry.count += 1;
    entry.revenue += Number(b.totalAmount);
  }
  for (const c of commissionEntries) {
    const entry = byProductMap.get(c.productType)!;
    entry.commission += Number(c.commissionAmount);
  }

  const byProduct = Array.from(byProductMap.entries()).map(([type, v]) => ({ type, ...v }));

  // Last 14 days, including days with zero bookings
  const dailyMap = new Map<string, number>();
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dailyMap.set(dayKey(d), 0);
  }
  for (const b of allBookings) {
    const key = dayKey(b.createdAt);
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }
  }
  const dailyBookings = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

  return {
    totals: {
      bookingCount: activeBookings.length,
      revenue,
      markup,
      commissionPaid,
      agencyShare,
    },
    byProduct,
    dailyBookings,
  };
}
