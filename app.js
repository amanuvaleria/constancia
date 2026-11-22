// ============================================================
// Constância — rastreador de frequência na academia e hábitos
// HTML + CSS + JS puro, localStorage, sem dependências externas.
// ============================================================

const WATER_GOAL = 3000;
const STORAGE_PREFIX = "constancia";
const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_LONG = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado",
];
const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// ---------------------------------------------------------------
// Datas (usa sempre a data/hora LOCAL do aparelho, nunca UTC)
// ---------------------------------------------------------------

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Segunda-feira da semana que contém `date`
function getMonday(date) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0=Dom ... 6=Sáb
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function isSameDay(a, b) {
  return formatDateKey(a) === formatDateKey(b);
}

function formatLongDate(date) {
  const weekday = WEEKDAY_LONG[date.getDay()];
  return `${weekday}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

function formatShortDayLabel(date) {
  return `${WEEKDAY_SHORT[date.getDay()]} ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
}

function formatWeekRangeLabel(monday, sunday) {
  return `${pad2(monday.getDate())}/${pad2(monday.getMonth() + 1)} a ${pad2(sunday.getDate())}/${pad2(sunday.getMonth() + 1)}`;
}

function todayDate() {
  return new Date();
}

function todayKey() {
  return formatDateKey(todayDate());
}

// ---------------------------------------------------------------
// História — Arco 1: A Torre do Impulso
// ---------------------------------------------------------------

const STORY_ARC = {
  id: "torre-impulso",
  title: "Arco 1 — A Torre do Impulso",
  location: "Torre do Impulso, nos arredores da Academia Vargen",
  boss: { name: "Guardião da Inércia", emoji: "🗿" },
  reward: { badge: "Emblema da Primeira Chama", accessory: "Bracelete de Impulso" },
  intro: [
    { speaker: "Vix", text: "Aprendiz! Chegou a hora. A Torre do Impulso se abriu diante de você." },
    { speaker: "Treinadora Kaya", text: "Lá dentro mora o Guardião da Inércia — um gigante de pedra que se alimenta da nossa preguiça." },
    { speaker: "Treinadora Kaya", text: "Cada treino que você completar na academia é um golpe de verdade contra ele. Não existe treino fácil, existe treino feito." },
    { speaker: "Vix", text: "Vença o Guardião antes que a semana acabe! Se não vencer, pode tentar de novo na semana seguinte." },
  ],
  victory: [
    { speaker: "Treinadora Kaya", text: "As rachaduras se abrem... a pedra não aguenta mais!" },
    { speaker: "Narrador", text: "O Guardião da Inércia desmorona em pó verde brilhante." },
    { speaker: "Vix", text: "Você conseguiu! O primeiro Guardião da Arena caiu diante da sua constância." },
    { speaker: "Treinadora Kaya", text: "Isso não foi sorte. Foi hábito. Guarde esse emblema — ele é prova do que você já é capaz de sustentar." },
  ],
};

// ---------------------------------------------------------------
// Perfis
// ---------------------------------------------------------------

function uid() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoryState() {
  return { introSeen: false, bossDefeated: false, victorySeen: false, badges: [], accessories: [] };
}

// Preenche campos novos em perfis antigos sem apagar o que já existe
function ensureProfileDefaults(profile) {
  if (profile.weeklyGoal == null) profile.weeklyGoal = 3;
  if (!Array.isArray(profile.trainDays)) profile.trainDays = [1, 2, 3, 4, 5]; // seg-sex
  if (!profile.reminderTime) profile.reminderTime = "18:00";
  if (profile.reminderEnabled == null) profile.reminderEnabled = false;
  if (!profile.story) profile.story = defaultStoryState();
  return profile;
}

