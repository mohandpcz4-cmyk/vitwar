// ============================================================
// منطق لوحة الأدمن
// ============================================================

const state = {
  branchId: null,
  categories: [],
  products: [],
  addons: [],
  orders: [],
  branchStatus: "open",
  editingId: null,
  formVariantGroups: [],
  formNoPriceGroups: [],
  formAddonIds: new Set(),
  playedSoundIds: new Set(),
};

// ---------- الثيم ----------
function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("vitwar_theme", theme);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}
(function initTheme() {
  const saved = localStorage.getItem("vitwar_theme");
  const preferred = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(preferred);
})();
document.getElementById("themeToggle")?.addEventListener("click", () => {
  const current = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(current);
});

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
    btn.addEventListener("click", () => {
      state.branchId = btn.dataset.branch;
      document.getElementById("branchSelectScreen").style.display = "none";
      document.getElementById("loginBranchName").textContent = BRANCHES[state.branchId].name;
      document.getElementById("loginScreen").style.display = "flex";
    });
  });
}
document.getElementById("backToBranchSelect").addEventListener("click", () => {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("branchSelectScreen").style.display = "flex";
});

function showApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("branchSelectScreen").style.display = "none";
  document.getElementById("adminScreen").style.display = "block";
  document.getElementById("adminBranchName").textContent = BRANCHES[state.branchId].name;
  loadAll();
  initAudioOnFirstClick();
}
function showLogin() {
  document.getElementById("adminScreen").style.display = "none";
  if (state.branchId) {
    document.getElementById("loginBranchName").textContent = BRANCHES[state.branchId].name;
    document.getElementById("loginScreen").style.display = "flex";
  } else {
    document.getElementById("branchSelectScreen").style.display = "flex";
  }
}

// ---------- تسجيل الدخول ----------
document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  const branch = BRANCHES[state.branchId];

  if (username !== branch.adminUser || password !== branch.adminPass) {
    errEl.textContent = "بيانات الدخول غلط";
    return;
  }

  // تسجيل دخول Firebase Auth عشان قواعد الأمان تسمح بالتعديل
  if (firebaseReady) {
    try {
      await auth.signInWithEmailAndPassword(branch.authEmail, password);
    } catch (e) {
      console.error(e);
      errEl.textContent = "تعذر الاتصال بالسيرفر. راجع إعدادات Firebase Authentication (شوف SETUP.md).";
      return;
    }
  }

  sessionStorage.setItem("vitwar_admin_branch", state.branchId);
  showApp();
});
document.getElementById("logoutBtn").addEventListener("click", async () => {
  sessionStorage.removeItem("vitwar_admin_branch");
  if (firebaseReady && auth.currentUser) {
    try { await auth.signOut(); } catch (e) {}
  }
  showLogin();
});
function checkAuth() {
  const saved = sessionStorage.getItem("vitwar_admin_branch");
  if (saved && BRANCHES[saved]) {
    state.branchId = saved;
    showApp();
  } else {
    renderBranchOptions();
    document.getElementById("branchSelectScreen").style.display = "flex";
  }
}

// ---------- التبويبات ----------
document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach((p) => (p.style.display = "none"));
    document.getElementById("tab-" + tab.dataset.tab).style.display = "block";
    if (tab.dataset.tab === "orders") {
      markAllOrdersSeen();
    }
  });
});

// ---------- حالة الفرع ----------
function renderStatusButtons() {
  document.querySelectorAll(".status-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.status === state.branchStatus);
  });
}
document.querySelectorAll(".status-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    await setBranchStatus(state.branchId, btn.dataset.status);
    showToast("تم تحديث حالة الفرع ✅", "success");
  });
});

// ---------- تحميل كل البيانات ----------
function loadAll() {
  subscribeBranch(state.branchId, (data) => {
    state.categories = data.categories || [];
    state.products = data.products || [];
    state.addons = data.addons || [];
    state.branchStatus = data.status || "open";
    renderStatusButtons();
    loadCategoriesUI();
    loadAddonsLibraryUI();
    loadProductsUI();
  });
  subscribeOrders(state.branchId, (orders) => {
    checkForNewOrders(orders);
  });
  loadTelegramSettings();
}

