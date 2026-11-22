// POST /api/sync-status
// O app manda o status do dia (treino feito? vida do chefe?) para o backend
// poder decidir se deve pular o aviso e o que escrever na mensagem.
const { withStore } = require("../_store");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { deviceId, profileId, dateKey, exercicioDoneToday, boss } = body || {};
    if (!deviceId || !profileId) return res.status(400).json({ error: "deviceId e profileId são obrigatórios" });

    const key = `${deviceId}::${profileId}`;
    await withStore((data) => {
      if (!data.subscriptions || !data.subscriptions[key]) return data; // sem inscrição, nada a fazer
      data.subscriptions[key].status = {
        dateKey,
        exercicioDoneToday: !!exercicioDoneToday,
        boss: boss || null,
        syncedAt: new Date().toISOString(),
      };
      return data;
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
};
