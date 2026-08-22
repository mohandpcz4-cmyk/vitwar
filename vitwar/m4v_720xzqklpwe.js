// ============================================================
// منطق صفحة العميل
// ============================================================

// ---------- قفل سكرول الصفحة اللي وراء أي نافذة/بانل مفتوح ----------
// (عدّاد عشان لو أكتر من نافذة مفتوحة فوق بعض، السكرول يفضل مقفول لحد ما كلهم يتقفلوا)
let openOverlaysCount = 0;
let savedScrollY = 0;
function lockBodyScroll() {
  openOverlaysCount++;
  if (openOverlaysCount === 1) {
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.documentElement.classList.add("no-scroll");
  }
}
function unlockBodyScroll() {
  openOverlaysCount = Math.max(0, openOverlaysCount - 1);
  if (openOverlaysCount === 0) {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.documentElement.classList.remove("no-scroll");
    window.scrollTo(0, savedScrollY);
  }
}

// ---------- فتح أي نافذة (مودال) بحيث تطلع من مكان الضغط لنص الشاشة ----------
function openModalPop(modalEl, triggerEl) {
  if (!modalEl) return;
  if (modalEl.classList.contains("open")) return; // متفتحش مرتين وتقفل السكرول مرتين
  const panel = modalEl.querySelector(".product-modal-panel");
  if (panel) {
    if (triggerEl && triggerEl.getBoundingClientRect) {
      const r = triggerEl.getBoundingClientRect();
      const originX = r.left + r.width / 2 - window.innerWidth / 2;
      const originY = r.top + r.height / 2 - window.innerHeight / 2;
      panel.style.setProperty("--origin-x", originX + "px");
      panel.style.setProperty("--origin-y", originY + "px");
    } else {
      panel.style.setProperty("--origin-x", "0px");
      panel.style.setProperty("--origin-y", "0px");
    }
  }
  modalEl.classList.remove("closing");
  modalEl.classList.add("open");
  lockBodyScroll();
}

function closeModalPop(modalEl) {
  if (!modalEl || !modalEl.classList.contains("open")) return;
  const panel = modalEl.querySelector(".product-modal-panel");
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    modalEl.classList.remove("open", "closing");
    panel?.removeEventListener("animationend", finish);
  };
  modalEl.classList.add("closing");
  unlockBodyScroll();
  if (panel) {
    panel.addEventListener("animationend", finish, { once: true });
  }
  setTimeout(finish, 400);
}

const state = {
  branchId: sessionStorage.getItem("vitwar_branch") || null,
  branchStatus: "open",
  deliveryEnabled: true,
  categories: [],
  products: [],
  offers: [],
  addons: [],
  activeCategory: "all",
  cart: JSON.parse(localStorage.getItem("vitwar_cart") || "[]"),
  modalProduct: null,
  modalIsOffer: false,
  modalSelection: { variants: {}, noPriceVariants: {}, addons: {}, qty: 1 },
  googleUser: null,
  customerProfile: null, // { uid, name, phone } - لما العميل يعمل تسجيل دخول بالرقم والباسورد
  checkoutType: null,
  paymentMethod: null,
  branchSyncUnsub: null,
  pendingAddonId: null,
};

// ---------- توفر الصنف: بياخد في الاعتبار الفلاج اليدوي وكمية المخزون ----------
function isProductAvailable(p) {
  if (!p) return false;
  if (p.available === false) return false;
  if (typeof p.stock === "number" && p.stock <= 0) return false;
  return true;
}

function sanitizeCart() {
  const valid = state.cart.filter(
    (i) => i && i.cartItemId && typeof i.unitPrice === "number" && i.name && i.image
  );
  valid.forEach((i) => {
    if (!Array.isArray(i.variantLabels)) i.variantLabels = [];
    if (!Array.isArray(i.noPriceLabels)) i.noPriceLabels = [];
    if (!Array.isArray(i.addonLabels)) i.addonLabels = [];
  });
  if (valid.length !== state.cart.length) {
    state.cart = valid;
    localStorage.setItem("vitwar_cart", JSON.stringify(state.cart));
  }
}
sanitizeCart();

// ---------- اختيار الفرع ----------
function renderBranchOptions() {
  const box = document.getElementById("branchOptions");
  box.innerHTML = Object.values(BRANCHES)
    .map(
      (b) => `
      <button class="branch-option-btn tap-fx" data-branch="${b.id}">
        <span class="branch-option-name">${branchName(b)}</span>
        <span class="branch-option-loc">${branchLocation(b)}</span>
      </button>`
    )
    .join("");
  box.querySelectorAll("[data-branch]").forEach((btn) => {
    btn.addEventListener("click", () => selectBranch(btn.dataset.branch));
  });
}

function updateBranchBadge() {
  const badge = document.getElementById("branchBadge");
  if (badge && state.branchId && BRANCHES[state.branchId]) {
    badge.textContent = branchName(BRANCHES[state.branchId]);
  }
}

function selectBranch(branchId) {
  state.branchId = branchId;
  sessionStorage.setItem("vitwar_branch", branchId);
  document.getElementById("branchSelectScreen").style.display = "none";
  document.getElementById("siteWrap").style.display = "block";
  updateBranchBadge();
  startBranchSync();
  startBroadcastListener(branchId);
  setupPushForBranch(branchId);
  if (typeof startPresenceHeartbeat === "function") startPresenceHeartbeat(branchId);
}

// ============================================================
// التقييمات (Reviews) — شاشة اختيار الفرع
// ============================================================
const RATING_COUNT_BASE = 764;
function getExtraReviewsCount() {
  return parseInt(localStorage.getItem("vitwar_extra_reviews_count") || "0", 10) || 0;
}
function bumpExtraReviewsCount() {
  const next = getExtraReviewsCount() + 1;
  localStorage.setItem("vitwar_extra_reviews_count", String(next));
  return next;
}
function getRatingCount() {
  if (firebaseReady) return RATING_COUNT_BASE + sharedReviewsCache.length;
  return RATING_COUNT_BASE + getExtraReviewsCount();
}

// ---------- تاريخ التقييمات الديناميكي ----------
// كل تقييم تجريبي عنده "daysAgo" (عمره بالأيام وقت الإطلاق)، وبنحسب من نقطة مرجعية ثابتة
// عشان التاريخ يزيد لوحده مع الوقت الحقيقي (مثلاً "من 3 أيام" تبقى "من 4 أيام" بعد 24 ساعة تلقائياً)
const REVIEWS_EPOCH = new Date("2026-08-02T00:00:00Z").getTime();

function formatRelativeTime(daysAgo, lang) {
  const elapsedDays = Math.floor((Date.now() - REVIEWS_EPOCH) / 86400000);
  const days = Math.max(0, (daysAgo || 0) + elapsedDays);
  const isEn = lang === "en";
  if (days <= 0) return isEn ? "Just now" : "الآن";
  if (days === 1) return isEn ? "1 day ago" : "من يوم";
  if (days === 2) return isEn ? "2 days ago" : "من يومين";
  if (days < 7) return isEn ? `${days} days ago` : `من ${days} أيام`;
  const weeks = Math.round(days / 7);
  if (days < 30) {
    if (weeks === 1) return isEn ? "1 week ago" : "من أسبوع";
    if (weeks === 2) return isEn ? "2 weeks ago" : "من أسبوعين";
    return isEn ? `${weeks} weeks ago` : `من ${weeks} أسابيع`;
  }
  const months = Math.round(days / 30);
  if (days < 365) {
    if (months === 1) return isEn ? "1 month ago" : "من شهر";
    if (months === 2) return isEn ? "2 months ago" : "من شهرين";
    return isEn ? `${months} months ago` : `من ${months} شهور`;
  }
  const years = Math.round(days / 365);
  if (years === 1) return isEn ? "1 year ago" : "من سنة";
  return isEn ? `${years} years ago` : `من ${years} سنين`;
}

// نفس الحساب لكن بناءً على وقت إرسال تقييم حقيقي من عميل (createdAt) بدل daysAgo ثابت
function formatReviewTimeFromCreatedAt(createdAt, lang) {
  const days = Math.floor((Date.now() - (createdAt || Date.now())) / 86400000);
  return formatRelativeTime(days, lang);
}

// ---------- متوسط التقييم ونسب النجوم — بيتحسبوا ديناميك من التقييمات الفعلية بدل رقم ثابت ----------
function computeRatingStats() {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  SEED_REVIEWS.forEach((r) => { counts[r.stars] = (counts[r.stars] || 0) + 1; });
  const extra = getExtraReviews();
  extra.forEach((r) => { counts[r.stars] = (counts[r.stars] || 0) + 1; });
  const total = SEED_REVIEWS.length + extra.length;
  let sum = 0;
  for (let s = 1; s <= 5; s++) sum += s * counts[s];
  const avg = total ? sum / total : 0;
  const breakdown = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    pct: total ? Math.round((counts[s] / total) * 100) : 0,
  }));
  return { avg, breakdown, total };
}