async function persistBranchMenu() {
  await saveBranchData(state.branchId, {
    categories: state.categories,
    products: state.products,
    addons: state.addons,
  });
}

// ================= التصنيفات =================
function loadCategoriesUI() {
  const select = document.getElementById("pCategory");
  const prevValue = select.value;
  select.innerHTML = state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  if (prevValue) select.value = prevValue;

  const list = document.getElementById("categoriesList");
  if (state.categories.length === 0) {
    list.innerHTML = `<p style="color:var(--muted)">لا يوجد تصنيفات بعد</p>`;
    return;
  }
  list.innerHTML = state.categories
    .map(
      (c) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)">
      <span>${c.name}</span>
      <button class="small-btn delete tap-fx" data-del-cat="${c.id}">حذف</button>
    </div>`
    )
    .join("");
  list.querySelectorAll("[data-del-cat]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await siteConfirm("متأكد عايز تحذف التصنيف ده؟");
      if (!ok) return;
      state.categories = state.categories.filter((c) => c.id !== btn.dataset.delCat);
      await persistBranchMenu();
    });
  });
}
document.getElementById("addCategoryBtn").addEventListener("click", async () => {
  const input = document.getElementById("newCategoryName");
  const name = input.value.trim();
  if (!name) return;
  const id = "c_" + Date.now().toString(36);
  state.categories.push({ id, name });
  await persistBranchMenu();
  input.value = "";
});

// ================= مكتبة الإضافات =================
function loadAddonsLibraryUI() {
  const tbody = document.getElementById("addonsTableBody");
  if (state.addons.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--muted)">لا يوجد إضافات بعد</td></tr>`;
  } else {
    tbody.innerHTML = state.addons
      .map(
        (a) => `
      <tr>
        <td>${a.name}</td>
        <td>${a.price} ج.م</td>
        <td><button class="small-btn delete tap-fx" data-del-addon="${a.id}">حذف</button></td>
      </tr>`
      )
      .join("");
    tbody.querySelectorAll("[data-del-addon]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const ok = await siteConfirm("متأكد عايز تحذف الإضافة دي؟");
        if (!ok) return;
        state.addons = state.addons.filter((a) => a.id !== btn.dataset.delAddon);
        await persistBranchMenu();
      });
    });
  }
  renderAddonsChecklist();
}
document.getElementById("addonForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("addonName").value.trim();
  const price = Number(document.getElementById("addonPrice").value);
  if (!name || !price) return;
  const id = "addon_" + Date.now().toString(36);
  state.addons.push({ id, name, price });
  await persistBranchMenu();
  document.getElementById("addonForm").reset();
});

function renderAddonsChecklist() {
  const container = document.getElementById("productAddonsChecklist");
  if (state.addons.length === 0) {
    container.innerHTML = `<p style="color:var(--muted);font-size:.85rem">لسه مفيش إضافات — ضيفها من تبويب "الإضافات" الأول.</p>`;
    return;
  }
  container.innerHTML = state.addons
    .map(
      (a) => `
    <label class="addon-checklist-row tap-fx">
      <input type="checkbox" data-addon-check="${a.id}" ${state.formAddonIds.has(a.id) ? "checked" : ""} />
      <span>${a.name} (${a.price} ج.م)</span>
    </label>`
    )
    .join("");
  container.querySelectorAll("[data-addon-check]").forEach((chk) => {
    chk.addEventListener("change", () => {
      if (chk.checked) state.formAddonIds.add(chk.dataset.addonCheck);
      else state.formAddonIds.delete(chk.dataset.addonCheck);
    });
  });
}

