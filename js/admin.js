// ============================================================
// منطق لوحة الأدمن
// ============================================================

const state = {
  branchId: null,
  categories: [],
  products: [],
  offers: [],
  addons: [],
  orders: [],
  chats: [],
  activeChatId: null,
  chatMsgsUnsub: null,
  playedChatSoundKeys: new Set(),
  branchStatus: "open",
  editingId: null,
  formVariantGroups: [],
  formNoPriceGroups: [],
  formAddonIds: new Set(),
  editingOfferId: null,
  formOfferVariantGroups: [],
  formOfferNoPriceGroups: [],
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
  const statusBranchNameEl = document.getElementById("statusBranchName");
  if (statusBranchNameEl) statusBranchNameEl.textContent = BRANCHES[state.branchId].name;
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
    const branchName = BRANCHES[state.branchId].name;
    const labelMap = { open: "مفتوح 🟢", busy: "مشغول 🟠", closed: "مغلق 🔴" };
    const ok = await siteConfirm(
      `هتغيّر حالة فرع "${branchName}" لـ ${labelMap[btn.dataset.status]}. متأكد؟`,
      "تأكيد",
      "إلغاء"
    );
    if (!ok) return;
    await setBranchStatus(state.branchId, btn.dataset.status);
    showToast(`تم تحديث حالة فرع ${branchName} ✅`, "success");
  });
});

// ---------- تحميل كل البيانات ----------
function loadAll() {
  subscribeBranch(state.branchId, (data) => {
    state.categories = data.categories || [];
    state.products = data.products || [];
    state.offers = data.offers || [];
    state.addons = data.addons || [];
    state.branchStatus = data.status || "open";
    renderStatusButtons();
    loadCategoriesUI();
    loadAddonsLibraryUI();
    loadProductsUI();
    loadOffersUI();
  });
  subscribeOrders(state.branchId, (orders) => {
    checkForNewOrders(orders);
  });
  subscribeChats(state.branchId, (chats) => {
    checkForNewChatMessages(chats);
  });
  subscribeBroadcastMessages(state.branchId, (messages) => {
    renderMessagesHistory(messages);
  });
  loadTelegramSettings();
}

// ================= رسائل الأدمن (Messages) =================
function renderMessagesHistory(messages) {
  const box = document.getElementById("messagesHistoryList");
  if (!box) return;
  if (!messages.length) {
    box.innerHTML = `<p style="color:var(--muted);text-align:center">لسه معملتش أي رسالة</p>`;
    return;
  }
  box.innerHTML = messages
    .map((m) => {
      const date = new Date(m.createdAt).toLocaleString("ar-EG");
      return `
        <div class="chat-list-item" style="cursor:default">
          <div class="chat-list-name">${m.title}</div>
          <div class="chat-list-sub">${m.body}</div>
          <div class="chat-list-status-closed">${date}</div>
        </div>`;
    })
    .join("");
}

document.getElementById("messageForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("messageError");
  const okEl = document.getElementById("messageSuccess");
  errEl.textContent = "";
  okEl.textContent = "";

  const title = document.getElementById("msgTitle").value.trim();
  const body = document.getElementById("msgBody").value.trim();
  if (!title || !body) {
    errEl.textContent = "من فضلك اكتب العنوان والموضوع";
    return;
  }

  const btn = document.getElementById("sendMessageBtn");
  btn.disabled = true;
  btn.textContent = "جاري الإرسال...";
  try {
    await sendBroadcastMessage(state.branchId, { title, body });
    okEl.textContent = "تم إرسال الرسالة لكل اللي فاتحين الموقع/التطبيق دلوقتي ✅";
    if (typeof playNotificationSound === "function") playNotificationSound();
    document.getElementById("messageForm").reset();
  } catch (err) {
    console.error(err);
    errEl.textContent = "حصل خطأ في الإرسال، حاول تاني";
  } finally {
    btn.disabled = false;
    btn.textContent = "إرسال الرسالة";
  }
});

