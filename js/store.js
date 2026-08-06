// ============================================================
// طبقة البيانات المشتركة بين صفحة العميل ولوحة الأدمن
// لو Firebase متظبط: كل حاجة بتتزامن لحظيًا لكل الأجهزة.
// لو مش متظبط لسه: بيشتغل محليًا بـ localStorage (للتجربة بس).
// ============================================================

// بنعرّفها هنا (أول ملف بيتحمّل) عشان أي كود في main.js يقدر يستخدمها
// فورًا من غير ما يستنى js/chat.js يخلص تحميل
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

const DEFAULT_CATEGORIES = [
  { id: "waffle", name: "وافل", nameEn: "Waffle" },
  { id: "brownie", name: "براونيز", nameEn: "Brownie" },
  { id: "cups", name: "كوبات حلا", nameEn: "Dessert Cups" },
  { id: "icecream", name: "آيس كريم", nameEn: "Ice Cream" },
  { id: "pancake", name: "ميني بان كيك", nameEn: "Mini Pancakes" },
];

// العروض: نفس فكرة الصنف (اسم، وصف، صورة، سعر) + مجموعتين اختيارات
// (بسعر / من غير سعر احتياطي)، بس من غير تصنيف أو إضافات — ليها تبويبها
// المستقل في واجهة العميل بدل ما تتحط جوه "الأصناف".
const DEFAULT_OFFERS = [];

const DEFAULT_ADDONS = [
  { id: "addon_icecream", name: "إضافة آيس كريم", price: 20 },
  { id: "addon_nutella", name: "نوتيلا إضافية", price: 15 },
  { id: "addon_lotus", name: "صوص لوتس إضافي", price: 15 },
];

const DEFAULT_PRODUCTS = [
  {
    id: "p1", name: "وافل نوتيلا", category: "waffle", price: 90,
    description: "وافل ساخن مقرمش مغطى بصوص نوتيلا غني وتوبينج مشكل.",
    image: "images/aif3z3o5sbchcnwva7os.jpg", available: true,
    variantGroups: [
      { id: "vg_style", label: "طريقة التقديم", options: [
        { id: "o_plate", label: "طبق", price: 90 },
        { id: "o_sandwich", label: "ساندوتش", price: 90 },
      ]}
    ],
    noPriceGroups: [],
    addonIds: ["addon_icecream", "addon_nutella"],
  },
  {
    id: "p3", name: "براونيز بالآيس كريم", category: "brownie", price: 85,
    description: "قطعة براونيز دافئة مع كرة آيس كريم فانيليا وصوص شوكولاتة.",
    image: "images/j4iopbrylhzncyd4o1wi.jpg", available: true,
    variantGroups: [], noPriceGroups: [], addonIds: ["addon_icecream"],
  },
  {
    id: "p4", name: "كوب حلا مشكل", category: "cups", price: 75,
    description: "طبقات من الكيك والكريمة وصوصات مشكلة في كوب.",
    image: "images/l8vwac2bxbl78hp5cckz.jpg", available: true,
    variantGroups: [], noPriceGroups: [], addonIds: [],
  },
];

function defaultBranchData() {
  return {
    status: "open", // open | closed | busy
    categories: DEFAULT_CATEGORIES,
    products: DEFAULT_PRODUCTS,
    offers: DEFAULT_OFFERS,
    addons: DEFAULT_ADDONS,
  };
}

// ---------- محلي (fallback) ----------
function localKey(branchId) {
  return `vitwar_branch_${branchId}`;
}
function localGetBranch(branchId) {
  const raw = localStorage.getItem(localKey(branchId));
  if (!raw) {
    const data = defaultBranchData();
    localStorage.setItem(localKey(branchId), JSON.stringify(data));
    return data;
  }
  return JSON.parse(raw);
}
function localSaveBranch(branchId, data) {
  localStorage.setItem(localKey(branchId), JSON.stringify(data));
}
function localOrdersKey(branchId) {
  return `vitwar_orders_${branchId}`;
}
function localGetOrders(branchId) {
  return JSON.parse(localStorage.getItem(localOrdersKey(branchId)) || "[]");
}
function localSaveOrders(branchId, orders) {
  localStorage.setItem(localOrdersKey(branchId), JSON.stringify(orders));
}