// ================= منشئ مجموعات الاختيارات (بسعر) =================
function renderVariantGroupsBuilder() {
  const container = document.getElementById("variantGroupsBuilder");
  if (state.formVariantGroups.length === 0) {
    container.innerHTML = `<p style="color:var(--muted);font-size:.85rem">مفيش مجموعات اختيارات بسعر لسه (اختياري).</p>`;
    return;
  }
  container.innerHTML = state.formVariantGroups
    .map(
      (g) => `
    <div class="vg-block" data-vg="${g.id}">
      <div class="vg-header">
        <input type="text" placeholder="اسم المجموعة (مثال: عدد القطع)" value="${g.label}" data-vg-label="${g.id}" />
        <button type="button" class="small-btn delete tap-fx" data-vg-remove="${g.id}">حذف المجموعة</button>
      </div>
      ${g.options
        .map(
          (o) => `
        <div class="vg-option-row" data-opt="${o.id}">
          <input type="text" class="opt-label" placeholder="اسم الاختيار" value="${o.label}" data-opt-label="${g.id}:${o.id}" />
          <input type="number" class="opt-price" placeholder="السعر" value="${o.price}" min="0" step="0.5" data-opt-price="${g.id}:${o.id}" />
          <button type="button" class="small-btn delete tap-fx" data-opt-remove="${g.id}:${o.id}">✕</button>
        </div>`
        )
        .join("")}
      <button type="button" class="glass-btn-secondary glass-btn tap-fx" style="padding:6px 14px;font-size:.8rem" data-vg-add-option="${g.id}">+ اختيار</button>
    </div>`
    )
    .join("");

  container.querySelectorAll("[data-vg-label]").forEach((input) => {
    input.addEventListener("input", () => {
      const g = state.formVariantGroups.find((x) => x.id === input.dataset.vgLabel);
      if (g) g.label = input.value;
    });
  });
  container.querySelectorAll("[data-opt-label]").forEach((input) => {
    input.addEventListener("input", () => {
      const [gid, oid] = input.dataset.optLabel.split(":");
      const g = state.formVariantGroups.find((x) => x.id === gid);
      const o = g?.options.find((x) => x.id === oid);
      if (o) o.label = input.value;
    });
  });
  container.querySelectorAll("[data-opt-price]").forEach((input) => {
    input.addEventListener("input", () => {
      const [gid, oid] = input.dataset.optPrice.split(":");
      const g = state.formVariantGroups.find((x) => x.id === gid);
      const o = g?.options.find((x) => x.id === oid);
      if (o) o.price = Number(input.value) || 0;
    });
  });
  container.querySelectorAll("[data-vg-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.formVariantGroups = state.formVariantGroups.filter((g) => g.id !== btn.dataset.vgRemove);
      renderVariantGroupsBuilder();
    });
  });
  container.querySelectorAll("[data-opt-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [gid, oid] = btn.dataset.optRemove.split(":");
      const g = state.formVariantGroups.find((x) => x.id === gid);
      if (g) g.options = g.options.filter((o) => o.id !== oid);
      renderVariantGroupsBuilder();
    });
  });
  container.querySelectorAll("[data-vg-add-option]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const g = state.formVariantGroups.find((x) => x.id === btn.dataset.vgAddOption);
      if (g) g.options.push({ id: "o_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), label: "", price: 0 });
      renderVariantGroupsBuilder();
    });
  });
}
document.getElementById("addVariantGroupBtn").addEventListener("click", () => {
  state.formVariantGroups.push({
    id: "vg_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    label: "",
    options: [{ id: "o_" + Date.now().toString(36), label: "", price: 0 }],
  });
  renderVariantGroupsBuilder();
});

