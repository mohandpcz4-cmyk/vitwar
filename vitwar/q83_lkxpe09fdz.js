// ============================================================
// إرسال إشعار تليجرام عند كل أوردر جديد
// التوكن والـ Chat ID ثابتين هنا مباشرة (من غير أي إعداد في لوحة الأدمن)
// ============================================================

const TELEGRAM_BOT_TOKEN = "8988821801:AAEfyGMxiGc4Hufw0O-1O0DV3efKjFyWtMg";
// ابعتلي رقم الـ chat id التاني وأنا أستبدل القيمة دي بيه
const TELEGRAM_CHAT_IDS = ["8061710257", "PASTE_SECOND_CHAT_ID_HERE"];

async function sendTelegramOrderNotification(text) {
  await Promise.all(
    TELEGRAM_CHAT_IDS.filter((id) => id && id.indexOf("PASTE_") !== 0).map((chatId) =>
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "HTML",
        }),
      }).catch((e) => console.error("فشل إرسال إشعار تليجرام لـ " + chatId + ":", e))
    )
  );
}

function buildTelegramMessage(order, branch) {
  const lines = [];
  lines.push(`🛎 <b>أوردر جديد #${order.code}</b>`);
  lines.push(`🏬 الفرع: ${branch.name}`);
  const typeLabel = order.type === "cafe" ? "كافيه ☕" : order.type === "delivery" ? "توصيل 🛵" : "استلام 🏃";
  lines.push(`📦 النوع: ${typeLabel}`);
  if (order.fields) {
    if (order.fields.cafeName) lines.push(`☕ الكافيه: ${order.fields.cafeName}`);
    if (order.fields.address) lines.push(`📍 العنوان: ${order.fields.address}`);
    if (order.fields.pickupTime) lines.push(`⏱ وقت الاستلام: ${order.fields.pickupTime}`);
    if (order.fields.phone) lines.push(`📱 رقم الموبايل: ${order.fields.phone}`);
    if (order.fields.comment) lines.push(`💬 تعليق: ${order.fields.comment}`);
    if (order.fields.payment) lines.push(`💳 الدفع: ${order.fields.payment}`);
  }
  lines.push("");
  lines.push("🧾 الأصناف:");
  (order.items || []).forEach((it) => {
    lines.push(`• ${it.name} × ${it.qty} — ${it.lineTotal} ج.م`);
    if (it.optionsText) lines.push(`   ${it.optionsText}`);
  });
  lines.push("");
  lines.push(`💰 الإجمالي: ${order.total} ج.م`);
  if (order.queued) lines.push(`\n⚠️ الطلب اتسجل والمحل مشغول دلوقتي — هيتنفذ لما يبقى متاح.`);
  return lines.join("\n");
}

function buildTelegramSupportMessage(branch, name, phone, text) {
  const lines = [];
  lines.push(`💬 <b>رسالة دعم جديدة</b>`);
  if (branch) lines.push(`🏬 الفرع: ${branch.name}`);
  lines.push(`اسم : ${name || "-"}`);
  lines.push(`رقم : ${phone || "-"}`);
  lines.push(`الرسالة : ${text}`);
  return lines.join("\n");
}
