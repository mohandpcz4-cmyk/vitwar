// ============================================================
// حماية بسيطة من نسخ/حفظ محتوى الموقع (صفحة العميل بس)
// ============================================================
// ⚠️ ملاحظة مهمة: مفيش أي تقنية ويب توقف سكرين شوت جهاز حقيقي
// (موبايل أو كمبيوتر) — ده تحكم نظام التشغيل مش المتصفح. اللي جوه
// الملف ده بيمنع بس: تحديد/نسخ النص، حفظ/سحب الصور بسهولة، والنسخ
// من جوه أدوات المطور وقت ما تكون مفتوحة (تعتيم المحتوى).
(function () {
  document.body.classList.add("protect-content");

  // منع الضغط بالزرار اليمين (قائمة "حفظ الصورة باسم")
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // منع سحب أي صورة (Drag & Drop save)
  document.addEventListener(
    "dragstart",
    (e) => {
      if (e.target && e.target.tagName === "IMG") e.preventDefault();
    },
    true
  );

  // منع اختصارات النسخ/حفظ الصفحة الشائعة (مش حماية 100%، بس بتقلل المحاولات العرضية)
  document.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase();
    const blockedWithCtrl = ["s", "u", "c", "p"]; // حفظ / مصدر الصفحة / نسخ / طباعة
    if ((e.ctrlKey || e.metaKey) && blockedWithCtrl.includes(k)) {
      e.preventDefault();
    }
    if (k === "printscreen") {
      // مفيش طريقة نمنع بيها فعليًا، بس نقدر نمسح الكليب بورد فورًا كمحاولة تقليل الفايدة
      try { navigator.clipboard && navigator.clipboard.writeText(""); } catch (err) {}
    }
  });

  // ---------- كشف فتح أدوات المطور (heuristic تقريبي مش 100% مضمون) ----------
  const warnBox = document.createElement("div");
  warnBox.className = "devtools-warning";
  warnBox.textContent = "🔒 المحتوى محمي — قفل أدوات المطور عشان تكمل تصفح الموقع.";
  document.body.appendChild(warnBox);

  const THRESHOLD = 160; // فرق بكسل بين حجم النافذة الخارجي والداخلي
  let wasOpen = false;
  setInterval(() => {
    const widthGap = window.outerWidth - window.innerWidth > THRESHOLD;
    const heightGap = window.outerHeight - window.innerHeight > THRESHOLD;
    const isOpen = widthGap || heightGap;
    if (isOpen !== wasOpen) {
      wasOpen = isOpen;
      document.body.classList.toggle("devtools-open", isOpen);
    }
  }, 700);
})();