// تقييمات تجريبية (Seed) — نصوص عربي/إنجليزي عشان تتحدث مع اللغة
const SEED_REVIEWS = [
  { name: "منى عادل", stars: 5, textAr: "المكان تحفة والطلبات بتوصل بسرعة، الحلويات فطلقة حلاوة 😍", textEn: "Lovely place and fast delivery, the desserts are amazing 😍", daysAgo: 3 },
  { name: "Ahmed Nabil", stars: 5, textAr: "أحسن مطعم وافل وبان كيك في المنطقة من ناحية الطعم والخدمة", textEn: "Best waffle & pancake restaurant in the area, great taste and service", daysAgo: 7 },
  { name: "سارة يوسف", stars: 4, textAr: "طعم جميل بس التغليف ممكن يتحسن شوية", textEn: "Great taste, packaging could be a bit better", daysAgo: 14 },
  { name: "Karim Hossam", stars: 5, textAr: "بجد بحب الوافل بالنوتيلا بتاعهم، طلبت أكتر من مرة", textEn: "I really love their Nutella waffle, ordered more than once", daysAgo: 21 },
  { name: "نورهان طارق", stars: 5, textAr: "خدمة سريعة واهتمام بالتفاصيل، شكراً فيتوار", textEn: "Fast service and attention to detail, thank you Vitwar", daysAgo: 30 },
  { name: "Mostafa Adel", stars: 4, textAr: "جودة كويسة والأسعار مناسبة", textEn: "Good quality and fair prices", daysAgo: 30 },
  { name: "ياسمين عمرو", stars: 5, textAr: "من أفضل تجارب التوصيل اللي جربتها، هطلب تاني أكيد", textEn: "One of the best delivery experiences I've had, will order again", daysAgo: 60 },
  { name: "Hassan Ali", stars: 3, textAr: "الطلب اتأخر شوية بس الطعم عوّض", textEn: "Order was a bit late but the taste made up for it", daysAgo: 60 },
  { name: "دينا محمود", stars: 5, textAr: "المكان نضيف والطاقم لطيف جداً", textEn: "The place is clean and the staff are very friendly", daysAgo: 90 },
  { name: "Omar Khaled", stars: 4, textAr: "تجربة حلوة عموماً، هكرر تاني", textEn: "Overall a nice experience, will come back", daysAgo: 90 },
  { name: "Mostafa Adel", stars: 5, textAr: "المكان تحفة والطلبات بتوصل بسرعة، تجربة رهيبة 😍", textEn: "Lovely place, orders arrive fast — amazing experience 😍", daysAgo: 21 },
  { name: "Rana Magdy", stars: 5, textAr: "أحسن مطعم وافل وبان كيك جربته من ناحية الطعم والخدمة", textEn: "Best waffle & pancake restaurant I've tried in terms of taste and service", daysAgo: 90 },
  { name: "Sherif Adham", stars: 5, textAr: "بجد بحب الحلويات بتاعتهم، طلبت أكتر من مرة ومحصلش خيبة أمل", textEn: "I really love their desserts, ordered many times and never disappointed", daysAgo: 180 },
  { name: "Farida Mohamed", stars: 5, textAr: "خدمة سريعة واهتمام بالتفاصيل، شكراً فيتوار ❤", textEn: "Fast service and attention to detail, thank you Vitwar ❤", daysAgo: 4 },
  { name: "Dalia Fouad", stars: 5, textAr: "من أفضل تجارب التوصيل اللي جربتها، هطلب تاني أكيد", textEn: "One of the best delivery experiences I've had, will order again for sure", daysAgo: 21 },
  { name: "Hedeer Mostafa", stars: 5, textAr: "المكان نضيف والطاقم لطيف جداً ومحترم", textEn: "The place is clean and the staff are very kind and respectful", daysAgo: 90 },
  { name: "Peter Nabil", stars: 5, textAr: "الطعم فوق الوصف، والتغليف أنيق جداً", textEn: "The taste is beyond words, and the packaging is very elegant", daysAgo: 180 },
  { name: "Jihad Adel", stars: 5, textAr: "جربت البان كيك والتشيز كيك وكانوا رائعين", textEn: "Tried the pancakes and cheesecake, both were fantastic", daysAgo: 4 },
  { name: "Verina Nabil", stars: 5, textAr: "سعر مناسب مقابل الجودة العالية اللي بتقدمها", textEn: "Fair price for the high quality they offer", daysAgo: 21 },
  { name: "Mostafa Adel", stars: 5, textAr: "فريق العمل بشوش ومتعاون جداً، تجربة ممتعة", textEn: "The staff are friendly and cooperative, a delightful experience", daysAgo: 90 },
  { name: "رنا مجدي", stars: 5, textAr: "الطلب وصل ساخن ومظبوط في معاده بالظبط", textEn: "The order arrived hot and right on time", daysAgo: 180 },
  { name: "Sherif Adham", stars: 5, textAr: "مكاني المفضل للقعدة مع صحابي، الجو حلو أوي", textEn: "My favorite spot to hang out with friends, the vibe is amazing", daysAgo: 4 },
  { name: "فريدة محمد", stars: 5, textAr: "لسه بجرب حاجات جديدة من المنيو وكل حاجة بتعجبني", textEn: "Still trying new items from the menu and loving everything", daysAgo: 21 },
  { name: "Dalia Fouad", stars: 5, textAr: "تصميم المكان جميل والإضاءة مريحة جداً للعين", textEn: "The place design is beautiful and the lighting is very comfortable", daysAgo: 90 },
  { name: "هدير مصطفى", stars: 5, textAr: "خدمة العملاء ردت عليا بسرعة وحلت مشكلتي فوراً", textEn: "Customer service replied quickly and solved my issue instantly", daysAgo: 180 },
  { name: "Peter Nabil", stars: 5, textAr: "الحلويات هنا مالهاش حل، خصوصاً البراونيز", textEn: "The desserts here are unbeatable, especially the brawnies", daysAgo: 4 },
  { name: "جهاد عادل", stars: 5, textAr: "بطلب منهم كل أسبوع، جودة ثابتة من غير ما تقل", textEn: "I order from them every week, consistent quality that never drops", daysAgo: 21 },
  { name: "Verina Nabil", stars: 5, textAr: "الكنافة بتاعتهم من أحلى كنافة اكلتها في حياتي", textEn: "Their kunafa is some of the best I've ever had", daysAgo: 90 },
  { name: "Mostafa Adel", stars: 5, textAr: "التطبيق سهل الاستخدام والطلب بياخد ثواني بس", textEn: "The app is easy to use and ordering takes just seconds", daysAgo: 180 },
  { name: "Rana Magdy", stars: 5, textAr: "عندهم عروض حلوة ومتجددة باستمرار", textEn: "They have great and constantly updated offers", daysAgo: 4 },
  { name: "Sherif Adham", stars: 5, textAr: "التوصيل كان أسرع من المتوقع بكتير", textEn: "Delivery was much faster than expected", daysAgo: 21 },
  { name: "Farida Mohamed", stars: 5, textAr: "جو المكان يخلي أي زيارة تبقى مميزة", textEn: "The atmosphere makes every visit feel special", daysAgo: 90 },
  { name: "Dalia Fouad", stars: 5, textAr: "أول مرة أزور وحبيت التجربة من كل النواحي", textEn: "First visit and I loved the experience in every way", daysAgo: 180 },
  { name: "Hedeer Mostafa", stars: 5, textAr: "النكهات مبتكرة وفيها لمسة مختلفة عن أي مكان تاني", textEn: "The flavors are creative with a unique twist you won't find elsewhere", daysAgo: 4 },
  { name: "Peter Nabil", stars: 5, textAr: "عيلتي كلها بقت بتطلب من هنا بقالها شهور", textEn: "My whole family has been ordering from here for months", daysAgo: 21 },
  { name: "Jihad Adel", stars: 5, textAr: "الأسعار معقولة جداً بالنسبة لجودة المنتج", textEn: "Very reasonable prices for the product quality", daysAgo: 90 },
  { name: "Verina Nabil", stars: 5, textAr: "حبيت إنهم بيردوا بسرعة على أي استفسار", textEn: "I loved how quickly they respond to any inquiry", daysAgo: 180 },
  { name: "Mostafa Adel", stars: 5, textAr: "البراونيز بتاعتهم لذيذة جداً في أي وقت", textEn: "Their brownies are amazing any time", daysAgo: 4 },
  { name: "رنا مجدي", stars: 5, textAr: "تجربة تستاهل كل نجومها، هرجع تاني أكيد", textEn: "An experience that deserves every star, I'll definitely be back", daysAgo: 21 },
  { name: "Sherif Adham", stars: 5, textAr: "بصراحة فاق توقعاتي، وربنا يوفقهم دايماً", textEn: "Honestly exceeded my expectations, wishing them continued success", daysAgo: 90 },
  { name: "Hazem Nasser", stars: 4, textAr: "المكان كويس بس مواعيد التوصيل ممكن تتظبط أكتر", textEn: "The place is good but delivery times could be more consistent", daysAgo: 3 },
  { name: "أحمد سامي", stars: 4, textAr: "الطعم حلو بس كنت متوقع كمية أكبر شوية", textEn: "Nice taste, though I expected a slightly bigger portion", daysAgo: 14 },
  { name: "Adham Fekry", stars: 4, textAr: "خدمة لطيفة لكن الزحمة بتأخر الطلب أحياناً", textEn: "Nice service but the crowd sometimes delays the order", daysAgo: 60 },
  { name: "نور الهدى خالد", stars: 4, textAr: "الطبق وصل سخن ولذيذ، بس ياريت التوصيل يكون أسرع شوية", textEn: "The dish arrived hot and delicious, just wish delivery was a bit faster", daysAgo: 150 },
  { name: "Hany Fawzy", stars: 4, textAr: "عموماً تجربة كويسة وهعاود اطلب تاني", textEn: "Overall a good experience and I'll order again", daysAgo: 3 },
  { name: "سيف الدين", stars: 4, textAr: "الأسعار حلوة بس ممكن يزودوا خيارات المنيو", textEn: "Good prices but menu options could be expanded", daysAgo: 14 },
  { name: "Nourhan Tarek", stars: 4, textAr: "حبيت المكان لكن مفيش أماكن جلوس كتير", textEn: "Liked the place but there isn't a lot of seating", daysAgo: 60 },
  { name: "Youssef Tarek", stars: 4, textAr: "التطبيق شغال كويس عدا شوية بطء أحياناً", textEn: "The app works well aside from occasional slowness", daysAgo: 150 },
  { name: "Aya Gamal", stars: 4, textAr: "الطلب كان مظبوط بس اتأخر شوية عن الميعاد", textEn: "The order was correct but arrived a bit late", daysAgo: 3 },
  { name: "Hazem Nasser", stars: 4, textAr: "الطعم جيد جداً، بس محتاجين يزودوا تنوع النكهات", textEn: "Taste is very good, just needs more flavor variety", daysAgo: 14 },
  { name: "Ahmed Samy", stars: 4, textAr: "خدمة جيدة وسعر مناسب، تجربة تستاهل التكرار", textEn: "Good service and fair price, worth repeating", daysAgo: 60 },
  { name: "Adham Fekry", stars: 4, textAr: "عجبني الاهتمام بالتفاصيل رغم بعض التأخير البسيط", textEn: "I liked the attention to detail despite a minor delay", daysAgo: 150 },
  { name: "Nour Elhoda Khaled", stars: 4, textAr: "النظافة كويسة والطاقم متعاون بشكل عام", textEn: "Cleanliness is good and staff are generally cooperative", daysAgo: 3 },
  { name: "Hany Fawzy", stars: 4, textAr: "تجربة مرضية، وفي مجال بسيط للتحسين في التغليف", textEn: "Satisfying experience, with slight room to improve packaging", daysAgo: 14 },
  { name: "Seif Eldin", stars: 4, textAr: "الطعم قريب من الممتاز، محتاج بس لمسة نهائية", textEn: "Taste is close to excellent, just needs a final touch", daysAgo: 60 },
  { name: "نورهان طارق", stars: 4, textAr: "سعر معقول وجودة كويسة، هجربه تاني قريب", textEn: "Reasonable price and good quality, I'll try it again soon", daysAgo: 150 },
  { name: "Youssef Tarek", stars: 4, textAr: "المكان مريح والخدمة سريعة في أغلب الأوقات", textEn: "The place is comfortable and service is fast most of the time", daysAgo: 3 },
  { name: "Menna Allah Sami", stars: 3, textAr: "متوسط بشكل عام، ممكن يتحسن في سرعة التوصيل", textEn: "Average overall, delivery speed could improve", daysAgo: 30 },
  { name: "Mahmoud Yasser", stars: 3, textAr: "الطعم كويس بس التغليف اتفتح وقت التوصيل", textEn: "Taste was fine but the packaging opened during delivery", daysAgo: 120 },
  { name: "Salma Ibrahim", stars: 3, textAr: "الخدمة عادية والانتظار كان أطول من المتوقع", textEn: "Service was average and the wait was longer than expected", daysAgo: 2 },
  { name: "Lina Sameh", stars: 3, textAr: "تجربة مقبولة، لكن محتاجة تحسينات في التنظيم", textEn: "An acceptable experience, but needs improvements in organization", daysAgo: 7 },
];

