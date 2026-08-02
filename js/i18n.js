// ============================================================
// ترجمة واجهة الموقع (عربي / إنجليزي)
// ملاحظة: النصوص دي بتغطي كل عناصر الواجهة الثابتة (أزرار، عناوين،
// تسميات، رسايل تنبيه...). أسماء وأوصاف الأصناف والتصنيفات نفسها
// بتيجي من لوحة الأدمن زي ما هي، لأن مفيش نسخة إنجليزية متخزنة
// لكل صنف لسه في قاعدة البيانات.
// ============================================================

const I18N = {
  ar: {
    branchSelectTitle: "اختيار الفرع",
    branchSelectHint: "اختار أقرب فرع ليك",
    cartBtn: "🛒 السلة",
    cartTitle: "سلتك",
    total: "الإجمالي",
    checkoutBtn: "إتمام الطلب",
    productModalTitle: "تخصيص الطلب",
    addToCartBtn: "أضف للسلة",
    checkoutModalTitle: "إتمام الطلب",
    chooseOrderType: "اختار طريقة استلام طلبك",
    orderTypeCafe: "كافيه",
    orderTypeDelivery: "توصيل",
    orderTypePickup: "استلام",
    supportTitle: "الدعم",
    supportFormHint: "قبل ما نبدأ، محتاجين بياناتك",
    nameLabel: "الاسم",
    namePlaceholder: "اكتب اسمك",
    phoneLabel: "رقم الموبايل",
    startChatBtn: "ابدأ المحادثة",
    chatPlaceholder: "اكتب رسالتك...",
    browseSupport: "تواصل مع الدعم",
    browseLocation: "العنوان",
    locationModalTitle: "العنوان",
    locationSeeYouSoon: "See you soon !",
    browseInstall: "تثبيت التطبيق",
    browseAbout: "عننا",
    browseMessages: "الرسائل",
    browseLang: "اللغة / Language",
    menuTooltip: "القائمة",
    browseLabel: "بحث",
    browseChangeBranch: "تغيير الفرع",
    aboutSubtitle: "من نحن",
    messagesInboxTitle: "الرسائل",
    messagesInboxEmpty: "مفيش رسائل لسه",
    footer: "© Vitwar — كل الحقوق محفوظة 2026",

    categoryAll: "الكل",
    categoryOffers: "🎁 العروض",
    noProductsInCategory: "لا يوجد أصناف في هذا التصنيف حاليًا",
    noOffersInCategory: "لا يوجد عروض حاليًا",
    unavailableBadge: "غير متاح حاليًا",
    priceFrom: "من",
    currency: "ج.م",
    chooseBtn: "اختيار",
    qtyLabel: "الكمية",
    addonsTitle: "إضافات مميزة (اختياري)",

    browseGoogleSignIn: "تسجيل الدخول بـ Google",
    browseGoogleSignOut: "تسجيل الخروج",
    googleSignInError: "حصل خطأ في تسجيل الدخول، حاول تاني",
    googleSignInSuccess: "تم تسجيل الدخول بنجاح ✅",
    googleSignOutSuccess: "تم تسجيل الخروج",
    googleSignInUnavailable: "تسجيل الدخول مش متاح دلوقتي",

    emptyCart: "السلة فاضية دلوقتي",
    branchClosedMsg: "الفرع مقفول دلوقتي، مينفعش تطلب حاليًا. جرب تاني بعدين 🙏",
    statusBusyMsg: "🟠 المحل مشغول شوية دلوقتي — تقدر تطلب عادي وطلبك هيتنفذ أول ما يتاح",

    cafeNameLabel: "اسم الكافيه",
    cafeNamePlaceholder: "اسم الكافيه",
    addressLabel: "العنوان بالتفصيل",
    addressPlaceholder: "العنوان...",
    pickupTimeLabel: "الوقت المتوقع للاستلام",
    pickup15: "15 دقيقة",
    pickup30: "30 دقيقة",
    pickup60: "1 ساعة",
    mobileNumberLabel: "رقم موبايلك",
    paymentMethodLabel: "طريقة الدفع",
    paymentCash: "💵 كاش",
    paymentInstapay: "💳 انستاباي",
    commentLabel: "تعليق (اختياري)",
    commentPlaceholder: "أي ملاحظة على الطلب... (اختياري)",
    confirmOrderBtn: "تأكيد الطلب",
    backBtn: "رجوع",
    sendingOrderBtn: "جاري إرسال الطلب...",
    errCafeName: "من فضلك اكتب اسم الكافيه",
    errAddress: "من فضلك اكتب العنوان",
    errPhone: "من فضلك اكتب رقم موبايل صحيح",
    errPayment: "من فضلك اختار طريقة الدفع",
    errOrderGeneric: "حصل خطأ في إرسال الطلب، حاول تاني",
    orderSuccessBusy: "تم استلام طلبك وكوده #{code} ✅\nالمحل مشغول شوية دلوقتي، هيتم تجهيز طلبك أول ما يتاح.",
    orderSuccessMsg: "تم إرسال طلبك بنجاح ✅ كود طلبك #{code}",

    installIosMsg: 'لتثبيت التطبيق على آيفون/آيباد: دوس زرار المشاركة ⬆️ تحت في Safari، وبعدين اختار "إضافة إلى الشاشة الرئيسية".',
    installOtherMsg: 'افتح قائمة المتصفح (⋮ فوق يمين) وهتلاقي خيار "تثبيت التطبيق" أو "Install App" / "Install Vitwar".',

    supportSubtitleDefault: "الدعم",
    supportGreeting: "أهلاً {name}",
    supportStartingBtn: "جاري البدء...",
    supportErrName: "من فضلك اكتب اسمك",
    supportErrPhone: "من فضلك اكتب رقم موبايل صحيح",
    supportErrGeneric: "حصل خطأ، حاول تاني",
    supportChatClosedByAdmin: "الدعم قفل المحادثة دي 🔒",
    supportClosedNote: "🔒 المحادثة دي اتقفلت من الدعم",
    newChatBtn: "بدء محادثة جديدة",

    heroBranch1: "تجمع اول",
    heroBranch5: "تجمع خامس",
    aboutUsLabel: "About us",
    closedTitleBig: "الفرع مقفول دلوقتي",
    closedSubtitle: "هنكون في استقبالك تاني قريب — تقدر تختار فرع تاني دلوقتي",
    closedChangeBranchBtn: "اختيار فرع تاني",
    installSheetTitle: "ثبت تطبيق Vitwar",
    installSheetDesc: "ثبت تطبيق ڤيتوار للحصول على العروض",
    installNowBtn: "تثبيت",
    installLaterBtn: "مش دلوقتي",
    offerBadge: "🎁 عرض خاص",

    reviewsBadgeWord: "تقييم",
    reviewsModalTitle: "التقييمات",
    rateUsTitle: "قيّمنا",
    reviewCommentLabel: "تعليقك",
    reviewCommentPlaceholder: "اكتب رأيك في المكان...",
    submitReviewBtn: "إرسال التقييم",
    reviewSubmitSuccess: "شكرًا لتقييمك! ✅",
    reviewErrStars: "من فضلك اختار تقييمك بالنجوم",
    reviewErrName: "من فضلك اكتب اسمك",
    reviewErrComment: "من فضلك اكتب تعليقك",

    aboutParagraphs: [
      "فيتوار مش مجرد مطعم وكافيه... هو مطعم متخصص في الوافل والبان كيك والبراونيز والتشيز كيك وطواجن الكنافة، وبنحب فيه كل تفصيلة من أول اختيار المكونات لحد آخر لمسة في التقديم.",
      "بنؤمن إن كل مشروب وكل قطعة حلو لازم توصلك بنفس الحب اللي إحنا بنحضّرها بيه، عشان تحس بالفرق من أول رشفة.",
      "جايين بفروع جديدة قريب عشان نكون أقرب لك، وهنفضل دايمًا بنطور نفسنا عشان نقدملك الأحسن في كل مرة.",
    ],
  },
  en: {
    branchSelectTitle: "Choose your branch",
    branchSelectHint: "Pick the nearest branch to you",
    cartBtn: "🛒 Cart",
    cartTitle: "Your Cart",
    total: "Total",
    checkoutBtn: "Checkout",
    productModalTitle: "Customize order",
    addToCartBtn: "Add to cart",
    checkoutModalTitle: "Checkout",
    chooseOrderType: "Choose how you'd like to get your order",
    orderTypeCafe: "Cafe",
    orderTypeDelivery: "Delivery",
    orderTypePickup: "Pickup",
    supportTitle: "Support",
    supportFormHint: "Before we start, we need a couple of details",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    phoneLabel: "Mobile number",
    startChatBtn: "Start chat",
    chatPlaceholder: "Type your message...",
    browseSupport: "Contact support",
    browseLocation: "Location",
    locationModalTitle: "Location",
    locationSeeYouSoon: "See you soon !",
    browseInstall: "Install app",
    browseAbout: "About us",
    browseMessages: "Messages",
    browseLang: "Language / اللغة",
    menuTooltip: "Menu",
    browseLabel: "Browse",
    browseChangeBranch: "Change branch",
    aboutSubtitle: "About us",
    messagesInboxTitle: "Messages",
    messagesInboxEmpty: "No messages yet",
    footer: "© Vitwar — All rights reserved 2026",

    categoryAll: "All",
    categoryOffers: "🎁 Offers",
    noProductsInCategory: "No items in this category right now",
    noOffersInCategory: "No offers available right now",
    unavailableBadge: "Currently unavailable",
    priceFrom: "From",
    currency: "EGP",
    chooseBtn: "Choose",
    qtyLabel: "Quantity",
    addonsTitle: "Extra add-ons (optional)",

    browseGoogleSignIn: "Sign in with Google",
    browseGoogleSignOut: "Sign out",
    googleSignInError: "Something went wrong signing in, please try again",
    googleSignInSuccess: "Signed in successfully ✅",
    googleSignOutSuccess: "Signed out",
    googleSignInUnavailable: "Sign-in isn't available right now",

    emptyCart: "Your cart is empty right now",
    branchClosedMsg: "This branch is closed right now, you can't order at the moment. Please try again later 🙏",
    statusBusyMsg: "🟠 The place is a bit busy right now — you can still order and we'll get to it as soon as we can",

    cafeNameLabel: "Cafe name",
    cafeNamePlaceholder: "Cafe name",
    addressLabel: "Full address",
    addressPlaceholder: "Address...",
    pickupTimeLabel: "Expected pickup time",
    pickup15: "15 minutes",
    pickup30: "30 minutes",
    pickup60: "1 hour",
    mobileNumberLabel: "Your mobile number",
    paymentMethodLabel: "Payment method",
    paymentCash: "💵 Cash",
    paymentInstapay: "💳 InstaPay",
    commentLabel: "Comment (optional)",
    commentPlaceholder: "Any note on your order... (optional)",
    confirmOrderBtn: "Confirm order",
    backBtn: "Back",
    sendingOrderBtn: "Sending your order...",
    errCafeName: "Please enter the cafe name",
    errAddress: "Please enter the address",
    errPhone: "Please enter a valid mobile number",
    errPayment: "Please choose a payment method",
    errOrderGeneric: "Something went wrong sending your order, please try again",
    orderSuccessBusy: "Your order was received, code #{code} ✅\nThe place is a bit busy right now, we'll prep your order as soon as we can.",
    orderSuccessMsg: "Your order was sent successfully ✅ your code is #{code}",

    installIosMsg: 'To install the app on iPhone/iPad: tap the Share button ⬆️ in Safari, then choose "Add to Home Screen".',
    installOtherMsg: 'Open your browser menu (⋮ top right) and look for "Install App" / "Install Vitwar".',

    supportSubtitleDefault: "Support",
    supportGreeting: "Hi {name}",
    supportStartingBtn: "Starting...",
    supportErrName: "Please enter your name",
    supportErrPhone: "Please enter a valid mobile number",
    supportErrGeneric: "Something went wrong, please try again",
    supportChatClosedByAdmin: "Support closed this conversation 🔒",
    supportClosedNote: "🔒 This conversation has been closed by support",
    newChatBtn: "Start a new conversation",

    heroBranch1: "First Settlement",
    heroBranch5: "Fifth Settlement",
    aboutUsLabel: "About us",
    closedTitleBig: "This branch is closed right now",
    closedSubtitle: "We'll be back soon — you can pick another branch now",
    closedChangeBranchBtn: "Choose another branch",
    installSheetTitle: "Install the Vitwar app",
    installSheetDesc: "Install the Vitwar app to get our offers",
    installNowBtn: "Install",
    installLaterBtn: "Not now",
    offerBadge: "🎁 Special offer",

    reviewsBadgeWord: "reviews",
    reviewsModalTitle: "Reviews",
    rateUsTitle: "Rate us",
    reviewCommentLabel: "Your review",
    reviewCommentPlaceholder: "Share your experience...",
    submitReviewBtn: "Submit review",
    reviewSubmitSuccess: "Thanks for your review! ✅",
    reviewErrStars: "Please select a star rating",
    reviewErrName: "Please enter your name",
    reviewErrComment: "Please write your review",

    aboutParagraphs: [
      "Vitwar isn't just a restaurant and cafe — it's a restaurant specialized in waffles, pancakes, brownies, cheesecake, and kunafa trays, where we care about every little detail, from choosing the ingredients to the final touch on your order.",
      "We believe every drink and every dessert should reach you with the same love we put into making it, so you feel the difference from the very first sip.",
      "New branches are coming soon to be closer to you, and we'll keep raising the bar to give you the best experience every time.",
    ],
  },
};

