// ============================================================
// منطق صفحة العميل
// ============================================================

// ---------- فتح أي نافذة (مودال) بحيث تطلع من مكان الضغط لنص الشاشة ----------
function openModalPop(modalEl, triggerEl) {
  if (!modalEl) return;
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
  if (panel) {
    panel.addEventListener("animationend", finish, { once: true });
  }
  setTimeout(finish, 400);
}

const state = {
  branchId: sessionStorage.getItem("vitwar_branch") || null,
  branchStatus: "open",
  categories: [],
  products: [],
  addons: [],
  activeCategory: "all",
  cart: JSON.parse(localStorage.getItem("vitwar_cart") || "[]"),
  modalProduct: null,
  modalSelection: { variants: {}, noPriceVariants: {}, addons: {}, qty: 1 },
  checkoutType: null,
  paymentMethod: null,
  branchSyncUnsub: null,
};

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
        <span class="branch-option-name">${b.name}</span>
        <span class="branch-option-loc">${b.location}</span>
      </button>`
    )
    .join("");
  box.querySelectorAll("[data-branch]").forEach((btn) => {
    btn.addEventListener("click", () => selectBranch(btn.dataset.branch));
  });
}

function selectBranch(branchId) {
  state.branchId = branchId;
  sessionStorage.setItem("vitwar_branch", branchId);
  document.getElementById("branchSelectScreen").style.display = "none";
  document.getElementById("siteWrap").style.display = "block";
  document.getElementById("branchBadge").textContent = BRANCHES[branchId].name;
  startBranchSync();
}

document.getElementById("changeBranchBtn").addEventListener("click", () => {
  if (state.branchId && typeof clearSupportSession === "function") {
    clearSupportSession(state.branchId);
  }
  if (state.branchSyncUnsub) {
    try { state.branchSyncUnsub(); } catch (e) {}
    state.branchSyncUnsub = null;
  }
  sessionStorage.removeItem("vitwar_branch");
  localStorage.removeItem("vitwar_cart");
  state.cart = [];
  state.branchId = null;
  state.branchStatus = "open";
  if (typeof renderCartCount === "function") renderCartCount();
  document.getElementById("siteWrap").style.display = "none";
  document.getElementById("branchSelectScreen").style.display = "flex";
});

// ---------- الثيم ----------
function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("vitwar_theme", theme);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}
function initTheme() {
  const saved = localStorage.getItem("vitwar_theme");
  const preferred = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(preferred);
}
document.getElementById("themeToggle").addEventListener("click", () => {
  const current = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(current);
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
    strip.textContent = "🟠 المحل مشغول شوية دلوقتي — تقدر تطلب عادي وطلبك هيتنفذ أول ما يتاح";
  } else if (state.branchStatus === "closed") {
    strip.style.display = "none";
    showClosedBanner(true);
  }
}

// ---------- عرض التصنيفات والمنتجات ----------
function renderCategories() {
  const bar = document.getElementById("categoriesBar");
  const all = [{ id: "all", name: "الكل" }, ...state.categories];
  bar.innerHTML = all
    .map(
      (c) =>
        `<button class="category-chip tap-fx ${state.activeCategory === c.id ? "active" : ""}" data-cat="${c.id}">${c.name}</button>`
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
  const list =
    state.activeCategory === "all"
      ? state.products
      : state.products.filter((p) => p.category === state.activeCategory);

  if (list.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--muted)">لا يوجد أصناف في هذا التصنيف حاليًا</p>`;
    return;
  }

  grid.innerHTML = list
    .map((p) => {
      const hasVariants = p.variantGroups && p.variantGroups.length > 0;
      const priceLabel = hasVariants ? `من ${productBasePrice(p)} ج.م` : `${p.price} ج.م`;
      return `
    <div class="product-card">
      <div class="img-wrap">
        <img src="${p.image}" alt="${p.name}" onerror="this.src='images/logo.png'"/>
        ${!p.available ? '<span class="unavailable-badge">غير متاح حاليًا</span>' : ""}
      </div>
      <div class="info">
        <h3>${p.name}</h3>
        <p class="desc">${p.description || ""}</p>
        <div class="row">
          <span class="price">${priceLabel}</span>
          <button class="glass-btn tap-fx" style="padding:8px 16px" data-open="${p.id}" ${!p.available ? "disabled" : ""}>اختيار</button>
        </div>
      </div>
    </div>
  `;
    })
    .join("");

  grid.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => openProductModal(btn.dataset.open, e.currentTarget));
  });
}