function getLocalReviews() {
  try { return JSON.parse(localStorage.getItem("vitwar_local_reviews") || "[]"); }
  catch (e) { return []; }
}
function saveLocalReview(review) {
  const list = getLocalReviews();
  list.unshift(review);
  try { localStorage.setItem("vitwar_local_reviews", JSON.stringify(list.slice(0, 50))); } catch (e) {}
}

// لو فايربيز شغال، بنبعت التقييم لكولكشن عامة (reviews) عشان يبقى مشترك بين كل العملاء
async function pushReviewToFirestore(review) {
  try {
    if (!firebaseReady || !db) return false;
    await db.collection("reviews").add({
      name: review.name,
      stars: review.stars,
      comment: review.text,
      createdAt: Date.now(),
    });
    return true;
  } catch (e) {
    // بيفشل غالبًا لو قواعد Firestore (Rules) متظبطتش صح لكولكشن reviews - شوف SETUP.md
    console.error("Review save error:", e);
    return false;
  }
}

// ---------- كاش التقييمات المشتركة (بتتحدث لحظيًا من subscribeAllReviews) ----------
// ده اللي بيخلي أي تقييم جديد يتخزن ويبان لكل العملاء على أي جهاز، مش بس اللي كتبه
// (بدل ما كان بيتخزن في localStorage بس وميبانش غير عند اللي كتبه هو).
let sharedReviewsCache = [];
function getExtraReviews() {
  if (firebaseReady) {
    return sharedReviewsCache.map((r) => ({
      name: r.name,
      stars: r.stars,
      text: r.comment,
      createdAt: r.createdAt,
    }));
  }
  return getLocalReviews();
}
function startReviewsSubscription() {
  if (!firebaseReady) return;
  subscribeAllReviews((reviews) => {
    sharedReviewsCache = reviews;
    renderRatingBadge();
    renderReviewsBars();
    renderReviewsList();
  });
}

function renderRatingBadge() {
  const avg = document.getElementById("ratingAvgText");
  const count = document.getElementById("ratingCountText");
  const modalCount = document.getElementById("reviewsModalCount");
  const modalScore = document.getElementById("reviewsSummaryScore");
  const ratingCount = getRatingCount();
  const stats = computeRatingStats();
  if (avg) avg.textContent = stats.avg.toFixed(1);
  if (count) count.textContent = String(ratingCount);
  if (modalCount) modalCount.textContent = String(ratingCount);
  if (modalScore) modalScore.textContent = stats.avg.toFixed(1);
}

function renderReviewsBars() {
  const box = document.getElementById("reviewsBars");
  if (!box) return;
  const stats = computeRatingStats();
  box.innerHTML = stats.breakdown.map(
    (r) => `
      <div class="reviews-bar-row">
        <span class="bar-label">${r.stars}★</span>
        <span class="reviews-bar-track"><span class="reviews-bar-fill" style="width:${r.pct}%"></span></span>
        <span class="bar-pct">${r.pct}%</span>
      </div>`
  ).join("");
}

function renderReviewsList() {
  const box = document.getElementById("reviewsList");
  if (!box) return;
  const lang = getSiteLang();
  const local = getExtraReviews().map((r) => ({
    name: r.name,
    stars: r.stars,
    text: r.text,
    time: formatReviewTimeFromCreatedAt(r.createdAt, lang),
  }));
  const seeded = SEED_REVIEWS.map((r) => ({
    name: r.name,
    stars: r.stars,
    text: lang === "en" ? r.textEn : r.textAr,
    time: formatRelativeTime(r.daysAgo, lang),
  }));
  const all = [...local, ...seeded];
  box.innerHTML = all
    .map(
      (r) => `
      <div class="review-item">
        <span class="review-item-avatar">${escapeHtml((r.name || "?").trim().charAt(0).toUpperCase())}</span>
        <div class="review-item-content">
          <div class="review-item-top">
            <span class="review-item-name">${escapeHtml(r.name)}</span>
            <span class="review-item-stars">${"★".repeat(r.stars)}${"✩".repeat(5 - r.stars)}</span>
          </div>
          <div class="review-item-text">${escapeHtml(r.text)}</div>
          <div class="review-item-time">${escapeHtml(r.time)}</div>
        </div>
      </div>`
    )
    .join("");
}

// ---------- اختيار النجوم في "قيّمنا" ----------
let selectedReviewStars = 0;
function renderRateUsStars() {
  document.querySelectorAll("#rateUsStars .rate-star").forEach((el) => {
    const val = Number(el.dataset.val);
    el.textContent = val <= selectedReviewStars ? "★" : "✩";
    el.classList.toggle("filled", val <= selectedReviewStars);
  });
}
document.querySelectorAll("#rateUsStars .rate-star").forEach((el) => {
  el.addEventListener("click", () => {
    selectedReviewStars = Number(el.dataset.val);
    renderRateUsStars();
  });
});

document.getElementById("submitReviewBtn")?.addEventListener("click", async () => {
  const errEl = document.getElementById("reviewFormError");
  const nameInput = document.getElementById("reviewNameInput");
  const commentInput = document.getElementById("reviewCommentInput");
  if (errEl) errEl.textContent = "";

  if (!isCustomerAuthed()) {
    closeModalPop(document.getElementById("reviewsModal"));
    await siteAlert(t("loginRequiredReview"));
    await googleSignIn();
    return;
  }

  if (!selectedReviewStars) {
    if (errEl) errEl.textContent = t("reviewErrStars");
    return;
  }
  const name = (nameInput?.value || "").trim();
  if (!name) {
    if (errEl) errEl.textContent = t("reviewErrName");
    return;
  }
  const comment = (commentInput?.value || "").trim();
  if (!comment) {
    if (errEl) errEl.textContent = t("reviewErrComment");
    return;
  }
  // مفيش مشروبات في المنيو - نمنع أي كومنت بيتكلم عن مشروبات/قهوة/شاي... إلخ
  const DRINK_KEYWORDS = [
    "مشروب", "مشروبات", "قهوة", "كابتشينو", "لاتيه", "اسبريسو", "إسبريسو", "نسكافيه",
    "شاي", "عصير", "عصائر", "سموذي", "ميلك شيك", "ميلكشيك", "كولا", "بيبسي", "مشروبات باردة", "مشروبات ساخنة",
    "drink", "drinks", "coffee", "cappuccino", "latte", "espresso", "tea", "juice", "smoothie", "milkshake", "soda",
  ];
  const commentLower = comment.toLowerCase();
  const hasDrinkMention = DRINK_KEYWORDS.some((kw) => commentLower.includes(kw.toLowerCase()));
  if (hasDrinkMention) {
    if (errEl) errEl.textContent = t("reviewErrDrinks");
    return;
  }

  const review = {
    name,
    stars: selectedReviewStars,
    text: comment,
    createdAt: Date.now(),
  };
  let saved = true;
  if (firebaseReady) {
    saved = await pushReviewToFirestore(review);
    if (!saved) {
      // فشل الحفظ المشترك (على الأغلب قواعد Firestore) - نحفظه محلي على الأقل عشان مايضيعش
      saveLocalReview(review);
      bumpExtraReviewsCount();
    }
  } else {
    saveLocalReview(review);
    bumpExtraReviewsCount();
  }
  renderRatingBadge();
  renderReviewsList();

  // تصفير الفورم
  selectedReviewStars = 0;
  renderRateUsStars();
  if (nameInput) nameInput.value = "";
  if (commentInput) commentInput.value = "";
  if (saved) {
    showToast(t("reviewSubmitSuccess"), "success");
  } else {
    showToast(t("reviewSubmitLocalOnly"), "info");
  }
});

// ---------- فتح/قفل مودال التقييمات ----------
document.getElementById("branchRatingBtn")?.addEventListener("click", (e) => {
  renderReviewsBars();
  renderReviewsList();
  const nameInput = document.getElementById("reviewNameInput");
  if (nameInput && !nameInput.value && state.customerProfile) nameInput.value = state.customerProfile.name || "";
  openModalPop(document.getElementById("reviewsModal"), e.currentTarget);
});
document.getElementById("closeReviewsModal")?.addEventListener("click", () => {
  closeModalPop(document.getElementById("reviewsModal"));
});
document.getElementById("reviewsModalOverlay")?.addEventListener("click", () => {
  closeModalPop(document.getElementById("reviewsModal"));
});

// ---------- نصوص "About us" (شاشة اختيار الفرع + مودال عننا) حسب اللغة ----------
function setAboutUsTexts(lang) {
  const dict = I18N[lang] || I18N.ar;
  const paragraphs = Array.isArray(dict.aboutParagraphs) ? dict.aboutParagraphs : [];
  const html = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  const heroAbout = document.getElementById("branchAboutBody");
  const modalAbout = document.getElementById("aboutUsBody");
  if (heroAbout && html) heroAbout.innerHTML = html;
  if (modalAbout && html) modalAbout.innerHTML = html;
}

// ---------- مودال "العنوان" — iframe الخريطة + عنوان الفرع حسب اللغة، مختلف لكل فرع ----------
function renderLocationModal() {
  const branch = typeof BRANCHES !== "undefined" ? BRANCHES[state.branchId] : null;
  const iframe = document.getElementById("locationMapIframe");
  const addressEl = document.getElementById("locationAddressText");
  const openMapsLink = document.getElementById("locationOpenMapsLink");
  // ملحوظة مهمة: متسيبش iframe.src يبقى "" فاضي — المتصفح بيتعامل معاها كإعادة تحميل
  // نفس صفحة الموقع جوه الـ iframe نفسه (جلتش "نافذة جوه نافذة" متداخلة). لو مفيش
  // لينك خريطة لسه، خليها "about:blank" بدل الفاضي.
  if (iframe) iframe.src = (branch && branch.locationMapUrl) ? branch.locationMapUrl : "about:blank";
  if (addressEl) addressEl.textContent = branch ? branchLocation(branch) : "";
  // زرار احتياطي دايمًا شغال يفتح خرائط جوجل مباشرة في تاب جديد، بغض النظر عن أي
  // مشكلة في تحميل الـ iframe بتاع الخريطة المصغّرة (بعض المتصفحات بترفض تحميل
  // خرائط جوجل جوه iframe حسب سياسات الخصوصية بتاعتها).
  if (openMapsLink) {
    const query = branch ? branchLocation(branch) : "";
    openMapsLink.href = query
      ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query)
      : "https://www.google.com/maps";
  }
}

// ---------- تفعيل Push Notifications (FCM) للفرع الحالي ----------
async function setupPushForBranch(branchId) {
  if (!("Notification" in window) || typeof registerFcmToken !== "function") return;
  if (Notification.permission === "granted") {
    registerFcmToken(branchId);
  } else if (Notification.permission === "default") {
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") registerFcmToken(branchId);
    } catch (e) {}
  }
}