function getSiteLang() {
  return localStorage.getItem("vitwar_lang") || detectDeviceLang();
}
function detectDeviceLang() {
  const nav = (navigator.language || navigator.userLanguage || "ar").toLowerCase();
  return nav.startsWith("ar") ? "ar" : "en";
}

// ---------- هيلبر ترجمة عام: t("key") أو t("key", {name: "..."}) ----------
function t(key, vars) {
  const dict = I18N[getSiteLang()] || I18N.ar;
  let str = dict[key] != null ? dict[key] : (I18N.ar[key] != null ? I18N.ar[key] : key);
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]);
    });
  }
  return str;
}

function applyLang(lang) {
  const dict = I18N[lang] || I18N.ar;
  localStorage.setItem("vitwar_lang", lang);

  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.body.style.direction = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] != null) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key] != null) el.setAttribute("placeholder", dict[key]);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (dict[key] != null) el.setAttribute("title", dict[key]);
  });

  // عنوان شات الدعم الفرعي: يترجم بس لو مفيش محادثة نشطة دلوقتي (عشان مايبوظش اسم العميل)
  const supportSub = document.getElementById("supportChatSubtitle");
  if (supportSub && typeof supportChatId !== "undefined" && !supportChatId) {
    supportSub.textContent = dict.supportSubtitleDefault;
  }

  // خانة اختيار اللغة نفسها
  const codeEn = document.getElementById("langCodeEn");
  const codeAr = document.getElementById("langCodeAr");
  if (codeEn && codeAr) {
    codeEn.classList.toggle("active", lang === "en");
    codeAr.classList.toggle("active", lang === "ar");
  }
  const browseLangValue = document.getElementById("browseLangValue");
  if (browseLangValue) browseLangValue.textContent = lang === "ar" ? "AR" : "EN";

  // إعادة رسم العناصر الديناميكية (كارت، سلة، فرع، حالة الفرع...) عشان تتحدث باللغة الجديدة
  if (typeof renderCartCount === "function") renderCartCount();
  if (typeof renderCategories === "function") renderCategories();
  if (typeof renderProducts === "function") renderProducts();
  if (typeof renderCartDrawer === "function") renderCartDrawer();
  if (typeof updateGoogleAuthUI === "function") updateGoogleAuthUI();
  if (typeof renderStatusStrip === "function") renderStatusStrip();
  if (typeof updateBranchBadge === "function") updateBranchBadge();
  // شاشة اختيار الفرع (أسماء/مواقع الفروع) + نصوص "عننا" + قائمة التقييمات
  // بيتحدثوا هنا عشان لو المستخدم غيّر اللغة وهو جوه الموقع، وبعدين رجع
  // لشاشة اختيار الفرع، يلاقي كل حاجة بنفس اللغة الجديدة
  if (typeof renderBranchOptions === "function") renderBranchOptions();
  if (typeof setAboutUsTexts === "function") setAboutUsTexts(lang);
  if (typeof renderLocationModal === "function") renderLocationModal();
  if (typeof renderReviewsList === "function") renderReviewsList();
  if (typeof renderRatingBadge === "function") renderRatingBadge();
}