// ================= منشئ مجموعات الاختيارات (من غير سعر) =================
function renderNoPriceGroupsBuilder() {
  const container = document.getElementById("noPriceGroupsBuilder");
  if (state.formNoPriceGroups.length === 0) {
    container.innerHTML = `<p style="color:var(--muted);font-size:.85rem">مفيش مجموعات اختيارات من غير سعر لسه (اختياري) — مثال: طبق / ساندوتش.</p>`;
    return;
  }
  container.innerHTML = state.formNoPriceGroups
    .map(
      (g) => `
    <div class="vg-block" data-vgnp="${g.id}">
      <div class="vg-header">
        <input type="text" placeholder="اسم المجموعة (مثال: طريقة التقديم)" value="${g.label}" data-vgnp-label="${g.id}" />
        <button type="button" class="small-btn delete tap-fx" data-vgnp-remove="${g.id}">حذف المجموعة</button>
      </div>
      ${g.options
        .map(
          (o) => `
        <div class="vg-option-row" data-optnp="${o.id}">
          <input type="text" class="opt-label" placeholder="اسم الاختيار (مثال: طبق)" value="${o.label}" data-optnp-label="${g.id}:${o.id}" />
          <button type="button" class="small-btn delete tap-fx" data-optnp-remove="${g.id}:${o.id}">✕</button>
        </div>`
        )
        .join("")}
      <button type="button" class="glass-btn-secondary glass-btn tap-fx" style="padding:6px 14px;font-size:.8rem" data-vgnp-add-option="${g.id}">+ اختيار</button>
    </div>`
    )
    .join("");

  container.querySelectorAll("[data-vgnp-label]").forEach((input) => {
    input.addEventListener("input", () => {
      const g = state.formNoPriceGroups.find((x) => x.id === input.dataset.vgnpLabel);
      if (g) g.label = input.value;
    });
  });
  container.querySelectorAll("[data-optnp-label]").forEach((input) => {
    input.addEventListener("input", () => {
      const [gid, oid] = input.dataset.optnpLabel.split(":");
      const g = state.formNoPriceGroups.find((x) => x.id === gid);
      const o = g?.options.find((x) => x.id === oid);
      if (o) o.label = input.value;
    });
  });
  container.querySelectorAll("[data-vgnp-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.formNoPriceGroups = state.formNoPriceGroups.filter((g) => g.id !== btn.dataset.vgnpRemove);
      renderNoPriceGroupsBuilder();
    });
  });
  container.querySelectorAll("[data-optnp-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [gid, oid] = btn.dataset.optnpRemove.split(":");
      const g = state.formNoPriceGroups.find((x) => x.id === gid);
      if (g) g.options = g.options.filter((o) => o.id !== oid);
      renderNoPriceGroupsBuilder();
    });
  });
  container.querySelectorAll("[data-vgnp-add-option]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const g = state.formNoPriceGroups.find((x) => x.id === btn.dataset.vgnpAddOption);
      if (g) g.options.push({ id: "o_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), label: "" });
      renderNoPriceGroupsBuilder();
    });
  });
}
document.getElementById("addNoPriceGroupBtn").addEventListener("click", () => {
  state.formNoPriceGroups.push({
    id: "vgnp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    label: "",
    options: [{ id: "o_" + Date.now().toString(36), label: "" }],
  });
  renderNoPriceGroupsBuilder();
});

