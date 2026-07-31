// ============================================================
// شات "تواصل مع الدعم" - صفحة العميل
// ============================================================

let supportChatId = null;
let supportChatStatusUnsub = null;
let supportChatMsgsUnsub = null;
let supportChatStatus = "open";
let supportPrevStatus = null;
let supportChatFirstLoad = true;
let supportLastMsgKey = null;

function supportStorageKey(branchId) {
  return `vitwar_support_${branchId}`;
}
function loadSupportSession(branchId) {
  try {
    return JSON.parse(localStorage.getItem(supportStorageKey(branchId)) || "null");
  } catch (e) {
    return null;
  }
}
function saveSupportSession(branchId, data) {
  localStorage.setItem(supportStorageKey(branchId), JSON.stringify(data));
}
function clearSupportSession(branchId) {
  localStorage.removeItem(supportStorageKey(branchId));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

// ---------- الزرار العائم ----------
function initSupportFab() {
  const fab = document.getElementById("supportFab");
  if (!fab || fab.dataset.inited) return;
  fab.dataset.inited = "1";
  fab.addEventListener("click", (e) => openSupportChat(e.currentTarget));

  document.getElementById("closeSupportChat")?.addEventListener("click", closeSupportChatModal);
  document.getElementById("supportChatOverlay")?.addEventListener("click", closeSupportChatModal);

  document.getElementById("startSupportChatBtn")?.addEventListener("click", handleStartChat);
  document.getElementById("sendSupportChatBtn")?.addEventListener("click", sendSupportMessage);
  document.getElementById("supportChatInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendSupportMessage();
    }
  });
  document.getElementById("newSupportChatBtn")?.addEventListener("click", startFreshChat);

  document.getElementById("changeBranchBtn")?.addEventListener("click", () => {
    closeSupportChatModal();
    teardownSupportSubscriptions();
    supportChatId = null;
  });
}

function openSupportChat(triggerEl) {
  openModalPop(document.getElementById("supportChatModal"), triggerEl);
  const session = loadSupportSession(state.branchId);
  if (session && session.chatId) {
    enterChatMode(session.chatId, session.name);
  } else {
    showSupportForm();
  }
}
function closeSupportChatModal() {
  closeModalPop(document.getElementById("supportChatModal"));
}

function showSupportForm() {
  document.getElementById("supportChatForm").style.display = "flex";
  document.getElementById("supportChatBody").style.display = "none";
  document.getElementById("supportChatSubtitle").textContent = "الدعم";
  teardownSupportSubscriptions();
}

function teardownSupportSubscriptions() {
  if (supportChatStatusUnsub) {
    try { supportChatStatusUnsub(); } catch (e) {}
    supportChatStatusUnsub = null;
  }
  if (supportChatMsgsUnsub) {
    try { supportChatMsgsUnsub(); } catch (e) {}
    supportChatMsgsUnsub = null;
  }
}

async function handleStartChat() {
  const errEl = document.getElementById("supportFormError");
  errEl.textContent = "";
  const name = document.getElementById("supportFieldName").value.trim();
  const phone = document.getElementById("supportFieldPhone").value.trim();

  if (!name) {
    errEl.textContent = "من فضلك اكتب اسمك";
    return;
  }
  if (!/^[0-9]{11}$/.test(phone)) {
    errEl.textContent = "من فضلك اكتب رقم موبايل صحيح";
    return;
  }

  const btn = document.getElementById("startSupportChatBtn");
  btn.disabled = true;
  btn.textContent = "جاري البدء...";
  try {
    const chat = await createChat(state.branchId, { name, phone });
    saveSupportSession(state.branchId, { chatId: chat.id, name, phone });
    enterChatMode(chat.id, name);
  } catch (e) {
    console.error(e);
    errEl.textContent = "حصل خطأ، حاول تاني";
  } finally {
    btn.disabled = false;
    btn.textContent = "ابدأ المحادثة";
  }
}

function enterChatMode(chatId, name) {
  supportChatId = chatId;
  supportChatFirstLoad = true;
  supportPrevStatus = null;
  supportLastMsgKey = null;
  document.getElementById("supportChatForm").style.display = "none";
  document.getElementById("supportChatBody").style.display = "flex";
  document.getElementById("supportChatSubtitle").textContent = name ? `أهلاً ${name}` : "الدعم";

  teardownSupportSubscriptions();

  supportChatStatusUnsub = subscribeSingleChat(state.branchId, chatId, (chat) => {
    supportChatStatus = chat.status || "open";
    updateClosedUI();
    if (supportPrevStatus === "open" && supportChatStatus === "closed") {
      showToast("الدعم قفل المحادثة دي 🔒", "info");
    }
    supportPrevStatus = supportChatStatus;
    if (chat.unreadForCustomer) {
      markChatSeenByCustomer(state.branchId, chatId);
    }
  });

  supportChatMsgsUnsub = subscribeChatMessages(state.branchId, chatId, (msgs) => {
    renderSupportMessages(msgs);
  });
}

function renderSupportMessages(msgs) {
  const box = document.getElementById("supportChatMessages");
  box.innerHTML = msgs
    .map((m) => {
      const cls =
        m.sender === "customer" ? "support-msg-customer" : m.sender === "admin" ? "support-msg-admin" : "support-msg-system";
      return `<div class="support-msg ${cls}">${escapeHtml(m.text)}</div>`;
    })
    .join("");
  box.scrollTop = box.scrollHeight;

  const last = msgs[msgs.length - 1];
  if (last) {
    const key = last.id || String(last.createdAt);
    if (last.sender === "admin" && !supportChatFirstLoad && key !== supportLastMsgKey) {
      playChatSound();
    }
    supportLastMsgKey = key;
  }
  supportChatFirstLoad = false;
}

function updateClosedUI() {
  const closedNote = document.getElementById("supportChatClosedNote");
  const inputRow = document.getElementById("supportChatInputRow");
  if (supportChatStatus === "closed") {
    closedNote.style.display = "flex";
    inputRow.style.display = "none";
  } else {
    closedNote.style.display = "none";
    inputRow.style.display = "flex";
  }
}

function sendSupportMessage() {
  const input = document.getElementById("supportChatInput");
  const text = input.value.trim();
  if (!text || !supportChatId || supportChatStatus === "closed") return;
  input.value = "";
  sendChatMessage(state.branchId, supportChatId, "customer", text);

  const session = loadSupportSession(state.branchId);
  const branch = typeof BRANCHES !== "undefined" ? BRANCHES[state.branchId] : null;
  if (session && typeof sendTelegramOrderNotification === "function") {
    sendTelegramOrderNotification(buildTelegramSupportMessage(branch, session.name, session.phone, text));
  }
}

function startFreshChat() {
  const prev = loadSupportSession(state.branchId);
  clearSupportSession(state.branchId);
  teardownSupportSubscriptions();
  supportChatId = null;
  supportChatStatus = "open";
  showSupportForm();
  if (prev) {
    document.getElementById("supportFieldName").value = prev.name || "";
    document.getElementById("supportFieldPhone").value = prev.phone || "";
  }
}

// ---------- انتظار اختيار الفرع قبل ما نفعّل الزرار ----------
function trySupportInit() {
  if (typeof state !== "undefined" && state.branchId && typeof BRANCHES !== "undefined" && BRANCHES[state.branchId]) {
    initSupportFab();
    return true;
  }
  return false;
}
if (!trySupportInit()) {
  const supportInitInterval = setInterval(() => {
    if (trySupportInit()) clearInterval(supportInitInterval);
  }, 400);
}
