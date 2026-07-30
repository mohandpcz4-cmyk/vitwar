// ============================================================
// طبقة البيانات المشتركة بين صفحة العميل ولوحة الأدمن
// لو Firebase متظبط: كل حاجة بتتزامن لحظيًا لكل الأجهزة.
// لو مش متظبط لسه: بيشتغل محليًا بـ localStorage (للتجربة بس).
// ============================================================

const DEFAULT_CATEGORIES = [
  { id: "waffle", name: "وافل" },
  { id: "brownie", name: "براونيز" },
  { id: "cups", name: "كوبات حلا" },
  { id: "icecream", name: "آيس كريم" },
  { id: "pancake", name: "ميني بان كيك" },
];

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
    seedBranchIfNeeded(branchId).then(() => {
      db.collection("branches").doc(branchId).onSnapshot((snap) => {
        if (snap.exists) callback(snap.data());
      });
    });
    return;
  }
  // fallback: قراءة فورية + تحديث لما يحصل تغيير في نفس المتصفح
  callback(localGetBranch(branchId));
  window.addEventListener("storage", (e) => {
    if (e.key === localKey(branchId)) callback(localGetBranch(branchId));
  });
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