async function persistBranchMenu() {
  await saveBranchData(state.branchId, {
    categories: state.categories,
    products: state.products,
    offers: state.offers,
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
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line);flex-wrap:wrap">
      <input type="text" value="${c.name || ""}" placeholder="عربي" data-cat-name="${c.id}" style="flex:1;min-width:100px;padding:6px 10px;border-radius:10px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink)" />
      <input type="text" value="${c.nameEn || ""}" placeholder="English" data-cat-name-en="${c.id}" style="flex:1;min-width:100px;padding:6px 10px;border-radius:10px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink)" />
      <button class="small-btn delete tap-fx" data-del-cat="${c.id}">حذف</button>
    </div>`
    )
    .join("");
  list.querySelectorAll("[data-cat-name]").forEach((input) => {
    input.addEventListener("change", async () => {
      const c = state.categories.find((x) => x.id === input.dataset.catName);
      if (c) { c.name = input.value.trim(); await persistBranchMenu(); }
    });
  });
  list.querySelectorAll("[data-cat-name-en]").forEach((input) => {
    input.addEventListener("change", async () => {
      const c = state.categories.find((x) => x.id === input.dataset.catNameEn);
      if (c) { c.nameEn = input.value.trim(); await persistBranchMenu(); }
    });
  });
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
  const inputEn = document.getElementById("newCategoryNameEn");
  const name = input.value.trim();
  const nameEn = inputEn.value.trim();
  if (!name) return;
  const id = "c_" + Date.now().toString(36);
  state.categories.push({ id, name, nameEn });
  await persistBranchMenu();
  input.value = "";
  inputEn.value = "";
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
        <td>${p.name}${p.nameEn ? `<br/><span style="color:var(--muted);font-size:.78rem">${p.nameEn}</span>` : ""}${p.isOffer ? `<br/><span style="color:var(--accent);font-size:.75rem;font-weight:800">🎁 عرض</span>` : ""}</td>
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
  document.getElementById("pNameEn").value = p.nameEn || "";
  document.getElementById("pCategory").value = p.category;
  document.getElementById("pPrice").value = p.price;
  document.getElementById("pDescription").value = p.description || "";
  document.getElementById("pImagePath").value = p.image && !p.image.startsWith("data:") ? p.image : "";
  document.getElementById("pAvailable").checked = !!p.available;
  document.getElementById("pIsOffer").checked = !!p.isOffer;

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
  const nameEn = document.getElementById("pNameEn").value.trim();
  const category = document.getElementById("pCategory").value;
  const price = Number(document.getElementById("pPrice").value);
  const description = document.getElementById("pDescription").value.trim();
  const available = document.getElementById("pAvailable").checked;
  const isOffer = document.getElementById("pIsOffer").checked;
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
    name, nameEn, category, price, description, available, isOffer,
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

// ================= العروض =================
// نفس فكرة الأصناف بالظبط (اسم، وصف، صورة، سعر + مجموعتين اختيارات) لكن
// من غير تصنيف أو إضافات، وليها تبويبها المستقل عند العميل بدل الدمج
// جوه "الأصناف".

// ---- منشئ مجموعات الاختيارات بسعر (للعروض) ----
function renderOfferVariantGroupsBuilder() {
  const container = document.getElementById("offerVariantGroupsBuilder");
  if (state.formOfferVariantGroups.length === 0) {
    container.innerHTML = `<p style="color:var(--muted);font-size:.85rem">مفيش مجموعات اختيارات بسعر لسه (اختياري).</p>`;
    return;
  }
  container.innerHTML = state.formOfferVariantGroups
    .map(
      (g) => `
    <div class="vg-block" data-ovg="${g.id}">
      <div class="vg-header">
        <input type="text" placeholder="اسم المجموعة (مثال: حجم العرض)" value="${g.label}" data-ovg-label="${g.id}" />
        <button type="button" class="small-btn delete tap-fx" data-ovg-remove="${g.id}">حذف المجموعة</button>
      </div>
      ${g.options
        .map(
          (o) => `
        <div class="vg-option-row" data-oopt="${o.id}">
          <input type="text" class="opt-label" placeholder="اسم الاختيار" value="${o.label}" data-oopt-label="${g.id}:${o.id}" />
          <input type="number" class="opt-price" placeholder="السعر" value="${o.price}" min="0" step="0.5" data-oopt-price="${g.id}:${o.id}" />
          <button type="button" class="small-btn delete tap-fx" data-oopt-remove="${g.id}:${o.id}">✕</button>
        </div>`
        )
        .join("")}
      <button type="button" class="glass-btn-secondary glass-btn tap-fx" style="padding:6px 14px;font-size:.8rem" data-ovg-add-option="${g.id}">+ اختيار</button>
    </div>`
    )
    .join("");

  container.querySelectorAll("[data-ovg-label]").forEach((input) => {
    input.addEventListener("input", () => {
      const g = state.formOfferVariantGroups.find((x) => x.id === input.dataset.ovgLabel);
      if (g) g.label = input.value;
    });
  });
  container.querySelectorAll("[data-oopt-label]").forEach((input) => {
    input.addEventListener("input", () => {
      const [gid, oid] = input.dataset.ooptLabel.split(":");
      const g = state.formOfferVariantGroups.find((x) => x.id === gid);
      const o = g?.options.find((x) => x.id === oid);
      if (o) o.label = input.value;
    });
  });
  container.querySelectorAll("[data-oopt-price]").forEach((input) => {
    input.addEventListener("input", () => {
      const [gid, oid] = input.dataset.ooptPrice.split(":");
      const g = state.formOfferVariantGroups.find((x) => x.id === gid);
      const o = g?.options.find((x) => x.id === oid);
      if (o) o.price = Number(input.value) || 0;
    });
  });
  container.querySelectorAll("[data-ovg-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.formOfferVariantGroups = state.formOfferVariantGroups.filter((g) => g.id !== btn.dataset.ovgRemove);
      renderOfferVariantGroupsBuilder();
    });
  });
  container.querySelectorAll("[data-oopt-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [gid, oid] = btn.dataset.ooptRemove.split(":");
      const g = state.formOfferVariantGroups.find((x) => x.id === gid);
      if (g) g.options = g.options.filter((o) => o.id !== oid);
      renderOfferVariantGroupsBuilder();
    });
  });
  container.querySelectorAll("[data-ovg-add-option]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const g = state.formOfferVariantGroups.find((x) => x.id === btn.dataset.ovgAddOption);
      if (g) g.options.push({ id: "o_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), label: "", price: 0 });
      renderOfferVariantGroupsBuilder();
    });
  });
}
document.getElementById("addOfferVariantGroupBtn").addEventListener("click", () => {
  state.formOfferVariantGroups.push({
    id: "vg_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    label: "",
    options: [{ id: "o_" + Date.now().toString(36), label: "", price: 0 }],
  });
  renderOfferVariantGroupsBuilder();
});

// ---- منشئ مجموعات الاختيارات من غير سعر (احتياطي) للعروض ----
function renderOfferNoPriceGroupsBuilder() {
  const container = document.getElementById("offerNoPriceGroupsBuilder");
  if (state.formOfferNoPriceGroups.length === 0) {
    container.innerHTML = `<p style="color:var(--muted);font-size:.85rem">مفيش مجموعات اختيارات من غير سعر لسه (اختياري) — مثال: طبق / ساندوتش.</p>`;
    return;
  }
  container.innerHTML = state.formOfferNoPriceGroups
    .map(
      (g) => `
    <div class="vg-block" data-ovgnp="${g.id}">
      <div class="vg-header">
        <input type="text" placeholder="اسم المجموعة (مثال: طريقة التقديم)" value="${g.label}" data-ovgnp-label="${g.id}" />
        <button type="button" class="small-btn delete tap-fx" data-ovgnp-remove="${g.id}">حذف المجموعة</button>
      </div>
      ${g.options
        .map(
          (o) => `
        <div class="vg-option-row" data-ooptnp="${o.id}">
          <input type="text" class="opt-label" placeholder="اسم الاختيار (مثال: طبق)" value="${o.label}" data-ooptnp-label="${g.id}:${o.id}" />
          <button type="button" class="small-btn delete tap-fx" data-ooptnp-remove="${g.id}:${o.id}">✕</button>
        </div>`
        )
        .join("")}
      <button type="button" class="glass-btn-secondary glass-btn tap-fx" style="padding:6px 14px;font-size:.8rem" data-ovgnp-add-option="${g.id}">+ اختيار</button>
    </div>`
    )
    .join("");

  container.querySelectorAll("[data-ovgnp-label]").forEach((input) => {
    input.addEventListener("input", () => {
      const g = state.formOfferNoPriceGroups.find((x) => x.id === input.dataset.ovgnpLabel);
      if (g) g.label = input.value;
    });
  });
  container.querySelectorAll("[data-ooptnp-label]").forEach((input) => {
    input.addEventListener("input", () => {
      const [gid, oid] = input.dataset.ooptnpLabel.split(":");
      const g = state.formOfferNoPriceGroups.find((x) => x.id === gid);
      const o = g?.options.find((x) => x.id === oid);
      if (o) o.label = input.value;
    });
  });
  container.querySelectorAll("[data-ovgnp-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.formOfferNoPriceGroups = state.formOfferNoPriceGroups.filter((g) => g.id !== btn.dataset.ovgnpRemove);
      renderOfferNoPriceGroupsBuilder();
    });
  });
  container.querySelectorAll("[data-ooptnp-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [gid, oid] = btn.dataset.ooptnpRemove.split(":");
      const g = state.formOfferNoPriceGroups.find((x) => x.id === gid);
      if (g) g.options = g.options.filter((o) => o.id !== oid);
      renderOfferNoPriceGroupsBuilder();
    });
  });
  container.querySelectorAll("[data-ovgnp-add-option]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const g = state.formOfferNoPriceGroups.find((x) => x.id === btn.dataset.ovgnpAddOption);
      if (g) g.options.push({ id: "o_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), label: "" });
      renderOfferNoPriceGroupsBuilder();
    });
  });
}
document.getElementById("addOfferNoPriceGroupBtn").addEventListener("click", () => {
  state.formOfferNoPriceGroups.push({
    id: "vgnp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    label: "",
    options: [{ id: "o_" + Date.now().toString(36), label: "" }],
  });
  renderOfferNoPriceGroupsBuilder();
});

// ---- جدول العروض + الفورم ----
function loadOffersUI() {
  const tbody = document.getElementById("offersTableBody");
  if (state.offers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted)">لا يوجد عروض بعد</td></tr>`;
  } else {
    tbody.innerHTML = state.offers
      .map((o) => {
        const priceLabel = o.variantGroups && o.variantGroups.length > 0
          ? `من ${Math.min(...o.variantGroups[0].options.map((opt) => opt.price))} ج.م`
          : `${o.price} ج.م`;
        return `
        <tr>
          <td><img src="${o.image}" onerror="this.src='images/logo.png'"/></td>
          <td>${o.name}${o.nameEn ? `<br/><span style="color:var(--muted);font-size:.78rem">${o.nameEn}</span>` : ""}</td>
          <td>${priceLabel}</td>
          <td>${o.available === false ? "❌" : "✅"}</td>
          <td class="row-actions">
            <button class="small-btn edit tap-fx" data-edit-offer="${o.id}">تعديل</button>
            <button class="small-btn delete tap-fx" data-delete-offer="${o.id}">حذف</button>
          </td>
        </tr>`;
      })
      .join("");
  }

  tbody.querySelectorAll("[data-edit-offer]").forEach((btn) => {
    btn.addEventListener("click", () => startEditOffer(btn.dataset.editOffer));
  });
  tbody.querySelectorAll("[data-delete-offer]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await siteConfirm("متأكد عايز تحذف العرض ده؟");
      if (!ok) return;
      state.offers = state.offers.filter((o) => o.id !== btn.dataset.deleteOffer);
      await persistBranchMenu();
    });
  });

  renderOfferVariantGroupsBuilder();
  renderOfferNoPriceGroupsBuilder();
}

