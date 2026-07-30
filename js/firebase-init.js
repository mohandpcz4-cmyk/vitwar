// ============================================================
// تشغيل Firebase (نسخة compat عشان تشتغل بملف HTML عادي من غير build tools)
// ============================================================
let db = null;
let auth = null;
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
  } else {
    console.warn(
      "Firebase مش متظبط لسه — عدّل js/firebase-config.js. الموقع هيشتغل محليًا (المتصفح ده بس) لحد ما تعمل الإعداد."
    );
  }
} catch (e) {
  console.error("Firebase init error:", e);
}

// أرقام الفروع الثابتة
const BRANCHES = {
  "1": {
    id: "1",
    name: "تجمع اول",
    location: "تجمع اول بنفسج 4",
    adminUser: "vitwar1",
    adminPass: "mohand@vitwar",
    authEmail: "vitwar1@vitwar.local",
    whatsapp: "201066403999",
  },
  "5": {
    id: "5",
    name: "تجمع خامس",
    location: "حي تاني - منطقة 5 - مول جراند بلازا - امام كافية جول",
    adminUser: "vitwar5",
    adminPass: "mohand@vitwar",
    authEmail: "vitwar5@vitwar.local",
    whatsapp: "201080802914",
  },
};

// أول رقم أوردر
const ORDER_CODE_START = 184;
