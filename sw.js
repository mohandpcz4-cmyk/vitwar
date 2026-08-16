// Service Worker بسيط عشان الموقع يبقى قابل للتثبيت كتطبيق (PWA)
const CACHE_NAME = "vitwar-cache-v1";
const CORE_ASSETS = ["./index.html", "./manifest.json", "./images/logo.png"];

// ============================================================
// Firebase Cloud Messaging — إشعارات push حتى لو التطبيق مقفول
// ============================================================
try {
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
  importScripts("./js/firebase-config.js");

  if (
    typeof firebaseConfig !== "undefined" &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.indexOf("PASTE_") === -1
  ) {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // لما تيجي رسالة والتطبيق مقفول/في الخلفية تمامًا، هي بتتعرض تلقائيًا
    // بس بنعمل onBackgroundMessage عشان نتحكم في الشكل (أيقونة، صوت... الخ)
    messaging.onBackgroundMessage((payload) => {
      const n = (payload && payload.notification) || {};
      const title = n.title || "رسالة جديدة";
      const options = {
        body: n.body || "",
        icon: "./images/icons/icon-192.png",
        badge: "./images/icons/icon-192.png",
        data: { url: "./index.html" },
      };
      self.registration.showNotification(title, options);
    });
  }
} catch (e) {
  // لو الـ firebase-config.js لسه فيه قيم وهمية أو أي خطأ، نتجاهل بهدوء
  console.warn("FCM SW init skipped:", e && e.message);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "./index.html";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes("index.html") && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