function goToBranchSelect() {
  if (state.branchId && typeof clearSupportSession === "function") {
    clearSupportSession(state.branchId);
  }
  if (state.branchSyncUnsub) {
    try { state.branchSyncUnsub(); } catch (e) {}
    state.branchSyncUnsub = null;
  }
  if (broadcastUnsub) {
    try { broadcastUnsub(); } catch (e) {}
    broadcastUnsub = null;
  }
  sessionStorage.removeItem("vitwar_branch");
  localStorage.removeItem("vitwar_cart");
  state.cart = [];
  state.branchId = null;
  state.branchStatus = "open";
  state.deliveryEnabled = true;
  if (typeof renderCartCount === "function") renderCartCount();
  showClosedBanner(false);
  document.getElementById("siteWrap").style.display = "none";
  document.getElementById("branchSelectScreen").style.display = "block";
}
document.getElementById("browseChangeBranchBtn")?.addEventListener("click", () => {
  closeBrowseMenu();
  goToBranchSelect();
});

// ---------- الثيم ----------
function applyTheme(theme, animate) {
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("vitwar_theme", theme);
  const icon = document.getElementById("browseThemeIcon");
  const iconImg = document.getElementById("browseThemeIconImg");
  const text = document.getElementById("browseThemeText");
  const pill = document.getElementById("browseThemeToggle");
  if (iconImg) {
    iconImg.src = theme === "dark" ? "images/icons/emoji-sun.gif" : "images/icons/emoji-moon.gif";
    iconImg.alt = theme === "dark" ? "☀️" : "🌙";
  } else if (icon) {
    icon.textContent = theme === "dark" ? "☀️" : "🌙";
  }
  if (text) text.textContent = theme === "dark" ? "Dark Mode" : "Light Mode";
  if (pill && animate) {
    pill.classList.remove("flip");
    void pill.offsetWidth;
    pill.classList.add("flip");
  }
}
function initTheme() {
  const saved = localStorage.getItem("vitwar_theme");
  const preferred = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(preferred, false);
}
document.getElementById("browseThemeToggle")?.addEventListener("click", () => {
  const current = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(current, true);
});

// ---------- قائمة Browse (⋮) ----------
function openBrowseMenu() {
  document.getElementById("browseMenuOverlay").classList.add("open");
  document.getElementById("browseMenuPanel").classList.remove("closing");
  document.getElementById("browseMenuPanel").classList.add("open");
  lockBodyScroll();
}
function closeBrowseMenu() {
  const panel = document.getElementById("browseMenuPanel");
  const overlay = document.getElementById("browseMenuOverlay");
  if (!panel.classList.contains("open")) return;
  panel.classList.add("closing");
  panel.classList.remove("open");
  overlay.classList.remove("open");
  unlockBodyScroll();
  setTimeout(() => panel.classList.remove("closing"), 250);
}
document.getElementById("browseMenuBtn")?.addEventListener("click", openBrowseMenu);
document.getElementById("closeBrowseMenu")?.addEventListener("click", closeBrowseMenu);
document.getElementById("browseMenuOverlay")?.addEventListener("click", closeBrowseMenu);
document.getElementById("browseLangBtn")?.addEventListener("click", () => {
  document.getElementById("langSwitch")?.click();
});

// ---------- تسجيل الدخول بـ Google (للعميل) ----------
function updateGoogleAuthUI() {
  const label = document.getElementById("browseGoogleAuthLabel");
  if (!label) return;
  if (state.googleUser) {
    label.textContent = state.googleUser.name || state.googleUser.email || t("browseGoogleSignOut");
    label.removeAttribute("data-i18n");
  } else {
    label.setAttribute("data-i18n", "browseGoogleSignIn");
    label.textContent = t("browseGoogleSignIn");
  }
  updateBranchLoginBox();
}

// ---------- خانة تسجيل الدخول في شاشة اختيار الفرع ----------
function isCustomerAuthed() {
  return !!(state.googleUser || state.customerProfile);
}

function updateBranchLoginBox() {
  const titleEl = document.getElementById("branchLoginBoxTitle");
  const subEl = document.getElementById("branchLoginBoxSub");
  const actionsEl = document.getElementById("branchLoginBoxActions");
  if (!titleEl || !subEl || !actionsEl) return;
  const name = (state.customerProfile && state.customerProfile.name) || (state.googleUser && state.googleUser.name) || "";
  if (isCustomerAuthed()) {
    titleEl.removeAttribute("data-i18n");
    titleEl.textContent = name ? `${t("branchLoginBoxWelcome")} ${name} 👋` : t("branchLoginBoxWelcomeNoName");
    subEl.removeAttribute("data-i18n");
    subEl.textContent = t("branchLoginBoxSubIn");
    actionsEl.innerHTML = `<button class="glass-btn-secondary glass-btn tap-fx branch-login-box-btn" id="branchLoginBoxLogoutBtn">${t("browseGoogleSignOut")}</button>`;
    document.getElementById("branchLoginBoxLogoutBtn")?.addEventListener("click", async () => {
      if (state.googleUser) await googleSignOut();
      else if (state.customerProfile) {
        const ok = await siteConfirm(t("browseCustomerLogout") + "؟");
        if (!ok) return;
        try {
          await logoutCustomerAccount();
          showToast(t("customerLogoutSuccess"), "info");
        } catch (err) { console.error(err); }
      }
    });
  } else {
    titleEl.setAttribute("data-i18n", "branchLoginBoxTitle");
    titleEl.textContent = t("branchLoginBoxTitle");
    subEl.setAttribute("data-i18n", "branchLoginBoxSub");
    subEl.textContent = t("branchLoginBoxSub");
    actionsEl.innerHTML = `
      <button class="glass-btn tap-fx branch-login-box-btn" id="branchLoginBoxSignInBtn">${t("signInLoginLabel")}</button>
    `;
    document.getElementById("branchLoginBoxSignInBtn")?.addEventListener("click", () => googleSignIn());
  }
}
updateBranchLoginBox();

async function googleSignIn() {
  if (!firebaseReady || !auth || typeof firebase === "undefined") {
    showToast(t("googleSignInUnavailable"), "error");
    return;
  }
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    state.googleUser = { name: user.displayName || "", email: user.email || "", photo: user.photoURL || "" };
    saveGoogleCustomerAccount(user);
    updateGoogleAuthUI();
    showToast(t("googleSignInSuccess"), "success");
  } catch (err) {
    console.error("Google sign-in error:", err);
    showToast(t("googleSignInError"), "error");
  }
}

async function googleSignOut() {
  const ok = await siteConfirm(t("browseGoogleSignOut") + "؟");
  if (!ok) return;
  try {
    if (auth) await auth.signOut();
  } catch (err) {}
  state.googleUser = null;
  updateGoogleAuthUI();
  showToast(t("googleSignOutSuccess"), "info");
}

document.getElementById("browseGoogleAuthBtn")?.addEventListener("click", () => {
  if (state.googleUser) {
    googleSignOut();
  } else {
    googleSignIn();
  }
});

if (typeof auth !== "undefined" && auth) {
  auth.onAuthStateChanged((user) => {
    if (user && user.providerData && user.providerData.some((p) => p.providerId === "google.com")) {
      state.googleUser = { name: user.displayName || "", email: user.email || "", photo: user.photoURL || "" };
      state.customerProfile = null;
      saveGoogleCustomerAccount(user);
    } else if (user && user.providerData && user.providerData.some((p) => p.providerId === "password")) {
      // حساب عميل بالرقم/الباسورد (مش جوجل)
      state.googleUser = null;
      db.collection("customers").doc(user.uid).get().then((doc) => {
        const data = doc.exists ? doc.data() : {};
        state.customerProfile = { uid: user.uid, name: data.name || user.displayName || "", phone: data.phone || "" };
        updateCustomerAuthUI();
      }).catch(() => {
        state.customerProfile = { uid: user.uid, name: user.displayName || "", phone: "" };
        updateCustomerAuthUI();
      });
    } else if (!user) {
      state.googleUser = null;
      state.customerProfile = null;
    }
    updateGoogleAuthUI();
    updateCustomerAuthUI();
  });
}
document.getElementById("browseAboutBtn")?.addEventListener("click", (e) => {
  closeBrowseMenu();
  openModalPop(document.getElementById("aboutUsModal"), e.currentTarget);
});


document.getElementById("browseReviewsBtn")?.addEventListener("click", (e) => {
  closeBrowseMenu();
  renderReviewsBars();
  renderReviewsList();
  const nameInput = document.getElementById("reviewNameInput");
  if (nameInput && !nameInput.value && state.customerProfile) nameInput.value = state.customerProfile.name || "";
  openModalPop(document.getElementById("reviewsModal"), e.currentTarget);
});
document.getElementById("browseLocationBtn")?.addEventListener("click", (e) => {
  closeBrowseMenu();
  renderLocationModal();
  openModalPop(document.getElementById("locationModal"), e.currentTarget);
});
document.getElementById("closeLocationModal")?.addEventListener("click", () => {
  closeModalPop(document.getElementById("locationModal"));
});
document.getElementById("locationModalOverlay")?.addEventListener("click", () => {
  closeModalPop(document.getElementById("locationModal"));
});
document.getElementById("closeAboutUs")?.addEventListener("click", () => {
  closeModalPop(document.getElementById("aboutUsModal"));
});
document.getElementById("aboutUsOverlay")?.addEventListener("click", () => {
  closeModalPop(document.getElementById("aboutUsModal"));
});
document.getElementById("browseMessagesBtn")?.addEventListener("click", (e) => {
  closeBrowseMenu();
  openModalPop(document.getElementById("customerMessagesModal"), e.currentTarget);
  markMessagesAsSeen();
});
document.getElementById("closeCustomerMessages")?.addEventListener("click", () => {
  closeModalPop(document.getElementById("customerMessagesModal"));
});
document.getElementById("customerMessagesOverlay")?.addEventListener("click", () => {
  closeModalPop(document.getElementById("customerMessagesModal"));
});

// ---------- حالة الفرع (مفتوح / مغلق / مشغول) ----------
function renderStatusStrip() {
  const strip = document.getElementById("statusStrip");
  if (state.branchStatus === "open") {
    strip.style.display = "none";
    showClosedBanner(false);
    return;
  }
  if (state.branchStatus === "busy") {
    showClosedBanner(false);
    strip.style.display = "block";
    strip.className = "status-strip busy";
    strip.textContent = t("statusBusyMsg");
  } else if (state.branchStatus === "closed") {
    strip.style.display = "none";
    showClosedBanner(true);
  }
}

// ---------- عرض التصنيفات والمنتجات ----------
const OFFERS_TAB_ID = "offers";
const ADDONS_TAB_ID = "addons_tab";
let addonsSearchQuery = "";

