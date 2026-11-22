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
// Perfis
// ---------------------------------------------------------------

function uid() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadProfiles() {
  let profiles = [];
  try {
    profiles = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}:profiles`)) || [];
  } catch {
    profiles = [];
  }
  if (!Array.isArray(profiles) || profiles.length === 0) {
    const defaultProfile = { id: uid(), name: "Perfil 1" };
    profiles = [defaultProfile];
    saveProfiles(profiles);
    setActiveProfileId(defaultProfile.id);
  }
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
  const profile = { id: uid(), name: name.trim().slice(0, 24) || "Novo perfil" };
  profiles.push(profile);
  saveProfiles(profiles);
  setActiveProfileId(profile.id);
  return profile;
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
  setToggleUI("exercicio", entry.exercicio, "Exercício feito hoje 💪", "Ainda sem registro — tudo bem, dia de descanso?");
  setToggleUI("fibras", entry.fibras, "Fibras registradas hoje 👍", "Ainda sem registro hoje");
  setToggleUI("dieta", entry.dieta, "Plano alimentar seguido hoje 👍", "Ainda sem registro hoje");

  // resumo do dia
  document.getElementById("summaryNum").textContent = countDoneHabits(entry);

  // resumo da semana (exercício)
  const monday = getMonday(todayDate());
  const exCount = countExerciseInWeek(profile.id, monday);
  document.getElementById("weekExerciseLabel").textContent = `Exercício: ${exCount}/7 dias nesta semana`;
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
  ["exercicio", "fibras", "dieta"].forEach((habit) => {
    document.getElementById(`btn-${habit}`).addEventListener("click", () => {
      toggleHabit(getActiveProfile().id, todayKey(), habit);
    });
  });

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
