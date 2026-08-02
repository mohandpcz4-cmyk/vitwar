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
let supportLastSeenByAdminAt = 0;
let supportLastMsgs = [];
let supportTypingTimer = null;
let supportTypingIndicatorInterval = null;

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

// ---------- فتح شات الدعم (من قائمة ⋮) ----------
function initSupportFab() {
  const fab = document.getElementById("browseSupportBtn");
  if (!fab || fab.dataset.inited) return;
  fab.dataset.inited = "1";
  fab.addEventListener("click", (e) => {
    closeBrowseMenu();
    openSupportChat(e.currentTarget);
  });

  document.getElementById("headerSupportChatBtn")?.addEventListener("click", (e) => {
    openSupportChat(e.currentTarget);
  });

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
  document.getElementById("supportChatInput")?.addEventListener("input", () => {
    if (!supportChatId || supportChatStatus === "closed") return;
    setTypingStatus(state.branchId, supportChatId, "customer", true);
    clearTimeout(supportTypingTimer);
    supportTypingTimer = setTimeout(() => {
      setTypingStatus(state.branchId, supportChatId, "customer", false);
    }, 2500);
  });
  document.getElementById("newSupportChatBtn")?.addEventListener("click", startFreshChat);

  document.getElementById("browseChangeBranchBtn")?.addEventListener("click", () => {
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
  document.getElementById("supportChatSubtitle").textContent = t("supportSubtitleDefault");
  teardownSupportSubscriptions();
}

function teardownSupportSubscriptions() {
  clearTimeout(supportTypingTimer);
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
    errEl.textContent = t("supportErrName");
    return;
  }
  if (!/^[0-9]{11}$/.test(phone)) {
    errEl.textContent = t("supportErrPhone");
    return;
  }

  const btn = document.getElementById("startSupportChatBtn");
  btn.disabled = true;
  btn.textContent = t("supportStartingBtn");
  try {
    const chat = await createChat(state.branchId, { name, phone });
    saveSupportSession(state.branchId, { chatId: chat.id, name, phone });
    enterChatMode(chat.id, name);
    sendAutoReplyMessages(state.branchId, chat.id);
  } catch (e) {
    console.error(e);
    errEl.textContent = t("supportErrGeneric");
  } finally {
    btn.disabled = false;
    btn.textContent = t("startChatBtn");
  }
}

function enterChatMode(chatId, name) {
  supportChatId = chatId;
  supportChatFirstLoad = true;
  supportPrevStatus = null;
  supportLastMsgKey = null;
  supportLastSeenByAdminAt = 0;
  supportLastMsgs = [];
  document.getElementById("supportChatForm").style.display = "none";
  document.getElementById("supportChatBody").style.display = "flex";
  document.getElementById("supportChatSubtitle").textContent = name ? t("supportGreeting", { name }) : t("supportSubtitleDefault");

  teardownSupportSubscriptions();

  supportChatStatusUnsub = subscribeSingleChat(state.branchId, chatId, (chat) => {
    supportChatStatus = chat.status || "open";
    updateClosedUI();
    if (supportPrevStatus === "open" && supportChatStatus === "closed") {
      showToast(t("supportChatClosedByAdmin"), "info");
    }
    supportPrevStatus = supportChatStatus;
    if (chat.unreadForCustomer) {
      markChatSeenByCustomer(state.branchId, chatId);
    }
    if (chat.lastSeenByAdminAt !== supportLastSeenByAdminAt) {
      supportLastSeenByAdminAt = chat.lastSeenByAdminAt || 0;
      renderSupportMessages(supportLastMsgs);
    }
    setSupportTypingIndicator(isTypingActive(chat.typingAdminAt));
  });

  supportChatMsgsUnsub = subscribeChatMessages(state.branchId, chatId, (msgs) => {
    supportLastMsgs = msgs;
    renderSupportMessages(msgs);
  });
}

function setSupportTypingIndicator(show) {
  const el = document.getElementById("supportTypingIndicator");
  if (!el) return;
  el.style.display = show ? "block" : "none";
  if (show) {
    const box = document.getElementById("supportChatMessages");
    if (box) box.scrollTop = box.scrollHeight;
  }
}

const TICK_SVG_SINGLE = `<svg viewBox="0 0 16 11" fill="none"><path d="M1 6l3.5 3.5L15 1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const TICK_SVG_DOUBLE = `<svg viewBox="0 0 20 11" fill="none"><path d="M1 6l3.5 3.5L14 1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6l3.5 3.5L19 1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function renderSupportMessages(msgs) {
  const box = document.getElementById("supportChatMessages");
  box.innerHTML = msgs
    .map((m) => {
      const cls =
        m.sender === "customer" ? "support-msg-customer" : m.sender === "admin" ? "support-msg-admin" : "support-msg-system";
      let ticks = "";
      if (m.sender === "customer") {
        const seen = supportLastSeenByAdminAt && m.createdAt <= supportLastSeenByAdminAt;
        ticks = `<span class="support-msg-ticks ${seen ? "seen" : ""}">${seen ? TICK_SVG_DOUBLE : TICK_SVG_SINGLE}</span>`;
      }
      return `<div class="support-msg ${cls}">${escapeHtml(m.text)}${ticks}</div>`;
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
  clearTimeout(supportTypingTimer);
  setTypingStatus(state.branchId, supportChatId, "customer", false);
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