function startEditOffer(id) {
  const o = state.offers.find((x) => x.id === id);
  if (!o) return;
  state.editingOfferId = id;
  document.getElementById("offerFormTitle").textContent = "تعديل العرض";
  document.getElementById("offerId").value = id;
  document.getElementById("oName").value = o.name;
  document.getElementById("oNameEn").value = o.nameEn || "";
  document.getElementById("oPrice").value = o.price;
  document.getElementById("oDescription").value = o.description || "";
  document.getElementById("oImagePath").value = o.image && !o.image.startsWith("data:") ? o.image : "";
  document.getElementById("oAvailable").checked = o.available !== false;

  state.formOfferVariantGroups = JSON.parse(JSON.stringify(o.variantGroups || []));
  state.formOfferNoPriceGroups = JSON.parse(JSON.stringify(o.noPriceGroups || []));
  renderOfferVariantGroupsBuilder();
  renderOfferNoPriceGroupsBuilder();

  document.getElementById("cancelOfferEdit").style.display = "inline-flex";
  document.querySelector('.admin-tab[data-tab="offers"]').click();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("cancelOfferEdit").addEventListener("click", resetOfferForm);
function resetOfferForm() {
  state.editingOfferId = null;
  document.getElementById("offerForm").reset();
  document.getElementById("offerId").value = "";
  document.getElementById("offerFormTitle").textContent = "إضافة عرض جديد";
  document.getElementById("cancelOfferEdit").style.display = "none";
  document.getElementById("offerError").textContent = "";
  document.getElementById("offerSuccess").textContent = "";
  state.formOfferVariantGroups = [];
  state.formOfferNoPriceGroups = [];
  renderOfferVariantGroupsBuilder();
  renderOfferNoPriceGroupsBuilder();
}

document.getElementById("offerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("offerError");
  const okEl = document.getElementById("offerSuccess");
  errEl.textContent = "";
  okEl.textContent = "";

  const name = document.getElementById("oName").value.trim();
  const nameEn = document.getElementById("oNameEn").value.trim();
  const price = Number(document.getElementById("oPrice").value);
  const description = document.getElementById("oDescription").value.trim();
  const available = document.getElementById("oAvailable").checked;
  const imagePath = document.getElementById("oImagePath").value.trim();
  const fileInput = document.getElementById("oImageFile");

  if (!name || !price) {
    errEl.textContent = "اسم العرض والسعر مطلوبين";
    return;
  }

  const cleanVariantGroups = state.formOfferVariantGroups
    .map((g) => ({ ...g, options: g.options.filter((o) => o.label.trim()) }))
    .filter((g) => g.label.trim() && g.options.length > 0);

  const cleanNoPriceGroups = state.formOfferNoPriceGroups
    .map((g) => ({ ...g, options: g.options.filter((o) => o.label.trim()) }))
    .filter((g) => g.label.trim() && g.options.length > 0);

  const isEdit = !!state.editingOfferId;
  let image = isEdit ? state.offers.find((o) => o.id === state.editingOfferId)?.image : "";
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

  const offerData = {
    name, nameEn, price, description, available,
    image: image || "images/logo.png",
    variantGroups: cleanVariantGroups,
    noPriceGroups: cleanNoPriceGroups,
  };

  if (isEdit) {
    const idx = state.offers.findIndex((o) => o.id === state.editingOfferId);
    state.offers[idx] = { ...state.offers[idx], ...offerData };
    okEl.textContent = "تم تعديل العرض بنجاح";
  } else {
    const id = "of_" + Date.now().toString(36);
    state.offers.push({ id, ...offerData });
    okEl.textContent = "تم إضافة العرض بنجاح";
  }

  try {
    await persistBranchMenu();
  } catch (err) {
    console.error(err);
    errEl.textContent = "تعذر الحفظ — لو رفعت صورة كبيرة جرب مسار صورة بدل كده";
    return;
  }
  resetOfferForm();
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
      if (o.fields && o.fields.phone) fieldsHtml += ` — 📱 ${o.fields.phone}`;
      if (o.fields && o.fields.comment) fieldsHtml += `<br/>💬 تعليق: ${o.fields.comment}`;

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
      playOrderSound(o.type);
    }
  });
  state.orders = orders;
  renderOrdersList();
  updateOrdersBadge();
}

