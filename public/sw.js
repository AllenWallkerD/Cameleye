// Minimal service worker — exists so the app is installable (PWA).
// Network passthrough, no caching, so users always get the latest version.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  /* passthrough — let the browser handle requests normally */
});
