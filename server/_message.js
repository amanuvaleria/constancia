// Monta a mensagem de notificação de missão a partir do status sincronizado.
function buildMissionMessage(sub) {
  const bossName = sub.status && sub.status.boss && sub.status.boss.name
    ? sub.status.boss.name
    : null;

  let body = "⚔️ Missão de hoje — hora de treinar!";
  if (bossName && sub.status.boss.hitsLeft != null) {
    const hitsLeft = sub.status.boss.hitsLeft;
    if (hitsLeft <= 0) {
      body = `⚔️ Missão de hoje — hora de treinar! Guardião ${bossName} já tombou esta semana 🎉`;
    } else if (hitsLeft === 1) {
      body = `⚔️ Missão de hoje — hora de treinar! Falta 1 golpe para vencer o ${bossName}.`;
    } else {
      body = `⚔️ Missão de hoje — hora de treinar! Faltam ${hitsLeft} golpes para vencer o ${bossName}.`;
    }
  }
  return { title: "Constância", body };
}

module.exports = { buildMissionMessage };
