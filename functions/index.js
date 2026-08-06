// ============================================================
// Cloud Function: بترسل Push Notification حقيقي (FCM) لكل الأجهزة
// اللي فاتحة فرع معين، لحظة ما الأدمن يبعت رسالة من تبويب "رسائل".
// ============================================================
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 5 });

exports.sendBroadcastPush = onDocumentCreated(
  "branches/{branchId}/messages/{messageId}",
  async (event) => {
    const branchId = event.params.branchId;
    const data = event.data && event.data.data();
    if (!data) return;

    const title = data.title || "رسالة جديدة";
    const body = data.body || "";

    const db = admin.firestore();
    const tokensSnap = await db
      .collection("branches")
      .doc(branchId)
      .collection("fcmTokens")
      .get();

    if (tokensSnap.empty) {
      console.log(`لا يوجد أجهزة مسجلة للإشعارات في الفرع ${branchId}`);
      return;
    }

    const tokens = tokensSnap.docs.map((d) => d.id);

    const message = {
      notification: { title, body },
      webpush: {
        notification: {
          icon: "/images/icons/icon-192.png",
          badge: "/images/icons/icon-192.png",
        },
        fcmOptions: { link: "/index.html" },
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // نظافة: نمسح أي توكن بقى invalid (المستخدم مسح التطبيق / منع الإشعارات)
    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (
        !r.success &&
        (r.error?.code === "messaging/registration-token-not-registered" ||
          r.error?.code === "messaging/invalid-registration-token")
      ) {
        invalidTokens.push(tokens[i]);
      }
    });

    if (invalidTokens.length) {
      const batch = db.batch();
      invalidTokens.forEach((t) => {
        batch.delete(
          db.collection("branches").doc(branchId).collection("fcmTokens").doc(t)
        );
      });
      await batch.commit();
    }

    console.log(
      `تم إرسال إشعار للفرع ${branchId}: نجح ${response.successCount} / فشل ${response.failureCount}`
    );
  }
);