function loadProfiles() {
  let profiles = [];
  try {
    profiles = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}:profiles`)) || [];
  } catch {
    profiles = [];
  }
  if (!Array.isArray(profiles) || profiles.length === 0) {
    const defaultProfile = ensureProfileDefaults({ id: uid(), name: "Perfil 1" });
    profiles = [defaultProfile];
    saveProfiles(profiles);
    setActiveProfileId(defaultProfile.id);
    return profiles;
  }
  let changed = false;
  profiles.forEach((p) => {
    const before = JSON.stringify(p);
    ensureProfileDefaults(p);
    if (JSON.stringify(p) !== before) changed = true;
  });
  if (changed) saveProfiles(profiles);
  return profiles;
}

function saveProfiles(profiles) {
  localStorage.setItem(`${STORAGE_PREFIX}:profiles`, JSON.stringify(profiles));
}

function getActiveProfileId() {
  const profiles = loadProfiles();
  let id = localStorage.getItem(`${STORAGE_PREFIX}:activeProfile`);
  if (!id || !profiles.some((p) => p.id === id)) {
    id = profiles[0].id;
    setActiveProfileId(id);
  }
  return id;
}

function setActiveProfileId(id) {
  localStorage.setItem(`${STORAGE_PREFIX}:activeProfile`, id);
}

function getActiveProfile() {
  const profiles = loadProfiles();
  const id = getActiveProfileId();
  return profiles.find((p) => p.id === id) || profiles[0];
}

function createProfile(name) {
  const profiles = loadProfiles();
  const profile = ensureProfileDefaults({ id: uid(), name: name.trim().slice(0, 24) || "Novo perfil" });
  profiles.push(profile);
  saveProfiles(profiles);
  setActiveProfileId(profile.id);
  return profile;
}

function updateProfile(id, mutator) {
  const profiles = loadProfiles();
  const profile = profiles.find((p) => p.id === id);
  if (!profile) return;
  mutator(profile);
  saveProfiles(profiles);
}

function deleteProfile(id) {
  let profiles = loadProfiles();
  if (profiles.length <= 1) return; // sempre deixa pelo menos 1 perfil
  profiles = profiles.filter((p) => p.id !== id);
  saveProfiles(profiles);
  localStorage.removeItem(`${STORAGE_PREFIX}:data:${id}`);
  if (getActiveProfileId() === id) {
    setActiveProfileId(profiles[0].id);
  }
}

// ---------------------------------------------------------------
// Dados por perfil (hábitos diários)
// ---------------------------------------------------------------

function defaultEntry() {
  return { agua: [], exercicio: false, fibras: false, dieta: false };
}

function loadData(profileId) {
  try {
    return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}:data:${profileId}`)) || {};
  } catch {
    return {};
  }
}

function saveData(profileId, data) {
  localStorage.setItem(`${STORAGE_PREFIX}:data:${profileId}`, JSON.stringify(data));
}

function getEntry(profileId, dateKey) {
  const data = loadData(profileId);
  return data[dateKey] ? { ...defaultEntry(), ...data[dateKey] } : defaultEntry();
}

function mutateEntry(profileId, dateKey, mutator) {
  const data = loadData(profileId);
  const entry = data[dateKey] ? { ...defaultEntry(), ...data[dateKey] } : defaultEntry();
  mutator(entry);
  data[dateKey] = entry;
  saveData(profileId, data);
  checkBossVictory(profileId);
  onDataChanged();
}

function addWater(profileId, dateKey, amount) {
  if (!amount || amount <= 0) return;
  mutateEntry(profileId, dateKey, (entry) => {
    entry.agua.push({ amount: Math.round(amount), ts: Date.now() });
  });
}

function undoWater(profileId, dateKey) {
  mutateEntry(profileId, dateKey, (entry) => {
    entry.agua.pop();
  });
}

function toggleHabit(profileId, dateKey, habit) {
  mutateEntry(profileId, dateKey, (entry) => {
    entry[habit] = !entry[habit];
  });
}

function waterTotal(entry) {
  return entry.agua.reduce((sum, r) => sum + r.amount, 0);
}

function isAguaDone(entry) {
  return waterTotal(entry) >= WATER_GOAL;
}

function countDoneHabits(entry) {
  return (isAguaDone(entry) ? 1 : 0) + (entry.exercicio ? 1 : 0) + (entry.fibras ? 1 : 0) + (entry.dieta ? 1 : 0);
}

function countExerciseInWeek(profileId, monday) {
  const data = loadData(profileId);
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const key = formatDateKey(addDays(monday, i));
    if (data[key] && data[key].exercicio) count++;
  }
  return count;
}

// ---------------------------------------------------------------
// Chefe da semana (vida = meta semanal - treinos registrados)
// Um golpe por data de treino; recalculado sempre a partir do
// histórico (corrigir um dia passado recalcula a vida na hora).
// ---------------------------------------------------------------

