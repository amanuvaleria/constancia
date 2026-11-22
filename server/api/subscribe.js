// POST /api/subscribe
// Registra (ou atualiza) a inscrição de avisos de missão de um perfil neste aparelho.
const { withStore } = require("../_store");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const {
      deviceId, profileId, profileName, subscription,
      trainDays, reminderTime, tz, enabled,
    } = body || {};

    if (!deviceId || !profileId || !subscription) {
      return res.status(400).json({ error: "deviceId, profileId e subscription são obrigatórios" });
    }

    const key = `${deviceId}::${profileId}`;
    await withStore((data) => {
      if (!data.subscriptions) data.subscriptions = {};
      const existing = data.subscriptions[key] || {};
      data.subscriptions[key] = {
        ...existing,
        deviceId,
        profileId,
        profileName: profileName || existing.profileName || "",
        subscription,
        trainDays: Array.isArray(trainDays) ? trainDays : existing.trainDays || [],
        reminderTime: reminderTime || existing.reminderTime || "18:00",
        tz: tz || existing.tz || "America/Sao_Paulo",
        enabled: enabled !== false,
        lastSentDate: existing.lastSentDate || null,
        status: existing.status || null,
        updatedAt: new Date().toISOString(),
      };
      return data;
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
};