checkAuth();

// ================= الدعم (شات العملاء) =================
function escapeHtmlAdmin(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

let adminLastSeenByCustomerAt = 0;
let adminLastChatMsgs = [];
let adminTypingTimer = null;

function checkForNewChatMessages(chats) {
  chats.forEach((c) => {
    const key = c.id + "_" + c.lastMessageAt;
    if (c.unreadForAdmin && c.lastSender === "customer" && !state.playedChatSoundKeys.has(key)) {
      state.playedChatSoundKeys.add(key);
      playChatSound();
    }
  });
  state.chats = chats;
  renderChatsList();
  updateSupportBadge();
  if (state.activeChatId) {
    const active = chats.find((c) => c.id === state.activeChatId);
    if (active) {
      updateConversationHeader(active);
      if ((active.lastSeenByCustomerAt || 0) !== adminLastSeenByCustomerAt) {
        adminLastSeenByCustomerAt = active.lastSeenByCustomerAt || 0;
        renderAdminChatMessages(adminLastChatMsgs);
      }
      setAdminTypingIndicator(isTypingActive(active.typingCustomerAt));
    }
  }
}

function setAdminTypingIndicator(show) {
  const el = document.getElementById("adminTypingIndicator");
  if (!el) return;
  el.style.display = show ? "block" : "none";
  if (show) {
    const box = document.getElementById("adminChatMessages");
    if (box) box.scrollTop = box.scrollHeight;
  }
}

function renderChatsList() {
  const list = document.getElementById("chatsList");
  if (!list) return;
  if (state.chats.length === 0) {
    list.innerHTML = `<p style="text-align:center;color:var(--muted)">لسه مفيش محادثات</p>`;
    return;
  }
  list.innerHTML = state.chats
    .map((c) => {
      const preview = c.lastSender === "admin" ? `أنت: ${c.lastMessageText || ""}` : c.lastMessageText || "";
      return `
      <div class="chat-list-item ${state.activeChatId === c.id ? "active" : ""}" data-chat="${c.id}">
        ${c.unreadForAdmin ? '<span class="chat-list-badge"></span>' : ""}
        <div class="chat-list-name">${escapeHtmlAdmin(c.name)} ${c.status === "closed" ? '<span class="chat-list-status-closed">🔒 مقفول</span>' : ""}</div>
        <div class="chat-list-sub">${escapeHtmlAdmin(preview)}</div>
      </div>`;
    })
    .join("");
  list.querySelectorAll("[data-chat]").forEach((el) => {
    el.addEventListener("click", () => selectChat(el.dataset.chat));
  });
}

function updateSupportBadge() {
  const unread = state.chats.filter((c) => c.unreadForAdmin).length;
  const badge = document.getElementById("supportBadge");
  if (!badge) return;
  if (unread > 0) {
    badge.style.display = "inline-flex";
    badge.textContent = unread;
  } else {
    badge.style.display = "none";
  }
}

function updateConversationHeader(chat) {
  document.getElementById("conversationName").textContent = chat.name;
  document.getElementById("conversationPhone").textContent = "📱 " + chat.phone;
  const closed = chat.status === "closed";
  document.getElementById("adminChatInputRow").style.display = closed ? "none" : "flex";
  document.getElementById("adminChatClosedMsg").style.display = closed ? "block" : "none";
  document.getElementById("closeChatBtn").style.display = closed ? "none" : "inline-flex";
  document.getElementById("deleteChatBtn").style.display = closed ? "inline-flex" : "none";
}

function selectChat(chatId) {
  state.activeChatId = chatId;
  adminLastSeenByCustomerAt = 0;
  adminLastChatMsgs = [];
  document.getElementById("conversationCard").style.display = "block";
  document.getElementById("noConversationCard").style.display = "none";
  renderChatsList();

  const chat = state.chats.find((c) => c.id === chatId);
  if (chat) {
    updateConversationHeader(chat);
    adminLastSeenByCustomerAt = chat.lastSeenByCustomerAt || 0;
    setAdminTypingIndicator(isTypingActive(chat.typingCustomerAt));
    if (chat.unreadForAdmin) markChatSeenByAdmin(state.branchId, chatId);
  }

  if (state.chatMsgsUnsub) {
    try { state.chatMsgsUnsub(); } catch (e) {}
    state.chatMsgsUnsub = null;
  }
  state.chatMsgsUnsub = subscribeChatMessages(state.branchId, chatId, (msgs) => {
    adminLastChatMsgs = msgs;
    renderAdminChatMessages(msgs);
  });
}

function renderAdminChatMessages(msgs) {
  const box = document.getElementById("adminChatMessages");
  if (!box) return;
  box.innerHTML = msgs
    .map((m) => {
      const cls = m.sender === "admin" ? "support-msg-admin" : m.sender === "customer" ? "support-msg-customer" : "support-msg-system";
      let ticks = "";
      if (m.sender === "admin") {
        const seen = adminLastSeenByCustomerAt && m.createdAt <= adminLastSeenByCustomerAt;
        ticks = `<span class="support-msg-ticks ${seen ? "seen" : ""}">${seen ? TICK_SVG_DOUBLE_ADMIN : TICK_SVG_SINGLE_ADMIN}</span>`;
      }
      return `<div class="support-msg ${cls}">${escapeHtmlAdmin(m.text)}${ticks}</div>`;
    })
    .join("");
  box.scrollTop = box.scrollHeight;
}
const TICK_SVG_SINGLE_ADMIN = `<svg viewBox="0 0 16 11" fill="none"><path d="M1 6l3.5 3.5L15 1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const TICK_SVG_DOUBLE_ADMIN = `<svg viewBox="0 0 20 11" fill="none"><path d="M1 6l3.5 3.5L14 1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6l3.5 3.5L19 1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

document.getElementById("adminSendChatBtn")?.addEventListener("click", sendAdminChatMessage);
document.getElementById("adminChatInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendAdminChatMessage();
  }
});
document.getElementById("adminChatInput")?.addEventListener("input", () => {
  if (!state.activeChatId) return;
  const chat = state.chats.find((c) => c.id === state.activeChatId);
  if (chat && chat.status === "closed") return;
  setTypingStatus(state.branchId, state.activeChatId, "admin", true);
  clearTimeout(adminTypingTimer);
  adminTypingTimer = setTimeout(() => {
    setTypingStatus(state.branchId, state.activeChatId, "admin", false);
  }, 2500);
});
function sendAdminChatMessage() {
  const input = document.getElementById("adminChatInput");
  const text = input.value.trim();
  if (!text || !state.activeChatId) return;
  const chat = state.chats.find((c) => c.id === state.activeChatId);
  if (chat && chat.status === "closed") return;
  input.value = "";
  clearTimeout(adminTypingTimer);
  setTypingStatus(state.branchId, state.activeChatId, "admin", false);
  sendChatMessage(state.branchId, state.activeChatId, "admin", text);
}