function getBossState(profile) {
  const monday = getMonday(todayDate());
  const goal = profile.weeklyGoal || 3;
  const hits = countExerciseInWeek(profile.id, monday);
  const hitsCapped = Math.min(hits, goal);
  const hp = Math.max(0, goal - hitsCapped);
  return {
    bossName: STORY_ARC.boss.name,
    bossEmoji: STORY_ARC.boss.emoji,
    goal,
    hits: hitsCapped,
    hitsLeft: hp,
    pctHp: goal > 0 ? (hp / goal) * 100 : 0,
    victoryNow: hitsCapped >= goal,
    alreadyDefeated: !!(profile.story && profile.story.bossDefeated),
  };
}

// Verifica se o chefe acabou de ser derrotado nesta semana e, se
// sim, registra a vitória permanentemente (emblema, acessório, cena).
function checkBossVictory(profileId) {
  const profiles = loadProfiles();
  const profile = profiles.find((p) => p.id === profileId);
  if (!profile) return;
  const boss = getBossState(profile);
  if (boss.victoryNow && !profile.story.bossDefeated) {
    profile.story.bossDefeated = true;
    profile.story.victorySeen = false;
    if (!profile.story.badges.includes(STORY_ARC.reward.badge)) {
      profile.story.badges.push(STORY_ARC.reward.badge);
    }
    if (!profile.story.accessories.includes(STORY_ARC.reward.accessory)) {
      profile.story.accessories.push(STORY_ARC.reward.accessory);
    }
    saveProfiles(profiles);
  }
}

// XP simples: cada dia com água/fibras/dieta concluídos dá pontos.
// Recalculado sempre a partir do histórico completo (sem contador manual).
function computeXp(profileId) {
  const data = loadData(profileId);
  let xp = 0;
  Object.values(data).forEach((entry) => {
    if (isAguaDone({ ...defaultEntry(), ...entry })) xp += 10;
    if (entry.fibras) xp += 10;
    if (entry.dieta) xp += 10;
  });
  return xp;
}

function computeLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

// ---------------------------------------------------------------
// Estado de UI
// ---------------------------------------------------------------

let historyWeekOffset = 0; // 0 = semana atual
const openHistoryDays = new Set();

// ---------------------------------------------------------------
// Render: página "Hoje"
// ---------------------------------------------------------------

function renderToday() {
  const profile = getActiveProfile();
  const key = todayKey();
  const entry = getEntry(profile.id, key);

  document.getElementById("todayDateLabel").textContent = formatLongDate(todayDate());

  // água
  const total = waterTotal(entry);
  const pct = Math.min(100, (total / WATER_GOAL) * 100);
  document.getElementById("aguaProgressFill").style.width = `${pct}%`;
  document.getElementById("aguaStatusText").textContent =
    `${total.toLocaleString("pt-BR")} mL de ${WATER_GOAL.toLocaleString("pt-BR")} mL`;
  document.getElementById("card-agua").classList.toggle("done", isAguaDone(entry));
  document.getElementById("aguaUndoBtn").disabled = entry.agua.length === 0;

  // exercício / fibras / dieta
  setToggleUI("fibras", entry.fibras, "Fibras registradas hoje 👍", "Ainda sem registro hoje");
  setToggleUI("dieta", entry.dieta, "Plano alimentar seguido hoje 👍", "Ainda sem registro hoje");

  // resumo do dia
  document.getElementById("summaryNum").textContent = countDoneHabits(entry);

  // resumo da semana (exercício)
  const monday = getMonday(todayDate());
  const exCount = countExerciseInWeek(profile.id, monday);
  document.getElementById("weekExerciseLabel").textContent = `Exercício: ${exCount}/7 dias nesta semana`;

  renderMission(profile, entry);
}

// ---------------------------------------------------------------
// Render: missão / chefe da semana
// ---------------------------------------------------------------

function isPlannedTrainingDay(profile, date) {
  const days = profile.trainDays;
  if (!Array.isArray(days) || days.length === 0) return true; // sem config = todo dia é válido
  return days.includes(date.getDay());
}