// ================= الأصناف =================
function loadProductsUI() {
  const tbody = document.getElementById("productsTableBody");
  if (state.products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted)">لا يوجد أصناف بعد</td></tr>`;
    return;
  }
  tbody.innerHTML = state.products
    .map((p) => {
      const catName = state.categories.find((c) => c.id === p.category)?.name || p.category;
      const priceLabel = p.variantGroups && p.variantGroups.length > 0
        ? `من ${Math.min(...p.variantGroups[0].options.map((o) => o.price))} ج.م`
        : `${p.price} ج.م`;
      return `
      <tr>
        <td><img src="${p.image}" onerror="this.src='images/logo.png'"/></td>
        <td>${p.name}</td>
        <td>${catName}</td>
        <td>${priceLabel}</td>
        <td>${p.available ? "✅" : "❌"}</td>
        <td class="row-actions">
          <button class="small-btn edit tap-fx" data-edit="${p.id}">تعديل</button>
          <button class="small-btn delete tap-fx" data-delete="${p.id}">حذف</button>
        </td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => startEdit(btn.dataset.edit));
  });
  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await siteConfirm("متأكد عايز تحذف الصنف ده؟");
      if (!ok) return;
      state.products = state.products.filter((p) => p.id !== btn.dataset.delete);
      await persistBranchMenu();
    });
  });
}

function startEdit(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  state.editingId = id;
  document.getElementById("formTitle").textContent = "تعديل الصنف";
  document.getElementById("productId").value = id;
  document.getElementById("pName").value = p.name;
  document.getElementById("pCategory").value = p.category;
  document.getElementById("pPrice").value = p.price;
  document.getElementById("pDescription").value = p.description || "";
  document.getElementById("pImagePath").value = p.image && !p.image.startsWith("data:") ? p.image : "";
  document.getElementById("pAvailable").checked = !!p.available;

  state.formVariantGroups = JSON.parse(JSON.stringify(p.variantGroups || []));
  state.formNoPriceGroups = JSON.parse(JSON.stringify(p.noPriceGroups || []));
  state.formAddonIds = new Set(p.addonIds || []);
  renderVariantGroupsBuilder();
  renderNoPriceGroupsBuilder();
  renderAddonsChecklist();

  document.getElementById("cancelEdit").style.display = "inline-flex";
  document.querySelector('.admin-tab[data-tab="products"]').click();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("cancelEdit").addEventListener("click", resetForm);
function resetForm() {
  state.editingId = null;
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("formTitle").textContent = "إضافة صنف جديد";
  document.getElementById("cancelEdit").style.display = "none";
  document.getElementById("productError").textContent = "";
  document.getElementById("productSuccess").textContent = "";
  state.formVariantGroups = [];
  state.formNoPriceGroups = [];
  state.formAddonIds = new Set();
  renderVariantGroupsBuilder();
  renderNoPriceGroupsBuilder();
  renderAddonsChecklist();
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("productError");
  const okEl = document.getElementById("productSuccess");
  errEl.textContent = "";
  okEl.textContent = "";

  const name = document.getElementById("pName").value.trim();
  const category = document.getElementById("pCategory").value;
  const price = Number(document.getElementById("pPrice").value);
  const description = document.getElementById("pDescription").value.trim();
  const available = document.getElementById("pAvailable").checked;
  const imagePath = document.getElementById("pImagePath").value.trim();
  const fileInput = document.getElementById("pImageFile");

  if (!name || !category || !price) {
    errEl.textContent = "الاسم والتصنيف والسعر مطلوبين";
    return;
  }

  const cleanVariantGroups = state.formVariantGroups
    .map((g) => ({ ...g, options: g.options.filter((o) => o.label.trim()) }))
    .filter((g) => g.label.trim() && g.options.length > 0);

  const cleanNoPriceGroups = state.formNoPriceGroups
    .map((g) => ({ ...g, options: g.options.filter((o) => o.label.trim()) }))
    .filter((g) => g.label.trim() && g.options.length > 0);

  const isEdit = !!state.editingId;
  let image = isEdit ? state.products.find((p) => p.id === state.editingId)?.image : "";
  if (fileInput.files[0]) {
    try {
      image = await fileToDataURL(fileInput.files[0]);
    } catch (err) {
      errEl.textContent = "حصل خطأ في قراءة الصورة";
      return;
    }
  } else if (imagePath) {
    image = imagePath;
  }

  const productData = {
    name, category, price, description, available,
    image: image || "images/logo.png",
    variantGroups: cleanVariantGroups,
    noPriceGroups: cleanNoPriceGroups,
    addonIds: Array.from(state.formAddonIds),
  };

  if (isEdit) {
    const idx = state.products.findIndex((p) => p.id === state.editingId);
    state.products[idx] = { ...state.products[idx], ...productData };
    okEl.textContent = "تم تعديل الصنف بنجاح";
  } else {
    const id = "p_" + Date.now().toString(36);
    state.products.push({ id, ...productData });
    okEl.textContent = "تم إضافة الصنف بنجاح";
  }

  try {
    await persistBranchMenu();
  } catch (err) {
    console.error(err);
    errEl.textContent = "تعذر الحفظ — لو رفعت صورة كبيرة جرب مسار صورة بدل كده";
    return;
  }
  resetForm();
});

// ================= إعدادات تليجرام =================
// التوكن والـ Chat ID بقوا ثابتين جوه js/telegram.js مباشرة، مفيش فورم هنا يتظبط منه.
function loadTelegramSettings() {
  const tokenField = document.getElementById("telegramToken");
  const chatField = document.getElementById("telegramChatId");
  if (tokenField) tokenField.value = "متظبط ثابت جوه الكود (js/telegram.js)";
  if (chatField) chatField.value = "متظبط ثابت جوه الكود (js/telegram.js)";
  const form = document.getElementById("telegramForm");
  if (form) {
    Array.from(form.querySelectorAll("input, button")).forEach((el) => (el.disabled = true));
  }
}

// ================= الطلبات =================
const ORDER_TYPE_LABELS = { cafe: "كافيه ☕", delivery: "توصيل 🛵", pickup: "استلام 🏃" };

function renderOrdersList() {
  const list = document.getElementById("ordersList");
  if (state.orders.length === 0) {
    list.innerHTML = `<p style="text-align:center;color:var(--muted)">لسه مفيش طلبات</p>`;
    return;
  }
  list.innerHTML = state.orders
    .map((o) => {
      const itemsHtml = (o.items || [])
        .map((it) => {
          const extras = [
            ...(it.variantLabels || []).map((v) => `${v.group}: ${v.option}`),
            ...(it.noPriceLabels || []).map((v) => `${v.group}: ${v.option}`),
            ...(it.addonLabels || []).map((a) => `+ ${a.name}`),
          ].join(" | ");
          return `${it.name}${extras ? ` (${extras})` : ""} × ${it.qty}`;
        })
        .join("<br/>");

      let fieldsHtml = "";
      if (o.type === "cafe") fieldsHtml = `الكافيه: ${o.fields.cafeName} — الدفع: ${o.fields.payment}`;
      else if (o.type === "delivery") fieldsHtml = `العنوان: ${o.fields.address} — الدفع: ${o.fields.payment}`;
      else if (o.type === "pickup") fieldsHtml = `وقت الاستلام: ${o.fields.pickupTime} — الدفع: ${o.fields.payment}`;

      const time = new Date(o.createdAt).toLocaleString("ar-EG");

      return `
      <div class="order-card type-${o.type}">
        <div class="order-top">
          <span class="order-code">#${o.code}</span>
          <span class="order-type-tag type-${o.type}">${ORDER_TYPE_LABELS[o.type] || o.type}</span>
          <span class="order-time">${time} ${o.seen ? "" : "🔴 جديد"} ${o.queued ? "⏳ مشغول وقت الطلب" : ""}</span>
        </div>
        <div class="order-items-list">${itemsHtml}</div>
        <div class="order-fields">${fieldsHtml}</div>
        <div class="order-top">
          <span class="order-total">${o.total} ج.م</span>
          <button class="small-btn delete tap-fx" data-del-order="${o.id}">حذف الطلب</button>
        </div>
      </div>`;
    })
    .join("");

  list.querySelectorAll("[data-del-order]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await siteConfirm("متأكد عايز تحذف الطلب ده؟");
      if (!ok) return;
      if (firebaseReady) {
        await db.collection("branches").doc(state.branchId).collection("orders").doc(btn.dataset.delOrder).delete();
      } else {
        state.orders = state.orders.filter((o) => o.id !== btn.dataset.delOrder);
        renderOrdersList();
      }
    });
  });
}

function updateOrdersBadge() {
  const unseen = state.orders.filter((o) => !o.seen).length;
  const badge = document.getElementById("ordersBadge");
  if (unseen > 0) {
    badge.style.display = "inline-flex";
    badge.textContent = unseen;
  } else {
    badge.style.display = "none";
  }
}

function markAllOrdersSeen() {
  state.orders.forEach((o) => {
    if (!o.seen) {
      o.seen = true;
      markOrderSeen(state.branchId, o.id);
    }
  });
  updateOrdersBadge();
  renderOrdersList();
}

document.getElementById("clearOrdersBtn").addEventListener("click", async () => {
  const ok = await siteConfirm("متأكد عايز تمسح كل الطلبات؟");
  if (!ok) return;
  await clearAllOrders(state.branchId);
});

function checkForNewOrders(orders) {
  orders.forEach((o) => {
    if (!o.seen && !state.playedSoundIds.has(o.id)) {
      state.playedSoundIds.add(o.id);
      startOrderSoundLoop(o.type);
    }
  });
  state.orders = orders;
  renderOrdersList();
  updateOrdersBadge();
}

checkAuth();