// ============================================================
// مودال اختيار المنتج
// ============================================================
function openProductModal(productId, triggerEl) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  state.modalProduct = product;
  state.modalSelection = { variants: {}, noPriceVariants: {}, addons: {}, qty: 1 };
  (product.variantGroups || []).forEach((g) => {
    state.modalSelection.variants[g.id] = g.options[0]?.id;
  });
  (product.noPriceGroups || []).forEach((g) => {
    state.modalSelection.noPriceVariants[g.id] = g.options[0]?.id;
  });

  document.getElementById("modalProductImg").src = product.image;
  document.getElementById("modalProductImg").onerror = function () { this.src = "images/logo.png"; };
  document.getElementById("modalProductName").textContent = product.name;
  document.getElementById("modalProductDesc").textContent = product.description || "";

  renderModalOptions();
  openModalPop(document.getElementById("productModal"), triggerEl);
}

function closeProductModal() {
  closeModalPop(document.getElementById("productModal"));
  state.modalProduct = null;
}
document.getElementById("closeProductModal").addEventListener("click", closeProductModal);
document.getElementById("productModalOverlay").addEventListener("click", closeProductModal);

function currentModalAddons() {
  const product = state.modalProduct;
  return state.addons.filter((a) => (product.addonIds || []).includes(a.id));
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
            ${o.label} <span class="pill-price">${o.price} ج.م</span>
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
      <div class="variant-group-label">إضافات مميزة (اختياري)</div>
      ${addons
        .map(
          (a) => `
        <label class="addon-row tap-fx">
          <span>${a.name} <span class="pill-price">+${a.price} ج.م</span></span>
          <input type="checkbox" data-addon="${a.id}" ${state.modalSelection.addons[a.id] ? "checked" : ""}/>
          <span class="addon-check"></span>
        </label>
      `
        )
        .join("")}
    </div>`;
  }

  html += `<div class="qty-row">
    <span class="variant-group-label" style="margin:0">الكمية</span>
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
    state.modalSelection.qty++;
    document.getElementById("modalQtyValue").textContent = state.modalSelection.qty;
    updateModalTotal();
  });

  updateModalTotal();
}