function renderMission(profile, entry) {
  const boss = getBossState(profile);
  const card = document.getElementById("card-missao");

  document.getElementById("missionArcTitle").textContent = STORY_ARC.title;
  document.getElementById("bossName").textContent = boss.bossName;
  document.getElementById("bossEmoji").textContent = boss.alreadyDefeated ? "💨" : boss.bossEmoji;

  const fill = document.getElementById("bossHpFill");
  fill.style.width = `${Math.max(0, Math.min(100, boss.pctHp))}%`;
  fill.classList.toggle("defeated", boss.alreadyDefeated);

  const hpText = document.getElementById("bossHpText");
  if (boss.alreadyDefeated) {
    hpText.textContent = "Guardião derrotado nesta semana 🎉";
  } else if (boss.hitsLeft <= 0) {
    hpText.textContent = "Chefe prestes a cair!";
  } else if (boss.hitsLeft === 1) {
    hpText.textContent = "Falta 1 golpe para vencer";
  } else {
    hpText.textContent = `Faltam ${boss.hitsLeft} golpes para vencer`;
  }

  card.classList.toggle("victory", boss.alreadyDefeated);

  const statusEl = document.getElementById("missionStatusText");
  const btn = document.getElementById("btn-treino");
  const today = todayDate();
  const planned = isPlannedTrainingDay(profile, today);

  if (entry.exercicio) {
    statusEl.textContent = "Treino de hoje concluído 💪 Golpe já aplicado no chefe desta semana.";
    btn.textContent = "Treino concluído hoje ✓";
  } else if (!planned) {
    statusEl.textContent = "🌿 Dia de recuperação. Treinar hoje também conta para a meta, se quiser.";
    btn.textContent = "Concluí meu treino";
  } else {
    statusEl.textContent = "Ainda sem treino registrado hoje.";
    btn.textContent = "Concluí meu treino";
  }

  // cenas: intro (uma vez) e vitória (quando ainda não vista)
  if (!profile.story.introSeen) {
    showIntroScene(profile.id);
  } else if (profile.story.bossDefeated && !profile.story.victorySeen) {
    showVictoryScene(profile.id);
  }
}

function setToggleUI(habit, done, doneText, pendingText) {
  const card = document.querySelector(`.toggle-card[data-habit="${habit}"]`);
  card.classList.toggle("done", done);
  document.getElementById(`${habit}StatusText`).textContent = done ? doneText : pendingText;
}

// ---------------------------------------------------------------
// Render: página "Histórico"
// ---------------------------------------------------------------

function currentHistoryMonday() {
  return addDays(getMonday(todayDate()), historyWeekOffset * 7);
}

function renderHistory() {
  const profile = getActiveProfile();
  const monday = currentHistoryMonday();
  const sunday = addDays(monday, 6);

  document.getElementById("weekRangeLabel").textContent = formatWeekRangeLabel(monday, sunday);
  const exCount = countExerciseInWeek(profile.id, monday);
  document.getElementById("historyWeekExerciseLabel").textContent = `Exercício: ${exCount}/7 dias`;

  const list = document.getElementById("historyList");
  list.innerHTML = "";
  const template = document.getElementById("historyDayTemplate");
  const tKey = todayKey();

  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const key = formatDateKey(date);
    const entry = getEntry(profile.id, key);

    const node = template.content.cloneNode(true);
    const card = node.querySelector(".history-day-card");
    card.dataset.datekey = key;

    const dateEl = node.querySelector(".history-day-date");
    dateEl.textContent = formatShortDayLabel(date);
    if (key === tKey) dateEl.classList.add("is-today");

    const iconsEl = node.querySelector(".history-day-icons");
    iconsEl.innerHTML = "";
    [
      ["💧", isAguaDone(entry)],
      ["🏋️", entry.exercicio],
      ["🥦", entry.fibras],
      ["🥗", entry.dieta],
    ].forEach(([icon, on]) => {
      const span = document.createElement("span");
      span.textContent = icon;
      span.className = on ? "on" : "off";
      if (!on) span.style.opacity = "0.3";
      iconsEl.appendChild(span);
    });

    const isOpen = openHistoryDays.has(key);
    const body = node.querySelector(".history-day-body");
    body.classList.toggle("hidden", !isOpen);
    card.classList.toggle("open", isOpen);

    node.querySelector(".history-day-head").addEventListener("click", () => {
      if (openHistoryDays.has(key)) openHistoryDays.delete(key);
      else openHistoryDays.add(key);
      renderHistory();
    });

    wireHistoryDayEditor(node, profile.id, key, entry);

    list.appendChild(node);
  }
}

