// Monta a mensagem de notificação de missão a partir do status sincronizado.
function buildMissionMessage(sub) {
  const bossName = sub.status && sub.status.boss && sub.status.boss.name
    ? sub.status.boss.name
    : null;

  // Sem dado de chefe sincronizado: mensagem neutra, sem citar a vida do boss.
  let body = "⚡ A arena abriu. Hora da sua missão de treino!";

  if (bossName && sub.status.boss.hitsLeft != null) {
    const hitsLeft = sub.status.boss.hitsLeft;
    if (hitsLeft <= 0) {
      body = `⚡ A arena abriu! O ${bossName} já tombou essa semana 🎉`;
    } else if (hitsLeft === 1) {
      body = `⚔️ Falta um golpe para vencer o ${bossName}!`;
    } else {
      body = `⚔️ Faltam ${hitsLeft} golpes para vencer o ${bossName}!`;
    }
  }
  return { title: "Constância", body };
}

module.exports = { buildMissionMessage };
