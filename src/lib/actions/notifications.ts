"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export async function getMyNotifications(): Promise<NotificationItem[]> {
  const session = await auth();
  if (!session) return [];

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });

  return { success: true };
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return { success: true };
}

export async function deleteNotification(id: string) {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  await prisma.notification.deleteMany({
    where: { id, userId: session.user.id },
  });

  return { success: true };
}

export async function clearAllNotifications() {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  await prisma.notification.deleteMany({
    where: { userId: session.user.id },
  });

  return { success: true };
}