function wireHistoryDayEditor(node, profileId, dateKey, entry) {
  const fill = node.querySelector(".edit-agua-fill");
  const status = node.querySelector(".edit-agua-status");
  const mark = node.querySelector(".edit-agua-mark");
  const cardAgua = node.querySelector(".edit-agua");
  const undoBtn = node.querySelector(".edit-agua-undo-btn");
  const customRow = node.querySelector(".edit-agua-custom-row");
  const customInput = node.querySelector(".edit-agua-custom-input");
  const customBtn = node.querySelector(".edit-agua-custom-btn");
  const customConfirm = node.querySelector(".edit-agua-custom-confirm");
  const customCancel = node.querySelector(".edit-agua-custom-cancel");

  function refreshWater(e) {
    const total = waterTotal(e);
    const pct = Math.min(100, (total / WATER_GOAL) * 100);
    fill.style.width = `${pct}%`;
    status.textContent = `${total.toLocaleString("pt-BR")} mL de ${WATER_GOAL.toLocaleString("pt-BR")} mL`;
    const done = total >= WATER_GOAL;
    cardAgua.classList.toggle("done", done);
    mark.classList.toggle("done", done);
    undoBtn.disabled = e.agua.length === 0;
  }
  refreshWater(entry);

  node.querySelectorAll("[data-edit-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      addWater(profileId, dateKey, Number(btn.dataset.editAdd));
      refreshWater(getEntry(profileId, dateKey));
      refreshHistoryTopSummary();
    });
  });

  undoBtn.addEventListener("click", () => {
    undoWater(profileId, dateKey);
    refreshWater(getEntry(profileId, dateKey));
    refreshHistoryTopSummary();
  });

  customBtn.addEventListener("click", () => {
    customRow.classList.remove("hidden");
    customInput.focus();
  });
  customCancel.addEventListener("click", () => {
    customRow.classList.add("hidden");
    customInput.value = "";
  });
  customConfirm.addEventListener("click", () => {
    const v = Number(customInput.value);
    if (v > 0) {
      addWater(profileId, dateKey, v);
      refreshWater(getEntry(profileId, dateKey));
      refreshHistoryTopSummary();
    }
    customRow.classList.add("hidden");
    customInput.value = "";
  });

  node.querySelectorAll(".edit-toggle").forEach((btn) => {
    const habit = btn.dataset.habit;
    btn.classList.toggle("done", entry[habit]);
    btn.addEventListener("click", () => {
      toggleHabit(profileId, dateKey, habit);
      const updated = getEntry(profileId, dateKey);
      btn.classList.toggle("done", updated[habit]);
      refreshHistoryTopSummary();
      refreshHistoryDayIcons(dateKey);
    });
  });
}

// Atualiza só o resumo de topo (contagem de exercício na semana) sem redesenhar a lista toda
function refreshHistoryTopSummary() {
  const profile = getActiveProfile();
  const monday = currentHistoryMonday();
  const exCount = countExerciseInWeek(profile.id, monday);
  document.getElementById("historyWeekExerciseLabel").textContent = `Exercício: ${exCount}/7 dias`;
}

function refreshHistoryDayIcons(dateKey) {
  const profile = getActiveProfile();
  const card = document.querySelector(`.history-day-card[data-datekey="${dateKey}"]`);
  if (!card) return;
  const entry = getEntry(profile.id, dateKey);
  const iconsEl = card.querySelector(".history-day-icons");
  iconsEl.innerHTML = "";
  [
    ["💧", isAguaDone(entry)],
    ["🏋️", entry.exercicio],
    ["🥦", entry.fibras],
    ["🥗", entry.dieta],
  ].forEach(([icon, on]) => {
    const span = document.createElement("span");
    span.textContent = icon;
    if (!on) span.style.opacity = "0.3";
    iconsEl.appendChild(span);
  });
}

// ---------------------------------------------------------------
// Modal de história (cenas da arena)
// ---------------------------------------------------------------

let storyOverlayOpen = false;