// ---------- الفرع: قراءة + اشتراك لحظي ----------
async function seedBranchIfNeeded(branchId) {
  if (!firebaseReady) return;
  const ref = db.collection("branches").doc(branchId);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set(defaultBranchData());
  }
}

function subscribeBranch(branchId, callback) {
  if (firebaseReady) {
    let unsub = null;
    let cancelled = false;
    seedBranchIfNeeded(branchId).then(() => {
      if (cancelled) return;
      unsub = db.collection("branches").doc(branchId).onSnapshot((snap) => {
        if (snap.exists) callback(snap.data());
      });
    });
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }
  // fallback: قراءة فورية + تحديث لما يحصل تغيير في نفس المتصفح
  callback(localGetBranch(branchId));
  const handler = (e) => {
    if (e.key === localKey(branchId)) callback(localGetBranch(branchId));
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

async function saveBranchData(branchId, partialData) {
  if (firebaseReady) {
    await db.collection("branches").doc(branchId).set(partialData, { merge: true });
  } else {
    const current = localGetBranch(branchId);
    const merged = Object.assign({}, current, partialData);
    localSaveBranch(branchId, merged);
  }
}

async function setBranchStatus(branchId, status) {
  await saveBranchData(branchId, { status });
}

// ---------- عداد رقم الأوردر (مشترك بين الفرعين) ----------
async function nextOrderCode() {
  if (firebaseReady) {
    const ref = db.collection("counters").doc("global");
    const code = await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      let next = ORDER_CODE_START;
      if (snap.exists && typeof snap.data().next === "number") {
        next = snap.data().next;
      }
      t.set(ref, { next: next + 1 }, { merge: true });
      return next;
    });
    return code;
  }
  const key = "vitwar_order_counter";
  let next = parseInt(localStorage.getItem(key) || String(ORDER_CODE_START), 10);
  localStorage.setItem(key, String(next + 1));
  return next;
}

// ---------- الطلبات ----------
async function addOrder(branchId, orderData) {
  const code = await nextOrderCode();
  const fullOrder = Object.assign({}, orderData, {
    code,
    branchId,
    seen: false,
    createdAt: Date.now(),
  });
  if (firebaseReady) {
    const ref = await db.collection("branches").doc(branchId).collection("orders").add(fullOrder);
    fullOrder.id = ref.id;
  } else {
    const orders = localGetOrders(branchId);
    fullOrder.id = "o_" + Date.now();
    orders.unshift(fullOrder);
    localSaveOrders(branchId, orders);
  }
  return fullOrder;
}

function subscribeOrders(branchId, callback) {
  if (firebaseReady) {
    db.collection("branches").doc(branchId).collection("orders")
      .orderBy("createdAt", "desc").limit(200)
      .onSnapshot((qs) => {
        const orders = [];
        qs.forEach((d) => orders.push(Object.assign({ id: d.id }, d.data())));
        callback(orders);
      });
    return;
  }
  callback(localGetOrders(branchId));
  window.addEventListener("storage", (e) => {
    if (e.key === localOrdersKey(branchId)) callback(localGetOrders(branchId));
  });
  setInterval(() => callback(localGetOrders(branchId)), 4000);
}

async function markOrderSeen(branchId, orderId) {
  if (firebaseReady) {
    await db.collection("branches").doc(branchId).collection("orders").doc(orderId).update({ seen: true });
  } else {
    const orders = localGetOrders(branchId);
    const o = orders.find((x) => x.id === orderId);
    if (o) o.seen = true;
    localSaveOrders(branchId, orders);
  }
}

async function clearAllOrders(branchId) {
  if (firebaseReady) {
    const qs = await db.collection("branches").doc(branchId).collection("orders").get();
    const batch = db.batch();
    qs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } else {
    localSaveOrders(branchId, []);
  }
}

