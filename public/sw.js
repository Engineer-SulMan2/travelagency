// Minimal service worker — required by browsers for the "Install app"
// prompt to be offered. Only touches GET requests; POST requests (used by
// Next.js Server Actions for login, bookings, etc.) are left completely
// untouched so they're never affected by service worker interception.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});