function renderDialogueLines(lines) {
  const body = document.getElementById("storyDialogueBody");
  body.innerHTML = "";
  lines.forEach((line) => {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${line.speaker}:</strong> ${line.text}`;
    body.appendChild(p);
  });
}

function openStoryOverlay({ lines, reward }) {
  if (storyOverlayOpen) return;
  storyOverlayOpen = true;
  document.getElementById("storyLocation").textContent = STORY_ARC.location;
  renderDialogueLines(lines);
  const rewardBox = document.getElementById("storyRewardBox");
  if (reward) {
    document.getElementById("storyRewardBadge").textContent = reward.badge;
    document.getElementById("storyRewardAccessory").textContent = reward.accessory;
    rewardBox.classList.remove("hidden");
  } else {
    rewardBox.classList.add("hidden");
  }
  document.getElementById("storyOverlay").classList.remove("hidden");
}

function closeStoryOverlay() {
  storyOverlayOpen = false;
  document.getElementById("storyOverlay").classList.add("hidden");
}

function showIntroScene(profileId) {
  if (storyOverlayOpen) return;
  openStoryOverlay({ lines: STORY_ARC.intro });
  document.getElementById("storyContinueBtn").onclick = () => {
    updateProfile(profileId, (p) => { p.story.introSeen = true; });
    closeStoryOverlay();
    renderAll();
  };
}

function showVictoryScene(profileId) {
  if (storyOverlayOpen) return;
  openStoryOverlay({ lines: STORY_ARC.victory, reward: STORY_ARC.reward });
  document.getElementById("storyContinueBtn").onclick = () => {
    updateProfile(profileId, (p) => { p.story.victorySeen = true; });
    closeStoryOverlay();
    renderAll();
  };
}

function showStoryRecap(profile) {
  if (storyOverlayOpen) return;
  const lines = profile.story.bossDefeated ? STORY_ARC.victory : STORY_ARC.intro;
  openStoryOverlay({ lines, reward: profile.story.bossDefeated ? STORY_ARC.reward : null });
  document.getElementById("storyContinueBtn").onclick = () => closeStoryOverlay();
}

// Animação rápida de ataque ao registrar o treino de hoje
function playAttackAnimation() {
  const hero = document.getElementById("heroEmoji");
  const boss = document.getElementById("bossEmoji");
  hero.classList.add("attack");
  boss.classList.add("shake");
  setTimeout(() => {
    hero.classList.remove("attack");
    boss.classList.remove("shake");
  }, 650);
}

// ---------------------------------------------------------------
// Render: página "Perfis"
// ---------------------------------------------------------------

function renderProfiles() {
  const profiles = loadProfiles();
  const activeId = getActiveProfileId();
  const list = document.getElementById("profileList");
  list.innerHTML = "";

  profiles.forEach((p) => {
    const row = document.createElement("div");
    row.className = "profile-item" + (p.id === activeId ? " active" : "");

    const selectBtn = document.createElement("button");
    selectBtn.className = "profile-select-btn";
    selectBtn.textContent = p.id === activeId ? `✓ ${p.name}` : p.name;
    selectBtn.addEventListener("click", () => {
      setActiveProfileId(p.id);
      renderAll();
    });
    row.appendChild(selectBtn);

    if (profiles.length > 1) {
      const delBtn = document.createElement("button");
      delBtn.className = "profile-delete-btn";
      delBtn.textContent = "Excluir";
      delBtn.addEventListener("click", () => {
        if (confirm(`Excluir o perfil "${p.name}" e todo o seu histórico?`)) {
          deleteProfile(p.id);
          renderAll();
        }
      });
      row.appendChild(delBtn);
    }

    list.appendChild(row);
  });

  document.getElementById("profileChip").textContent = getActiveProfile().name;

  renderMissionSettings(getActiveProfile());
}

// ---------------------------------------------------------------
// Render: Missão & avisos (dentro de Perfis)
// ---------------------------------------------------------------

const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"]; // Dom..Sáb, iniciais

function renderMissionSettings(profile) {
  document.getElementById("missionSettingsProfileName").textContent = profile.name;
  document.getElementById("weeklyGoalValue").textContent = profile.weeklyGoal;
  document.getElementById("reminderTimeInput").value = profile.reminderTime;

  const chipsEl = document.getElementById("trainDaysChips");
  chipsEl.innerHTML = "";
  for (let d = 0; d < 7; d++) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "day-chip" + (profile.trainDays.includes(d) ? " selected" : "");
    chip.textContent = DAY_LABELS[d];
    chip.addEventListener("click", () => {
      updateProfile(profile.id, (p) => {
        const idx = p.trainDays.indexOf(d);
        if (idx >= 0) p.trainDays.splice(idx, 1);
        else p.trainDays.push(d);
      });
      renderMissionSettings(getActiveProfile());
      renderToday();
    });
    chipsEl.appendChild(chip);
  }

  const note = document.getElementById("alertsStatusNote");
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    note.textContent = "Este navegador não suporta notificações push.";
  } else if (profile.reminderEnabled) {
    note.textContent = `Avisos de missão: ativados, às ${profile.reminderTime}.`;
  } else {
    note.textContent = "Avisos de missão: desativados.";
  }
}

// ---------------------------------------------------------------
// Render geral
// ---------------------------------------------------------------

function renderAll() {
  renderToday();
  renderHistory();
  renderProfiles();
}

function onDataChanged() {
  renderToday();
  refreshHistoryTopSummary();
  syncStatusIfEnabled(getActiveProfile());
}

// ---------------------------------------------------------------
// Avisos de missão (Web Push)
// ---------------------------------------------------------------

// Preencher após publicar o backend (server/README.md explica como).
const PUSH_BACKEND_URL = ""; // ex: "https://constancia-push.vercel.app"
const VAPID_PUBLIC_KEY = "BGNFrWvgZHYqDCciDP8aWVYxFuW0WL8YBY8Qf78TDbC6HqwKWgLF1jGkzXq2mr2vjpEe4BJ50kcr1IMLYrL1udI";

function getDeviceId() {
  let id = localStorage.getItem(`${STORAGE_PREFIX}:deviceId`);
  if (!id) {
    id = `d_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(`${STORAGE_PREFIX}:deviceId`, id);
  }
  return id;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function postBackend(path, payload) {
  if (!PUSH_BACKEND_URL) return null;
  try {
    const res = await fetch(`${PUSH_BACKEND_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json().catch(() => null);
  } catch {
    return null;
  }
}

async function enableMissionAlerts(profile) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    alert("Este navegador não suporta avisos push.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("Permissão de notificações negada. Ative nas configurações do Safari/iOS para este site.");
    return;
  }

  updateProfile(profile.id, (p) => { p.reminderEnabled = true; });

  if (PUSH_BACKEND_URL && VAPID_PUBLIC_KEY) {
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      await postBackend("/api/subscribe", {
        deviceId: getDeviceId(),
        profileId: profile.id,
        profileName: profile.name,
        subscription: sub,
        trainDays: profile.trainDays,
        reminderTime: profile.reminderTime,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        enabled: true,
      });
    } catch (err) {
      alert("Não foi possível concluir a inscrição de avisos: " + err.message);
    }
  } else {
    alert(
      "Permissão concedida! O backend de envio ainda não foi publicado, então por enquanto só o " +
      "aviso de teste local funciona (com o app aberto)."
    );
  }
  renderMissionSettings(getActiveProfile());
}

async function sendTestAlert(profile) {
  if (PUSH_BACKEND_URL) {
    const result = await postBackend("/api/test-push", { deviceId: getDeviceId(), profileId: profile.id });
    if (result && result.ok) {
      alert("Aviso de teste enviado! Deve chegar em poucos segundos.");
    } else {
      alert("Não foi possível enviar o aviso de teste pelo backend. Veja o console para detalhes.");
    }
    return;
  }
  if ("serviceWorker" in navigator && "Notification" in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("⚔️ Missão de hoje — teste", {
        body: "Este é um aviso de teste local do Constância.",
        icon: "./icon-192.png",
      });
    } catch (err) {
      alert("Não foi possível mostrar a notificação de teste: " + err.message);
    }
  } else {
    alert("Notificações não suportadas neste navegador.");
  }
}

async function pauseMissionAlerts(profile) {
  updateProfile(profile.id, (p) => { p.reminderEnabled = false; });
  await postBackend("/api/subscribe", {
    deviceId: getDeviceId(),
    profileId: profile.id,
    profileName: profile.name,
    subscription: null,
    enabled: false,
  });
  renderMissionSettings(getActiveProfile());
}

// Sincroniza o status do dia com o backend (para ele saber se deve pular o aviso)
function syncStatusIfEnabled(profile) {
  if (!profile.reminderEnabled || !PUSH_BACKEND_URL) return;
  const entry = getEntry(profile.id, todayKey());
  const boss = getBossState(profile);
  postBackend("/api/sync-status", {
    deviceId: getDeviceId(),
    profileId: profile.id,
    dateKey: todayKey(),
    exercicioDoneToday: entry.exercicio,
    boss: { name: boss.bossName, hitsLeft: boss.hitsLeft },
  });
}

// ---------------------------------------------------------------
// Navegação por abas
// ---------------------------------------------------------------

function goToPage(pageName) {
  document.querySelectorAll(".page").forEach((el) => el.classList.remove("active"));
  document.getElementById(`page-${pageName}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === pageName);
  });
  if (pageName === "historico") renderHistory();
  if (pageName === "perfis") renderProfiles();
}

// ---------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------

function init() {
  loadProfiles();
  getActiveProfileId();

  // aberto a partir de um clique numa notificação push? abre o perfil certo
  const urlParams = new URLSearchParams(location.search);
  const profileFromUrl = urlParams.get("profile");
  if (profileFromUrl && loadProfiles().some((p) => p.id === profileFromUrl)) {
    setActiveProfileId(profileFromUrl);
  }

  // navegação inferior
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => goToPage(btn.dataset.page));
  });
  document.getElementById("profileChip").addEventListener("click", () => goToPage("perfis"));

  // água (hoje)
  document.querySelectorAll('#card-agua [data-add]').forEach((btn) => {
    btn.addEventListener("click", () => {
      addWater(getActiveProfile().id, todayKey(), Number(btn.dataset.add));
    });
  });
  document.getElementById("aguaUndoBtn").addEventListener("click", () => {
    undoWater(getActiveProfile().id, todayKey());
  });
  document.getElementById("aguaCustomBtn").addEventListener("click", () => {
    document.getElementById("aguaCustomRow").classList.remove("hidden");
    document.getElementById("aguaCustomInput").focus();
  });
  document.getElementById("aguaCustomCancel").addEventListener("click", () => {
    document.getElementById("aguaCustomRow").classList.add("hidden");
    document.getElementById("aguaCustomInput").value = "";
  });
  document.getElementById("aguaCustomConfirm").addEventListener("click", () => {
    const v = Number(document.getElementById("aguaCustomInput").value);
    if (v > 0) addWater(getActiveProfile().id, todayKey(), v);
    document.getElementById("aguaCustomRow").classList.add("hidden");
    document.getElementById("aguaCustomInput").value = "";
  });

  // exercício / fibras / dieta (hoje)
  document.getElementById("btn-treino").addEventListener("click", () => {
    const profileId = getActiveProfile().id;
    const key = todayKey();
    const before = getEntry(profileId, key).exercicio;
    toggleHabit(profileId, key, "exercicio");
    const after = getEntry(profileId, key).exercicio;
    if (!before && after) playAttackAnimation();
  });
  ["fibras", "dieta"].forEach((habit) => {
    document.getElementById(`btn-${habit}`).addEventListener("click", () => {
      toggleHabit(getActiveProfile().id, todayKey(), habit);
    });
  });

  // história: botão "ver história" e fechar modal
  document.getElementById("missionStoryBtn").addEventListener("click", () => {
    showStoryRecap(getActiveProfile());
  });

  // perfis: meta semanal de treinos
  document.getElementById("goalMinusBtn").addEventListener("click", () => {
    const profile = getActiveProfile();
    updateProfile(profile.id, (p) => { p.weeklyGoal = Math.max(1, (p.weeklyGoal || 3) - 1); });
    renderMissionSettings(getActiveProfile());
    renderToday();
  });
  document.getElementById("goalPlusBtn").addEventListener("click", () => {
    const profile = getActiveProfile();
    updateProfile(profile.id, (p) => { p.weeklyGoal = Math.min(7, (p.weeklyGoal || 3) + 1); });
    renderMissionSettings(getActiveProfile());
    renderToday();
  });
  document.getElementById("reminderTimeInput").addEventListener("change", (ev) => {
    const profile = getActiveProfile();
    updateProfile(profile.id, (p) => { p.reminderTime = ev.target.value || "18:00"; });
    renderMissionSettings(getActiveProfile());
  });

  // avisos de missão
  document.getElementById("enableAlertsBtn").addEventListener("click", () => enableMissionAlerts(getActiveProfile()));
  document.getElementById("testAlertBtn").addEventListener("click", () => sendTestAlert(getActiveProfile()));
  document.getElementById("pauseAlertsBtn").addEventListener("click", () => pauseMissionAlerts(getActiveProfile()));

  // histórico: navegação de semanas
  document.getElementById("weekPrevBtn").addEventListener("click", () => {
    historyWeekOffset -= 1;
    renderHistory();
  });
  document.getElementById("weekNextBtn").addEventListener("click", () => {
    historyWeekOffset += 1;
    renderHistory();
  });

  // perfis: criar novo
  document.getElementById("addProfileBtn").addEventListener("click", () => {
    const input = document.getElementById("newProfileInput");
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    createProfile(name);
    input.value = "";
    renderAll();
  });
  document.getElementById("newProfileInput").addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") document.getElementById("addProfileBtn").click();
  });

  renderAll();

  // detecta virada do dia enquanto o app fica aberto
  let lastKey = todayKey();
  setInterval(() => {
    const k = todayKey();
    if (k !== lastKey) {
      lastKey = k;
      renderAll();
    }
  }, 60 * 1000);

  // PWA: service worker (opcional, cache offline)
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", init);