// ---------- شات الدعم ----------
function localChatsKey(branchId) {
  return `vitwar_chats_${branchId}`;
}
function localGetChats(branchId) {
  return JSON.parse(localStorage.getItem(localChatsKey(branchId)) || "[]");
}
function localSaveChats(branchId, chats) {
  localStorage.setItem(localChatsKey(branchId), JSON.stringify(chats));
}
function localChatMsgsKey(branchId, chatId) {
  return `vitwar_chatmsgs_${branchId}_${chatId}`;
}
function localGetChatMsgs(branchId, chatId) {
  return JSON.parse(localStorage.getItem(localChatMsgsKey(branchId, chatId)) || "[]");
}
function localSaveChatMsgs(branchId, chatId, msgs) {
  localStorage.setItem(localChatMsgsKey(branchId, chatId), JSON.stringify(msgs));
}

async function createChat(branchId, { name, phone }) {
  const base = {
    name,
    phone,
    status: "open",
    createdAt: Date.now(),
    lastMessageAt: Date.now(),
    lastMessageText: "",
    lastSender: "customer",
    unreadForAdmin: false,
    unreadForCustomer: false,
  };
  if (firebaseReady) {
    const ref = await db.collection("branches").doc(branchId).collection("chats").add(base);
    return Object.assign({ id: ref.id }, base);
  }
  const chats = localGetChats(branchId);
  const chat = Object.assign({ id: "c_" + Date.now() }, base);
  chats.unshift(chat);
  localSaveChats(branchId, chats);
  return chat;
}

function subscribeChats(branchId, callback) {
  if (firebaseReady) {
    db.collection("branches").doc(branchId).collection("chats")
      .orderBy("lastMessageAt", "desc").limit(200)
      .onSnapshot((qs) => {
        const chats = [];
        qs.forEach((d) => chats.push(Object.assign({ id: d.id }, d.data())));
        callback(chats);
      });
    return;
  }
  callback(localGetChats(branchId));
  window.addEventListener("storage", (e) => {
    if (e.key === localChatsKey(branchId)) callback(localGetChats(branchId));
  });
  setInterval(() => callback(localGetChats(branchId)), 3000);
}

function subscribeSingleChat(branchId, chatId, callback) {
  if (firebaseReady) {
    return db.collection("branches").doc(branchId).collection("chats").doc(chatId)
      .onSnapshot((snap) => {
        if (snap.exists) callback(Object.assign({ id: snap.id }, snap.data()));
      });
  }
  const tick = () => {
    const chat = localGetChats(branchId).find((c) => c.id === chatId);
    if (chat) callback(chat);
  };
  tick();
  const interval = setInterval(tick, 3000);
  return () => clearInterval(interval);
}

function subscribeChatMessages(branchId, chatId, callback) {
  if (firebaseReady) {
    return db.collection("branches").doc(branchId).collection("chats").doc(chatId)
      .collection("messages").orderBy("createdAt", "asc")
      .onSnapshot((qs) => {
        const msgs = [];
        qs.forEach((d) => msgs.push(Object.assign({ id: d.id }, d.data())));
        callback(msgs);
      });
  }
  callback(localGetChatMsgs(branchId, chatId));
  const handler = (e) => {
    if (e.key === localChatMsgsKey(branchId, chatId)) callback(localGetChatMsgs(branchId, chatId));
  };
  window.addEventListener("storage", handler);
  const interval = setInterval(() => callback(localGetChatMsgs(branchId, chatId)), 3000);
  return () => {
    window.removeEventListener("storage", handler);
    clearInterval(interval);
  };
}

async function sendChatMessage(branchId, chatId, sender, text) {
  const msg = { sender, text, createdAt: Date.now() };
  const chatUpdate = {
    lastMessageAt: msg.createdAt,
    lastMessageText: text,
    lastSender: sender,
  };
  if (sender === "customer") chatUpdate.unreadForAdmin = true;
  if (sender === "admin") chatUpdate.unreadForCustomer = true;

  if (firebaseReady) {
    const chatRef = db.collection("branches").doc(branchId).collection("chats").doc(chatId);
    await chatRef.collection("messages").add(msg);
    await chatRef.set(chatUpdate, { merge: true });
    return;
  }
  const msgs = localGetChatMsgs(branchId, chatId);
  msg.id = "m_" + Date.now();
  msgs.push(msg);
  localSaveChatMsgs(branchId, chatId, msgs);
  const chats = localGetChats(branchId);
  const chat = chats.find((c) => c.id === chatId);
  if (chat) Object.assign(chat, chatUpdate);
  localSaveChats(branchId, chats);
}