function updateModalTotal() {
  const { unit } = computeModalUnitPrice();
  const total = unit * state.modalSelection.qty;
  document.getElementById("modalTotalPrice").textContent = `${total} ج.م`;
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
    name: product.name,
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
    container.innerHTML = `<div class="empty-cart">السلة فاضية دلوقتي</div>`;
    document.getElementById("cartTotal").textContent = "0 ج.م";
    return;
  }
  container.innerHTML = state.cart
    .map((item) => {
      const extras = extrasTextForItem(item);
      return `
      <div class="cart-item">
        <img src="${item.image}" onerror="this.src='images/logo.png'"/>
        <div class="grow">
          <div style="font-weight:700">${item.name}</div>
          ${extras ? `<div style="color:var(--muted);font-size:.78rem">${extras}</div>` : ""}
          <div style="color:var(--muted);font-size:.85rem">${item.unitPrice} ج.م × ${item.qty}</div>
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
  document.getElementById("cartTotal").textContent = `${cartTotal()} ج.م`;

  container.querySelectorAll("[data-qty-plus]").forEach((b) =>
    b.addEventListener("click", () => changeCartQty(b.dataset.qtyPlus, 1))
  );
  container.querySelectorAll("[data-qty-minus]").forEach((b) =>
    b.addEventListener("click", () => changeCartQty(b.dataset.qtyMinus, -1))
  );
}

function openCartDrawer() {
  renderCartDrawer();
  document.getElementById("cartDrawer").classList.add("open");
}
document.getElementById("cartFab").addEventListener("click", openCartDrawer);
document.getElementById("closeCart").addEventListener("click", () => {
  document.getElementById("cartDrawer").classList.remove("open");
});
document.getElementById("cartOverlay").addEventListener("click", () => {
  document.getElementById("cartDrawer").classList.remove("open");
});

// ============================================================
// إتمام الطلب: كافيه / ديليفري / استلام
// ============================================================
document.getElementById("checkoutBtn").addEventListener("click", async (e) => {
  if (state.cart.length === 0) return;
  if (state.branchStatus === "closed") {
    await siteAlert("الفرع مقفول دلوقتي، مينفعش تطلب حاليًا. جرب تاني بعدين 🙏");
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
    state.checkoutType = btn.dataset.orderType;
    renderCheckoutStep2();
  });
});

function renderCheckoutStep2() {
  document.getElementById("checkoutStep1").style.display = "none";
  const step2 = document.getElementById("checkoutStep2");
  step2.style.display = "block";

  let fieldsHtml = "";
  if (state.checkoutType === "cafe") {
    fieldsHtml = `
      <div class="field">
        <label>اسم الكافيه</label>
        <input type="text" id="fieldCafeName" placeholder="اسم الكافيه" />
      </div>
    `;
  } else if (state.checkoutType === "delivery") {
    fieldsHtml = `
      <div class="field">
        <label>العنوان بالتفصيل</label>
        <textarea id="fieldAddress" rows="2" placeholder="العنوان..."></textarea>
      </div>
    `;
  } else if (state.checkoutType === "pickup") {
    fieldsHtml = `
      <div class="field">
        <label>الوقت المتوقع للاستلام</label>
        <select id="fieldPickupTime">
          <option value="15 دقيقة">15 دقيقة</option>
          <option value="30 دقيقة">30 دقيقة</option>
          <option value="1 ساعة">1 ساعة</option>
        </select>
      </div>
    `;
  }

  const typeLabel = { cafe: "كافيه ☕", delivery: "توصيل 🛵", pickup: "استلام 🏃" }[state.checkoutType];
  step2.innerHTML = `
    <div class="option-box">
      <div class="variant-group-label" style="margin-bottom:12px">${typeLabel}</div>
      ${fieldsHtml}
      <div class="field">
        <label>رقم موبايلك</label>
        <input type="tel" id="fieldPhone" placeholder="01xxxxxxxxx" maxlength="11" inputmode="numeric" />
      </div>
      <div class="field">
        <label>طريقة الدفع</label>
        <div class="payment-method-grid">
          <button type="button" class="glass-btn-secondary glass-btn tap-fx payment-method-btn" data-payment="كاش">💵 كاش</button>
          <button type="button" class="glass-btn-secondary glass-btn tap-fx payment-method-btn" data-payment="انستاباي">💳 انستاباي</button>
        </div>
      </div>
      <div class="field">
        <label>تعليق (اختياري)</label>
        <textarea id="fieldComment" rows="2" placeholder="أي ملاحظة على الطلب... (اختياري)"></textarea>
      </div>
      <p class="error-msg" id="checkoutError"></p>
      <button class="glass-btn tap-fx" id="confirmOrderBtn" style="width:100%;margin-top:6px">تأكيد الطلب</button>
      <button class="glass-btn-secondary glass-btn tap-fx" id="backToStep1" style="width:100%">رجوع</button>
    </div>
  `;

  step2.querySelectorAll(".payment-method-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.paymentMethod = btn.dataset.payment;
      step2.querySelectorAll(".payment-method-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  document.getElementById("backToStep1").addEventListener("click", () => {
    document.getElementById("checkoutStep1").style.display = "block";
    step2.style.display = "none";
  });
  document.getElementById("confirmOrderBtn").addEventListener("click", submitOrder);
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

async function submitOrder() {
  const errEl = document.getElementById("checkoutError");
  errEl.textContent = "";

  const fields = {};
  if (state.checkoutType === "cafe") {
    fields.cafeName = document.getElementById("fieldCafeName").value.trim();
    if (!fields.cafeName) {
      errEl.textContent = "من فضلك اكتب اسم الكافيه";
      return;
    }
  } else if (state.checkoutType === "delivery") {
    fields.address = document.getElementById("fieldAddress").value.trim();
    if (!fields.address) {
      errEl.textContent = "من فضلك اكتب العنوان";
      return;
    }
  } else if (state.checkoutType === "pickup") {
    fields.pickupTime = document.getElementById("fieldPickupTime").value;
  }

  const phoneRaw = document.getElementById("fieldPhone").value.trim();
  if (!/^[0-9]{11}$/.test(phoneRaw)) {
    errEl.textContent = "من فضلك اكتب رقم موبايل صحيح";
    return;
  }
  fields.phone = phoneRaw;

  if (!state.paymentMethod) {
    errEl.textContent = "من فضلك اختار طريقة الدفع";
    return;
  }
  fields.payment = state.paymentMethod;
  fields.comment = document.getElementById("fieldComment").value.trim();

  const total = cartTotal();
  const isBusy = state.branchStatus === "busy";
  const confirmBtn = document.getElementById("confirmOrderBtn");
  confirmBtn.disabled = true;
  confirmBtn.textContent = "جاري إرسال الطلب...";

  const orderPayload = {
    type: state.checkoutType,
    items: state.cart.map((i) => ({
      name: i.name,
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
    errEl.textContent = "حصل خطأ في إرسال الطلب، حاول تاني";
    confirmBtn.disabled = false;
    confirmBtn.textContent = "تأكيد الطلب";
    return;
  }

  sendTelegramOrderNotification(buildTelegramMessage(order, BRANCHES[state.branchId]));
  openWhatsAppOrder(order, BRANCHES[state.branchId]);

  state.cart = [];
  saveCart();
  document.getElementById("checkoutModal").classList.remove("open");
  document.getElementById("cartDrawer").classList.remove("open");

  if (isBusy) {
    await siteAlert(`تم استلام طلبك وكوده #${order.code} ✅\nالمحل مشغول شوية دلوقتي، هيتم تجهيز طلبك أول ما يتاح.`);
  } else if (state.checkoutType === "delivery") {
    showGlassNote(`تم إرسال طلبك بنجاح ✅ كود طلبك #${order.code}`);
  } else {
    showGlassNote(`تم إرسال طلبك بنجاح ✅ كود طلبك #${order.code}`);
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
    state.addons = data.addons || [];
    state.branchStatus = data.status || "open";
    renderStatusStrip();
    renderCategories();
    renderProducts();
  });
}

