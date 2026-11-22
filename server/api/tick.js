// GET /api/tick?secret=...
// Chamado periodicamente (GitHub Actions) para verificar quem deve receber
// o aviso de missão agora, respeitando dia/horário escolhido, fuso horário
// e se o treino do dia já foi sincronizado como concluído.
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

function nowInTz(tz) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", weekday: "short",
    });
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
    const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      dateKey: `${parts.year}-${parts.month}-${parts.day}`,
      hhmm: `${parts.hour}:${parts.minute}`,
      weekday: weekdayMap[parts.weekday],
    };
  } catch {
    const d = new Date();
    return { dateKey: d.toISOString().slice(0, 10), hhmm: "00:00", weekday: d.getUTCDay() };
  }
}

module.exports = async (req, res) => {
  const secret = req.query && req.query.secret;
  if (!process.env.TICK_SECRET || secret !== process.env.TICK_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  configureWebPush();
  const sent = [];
  const errors = [];

  await withStore((data) => {
    const subs = data.subscriptions || {};
    for (const key of Object.keys(subs)) {
      const sub = subs[key];
      if (!sub || !sub.enabled) continue;

      const { dateKey, hhmm, weekday } = nowInTz(sub.tz || "America/Sao_Paulo");

      // já enviado hoje? evita duplicar em ticks seguidos no mesmo dia
      if (sub.lastSentDate === dateKey) continue;

      // fora da janela de horário (tick roda a cada poucos minutos — tolerância de 4 min)
      const [goalH, goalM] = (sub.reminderTime || "18:00").split(":").map(Number);
      const [curH, curM] = hhmm.split(":").map(Number);
      const diffMin = Math.abs((curH * 60 + curM) - (goalH * 60 + goalM));
      if (diffMin > 4) continue;

      // dia de treino planejado? (lista vazia = todo dia)
      if (Array.isArray(sub.trainDays) && sub.trainDays.length > 0 && !sub.trainDays.includes(weekday)) continue;

      // treino de hoje já sincronizado como feito? pula o aviso
      if (sub.status && sub.status.dateKey === dateKey && sub.status.exercicioDoneToday) continue;

      const msg = buildMissionMessage(sub);
      sent.push({ key, msg });

      webpush
        .sendNotification(sub.subscription, JSON.stringify({ title: msg.title, body: msg.body, profileId: sub.profileId }))
        .then(() => {
          sub.lastSentDate = dateKey;
        })
        .catch((err) => {
          errors.push({ key, error: String(err.message || err) });
          // inscrição inválida/expirada: desativa para não tentar de novo
          if (err && (err.statusCode === 404 || err.statusCode === 410)) {
            sub.enabled = false;
          }
        });
    }
    return data;
  });

  // pequena espera para as promises de envio assentarem antes do segundo write
  await new Promise((r) => setTimeout(r, 1500));
  // persiste lastSentDate/enabled atualizados
  await withStore((data) => data);

  return res.status(200).json({ ok: true, checked: true, sent: sent.length, errors });
};