async function closeChat(branchId, chatId) {
  const sysMsg = { sender: "system", text: "تم إغلاق المحادثة بواسطة الدعم", createdAt: Date.now() };
  if (firebaseReady) {
    const chatRef = db.collection("branches").doc(branchId).collection("chats").doc(chatId);
    await chatRef.collection("messages").add(sysMsg);
    await chatRef.set({ status: "closed", unreadForCustomer: true }, { merge: true });
    return;
  }
  const msgs = localGetChatMsgs(branchId, chatId);
  sysMsg.id = "m_" + Date.now();
  msgs.push(sysMsg);
  localSaveChatMsgs(branchId, chatId, msgs);
  const chats = localGetChats(branchId);
  const chat = chats.find((c) => c.id === chatId);
  if (chat) Object.assign(chat, { status: "closed", unreadForCustomer: true });
  localSaveChats(branchId, chats);
}

async function deleteChat(branchId, chatId) {
  if (firebaseReady) {
    const chatRef = db.collection("branches").doc(branchId).collection("chats").doc(chatId);
    const msgsSnap = await chatRef.collection("messages").get();
    const batch = db.batch();
    msgsSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(chatRef);
    await batch.commit();
    return;
  }
  const chats = localGetChats(branchId).filter((c) => c.id !== chatId);
  localSaveChats(branchId, chats);
  localStorage.removeItem(localChatMsgsKey(branchId, chatId));
}

async function markChatSeenByAdmin(branchId, chatId) {
  const patch = { unreadForAdmin: false, lastSeenByAdminAt: Date.now() };
  if (firebaseReady) {
    await db.collection("branches").doc(branchId).collection("chats").doc(chatId).set(patch, { merge: true });
    return;
  }
  const chats = localGetChats(branchId);
  const chat = chats.find((c) => c.id === chatId);
  if (chat) Object.assign(chat, patch);
  localSaveChats(branchId, chats);
}

// ---------- مؤشر "بيكتب الآن..." (Typing indicator) ----------
// بنخزن على مستوى الشات نفسه timestamp لآخر لحظة كتابة، وبنعتبره "بيكتب"
// لو الفرق بينه وبين دلوقتي أقل من TYPING_TIMEOUT_MS (بيتلغي لوحده لو الطرف قفل التاب فجأة)
const TYPING_TIMEOUT_MS = 4000;
async function setTypingStatus(branchId, chatId, who, isTyping) {
  if (!chatId) return;
  const field = who === "admin" ? "typingAdminAt" : "typingCustomerAt";
  const patch = { [field]: isTyping ? Date.now() : 0 };
  if (firebaseReady) {
    try {
      await db.collection("branches").doc(branchId).collection("chats").doc(chatId).set(patch, { merge: true });
    } catch (e) {}
    return;
  }
  const chats = localGetChats(branchId);
  const chat = chats.find((c) => c.id === chatId);
  if (chat) Object.assign(chat, patch);
  localSaveChats(branchId, chats);
}
function isTypingActive(typingAt) {
  return !!typingAt && (Date.now() - typingAt) < TYPING_TIMEOUT_MS;
}

// ---------- رسايل ترحيب تلقائية أول ما العميل يبدأ شات جديد ----------
async function sendAutoReplyMessages(branchId, chatId) {
  const autoMsgs = [
    "من الممكن ان نتأخر في الرد ولكن سنحاول الإجابة سريعاً",
    "برجاء اترك رسالتك.",
  ];
  for (const text of autoMsgs) {
    await sendChatMessage(branchId, chatId, "admin", text);
  }
}

// ---------- رسائل الأدمن (Messages / Broadcast) ----------
// ملاحظة مهمة: ده بث "لحظي" لأي حد فاتح الموقع/التطبيق دلوقتي (سواء تاب مفتوح
// في الخلفية أو التطبيق شغال) — مش إشعار Push حقيقي بيوصل للتليفون وهو مقفول
// خالص. إشعار Push حقيقي وقت ما التطبيق مقفول محتاج سيرفر (Firebase Cloud
// Functions + FCM) مش موجود في المشروع ده حاليًا.
function localMessagesKey(branchId) {
  return `vitwar_messages_${branchId}`;
}
function localGetMessages(branchId) {
  return JSON.parse(localStorage.getItem(localMessagesKey(branchId)) || "[]");
}
function localSaveMessages(branchId, msgs) {
  localStorage.setItem(localMessagesKey(branchId), JSON.stringify(msgs));
}