function renderCategories() {
  const bar = document.getElementById("categoriesBar");
  const all = [{ id: "all", name: t("categoryAll") }, ...state.categories];
  if (state.offers && state.offers.length > 0) {
    all.unshift({ id: OFFERS_TAB_ID, name: t("categoryOffers") });
  } else if (state.activeCategory === OFFERS_TAB_ID) {
    // لو العروض اتشالت كلها وكان العميل واقف على تبويبها، ارجعه لـ"الكل"
    state.activeCategory = "all";
  }
  if (state.addons && state.addons.length > 0) {
    all.push({ id: ADDONS_TAB_ID, name: t("categoryAddons") });
  } else if (state.activeCategory === ADDONS_TAB_ID) {
    state.activeCategory = "all";
  }
  bar.innerHTML = all
    .map(
      (c) =>
        `<button class="category-chip tap-fx ${c.id === OFFERS_TAB_ID ? "category-chip-offer" : ""} ${c.id === ADDONS_TAB_ID ? "category-chip-addon" : ""} ${state.activeCategory === c.id ? "active" : ""}" data-cat="${c.id}">${c.id === "all" || c.id === OFFERS_TAB_ID || c.id === ADDONS_TAB_ID ? c.name : itemDisplayName(c)}</button>`
    )
    .join("");
  bar.querySelectorAll(".category-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeCategory = btn.dataset.cat;
      renderCategories();
      renderProducts();
    });
  });
}

function productBasePrice(p) {
  if (p.variantGroups && p.variantGroups.length > 0) {
    const firstGroup = p.variantGroups[0];
    const prices = firstGroup.options.map((o) => o.price);
    return Math.min(...prices);
  }
  return p.price;
}

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const isOffersTab = state.activeCategory === OFFERS_TAB_ID;
  const isAddonsTab = state.activeCategory === ADDONS_TAB_ID;

  if (isAddonsTab) {
    renderAddonsTab(grid);
    return;
  }

  const list = isOffersTab
    ? state.offers
    : state.activeCategory === "all"
      ? state.products
      : state.products.filter((p) => p.category === state.activeCategory);

  if (list.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--muted)">${isOffersTab ? t("noOffersInCategory") : t("noProductsInCategory")}</p>`;
    return;
  }

  grid.innerHTML = list
    .map((p) => {
      const hasVariants = p.variantGroups && p.variantGroups.length > 0;
      const priceLabel = hasVariants ? `${t("priceFrom")} ${productBasePrice(p)} ${t("currency")}` : `${p.price} ${t("currency")}`;
      const available = isProductAvailable(p);
      return `
    <div class="product-card${!available ? " is-unavailable" : ""}">
      <div class="img-wrap">
        <img src="${p.image}" alt="${itemDisplayName(p)}" onerror="this.src='images/dialoglg.png'"/>
        ${isOffersTab || p.isOffer ? `<span class="offer-badge">${t("offerBadge")}</span>` : ""}
        ${!available ? `<div class="sold-out-ribbon-wrap"><span class="sold-out-ribbon">${Array(6).fill(t("soldOutRibbon")).join("   •   ")}</span></div>` : ""}
      </div>
      <div class="info">
        <h3>${itemDisplayName(p)}</h3>
        <p class="desc" data-desc-id="${p.id}">${p.description || ""}</p>
        <div class="row">
          <span class="price">${priceLabel}</span>
          <button class="glass-btn tap-fx" style="padding:8px 16px" data-open="${p.id}" data-offer="${isOffersTab ? "1" : "0"}" data-available="${available ? "1" : "0"}">${t("chooseBtn")}</button>
        </div>
      </div>
    </div>
  `;
    })
    .join("");

  grid.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (btn.dataset.available === "0") {
        showToast(t("productUnavailableToast"), "error");
        return;
      }
      openProductModal(btn.dataset.open, e.currentTarget, btn.dataset.offer === "1");
    });
  });
  grid.querySelectorAll("[data-desc-id]").forEach((el) => {
    const p = list.find((x) => x.id === el.dataset.descId);
    if (p) applyAutoTranslate(el, p.description || "");
  });
}

// ============================================================
// تبويب "الإضافات" المستقل — بحث + كل الإضافات المتاحة، والعميل
// يقدر يضيف أي إضافة لأي صنف موجود بالفعل في سلته
// ============================================================
function renderAddonsTab(grid) {
  const q = addonsSearchQuery.trim().toLowerCase();
  const filtered = (state.addons || []).filter((a) => a.available !== false && (!q || a.name.toLowerCase().includes(q)));

  grid.innerHTML = `
    <div class="addons-tab-wrap">
      <div class="addons-search-row">
        <input type="text" id="addonsSearchInput" class="addons-search-input" placeholder="${t("searchAddonsPlaceholder")}" value="${escapeHtml(addonsSearchQuery)}" />
      </div>
      <div class="addons-tab-grid">
        ${
          filtered.length === 0
            ? `<p style="grid-column:1/-1;text-align:center;color:var(--muted)">${t("noAddonsFound")}</p>`
            : filtered
                .map(
                  (a) => `
          <div class="addon-tab-card">
            <div class="addon-tab-card-name">${escapeHtml(a.name)}</div>
            <div class="addon-tab-card-price">${a.price} ${t("currency")}</div>
            <button class="glass-btn tap-fx addon-tab-add-btn" data-addon-add="${a.id}">${t("addAddonBtn")}</button>
          </div>
        `
                )
                .join("")
        }
      </div>
    </div>
  `;

  const input = document.getElementById("addonsSearchInput");
  input?.addEventListener("input", () => {
    addonsSearchQuery = input.value;
    const caret = input.selectionStart;
    renderAddonsTab(grid);
    const newInput = document.getElementById("addonsSearchInput");
    if (newInput) {
      newInput.focus();
      newInput.setSelectionRange(caret, caret);
    }
  });

  grid.querySelectorAll("[data-addon-add]").forEach((btn) => {
    btn.addEventListener("click", () => openAttachAddonModal(btn.dataset.addonAdd));
  });
}

function openAttachAddonModal(addonId) {
  const addon = (state.addons || []).find((a) => a.id === addonId);
  if (!addon) return;
  if (state.cart.length === 0) {
    showToast(t("cartEmptyForAddonToast"), "error");
    return;
  }
  state.pendingAddonId = addonId;
  document.getElementById("attachAddonAddonName").textContent = `${addon.name} (+${addon.price} ${t("currency")})`;
  renderAttachAddonCartList();
  openModalPop(document.getElementById("attachAddonModal"));
}

function renderAttachAddonCartList() {
  const list = document.getElementById("attachAddonCartList");
  if (!list) return;
  list.innerHTML = state.cart
    .map(
      (item) => `
    <button class="attach-addon-cart-item tap-fx" data-cart-item="${item.cartItemId}">
      <img src="${item.image}" onerror="this.src='images/dialoglg.png'" />
      <div class="attach-addon-cart-item-info">
        <div class="attach-addon-cart-item-name">${item.name}</div>
        ${extrasTextForItem(item) ? `<div class="attach-addon-cart-item-extras">${extrasTextForItem(item)}</div>` : ""}
      </div>
      <span class="attach-addon-cart-item-qty">×${item.qty}</span>
    </button>
  `
    )
    .join("");
  list.querySelectorAll("[data-cart-item]").forEach((btn) => {
    btn.addEventListener("click", () => attachAddonToCartItem(btn.dataset.cartItem));
  });
}

function attachAddonToCartItem(cartItemId) {
  const addon = (state.addons || []).find((a) => a.id === state.pendingAddonId);
  const item = state.cart.find((i) => i.cartItemId === cartItemId);
  if (!addon || !item) return;
  item.addonLabels = [...(item.addonLabels || []), { name: addon.name, price: addon.price }];
  item.unitPrice += addon.price;
  saveCart();
  renderCartCount();
  if (document.getElementById("cartDrawer")?.classList.contains("open")) renderCartDrawer();
  closeModalPop(document.getElementById("attachAddonModal"));
  showToast(t("addonAttachedToast", { addon: addon.name, item: item.name }), "success");
  state.pendingAddonId = null;
}
document.getElementById("closeAttachAddon")?.addEventListener("click", () => {
  closeModalPop(document.getElementById("attachAddonModal"));
});
document.getElementById("attachAddonOverlay")?.addEventListener("click", () => {
  closeModalPop(document.getElementById("attachAddonModal"));
});

// ============================================================
// مودال اختيار المنتج
// ============================================================
function openProductModal(productId, triggerEl, isOffer) {
  const product = isOffer
    ? state.offers.find((p) => p.id === productId)
    : (state.products.find((p) => p.id === productId) || state.offers.find((p) => p.id === productId));
  if (!product) return;

  state.modalProduct = product;
  state.modalIsOffer = !!isOffer;
  state.modalSelection = { variants: {}, noPriceVariants: {}, addons: {}, qty: 1 };
  (product.variantGroups || []).forEach((g) => {
    state.modalSelection.variants[g.id] = g.options[0]?.id;
  });
  (product.noPriceGroups || []).forEach((g) => {
    state.modalSelection.noPriceVariants[g.id] = g.options[0]?.id;
  });

  document.getElementById("modalProductImg").src = product.image;
  document.getElementById("modalProductImg").onerror = function () { this.src = "images/dialoglg.png"; };

  const nameBadge = document.getElementById("modalOfferNameBadge");
  const imgWrap = document.getElementById("modalProductImgWrap");
  const nameHeading = document.getElementById("modalProductName");
  if (state.modalIsOffer) {
    // العروض: اسم العرض بيتكتب فوق الصورة (أعلى اليمين) بخلفية زجاجية بنفس
    // استايل الموقع بدل ما يتكرر تاني تحت كعنوان عادي
    nameBadge.textContent = itemDisplayName(product);
    nameBadge.style.display = "inline-block";
    imgWrap.classList.add("has-offer-name");
    nameHeading.style.display = "none";
    nameHeading.textContent = "";
  } else {
    nameBadge.style.display = "none";
    imgWrap.classList.remove("has-offer-name");
    nameHeading.style.display = "";
    nameHeading.textContent = itemDisplayName(product);
  }
  applyAutoTranslate(document.getElementById("modalProductDesc"), product.description || "");

  renderModalOptions();
  openModalPop(document.getElementById("productModal"), triggerEl);
}

function closeProductModal() {
  closeModalPop(document.getElementById("productModal"));
  state.modalProduct = null;
  state.modalIsOffer = false;
}
document.getElementById("closeProductModal").addEventListener("click", closeProductModal);
document.getElementById("productModalOverlay").addEventListener("click", closeProductModal);

function currentModalAddons() {
  const product = state.modalProduct;
  return state.addons.filter((a) => a.available !== false && (product.addonIds || []).includes(a.id));
}

function computeModalUnitPrice() {
  const product = state.modalProduct;
  let price = product.price;
  (product.variantGroups || []).forEach((g) => {
    const selectedOptId = state.modalSelection.variants[g.id];
    const opt = g.options.find((o) => o.id === selectedOptId);
    if (opt) price = opt.price;
  });
  let addonsTotal = 0;
  currentModalAddons().forEach((a) => {
    if (state.modalSelection.addons[a.id]) addonsTotal += a.price;
  });
  return { base: price, addonsTotal, unit: price + addonsTotal };
}

