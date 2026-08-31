"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type GlobalSearchResult = {
  bookings: { id: string; type: string; bookingRef: string; title: string; href: string }[];
  customers: { id: string; fullName: string; phone: string | null; href: string }[];
  subAgents: { id: string; name: string; email: string; href: string }[];
};

const EMPTY: GlobalSearchResult = { bookings: [], customers: [], subAgents: [] };

export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  const q = query.trim();
  if (q.length < 2) return EMPTY;

  const session = await auth();
  if (!session) return EMPTY;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return EMPTY;

  const isAdmin = [Role.SUPER_ADMIN, Role.AGENCY_ADMIN].includes(user.role);
  const bookingWhere = isAdmin ? { agencyId: user.agencyId } : { userId: user.id };
  const customerWhere = isAdmin ? { agencyId: user.agencyId } : { createdById: user.id };
  const customersHref = isAdmin ? "/admin/customers" : "/agent/customers";

  const [flights, hotels, packages, visas, customers, subAgents] = await Promise.all([
    prisma.booking.findMany({
      where: {
        ...bookingWhere,
        OR: [
          { bookingRef: { contains: q, mode: "insensitive" } },
          { airline: { contains: q, mode: "insensitive" } },
          { flightNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, bookingRef: true, airline: true, flightNumber: true, origin: true, destination: true },
    }),
    prisma.hotelBooking.findMany({
      where: {
        ...bookingWhere,
        OR: [{ bookingRef: { contains: q, mode: "insensitive" } }, { hotelName: { contains: q, mode: "insensitive" } }],
      },
      take: 5,
      select: { id: true, bookingRef: true, hotelName: true },
    }),
    prisma.packageBooking.findMany({
      where: {
        ...bookingWhere,
        OR: [
          { bookingRef: { contains: q, mode: "insensitive" } },
          { leadTravelerName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, bookingRef: true, leadTravelerName: true },
    }),
    prisma.visaBooking.findMany({
      where: {
        ...bookingWhere,
        OR: [
          { bookingRef: { contains: q, mode: "insensitive" } },
          { leadApplicantName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, bookingRef: true, destinationCountry: true, leadApplicantName: true },
    }),
    prisma.customer.findMany({
      where: {
        ...customerWhere,
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { passportNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, fullName: true, phone: true },
    }),
    isAdmin
      ? prisma.user.findMany({
          where: {
            agencyId: user.agencyId,
            role: Role.SUB_AGENT,
            OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
          },
          take: 5,
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  const bookings = [
    ...flights.map((b) => ({
      id: b.id,
      type: "FLIGHT",
      bookingRef: b.bookingRef,
      title: `${b.airline} ${b.flightNumber} · ${b.origin} → ${b.destination}`,
      href: `/invoice/flight/${b.id}`,
    })),
    ...hotels.map((b) => ({
      id: b.id,
      type: "HOTEL",
      bookingRef: b.bookingRef,
      title: b.hotelName,
      href: `/invoice/hotel/${b.id}`,
    })),
    ...packages.map((b) => ({
      id: b.id,
      type: "PACKAGE",
      bookingRef: b.bookingRef,
      title: b.leadTravelerName,
      href: `/invoice/package/${b.id}`,
    })),
    ...visas.map((b) => ({
      id: b.id,
      type: "VISA",
      bookingRef: b.bookingRef,
      title: `${b.destinationCountry} — ${b.leadApplicantName}`,
      href: `/invoice/visa/${b.id}`,
    })),
  ];

  return {
    bookings,
    customers: customers.map((c) => ({ id: c.id, fullName: c.fullName, phone: c.phone, href: customersHref })),
    subAgents: subAgents.map((a) => ({ id: a.id, name: a.name, email: a.email, href: "/admin/sub-agents" })),
  };
}