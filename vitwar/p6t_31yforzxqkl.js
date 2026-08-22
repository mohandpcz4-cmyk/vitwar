// ============================================================
// حماية بسيطة من نسخ/حفظ محتوى الموقع (صفحة العميل بس)
// ============================================================
// ⚠️ ملاحظة مهمة: مفيش أي تقنية ويب توقف سكرين شوت جهاز حقيقي
// (موبايل أو كمبيوتر) — ده تحكم نظام التشغيل مش المتصفح. اللي جوه
// الملف ده بيمنع بس: تحديد/نسخ النص، حفظ/سحب الصور بسهولة، والنسخ
// من جوه أدوات المطور وقت ما تكون مفتوحة (تعتيم المحتوى).
(function () {
  document.body.classList.add("protect-content");

  // اللينك اللي بيتحول له أي حد يحاول يفتح أدوات المطور / الزرار اليمين
  var PROTECT_REDIRECT_URL = "https://vitwar.c2019.workers.dev";
  function redirectNow() {
    try { window.location.replace(PROTECT_REDIRECT_URL); } catch (err) { window.location.href = PROTECT_REDIRECT_URL; }
  }

  // منع الضغط بالزرار اليمين (قائمة "حفظ الصورة باسم") + تحويل مباشر
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    redirectNow();
  });

  // منع سحب أي صورة (Drag & Drop save)
  document.addEventListener(
    "dragstart",
    (e) => {
      if (e.target && e.target.tagName === "IMG") e.preventDefault();
    },
    true
  );

  // منع اختصارات النسخ/حفظ الصفحة/فتح أدوات المطور + تحويل مباشر عند F12 / Ctrl+Shift+I / Ctrl+U
  document.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase();
    const blockedWithCtrl = ["s", "c", "p"]; // حفظ / نسخ / طباعة
    const isF12 = k === "f12";
    const isDevtoolsCombo = (e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k); // أدوات المطور / الكونسول / فحص العنصر
    const isViewSource = (e.ctrlKey || e.metaKey) && k === "u"; // عرض مصدر الصفحة

    if (isF12 || isDevtoolsCombo || isViewSource) {
      e.preventDefault();
      redirectNow();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && blockedWithCtrl.includes(k)) {
      e.preventDefault();
    }
    if (k === "printscreen") {
      // مفيش طريقة نمنع بيها فعليًا، بس نقدر نمسح الكليب بورد فورًا كمحاولة تقليل الفايدة
      try { navigator.clipboard && navigator.clipboard.writeText(""); } catch (err) {}
    }
  });

  // ملحوظة: اتشال هنا كشف "فتح أدوات المطور" اللي كان بيعتمد على مقارنة حجم
  // النافذة الداخلي/الخارجي — كان بيدي إنذار كاذب (تعتيم الصفحة + نافذة تحذير)
  // في حالات عادية جدًا زي: فتح الكيبورد على الموبايل، تكبير/تصغير المتصفح
  // (Zoom)، أو شاشات بشريط أدوات كبير — مش بس لما أدوات المطور فعلاً مفتوحة.
})();
