// POST /api/test-push — envia um aviso imediato para validar a configuração.
const webpush = require("web-push");
const { withStore } = require("../_store");
const { buildMissionMessage } = require("../_message");

function configureWebPush() {
  webpush.setVapidDetails(
    "mailto:constancia-app@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { deviceId, profileId } = body || {};
    if (!deviceId || !profileId) return res.status(400).json({ error: "deviceId e profileId são obrigatórios" });

    const key = `${deviceId}::${profileId}`;
    const result = await withStore((data) => data); // leitura simples (sem mutação)
    const sub = result && result.subscriptions && result.subscriptions[key];
    if (!sub) return res.status(404).json({ error: "inscrição não encontrada" });

    configureWebPush();
    const msg = buildMissionMessage(sub);
    msg.body = `[TESTE] ${msg.body}`;

    await webpush.sendNotification(
      sub.subscription,
      JSON.stringify({ title: msg.title, body: msg.body, profileId })
    );

    return res.status(200).json({ ok: true, sent: msg });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
};
