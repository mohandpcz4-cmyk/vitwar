// ============================================================
// تشغيل Firebase (نسخة compat عشان تشتغل بملف HTML عادي من غير build tools)
// ============================================================
let db = null;
let auth = null;
let messaging = null;
let firebaseReady = false;

try {
  if (
    typeof firebase !== "undefined" &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.indexOf("PASTE_") === -1
  ) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    firebaseReady = true;
    if (firebase.messaging && firebase.messaging.isSupported && firebase.messaging.isSupported()) {
      messaging = firebase.messaging();
    }
  } else {
    console.warn(
      "Firebase مش متظبط لسه — عدّل js/firebase-config.js. الموقع هيشتغل محليًا (المتصفح ده بس) لحد ما تعمل الإعداد."
    );
  }
} catch (e) {
  console.error("Firebase init error:", e);
}

// ============================================================
// Push Notifications (FCM) — تشتغل حتى لو التطبيق/الموقع مقفول
// ============================================================
// بتطلب إذن الإشعارات، تاخد توكن الجهاز، وتخزنه في:
// branches/{branchId}/fcmTokens/{token}
// عشان الـ Cloud Function تعرف تبعتله لما الأدمن يبعت رسالة.
async function registerFcmToken(branchId) {
  try {
    if (!messaging || !firebaseReady || !branchId) return null;
    if (!("serviceWorker" in navigator)) return null;
    if (typeof VAPID_KEY !== "string" || !VAPID_KEY || VAPID_KEY.indexOf("PASTE_") === 0) {
      console.warn("VAPID_KEY مش متظبط لسه في js/firebase-config.js — الإشعارات مش هتشتغل.");
      return null;
    }
    const reg = await navigator.serviceWorker.ready;
    const token = await messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return null;
    await db.collection("branches").doc(branchId).collection("fcmTokens").doc(token).set({
      token,
      updatedAt: Date.now(),
      ua: navigator.userAgent || "",
    });
    // لو المستخدم بدّل الفرع أو الجهاز جدد التوكن، امسح توكنات فروع تانية مش لازمة (اختياري بسيط: نتجاهل)
    return token;
  } catch (e) {
    console.error("FCM token error:", e);
    return null;
  }
}

// يستقبل رسايل الفورجراوند (التطبيق مفتوح فعليًا) عشان نعرض بانر بالشكل بتاعنا
// بدل ما يعرض إشعار نظام افتراضي فوق الموقع المفتوح
function onFcmForegroundMessage(callback) {
  if (!messaging) return;
  try {
    messaging.onMessage((payload) => {
      const n = payload && payload.notification ? payload.notification : {};
      callback({ title: n.title || "", body: n.body || "" });
    });
  } catch (e) {}
}

// أرقام الفروع الثابتة
// locationMapUrl: لينك الـ "Embed a map" من Google Maps لكل فرع (بيتحط جوا iframe في مودال "العنوان")
// — سيبته فاضي دلوقتي وهتحطه بعدين لما يبقى عندك لينك الخريطة بتاع كل فرع (شوف SETUP.md).
const BRANCHES = {
  "1": {
    id: "1",
    name: "تجمع اول",
    nameEn: "First Settlement",
    location: "تجمع اول بنفسج 4",
    locationEn: "First Settlement, Banafseg 4",
    locationMapUrl: "",
    adminUser: "vitwar1",
    adminPass: "mohand@vitwar",
    authEmail: "vitwar1@vitwar.local",
    whatsapp: "201066403999",
  },
  "5": {
    id: "5",
    name: "تجمع خامس",
    nameEn: "Fifth Settlement",
    location: "حي تاني - منطقة 5 - مول جراند بلازا - امام كافية جول",
    locationEn: "District 2 - Zone 5 - Grand Plaza Mall - in front of Gool Cafe",
    locationMapUrl: "",
    adminUser: "vitwar5",
    adminPass: "mohand@vitwar",
    authEmail: "vitwar5@vitwar.local",
    whatsapp: "201080802914",
  },
};

// اسم/موقع الفرع باللغة الحالية للموقع
function branchName(branch) {
  if (!branch) return "";
  const lang = typeof getSiteLang === "function" ? getSiteLang() : "ar";
  return (lang === "en" && branch.nameEn) ? branch.nameEn : branch.name;
}
function branchLocation(branch) {
  if (!branch) return "";
  const lang = typeof getSiteLang === "function" ? getSiteLang() : "ar";
  return (lang === "en" && branch.locationEn) ? branch.locationEn : branch.location;
}

// أول رقم أوردر
const ORDER_CODE_START = 843;