async function sendBroadcastMessage(branchId, { title, body }) {
  const msg = { title, body, createdAt: Date.now() };
  if (firebaseReady) {
    const ref = await db.collection("branches").doc(branchId).collection("messages").add(msg);
    return Object.assign({ id: ref.id }, msg);
  }
  const msgs = localGetMessages(branchId);
  msg.id = "msg_" + Date.now();
  msgs.unshift(msg);
  localSaveMessages(branchId, msgs);
  return msg;
}

function subscribeBroadcastMessages(branchId, callback) {
  if (firebaseReady) {
    return db.collection("branches").doc(branchId).collection("messages")
      .orderBy("createdAt", "desc").limit(50)
      .onSnapshot((qs) => {
        const msgs = [];
        qs.forEach((d) => msgs.push(Object.assign({ id: d.id }, d.data())));
        callback(msgs);
      });
  }
  callback(localGetMessages(branchId));
  const handler = (e) => {
    if (e.key === localMessagesKey(branchId)) callback(localGetMessages(branchId));
  };
  window.addEventListener("storage", handler);
  const interval = setInterval(() => callback(localGetMessages(branchId)), 3000);
  return () => {
    window.removeEventListener("storage", handler);
    clearInterval(interval);
  };
}

async function deleteAllBroadcastMessages(branchId) {
  if (firebaseReady) {
    const snap = await db.collection("branches").doc(branchId).collection("messages").get();
    const batch = db.batch();
    snap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    return;
  }
  localSaveMessages(branchId, []);
}

async function markChatSeenByCustomer(branchId, chatId) {
  const patch = { unreadForCustomer: false, lastSeenByCustomerAt: Date.now() };
  if (firebaseReady) {
    await db.collection("branches").doc(branchId).collection("chats").doc(chatId).set(patch, { merge: true });
    return;
  }
  const chats = localGetChats(branchId);
  const chat = chats.find((c) => c.id === chatId);
  if (chat) Object.assign(chat, patch);
  localSaveChats(branchId, chats);
}

// ---------- التقييمات المشتركة (Reviews) — اشتراك لحظي عشان أي تقييم جديد يبان لكل العملاء فورًا ----------
function subscribeAllReviews(callback) {
  if (firebaseReady) {
    return db.collection("reviews").orderBy("createdAt", "desc").limit(300).onSnapshot((qs) => {
      const reviews = [];
      qs.forEach((d) => reviews.push(Object.assign({ id: d.id }, d.data())));
      callback(reviews);
    }, () => callback([]));
  }
  callback([]);
  return () => {};
}

// ============================================================
// حسابات العملاء (تسجيل دخول بالاسم/الرقم/باسورد يختاره العميل)
// ============================================================
// بنستخدم رقم الموبايل كمعرّف الحساب بدل الإيميل الحقيقي (العميل معطاش إيميل جوجل ولا حاجة تخصه،
// فبنبني "إيميل" داخلي وهمي بس عشان Firebase Auth محتاج شكل إيميل، ده مش إيميل حقيقي وميتبعتش لحد)
function customerPseudoEmail(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return `${digits}@vitwar-customer.local`;
}

async function signUpCustomerAccount({ name, phone, password }) {
  if (!firebaseReady || !auth || !db) throw new Error("firebase-not-ready");
  const email = customerPseudoEmail(phone);
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName: name });
  await db.collection("customers").doc(cred.user.uid).set({
    name,
    phone,
    createdAt: Date.now(),
  });
  return { uid: cred.user.uid, name, phone };
}