function renderModalOptions() {
  const product = state.modalProduct;
  const optionBox = document.getElementById("modalOptionBox");
  let html = "";

  (product.variantGroups || []).forEach((g) => {
    html += `<div class="variant-group" data-group="${g.id}">
      <div class="variant-group-label">${g.label}</div>
      <div class="variant-pills">
        ${g.options
          .map(
            (o) => `
          <button type="button" class="variant-pill tap-fx ${state.modalSelection.variants[g.id] === o.id ? "active" : ""}"
            data-group="${g.id}" data-option="${o.id}">
            ${o.label} <span class="pill-price">${o.price} ${t("currency")}</span>
          </button>
        `
          )
          .join("")}
      </div>
    </div>`;
  });

  (product.noPriceGroups || []).forEach((g) => {
    html += `<div class="variant-group" data-group-np="${g.id}">
      <div class="variant-group-label">${g.label}</div>
      <div class="variant-pills">
        ${g.options
          .map(
            (o) => `
          <button type="button" class="variant-pill tap-fx ${state.modalSelection.noPriceVariants[g.id] === o.id ? "active" : ""}"
            data-group-np="${g.id}" data-option-np="${o.id}">
            ${o.label}
          </button>
        `
          )
          .join("")}
      </div>
    </div>`;
  });

  const addons = currentModalAddons();
  if (addons.length > 0) {
    html += `<div class="addons-group">
      <div class="variant-group-label">${t("addonsTitle")}</div>
      ${addons
        .map(
          (a) => `
        <label class="addon-row tap-fx">
          <span>${a.name} <span class="pill-price">+${a.price} ${t("currency")}</span></span>
          <input type="checkbox" data-addon="${a.id}" ${state.modalSelection.addons[a.id] ? "checked" : ""}/>
          <span class="addon-check"></span>
        </label>
      `
        )
        .join("")}
    </div>`;
  }

  html += `<div class="qty-row">
    <span class="variant-group-label" style="margin:0">${t("qtyLabel")}</span>
    <div class="qty-controls">
      <button type="button" class="tap-fx" id="modalQtyMinus">−</button>
      <span id="modalQtyValue">${state.modalSelection.qty}</span>
      <button type="button" class="tap-fx" id="modalQtyPlus">+</button>
    </div>
  </div>`;

  optionBox.innerHTML = html;

  optionBox.querySelectorAll(".variant-pill[data-group]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.modalSelection.variants[btn.dataset.group] = btn.dataset.option;
      renderModalOptions();
      updateModalTotal();
    });
  });
  optionBox.querySelectorAll(".variant-pill[data-group-np]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.modalSelection.noPriceVariants[btn.dataset.groupNp] = btn.dataset.optionNp;
      renderModalOptions();
      updateModalTotal();
    });
  });
  optionBox.querySelectorAll("[data-addon]").forEach((chk) => {
    chk.addEventListener("change", () => {
      state.modalSelection.addons[chk.dataset.addon] = chk.checked;
      updateModalTotal();
    });
  });
  document.getElementById("modalQtyMinus").addEventListener("click", () => {
    if (state.modalSelection.qty > 1) state.modalSelection.qty--;
    document.getElementById("modalQtyValue").textContent = state.modalSelection.qty;
    updateModalTotal();
  });
  document.getElementById("modalQtyPlus").addEventListener("click", () => {
    const p = state.modalProduct;
    if (typeof p.stock === "number") {
      const alreadyInCart = state.cart
        .filter((i) => i.productId === p.id)
        .reduce((sum, i) => sum + i.qty, 0);
      const maxAddable = p.stock - alreadyInCart;
      if (state.modalSelection.qty >= maxAddable) {
        showToast(t("stockLimitToast", { stock: Math.max(0, maxAddable) }), "error");
        return;
      }
    }
    state.modalSelection.qty++;
    document.getElementById("modalQtyValue").textContent = state.modalSelection.qty;
    updateModalTotal();
  });

  updateModalTotal();
}

function updateModalTotal() {
  const { unit } = computeModalUnitPrice();
  const total = unit * state.modalSelection.qty;
  document.getElementById("modalTotalPrice").textContent = `${total} ${t("currency")}`;
}

document.getElementById("modalAddToCart").addEventListener("click", () => {
  const product = state.modalProduct;
  const { unit } = computeModalUnitPrice();

  const variantLabels = (product.variantGroups || []).map((g) => {
    const opt = g.options.find((o) => o.id === state.modalSelection.variants[g.id]);
    return { group: g.label, option: opt ? opt.label : "" };
  });
  const noPriceLabels = (product.noPriceGroups || []).map((g) => {
    const opt = g.options.find((o) => o.id === state.modalSelection.noPriceVariants[g.id]);
    return { group: g.label, option: opt ? opt.label : "" };
  });
  const addonLabels = currentModalAddons()
    .filter((a) => state.modalSelection.addons[a.id])
    .map((a) => ({ name: a.name, price: a.price }));

  const cartItem = {
    cartItemId: "ci_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    productId: product.id,
    name: itemDisplayName(product),
    image: product.image,
    qty: state.modalSelection.qty,
    variantLabels,
    noPriceLabels,
    addonLabels,
    unitPrice: unit,
  };
  state.cart.push(cartItem);
  saveCart();
  closeProductModal();
  openCartDrawer();
});

// ---------- السلة ----------
function saveCart() {
  localStorage.setItem("vitwar_cart", JSON.stringify(state.cart));
  renderCartCount();
}
function removeCartItem(cartItemId) {
  state.cart = state.cart.filter((i) => i.cartItemId !== cartItemId);
  saveCart();
  renderCartDrawer();
}
function changeCartQty(cartItemId, delta) {
  const item = state.cart.find((i) => i.cartItemId === cartItemId);
  if (!item) return;
  if (delta > 0) {
    const product = state.products.find((p) => p.id === item.productId) || state.offers.find((p) => p.id === item.productId);
    if (product && typeof product.stock === "number") {
      const totalQtyForProduct = state.cart
        .filter((i) => i.productId === item.productId)
        .reduce((sum, i) => sum + i.qty, 0);
      if (totalQtyForProduct >= product.stock) {
        showToast(t("stockLimitToast", { stock: product.stock }), "error");
        return;
      }
    }
  }
  item.qty += delta;
  if (item.qty <= 0) {
    removeCartItem(cartItemId);
    return;
  }
  saveCart();
  renderCartDrawer();
}
function renderCartCount() {
  const count = state.cart.reduce((sum, i) => sum + i.qty, 0);
  document.getElementById("cartCountText").textContent = `(${count})`;
}
function cartTotal() {
  return state.cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
}
function extrasTextForItem(item) {
  return [
    ...(item.variantLabels || []).map((v) => `${v.group}: ${v.option}`),
    ...(item.noPriceLabels || []).map((v) => `${v.group}: ${v.option}`),
    ...(item.addonLabels || []).map((a) => `+ ${a.name}`),
  ].join(" · ");
}
function renderCartDrawer() {
  const container = document.getElementById("cartItems");
  if (state.cart.length === 0) {
    container.innerHTML = `<div class="empty-cart">${t("emptyCart")}</div>`;
    document.getElementById("cartTotal").textContent = `0 ${t("currency")}`;
    return;
  }
  container.innerHTML = state.cart
    .map((item) => {
      const extras = extrasTextForItem(item);
      return `
      <div class="cart-item">
        <img src="${item.image}" onerror="this.src='images/dialoglg.png'"/>
        <div class="grow">
          <div style="font-weight:700">${item.name}</div>
          ${extras ? `<div style="color:var(--muted);font-size:.78rem">${extras}</div>` : ""}
          <div style="color:var(--muted);font-size:.85rem">${item.unitPrice} ${t("currency")} × ${item.qty}</div>
        </div>
        <div class="qty-controls">
          <button class="tap-fx" data-qty-minus="${item.cartItemId}">−</button>
          <span>${item.qty}</span>
          <button class="tap-fx" data-qty-plus="${item.cartItemId}">+</button>
        </div>
      </div>
    `;
    })
    .join("");
  document.getElementById("cartTotal").textContent = `${cartTotal()} ${t("currency")}`;

  container.querySelectorAll("[data-qty-plus]").forEach((b) =>
    b.addEventListener("click", () => changeCartQty(b.dataset.qtyPlus, 1))
  );
  container.querySelectorAll("[data-qty-minus]").forEach((b) =>
    b.addEventListener("click", () => changeCartQty(b.dataset.qtyMinus, -1))
  );
}

function openCartDrawer() {
  renderCartDrawer();
  const drawer = document.getElementById("cartDrawer");
  if (!drawer.classList.contains("open")) lockBodyScroll();
  drawer.classList.add("open");
}
function closeCartDrawer() {
  const drawer = document.getElementById("cartDrawer");
  if (!drawer.classList.contains("open")) return;
  drawer.classList.remove("open");
  unlockBodyScroll();
}
document.getElementById("cartFab").addEventListener("click", openCartDrawer);
document.getElementById("closeCart").addEventListener("click", closeCartDrawer);
document.getElementById("cartOverlay").addEventListener("click", closeCartDrawer);

// ============================================================
// إتمام الطلب: كافيه / ديليفري / استلام
// ============================================================
document.getElementById("checkoutBtn").addEventListener("click", async (e) => {
  if (state.cart.length === 0) return;
  if (!isCustomerAuthed()) {
    closeCartDrawer();
    await siteAlert(t("loginRequiredOrder"));
    await googleSignIn();
    return;
  }
  if (state.branchStatus === "closed") {
    await siteAlert(t("branchClosedMsg"));
    return;
  }
  state.checkoutType = null;
  state.paymentMethod = null;
  document.getElementById("checkoutStep1").style.display = "block";
  document.getElementById("checkoutStep2").style.display = "none";
  openModalPop(document.getElementById("checkoutModal"), e.currentTarget);
});
document.getElementById("closeCheckoutModal").addEventListener("click", () => {
  closeModalPop(document.getElementById("checkoutModal"));
});
document.getElementById("checkoutModalOverlay").addEventListener("click", () => {
  closeModalPop(document.getElementById("checkoutModal"));
});

document.querySelectorAll("[data-order-type]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.orderType === "delivery" && !state.deliveryEnabled) {
      showDeliveryUnavailableModal();
      return;
    }
    state.checkoutType = btn.dataset.orderType;
    renderCheckoutStep2();
  });
});

