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
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  if (type === "cafe") {
    beep(700, now, 0.18);
    beep(700, now + 0.25, 0.18);
  } else if (type === "delivery") {
    beep(500, now, 0.14);
    beep(650, now + 0.18, 0.14);
    beep(800, now + 0.36, 0.18);
  } else if (type === "pickup") {
    beep(600, now, 0.45, 0.2);
  } else {
    beep(650, now, 0.2);
  }
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

// شاشة "الفرع مقفول" الحمراء
function showClosedBanner(show) {
  let banner = document.getElementById("closedBanner");
  if (show) {
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "closedBanner";
      banner.className = "closed-banner";
      banner.innerHTML = `<div class="closed-banner-box"><span class="closed-icon">⛔</span><span>الفرع مقفول دلوقتي</span></div>`;
      document.body.appendChild(banner);
      playClosedSound();
    }
  } else if (banner) {
    banner.remove();
  }
}