async function loginCustomerAccount({ phone, password }) {
  if (!firebaseReady || !auth) throw new Error("firebase-not-ready");
  const email = customerPseudoEmail(phone);
  const cred = await auth.signInWithEmailAndPassword(email, password);
  let name = cred.user.displayName || "";
  let phoneFromDb = phone;
  try {
    const doc = await db.collection("customers").doc(cred.user.uid).get();
    if (doc.exists) {
      name = doc.data().name || name;
      phoneFromDb = doc.data().phone || phone;
    }
  } catch (e) {}
  return { uid: cred.user.uid, name, phone: phoneFromDb };
}

async function logoutCustomerAccount() {
  if (!firebaseReady || !auth) return;
  await auth.signOut();
}

// تسجيل/تحديث حساب العميل اللي داخل بجوجل في نفس كولكشن customers، عشان يتحسب
// في إحصائية "حسابات مسجلة على الموقع" باللوحة (قبل كده كانت بس بتحفظ حسابات
// الرقم/الباسورد القديمة، فحسابات جوجل مكانتش بتتسجل هناك خالص)
async function saveGoogleCustomerAccount(user) {
  if (!firebaseReady || !db || !user) return;
  try {
    const ref = db.collection("customers").doc(user.uid);
    const doc = await ref.get();
    const data = {
      name: user.displayName || "",
      email: user.email || "",
      provider: "google",
    };
    if (!doc.exists) data.createdAt = Date.now();
    await ref.set(data, { merge: true });
  } catch (e) {
    console.error("saveGoogleCustomerAccount error:", e);
  }
}

// ============================================================
// إحصائيات لوحة الأدمن: حسابات مسجلة / أونلاين دلوقتي / الإيرادات
// ============================================================

// عدد كل حسابات العملاء المسجلة على الموقع (كل الفروع مع بعض)
async function getTotalRegisteredAccounts() {
  if (!firebaseReady || !db) return null;
  try {
    const snap = await db.collection("customers").count().get();
    return snap.data().count;
  } catch (e) {
    console.error("getTotalRegisteredAccounts error:", e);
    return null; // على الأغلب لسه محتاج تحديث Firestore Rules (شوف SETUP.md)
  }
}

// نبضة حياة كل شوية عشان نعرف مين فاتح الموقع دلوقتي بالظبط
let presenceHeartbeatTimer = null;
function startPresenceHeartbeat(branchId) {
  if (!firebaseReady || !db || !branchId) return;
  const sessionId =
    sessionStorage.getItem("vitwar_presence_id") ||
    (() => {
      const id = "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem("vitwar_presence_id", id);
      return id;
    })();
  const ping = () => {
    db.collection("branches").doc(branchId).collection("presence").doc(sessionId)
      .set({ updatedAt: Date.now() }, { merge: true })
      .catch(() => {});
  };
  ping();
  clearInterval(presenceHeartbeatTimer);
  presenceHeartbeatTimer = setInterval(ping, 20000);
  window.addEventListener("beforeunload", () => {
    db.collection("branches").doc(branchId).collection("presence").doc(sessionId).delete().catch(() => {});
  });
}

// عدد الجلسات اللي كانت شغالة في آخر 45 ثانية = "فاتحين الموقع دلوقتي"
function subscribePresenceCount(branchId, callback) {
  if (!firebaseReady || !db || !branchId) {
    callback(null);
    return () => {};
  }
  return db.collection("branches").doc(branchId).collection("presence").onSnapshot(
    (qs) => {
      const now = Date.now();
      let count = 0;
      qs.forEach((d) => {
        const data = d.data();
        if (data.updatedAt && now - data.updatedAt < 45000) count++;
      });
      callback(count);
    },
    () => callback(null)
  );
}

// إيرادات اليوم وإجمالي الإيرادات من كل الطلبات (مش بس آخر 200 زي state.orders)
async function getRevenueStats(branchId) {
  if (!firebaseReady || !db || !branchId) return { daily: null, total: null };
  try {
    const qs = await db.collection("branches").doc(branchId).collection("orders").get();
    const todayStr = new Date().toDateString();
    let daily = 0;
    let total = 0;
    qs.forEach((d) => {
      const o = d.data();
      const amount = Number(o.total) || 0;
      total += amount;
      if (o.createdAt && new Date(o.createdAt).toDateString() === todayStr) daily += amount;
    });
    return { daily, total };
  } catch (e) {
    console.error("getRevenueStats error:", e);
    return { daily: null, total: null };
  }
}