// ---------- نافذة "الديلفري مقفول دلوقتي" (لما الأدمن يقفل الديلفري) ----------
const TALABAT_LINK = "https://www.talabat.com/egypt/vitwar";
function ensureDeliveryUnavailableModal() {
  let host = document.getElementById("deliveryUnavailableModal");
  if (host) return host;
  host = document.createElement("div");
  host.id = "deliveryUnavailableModal";
  host.className = "vt-modal-host";
  host.innerHTML = `
    <div class="cart-overlay vt-modal-overlay" id="deliveryUnavailableOverlay"></div>
    <div class="vt-modal-box delivery-unavailable-box">
      <div class="delivery-unavailable-badge">
        <img src="images/icons/eye.gif" alt="🛑" />
      </div>
      <p class="vt-modal-text">${t("deliveryUnavailableMsg")}</p>
      <div class="vt-modal-actions">
        <button type="button" class="glass-btn-gray glass-btn tap-fx" id="deliveryUnavailableCloseBtn">${t("deliveryUnavailableCloseBtn")}</button>
        <button type="button" class="glass-btn tap-fx" id="deliveryUnavailableTalabatBtn">${t("deliveryUnavailableTalabatBtn")}</button>
      </div>
    </div>`;
  document.body.appendChild(host);
  const close = () => host.classList.remove("open");
  host.querySelector("#deliveryUnavailableOverlay").addEventListener("click", close);
  host.querySelector("#deliveryUnavailableCloseBtn").addEventListener("click", close);
  host.querySelector("#deliveryUnavailableTalabatBtn").addEventListener("click", () => {
    window.open(TALABAT_LINK, "_blank");
    close();
  });
  return host;
}
function showDeliveryUnavailableModal() {
  const host = ensureDeliveryUnavailableModal();
  host.classList.add("open");
}

function renderCheckoutStep2() {
  document.getElementById("checkoutStep1").style.display = "none";
  const step2 = document.getElementById("checkoutStep2");
  step2.style.display = "block";

  let fieldsHtml = "";
  if (state.checkoutType === "cafe") {
    fieldsHtml = `
      <div class="field">
        <label>${t("cafeNameLabel")}</label>
        <input type="text" id="fieldCafeName" placeholder="${t("cafeNamePlaceholder")}" />
      </div>
    `;
  } else if (state.checkoutType === "delivery") {
    fieldsHtml = `
      <div class="field">
        <label>${t("addressLabel")}</label>
        <textarea id="fieldAddress" rows="2" placeholder="${t("addressPlaceholder")}"></textarea>
      </div>
    `;
  } else if (state.checkoutType === "pickup") {
    fieldsHtml = `
      <div class="field">
        <label>${t("pickupTimeLabel")}</label>
        <select id="fieldPickupTime">
          <option value="15 دقيقة">${t("pickup15")}</option>
          <option value="30 دقيقة">${t("pickup30")}</option>
          <option value="1 ساعة">${t("pickup60")}</option>
        </select>
      </div>
    `;
  }

  const typeLabel = {
    cafe: `${t("orderTypeCafe")} <img class="emoji-gif" src="images/icons/emoji-coffee.gif" alt="☕" />`,
    delivery: `${t("orderTypeDelivery")} <img class="emoji-gif" src="images/icons/emoji-scooter.gif" alt="🛵" />`,
    pickup: `${t("orderTypePickup")} <img class="emoji-gif" src="images/icons/emoji-runner.gif" alt="🏃" />`,
  }[state.checkoutType];
  step2.innerHTML = `
    <div class="option-box">
      <div class="variant-group-label" style="margin-bottom:12px">${typeLabel}</div>
      ${fieldsHtml}
      <div class="field">
        <label>${t("mobileNumberLabel")}</label>
        <input type="tel" id="fieldPhone" placeholder="01xxxxxxxxx" maxlength="11" inputmode="numeric" />
      </div>
      <div class="field">
        <label>${t("paymentMethodLabel")}</label>
        <div class="payment-method-grid">
          <button type="button" class="glass-btn-secondary glass-btn tap-fx payment-method-btn" data-payment="كاش">
            <span class="payment-method-inner">
              <img class="payment-method-icon" src="images/icons/emoji-cash.gif" alt="كاش" />
              <span class="payment-method-caption">${t("paymentCashCaption")}</span>
            </span>
          </button>
          <button type="button" class="glass-btn-secondary glass-btn tap-fx payment-method-btn" data-payment="انستاباي">
            <span class="payment-method-inner">
              <img class="payment-method-icon" src="images/icons/emoji-instapay.gif" alt="انستاباي" />
              <span class="payment-method-caption">${t("paymentInstapayCaption")}</span>
            </span>
          </button>
        </div>
        <button type="button" class="glass-btn tap-fx" id="openInstapayLinkBtn" style="width:100%;margin-top:10px;display:none">${t("openInstapayLinkBtn")}</button>
      </div>
      <div class="field">
        <label>${t("commentLabel")}</label>
        <textarea id="fieldComment" rows="2" placeholder="${t("commentPlaceholder")}"></textarea>
      </div>
      <p class="error-msg" id="checkoutError"></p>
      <button class="glass-btn tap-fx" id="confirmOrderBtn" style="width:100%;margin-top:6px">${t("confirmOrderBtn")}</button>
      <button class="glass-btn-secondary glass-btn tap-fx" id="backToStep1" style="width:100%">${t("backBtn")}</button>
    </div>
  `;

  const instapayLinkBtn = document.getElementById("openInstapayLinkBtn");
  step2.querySelectorAll(".payment-method-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.paymentMethod = btn.dataset.payment;
      step2.querySelectorAll(".payment-method-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (instapayLinkBtn) {
        instapayLinkBtn.style.display = (state.paymentMethod === "انستاباي") ? "block" : "none";
      }
    });
  });
  if (instapayLinkBtn) {
    instapayLinkBtn.addEventListener("click", () => {
      window.open(INSTAPAY_LINK, "_blank");
    });
  }

  document.getElementById("backToStep1").addEventListener("click", () => {
    document.getElementById("checkoutStep1").style.display = "block";
    step2.style.display = "none";
  });
  document.getElementById("confirmOrderBtn").addEventListener("click", submitOrder);

  // لو العميل مسجل دخول، عبّي رقمه تلقائيًا
  const phoneField = document.getElementById("fieldPhone");
  if (phoneField && state.customerProfile && state.customerProfile.phone) {
    phoneField.value = state.customerProfile.phone;
  }
}

function openWhatsAppOrder(order, branch) {
  // الواتساب بيتفتح بس في طلبات التوصيل
  if (order.type !== "delivery") return;
  if (!branch || !branch.whatsapp) return;
  const message = encodeURIComponent(
    `مهم قم بإرسالها #${order.code} ، من فضلك ارسل اللوكيشن لدقة التوصيل`
  );
  const url = `https://wa.me/${branch.whatsapp}?text=${message}`;
  window.open(url, "_blank");
}

// لينك صفحة الدفع بالانستاباي
const INSTAPAY_LINK = "https://ipn.eg/S/sherifsamysaeed/instapay/9zEWGz";

async function submitOrder() {
  const errEl = document.getElementById("checkoutError");
  errEl.textContent = "";

  const fields = {};
  if (state.checkoutType === "cafe") {
    fields.cafeName = document.getElementById("fieldCafeName").value.trim();
    if (!fields.cafeName) {
      errEl.textContent = t("errCafeName");
      return;
    }
  } else if (state.checkoutType === "delivery") {
    fields.address = document.getElementById("fieldAddress").value.trim();
    if (!fields.address) {
      errEl.textContent = t("errAddress");
      return;
    }
  } else if (state.checkoutType === "pickup") {
    fields.pickupTime = document.getElementById("fieldPickupTime").value;
  }

  const phoneRaw = document.getElementById("fieldPhone").value.trim();
  if (!/^[0-9]{11}$/.test(phoneRaw)) {
    errEl.textContent = t("errPhone");
    return;
  }
  fields.phone = phoneRaw;

  if (!state.paymentMethod) {
    errEl.textContent = t("errPayment");
    return;
  }
  fields.payment = state.paymentMethod;
  fields.comment = document.getElementById("fieldComment").value.trim();

  const total = cartTotal();
  const isBusy = state.branchStatus === "busy";
  const confirmBtn = document.getElementById("confirmOrderBtn");
  confirmBtn.disabled = true;
  confirmBtn.textContent = t("sendingOrderBtn");

  const orderPayload = {
    type: state.checkoutType,
    items: state.cart.map((i) => ({
      name: i.name,
      productId: i.productId,
      qty: i.qty,
      unitPrice: i.unitPrice,
      lineTotal: i.unitPrice * i.qty,
      variantLabels: i.variantLabels,
      noPriceLabels: i.noPriceLabels,
      addonLabels: i.addonLabels,
      optionsText: extrasTextForItem(i),
    })),
    total,
    fields,
    queued: isBusy,
  };

  let order;
  try {
    order = await addOrder(state.branchId, orderPayload);
  } catch (e) {
    console.error(e);
    errEl.textContent = t("errOrderGeneric");
    confirmBtn.disabled = false;
    confirmBtn.textContent = t("confirmOrderBtn");
    return;
  }

  sendTelegramOrderNotification(buildTelegramMessage(order, BRANCHES[state.branchId]));
  openWhatsAppOrder(order, BRANCHES[state.branchId]);
  applyOrderedQuantitiesToStock(state.cart);

  state.cart = [];
  saveCart();
  closeModalPop(document.getElementById("checkoutModal"));
  closeCartDrawer();

  if (isBusy) {
    await siteAlert(t("orderSuccessBusy", { code: order.code }));
  } else {
    showGlassNote(t("orderSuccessMsg", { code: order.code }));
  }
}

// ---------- خصم الكمية المتاحة من المخزون بعد نجاح الطلب، وتعطيل الصنف أوتوماتيك لو خلص ----------
async function applyOrderedQuantitiesToStock(orderedItems) {
  const orderedQtyByProduct = {};
  orderedItems.forEach((i) => {
    if (!i.productId) return;
    orderedQtyByProduct[i.productId] = (orderedQtyByProduct[i.productId] || 0) + i.qty;
  });
  if (Object.keys(orderedQtyByProduct).length === 0) return;

  let changed = false;
  const updatedProducts = state.products.map((p) => {
    const orderedQty = orderedQtyByProduct[p.id];
    if (!orderedQty || typeof p.stock !== "number") return p;
    changed = true;
    const newStock = Math.max(0, p.stock - orderedQty);
    return { ...p, stock: newStock, available: newStock > 0 ? p.available : false };
  });
  if (!changed) return;

  state.products = updatedProducts;
  try {
    await saveBranchData(state.branchId, { products: updatedProducts });
  } catch (err) {
    console.error("تعذر تحديث كمية المخزون:", err);
  }
}

function showGlassNote(text) {
  const note = document.getElementById("glassNote");
  note.textContent = text;
  note.classList.add("show");
  setTimeout(() => note.classList.remove("show"), 4500);
}

// ---------- مزامنة بيانات الفرع لحظيًا ----------
function startBranchSync() {
  if (state.branchSyncUnsub) {
    try { state.branchSyncUnsub(); } catch (e) {}
    state.branchSyncUnsub = null;
  }
  state.branchSyncUnsub = subscribeBranch(state.branchId, (data) => {
    state.categories = data.categories || [];
    state.products = data.products || [];
    state.offers = data.offers || [];
    state.addons = data.addons || [];
    state.branchStatus = data.status || "open";
    state.deliveryEnabled = data.deliveryEnabled !== false;
    renderStatusStrip();
    renderCategories();
    renderProducts();
  });
}