// ---------- اسم الصنف/التصنيف باللغة الحالية (خانة عربي + خانة إنجليزي) ----------
function itemDisplayName(item) {
  if (!item) return "";
  const lang = getSiteLang();
  return (lang === "en" && item.nameEn && item.nameEn.trim()) ? item.nameEn : item.name;
}

// ---------- ترجمة تلقائية للوصف (خانة وحدة بالعربي بيتكتبها الأدمن، وبتتترجم من الموقع) ----------
const _vtTranslateCache = (() => {
  try { return JSON.parse(localStorage.getItem("vitwar_translate_cache") || "{}"); }
  catch (e) { return {}; }
})();
function _vtSaveTranslateCache() {
  try { localStorage.setItem("vitwar_translate_cache", JSON.stringify(_vtTranslateCache)); } catch (e) {}
}
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return "";
  if (targetLang === "ar") return text; // النص الأصلي مكتوب بالعربي من الأدمن
  const key = targetLang + "::" + text;
  if (_vtTranslateCache[key]) return _vtTranslateCache[key];
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (translated) {
      _vtTranslateCache[key] = translated;
      _vtSaveTranslateCache();
      return translated;
    }
  } catch (e) {}
  return text; // لو الترجمة فشلت (مثلاً مفيش إنترنت) بنرجع النص الأصلي
}
// بيملأ أي عنصر في الصفحة عليه data-translate بالنص المترجم (بدون ما يعطل عرض النص الأصلي الأول)
function applyAutoTranslate(el, text) {
  if (!el) return;
  el.textContent = text || "";
  const lang = getSiteLang();
  if (lang !== "en" || !text) return;
  translateText(text, "en").then((translated) => {
    if (el.isConnected) el.textContent = translated;
  });
}

function initLangSwitch() {
  applyLang(getSiteLang());
  const box = document.getElementById("langSwitch");
  if (!box || box.dataset.inited) return;
  box.dataset.inited = "1";
  box.addEventListener("click", () => {
    const current = getSiteLang();
    const next = current === "ar" ? "en" : "ar";
    box.classList.remove("lang-flip");
    void box.offsetWidth;
    box.classList.add("lang-flip");
    applyLang(next);
  });
}
document.addEventListener("DOMContentLoaded", initLangSwitch);
if (document.readyState === "interactive" || document.readyState === "complete") {
  initLangSwitch();
}
