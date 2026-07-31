// ============================================================
// إعدادات Firebase — لازم تعبيها انت عشان الموقع يشتغل
// ============================================================
// من غير الإعدادات دي، مفيش طريقة إن تحديث المنيو أو الطلبات
// يوصل لكل الناس (مش بس اللي فاتح نفس الجهاز). ده شرح الخطوات
// بالتفصيل موجود في ملف SETUP.md اللي جنب الملف ده.
//
// اختصار الخطوات:
// 1) روح https://console.firebase.google.com وسجل دخول بجيميل
// 2) Add project -> اديله اي اسم -> كمل الخطوات (من غير Google Analytics أسهل)
// 3) من صفحة المشروع دوس على أيقونة </> (Web app) وسجل اسم للتطبيق
// 4) هيديك كائن firebaseConfig زي اللي تحت بالظبط، انسخه هنا مكان القيم الوهمية
// 5) من القائمة الجانبية: Build -> Firestore Database -> Create database
//    اختار وضع "production" وأي location قريب (زي eur3)
// 6) من تبويب Rules في Firestore، الصق القواعد الموجودة في SETUP.md واعمل Publish
// 7) من القائمة الجانبية: Build -> Authentication -> Get started -> فعّل
//    "Email/Password" -> بعدين من تبويب Users ضيف اليوزرين دول بالظبط:
//      البريد: vitwar1@vitwar.local   -- كلمة المرور: mohand@vitwar
//      البريد: vitwar5@vitwar.local   -- كلمة المرور: mohand@vitwar
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCaUhqi3yW9wX4Zf67J5p-hz3TS_mX-KV0",
  authDomain: "vitwar-d31c4.firebaseapp.com",
  projectId: "vitwar-d31c4",
  storageBucket: "vitwar-d31c4.firebasestorage.app",
  messagingSenderId: "594139254005",
  appId: "1:594139254005:web:44d7ac1a039cb8a40909bc",
};