// ---------- تثبيت الموقع كتطبيق (فون / ويندوز / ماك) ----------
let deferredInstallPrompt = null;
function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}
function isRunningStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
(function initInstallButton() {
  const btn = document.getElementById("installAppBtn");
  if (!btn || isRunningStandalone()) return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    btn.style.display = "inline-flex";
  });

  if (isIosDevice()) {
    btn.style.display = "inline-flex";
  }

  btn.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      btn.style.display = "none";
      return;
    }
    if (isIosDevice()) {
      await siteAlert('لتثبيت التطبيق على آيفون/آيباد: دوس زرار المشاركة ⬆️ تحت في Safari، وبعدين اختار "إضافة إلى الشاشة الرئيسية".');
    } else {
      await siteAlert('افتح قائمة المتصفح (⋮ فوق يمين) وهتلاقي خيار "تثبيت التطبيق" أو "Install App" / "Install Vitwar".');
    }
  });

  window.addEventListener("appinstalled", () => {
    btn.style.display = "none";
    deferredInstallPrompt = null;
  });
})();

// ---------- تشغيل أولي ----------
initTheme();
renderCartCount();
renderBranchOptions();
if (state.branchId && BRANCHES[state.branchId]) {
  document.getElementById("branchSelectScreen").style.display = "none";
  document.getElementById("siteWrap").style.display = "block";
  document.getElementById("branchBadge").textContent = BRANCHES[state.branchId].name;
  startBranchSync();
}
