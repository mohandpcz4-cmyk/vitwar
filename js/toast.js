// ============================================================
// نظام الإشعارات والصوت المشترك (بدل alert/confirm بتاع المتصفح)
// ============================================================

// ---------- الصوت ----------
let audioCtx = null;
function initAudioOnFirstClick() {
  const enable = () => {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    document.removeEventListener("click", enable);
    document.removeEventListener("touchstart", enable);
  };
  document.addEventListener("click", enable);
  document.addEventListener("touchstart", enable);
}
initAudioOnFirstClick();

function beep(freq, startTime, duration, gainValue = 0.18) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(gainValue, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playOrderSound(type) {
  const fileMap = { cafe: "sounds/cafe.mp3", delivery: "sounds/delivery.mp3", pickup: "sounds/pickup.mp3" };
  const src = fileMap[type] || fileMap.pickup;
  try {
    const audio = new Audio(src);
    audio.volume = 1;
    audio.play().catch(() => {});
  } catch (e) {}
}

function playChatSound() {
  try {
    const audio = new Audio("sounds/chat.mp3");
    audio.volume = 1;
    audio.play().catch(() => {});
  } catch (e) {}
}

// صوت إشعار مخصص لرسائل الأدمن (تبويب "رسائل")
function playNotificationSound() {
  try {
    const audio = new Audio("sounds/notification.mp3");
    audio.volume = 1;
    audio.play().catch(() => {});
  } catch (e) {}
}

// صوت خفيف هادي لحالة "مقفول"
function playClosedSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  beep(360, now, 0.35, 0.09);
  beep(300, now + 0.28, 0.4, 0.08);
}

// ---------- Toast خفيف (إشعار بسيط بيختفي لوحده) ----------
function ensureToastHost() {
  let host = document.getElementById("vtToastHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "vtToastHost";
    host.className = "vt-toast-host";
    document.body.appendChild(host);
  }
  return host;
}

function showToast(message, kind = "info", duration = 3200) {
  const host = ensureToastHost();
  const el = document.createElement("div");
  el.className = `vt-toast vt-toast-${kind} tap-fx`;
  el.textContent = message;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ---------- Modal بديل alert() و confirm() بشكل الموقع ----------
function ensureModalHost() {
  let host = document.getElementById("vtModalHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "vtModalHost";
    host.className = "vt-modal-host";
    host.innerHTML = `
      <div class="cart-overlay vt-modal-overlay"></div>
      <div class="vt-modal-box">
        <p class="vt-modal-text" id="vtModalText"></p>
        <div class="vt-modal-actions" id="vtModalActions"></div>
      </div>`;
    document.body.appendChild(host);
  }
  return host;
}

function siteAlert(message, okLabel = "تمام") {
  return new Promise((resolve) => {
    const host = ensureModalHost();
    host.querySelector("#vtModalText").textContent = message;
    const actions = host.querySelector("#vtModalActions");
    actions.innerHTML = "";
    const okBtn = document.createElement("button");
    okBtn.className = "glass-btn tap-fx";
    okBtn.textContent = okLabel;
    actions.appendChild(okBtn);
    host.classList.add("open");
    const close = () => {
      host.classList.remove("open");
      resolve(true);
    };
    okBtn.onclick = close;
    host.querySelector(".vt-modal-overlay").onclick = close;
  });
}

function siteConfirm(message, okLabel = "تأكيد", cancelLabel = "إلغاء") {
  return new Promise((resolve) => {
    const host = ensureModalHost();
    host.querySelector("#vtModalText").textContent = message;
    const actions = host.querySelector("#vtModalActions");
    actions.innerHTML = "";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "glass-btn-secondary glass-btn tap-fx";
    cancelBtn.textContent = cancelLabel;
    const okBtn = document.createElement("button");
    okBtn.className = "glass-btn tap-fx";
    okBtn.textContent = okLabel;
    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    host.classList.add("open");
    const finish = (val) => {
      host.classList.remove("open");
      resolve(val);
    };
    okBtn.onclick = () => finish(true);
    cancelBtn.onclick = () => finish(false);
    host.querySelector(".vt-modal-overlay").onclick = () => finish(false);
  });
}

function sitePrompt(message, { placeholder = "", value = "", okLabel = "تأكيد", cancelLabel = "إلغاء", inputType = "text" } = {}) {
  return new Promise((resolve) => {
    const host = ensureModalHost();
    host.querySelector("#vtModalText").textContent = message;
    const actions = host.querySelector("#vtModalActions");
    const box = host.querySelector(".vt-modal-box");
    actions.innerHTML = "";

    const input = document.createElement("input");
    input.type = inputType;
    input.className = "vt-modal-input";
    input.placeholder = placeholder;
    input.value = value;
    if (inputType === "number") { input.min = "0"; input.step = "1"; input.inputMode = "numeric"; }
    box.insertBefore(input, actions);

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "glass-btn-secondary glass-btn tap-fx";
    cancelBtn.textContent = cancelLabel;
    const okBtn = document.createElement("button");
    okBtn.className = "glass-btn tap-fx";
    okBtn.textContent = okLabel;
    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    host.classList.add("open");
    setTimeout(() => input.focus(), 50);

    const finish = (val) => {
      input.remove();
      host.classList.remove("open");
      resolve(val);
    };
    okBtn.onclick = () => finish(input.value);
    cancelBtn.onclick = () => finish(null);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); finish(input.value); } });
    host.querySelector(".vt-modal-overlay").onclick = () => finish(null);
  });
}

// شاشة "الفرع مقفول"
function showClosedBanner(show) {
  let banner = document.getElementById("closedBanner");
  if (show) {
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "closedBanner";
      banner.className = "closed-banner";
      const tr = (k, d) => (typeof t === "function" ? t(k) : d);
      banner.innerHTML = `
        <button class="closed-banner-close tap-fx" id="closedBannerCloseX">✕</button>
        <div class="closed-banner-box">
          <div class="closed-icon-badge"><img class="emoji-gif" src="images/icons/emoji-closed.gif" alt="⛔" /></div>
          <h3 class="closed-banner-title">${tr("closedTitleBig", "الفرع مقفول دلوقتي")}</h3>
          <p class="closed-banner-subtitle">${tr("closedSubtitle", "هنكون في استقبالك تاني قريب — تقدر تختار فرع تاني دلوقتي")}</p>
          <button class="glass-btn tap-fx" id="closedBannerChangeBranch">${tr("closedChangeBranchBtn", "اختيار فرع تاني")}</button>
        </div>`;
      document.body.appendChild(banner);
      playClosedSound();
      const goBranch = () => { if (typeof goToBranchSelect === "function") goToBranchSelect(); };
      document.getElementById("closedBannerCloseX").addEventListener("click", goBranch);
      document.getElementById("closedBannerChangeBranch").addEventListener("click", goBranch);
    }
  } else if (banner) {
    banner.remove();
  }
}