// ---------- تثبيت الموقع كتطبيق (فون / ويندوز / ماك) ----------
let deferredInstallPrompt = null;
function isIosDevice() {
  const ua = navigator.userAgent;
  const isClassicIos = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
  // iPadOS 13+ بيبعت User-Agent شبه ماك بالظبط (مفيهوش كلمة iPad خالص)،
  // فبنفرّقه عن ماك حقيقي بإنه بيدعم تاتش ومفيهوش ماوس
  const isModernIpad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isClassicIos || isModernIpad;
}
function isRunningStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

async function runInstallFlow() {
  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      return;
    } catch (e) {
      // الحدث اتستخدم قبل كده أو المتصفح رفضه - نرجع للتعليمات اليدوية بدل ما الزرار "يفضل مش شغال"
      console.error("Native install prompt failed:", e);
      deferredInstallPrompt = null;
    }
  }
  if (isIosDevice()) {
    await siteAlert(t("installIosMsg"));
  } else {
    await siteAlert(t("installOtherMsg"));
  }
}

function openInstallSheet() {
  document.getElementById("installSheetOverlay")?.classList.add("open");
  const sheet = document.getElementById("installSheet");
  sheet?.classList.remove("closing");
  sheet?.classList.add("open");
  lockBodyScroll();
}
function closeInstallSheet(remember) {
  const overlay = document.getElementById("installSheetOverlay");
  const sheet = document.getElementById("installSheet");
  if (!sheet || !sheet.classList.contains("open")) return;
  sheet.classList.add("closing");
  sheet.classList.remove("open");
  overlay?.classList.remove("open");
  unlockBodyScroll();
  setTimeout(() => sheet.classList.remove("closing"), 300);
  if (remember) localStorage.setItem("vitwar_install_sheet_seen", "1");
}

(function initInstallFlow() {
  if (isRunningStandalone()) return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    closeInstallSheet(true);
  });

  document.getElementById("browseInstallBtn")?.addEventListener("click", () => {
    closeBrowseMenu();
    openInstallSheet();
  });
  document.getElementById("installSheetInstallBtn")?.addEventListener("click", async () => {
    await runInstallFlow();
    closeInstallSheet(true);
  });
  document.getElementById("installSheetRejectBtn")?.addEventListener("click", () => closeInstallSheet(true));
  document.getElementById("closeInstallSheet")?.addEventListener("click", () => closeInstallSheet(true));
  document.getElementById("installSheetOverlay")?.addEventListener("click", () => closeInstallSheet(true));

  // تظهر أوتوماتيك أول ما العميل يفتح الموقع (مرة واحدة بس لو مقفلها قبل كده)
  if (!localStorage.getItem("vitwar_install_sheet_seen")) {
    setTimeout(() => {
      if (!isRunningStandalone()) openInstallSheet();
    }, 2200);
  }
})();

// ---------- رسائل الأدمن (Messages) ----------
const broadcastSessionStart = Date.now();
const broadcastShownIds = new Set();
let broadcastUnsub = null;
let customerMessagesList = []; // كل الرسائل اللي وصلت للفرع الحالي (من Firestore أو محليًا)
// (طلب إذن الإشعارات بقى بيحصل في setupPushForBranch بعد اختيار الفرع،
// عشان نربط الإذن مباشرة بتسجيل توكن الـ FCM بتاع الفرع ده)

function messagesSeenKey(branchId) {
  return `vitwar_msgs_seen_${branchId}`;
}
function lastSeenMessageTime(branchId) {
  return Number(localStorage.getItem(messagesSeenKey(branchId)) || 0);
}
function markMessagesAsSeen() {
  if (!state.branchId) return;
  const newest = customerMessagesList.reduce((max, m) => Math.max(max, m.createdAt || 0), 0);
  localStorage.setItem(messagesSeenKey(state.branchId), String(newest));
  updateMessagesBadge();
}
function updateMessagesBadge() {
  const badge = document.getElementById("browseMessagesBadge");
  if (!badge || !state.branchId) return;
  const seen = lastSeenMessageTime(state.branchId);
  const dismissed = typeof getDismissedMsgIds === "function" ? getDismissedMsgIds() : new Set();
  const hasUnread = customerMessagesList.some((m) => (m.createdAt || 0) > seen && !dismissed.has(m.id));
  badge.style.display = hasUnread ? "inline-block" : "none";
}

// بيرسم قائمة الرسائل جوه مودال "الرسائل" — نفس الرسائل اللي بتوصل بانر لحظي،
// بس هنا بتفضل متخزنة عشان العميل يقدر يرجعلها في أي وقت
function dismissedMsgKey() {
  return `vitwar_dismissed_msgs_${state.branchId || "default"}`;
}
function getDismissedMsgIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(dismissedMsgKey()) || "[]"));
  } catch (e) {
    return new Set();
  }
}
function addDismissedMsgId(id) {
  const set = getDismissedMsgIds();
  set.add(id);
  localStorage.setItem(dismissedMsgKey(), JSON.stringify([...set]));
}

function renderCustomerMessagesInbox() {
  const box = document.getElementById("customerMessagesBody");
  if (!box) return;
  const dismissed = getDismissedMsgIds();
  const visibleMessages = customerMessagesList.filter((m) => !dismissed.has(m.id));
  if (!visibleMessages.length) {
    box.innerHTML = `<p style="color:var(--muted);text-align:center;padding:24px 0">${t("messagesInboxEmpty")}</p>`;
    return;
  }
  const lang = typeof getSiteLang === "function" ? getSiteLang() : "ar";
  box.innerHTML = visibleMessages
    .map((m) => {
      const date = new Date(m.createdAt).toLocaleString(lang === "en" ? "en-US" : "ar-EG");
      return `
        <div class="inbox-msg-item" data-msg-id="${m.id}">
          <span class="inbox-msg-icon"><img class="emoji-gif" src="images/icons/emoji-bell.gif" alt="🔔" /></span>
          <div class="inbox-msg-content">
            <div class="inbox-msg-title">${escapeHtml(m.title)}</div>
            <div class="inbox-msg-body">${escapeHtml(m.body)}</div>
            <div class="inbox-msg-date">${date}</div>
          </div>
          <button class="inbox-msg-delete tap-fx" data-del-msg="${m.id}" title="${t("messagesDeleteOne")}">🗑️</button>
        </div>`;
    })
    .join("");
  box.querySelectorAll("[data-del-msg]").forEach((btn) => {
    btn.addEventListener("click", () => {
      addDismissedMsgId(btn.dataset.delMsg);
      renderCustomerMessagesInbox();
    });
  });
}

document.getElementById("clearAllCustomerMessagesBtn")?.addEventListener("click", async () => {
  if (!customerMessagesList.length) return;
  const ok = await siteConfirm(t("messagesClearAllConfirm"));
  if (!ok) return;
  customerMessagesList.forEach((m) => addDismissedMsgId(m.id));
  renderCustomerMessagesInbox();
});

function showBroadcastBanner(title, body) {
  let banner = document.getElementById("broadcastBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "broadcast-banner";
    banner.id = "broadcastBanner";
    banner.innerHTML = `
      <span class="broadcast-banner-icon"><img class="emoji-gif" src="images/icons/emoji-bell.gif" alt="🔔" /></span>
      <div>
        <div class="broadcast-banner-title" id="broadcastBannerTitle"></div>
        <div class="broadcast-banner-body" id="broadcastBannerBody"></div>
      </div>
      <button class="broadcast-banner-close" id="broadcastBannerClose">✕</button>
    `;
    document.body.appendChild(banner);
    document.getElementById("broadcastBannerClose").addEventListener("click", () => {
      banner.classList.remove("show");
    });
  }
  document.getElementById("broadcastBannerTitle").textContent = title;
  document.getElementById("broadcastBannerBody").textContent = body;
  banner.classList.add("show");
  // بتختفي البانر لوحدها بعد 7 ثواني — بس الرسالة نفسها بتفضل متخزنة جوه "الرسائل"
  setTimeout(() => banner.classList.remove("show"), 7000);
}
function startBroadcastListener(branchId) {
  if (broadcastUnsub) {
    try { broadcastUnsub(); } catch (e) {}
    broadcastUnsub = null;
  }
  if (typeof subscribeBroadcastMessages !== "function") return;
  broadcastUnsub = subscribeBroadcastMessages(branchId, (messages) => {
    // نحدّث قائمة الرسائل المخزنة لمودال "الرسائل" مع كل تحديث لحظي من Firestore
    customerMessagesList = messages.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    renderCustomerMessagesInbox();
    updateMessagesBadge();

    messages
      .filter((m) => m.createdAt > broadcastSessionStart)
      .forEach((m) => {
        if (broadcastShownIds.has(m.id)) return;
        broadcastShownIds.add(m.id);
        // نعرضها بمظهر الموقع سواء داخل التطبيق المثبت أو المتصفح العادي
        showBroadcastBanner(m.title, m.body);
        playNotificationSound();
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(m.title, { body: m.body, icon: "images/icons/icon-192.png" });
          } catch (e) {}
        }
      });
  });
}

// ---------- ضبط الفريم الزجاجي عشان يبقى بنفس مقاس الصورة بالظبط ----------
function syncBranchHeroFrame() {
  const hero = document.querySelector(".branch-hero");
  const framed = document.querySelector(".branch-hero-framed");
  const img = document.querySelector(".branch-hero-img");
  if (!hero || !framed || !img || !img.naturalWidth || !img.naturalHeight) return;

  const CM_TO_PX = 37.7952755906;
  const margin = 0.25 * CM_TO_PX;
  const availW = hero.clientWidth - margin * 2;
  const availH = hero.clientHeight - margin * 2;
  if (availW <= 0 || availH <= 0) return;

  const imgRatio = img.naturalWidth / img.naturalHeight;
  const availRatio = availW / availH;

  let w, h;
  if (imgRatio > availRatio) {
    w = availW;
    h = w / imgRatio;
  } else {
    h = availH;
    w = h * imgRatio;
  }

  framed.style.width = w + "px";
  framed.style.height = h + "px";
  framed.style.left = (hero.clientWidth - w) / 2 + "px";
  framed.style.top = (hero.clientHeight - h) / 2 + "px";
}
window.addEventListener("resize", syncBranchHeroFrame);
window.addEventListener("orientationchange", () => setTimeout(syncBranchHeroFrame, 200));
document.querySelector(".branch-hero-img")?.addEventListener("load", syncBranchHeroFrame);
if (document.querySelector(".branch-hero-img")?.complete) syncBranchHeroFrame();

// ---------- تشغيل أولي ----------
initTheme();
renderCartCount();
renderBranchOptions();
setAboutUsTexts(getSiteLang());
renderRatingBadge();
renderReviewsBars();
renderReviewsList();
startReviewsSubscription();
syncBranchHeroFrame();
if (isRunningStandalone()) document.body.classList.add("is-standalone");
if (state.branchId && BRANCHES[state.branchId]) {
  document.getElementById("branchSelectScreen").style.display = "none";
  document.getElementById("siteWrap").style.display = "block";
  updateBranchBadge();
  startBranchSync();
  startBroadcastListener(state.branchId);
  setupPushForBranch(state.branchId);
  if (typeof startPresenceHeartbeat === "function") startPresenceHeartbeat(state.branchId);
}