document.getElementById("closeChatBtn")?.addEventListener("click", async () => {
  if (!state.activeChatId) return;
  const ok = await siteConfirm("متأكد عايز تقفل الشات ده؟ العميل مش هيقدر يبعت تاني.");
  if (!ok) return;
  await closeChat(state.branchId, state.activeChatId);
  showToast("تم قفل الشات ✅", "success");
});

document.getElementById("deleteChatBtn")?.addEventListener("click", async () => {
  if (!state.activeChatId) return;
  const ok = await siteConfirm("متأكد عايز تمسح الشات ده نهائي؟ مش هينفع ترجعه تاني.");
  if (!ok) return;
  const chatId = state.activeChatId;
  if (state.chatMsgsUnsub) {
    try { state.chatMsgsUnsub(); } catch (e) {}
    state.chatMsgsUnsub = null;
  }
  try {
    await deleteChat(state.branchId, chatId);
    state.activeChatId = null;
    document.getElementById("conversationCard").style.display = "none";
    document.getElementById("noConversationCard").style.display = "block";
    showToast("تم مسح الشات 🗑️", "success");
  } catch (e) {
    console.error(e);
    showToast("مقدرش أمسح الشات، لازم تحدّث قواعد Firestore (Rules) في SETUP.md عشان تسمح بالمسح", "error");
    selectChat(chatId);
  }
});
