// ============================================================
// نافذة "طلب جديد" — صوت بيعمل loop لحد ما تدوس "قبول"
// أقصى مدة للـ loop: 30 ثانية، وبعدها الصوت بيسكت لوحده (والنافذة تفضل مفتوحة)
// ============================================================

const NEW_ORDER_LOOP_MAX_MS = 30000; // نص دقيقة
const NEW_ORDER_SOUND_FILES = {
  cafe: "sounds/cafe.mp3",
  delivery: "sounds/delivery.mp3",
  pickup: "sounds/pickup.mp3",
};

const orderPopupState = {
  queue: [],
  current: null,
  audio: null,
  maxTimer: null,
};

function enqueueNewOrderPopup(order) {
  orderPopupState.queue.push(order);
  processNewOrderPopupQueue();
}

function processNewOrderPopupQueue() {
  if (orderPopupState.current) return; // في طلب متعروض دلوقتي، استنى لحد ما يتقبل
  const next = orderPopupState.queue.shift();
  if (!next) return;
  orderPopupState.current = next;
  renderNewOrderPopup(next);
  startNewOrderLoopSound(next.type);
}

function startNewOrderLoopSound(type) {
  stopNewOrderLoopSound();
  const src = NEW_ORDER_SOUND_FILES[type] || NEW_ORDER_SOUND_FILES.pickup;
  try {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 1;
    audio.play().catch(() => {});
    orderPopupState.audio = audio;
  } catch (e) {}
  orderPopupState.maxTimer = setTimeout(() => {
    stopNewOrderLoopSound();
  }, NEW_ORDER_LOOP_MAX_MS);
}

function stopNewOrderLoopSound() {
  if (orderPopupState.audio) {
    try {
      orderPopupState.audio.pause();
      orderPopupState.audio.currentTime = 0;
    } catch (e) {}
    orderPopupState.audio = null;
  }
  if (orderPopupState.maxTimer) {
    clearTimeout(orderPopupState.maxTimer);
    orderPopupState.maxTimer = null;
  }
}

function ensureNewOrderPopupHost() {
  let host = document.getElementById("newOrderPopupHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "newOrderPopupHost";
    host.className = "new-order-popup-host";
    host.innerHTML = `
      <div class="new-order-popup-overlay"></div>
      <div class="new-order-popup-box">
        <div class="new-order-popup-badge">
          <img id="newOrderPopupGif" src="images/icons/wait.gif" alt="⏳" />
        </div>
        <span class="new-order-popup-tag" id="newOrderPopupType"></span>
        <h3 class="new-order-popup-title">طلب جديد!</h3>
        <p class="new-order-popup-code" id="newOrderPopupCode"></p>
        <p class="new-order-popup-total" id="newOrderPopupTotal"></p>
        <div class="new-order-popup-timerbar">
          <div class="new-order-popup-timerbar-fill" id="newOrderPopupTimerFill"></div>
        </div>
        <button type="button" class="glass-btn tap-fx new-order-popup-accept" id="newOrderPopupAccept">
          ✅ قبول الطلب
        </button>
      </div>`;
    document.body.appendChild(host);
    document.getElementById("newOrderPopupAccept").addEventListener("click", acceptCurrentNewOrderPopup);
  }
  return host;
}

function renderNewOrderPopup(order) {
  const host = ensureNewOrderPopupHost();
  const typeLabel = (typeof ORDER_TYPE_LABELS !== "undefined" && ORDER_TYPE_LABELS[order.type]) || order.type;
  document.getElementById("newOrderPopupType").textContent = typeLabel;
  document.getElementById("newOrderPopupCode").textContent = order.code ? `#${order.code}` : "";
  document.getElementById("newOrderPopupTotal").textContent = order.total != null ? `${order.total} ج.م` : "";

  const fill = document.getElementById("newOrderPopupTimerFill");
  if (fill) {
    fill.classList.remove("run");
    void fill.offsetWidth; // reflow عشان الأنميشن يبدأ من جديد كل مرة
    fill.classList.add("run");
  }

  host.classList.add("open");
  document.documentElement.classList.add("no-scroll");
}

function hideNewOrderPopup() {
  const host = document.getElementById("newOrderPopupHost");
  if (host) host.classList.remove("open");
  document.documentElement.classList.remove("no-scroll");
}

function acceptCurrentNewOrderPopup() {
  const order = orderPopupState.current;
  stopNewOrderLoopSound();
  hideNewOrderPopup();

  if (order) {
    if (typeof state !== "undefined" && state.orders) {
      const local = state.orders.find((o) => o.id === order.id);
      if (local) local.seen = true;
      if (typeof updateOrdersBadge === "function") updateOrdersBadge();
      if (typeof renderOrdersList === "function") renderOrdersList();
    }
    if (typeof markOrderSeen === "function" && typeof state !== "undefined" && state.branchId) {
      markOrderSeen(state.branchId, order.id);
    }
  }

  orderPopupState.current = null;
  setTimeout(() => processNewOrderPopupQueue(), 250);
}
