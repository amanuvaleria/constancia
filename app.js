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
// História — Saga do Constância (capítulos / arenas)
// ---------------------------------------------------------------

const CHAPTERS = [
  {
    id: "torre-impulso",
    num: 1,
    title: "A Torre do Impulso",
    episodeLabel: "Capítulo 1 · A Torre do Impulso",
    location: "Torre do Impulso, Academia Vargen",
    boss: { name: "Guardião da Inércia", emoji: "🗿" },
    reward: { badge: "Emblema da Primeira Chama", accessoryId: "faixa_eletrica" },
    intro: [
      { speaker: "Treinadora Aya", text: "Bem-vinda à Torre do Impulso. Esta arena guarda o primeiro Guardião da Liga." },
      { speaker: "Treinadora Aya", text: "O Guardião da Inércia é pedra pura — rachaduras verdes correm por ele como veias de energia presa." },
      { speaker: "Treinadora Aya", text: "Cada treino seu é um golpe de verdade. Vença antes que a semana acabe." },
    ],
    victory: [
      { speaker: "Narrador", text: "As rachaduras se abrem de vez. O Guardião da Inércia desmorona em pó verde brilhante." },
      { speaker: "Treinadora Aya", text: "Isso não foi sorte — foi hábito. Leve esse emblema com você." },
    ],
  },
  {
    id: "eco-rotina",
    num: 2,
    title: "O Eco da Rotina",
    episodeLabel: "Capítulo 2 · O Eco da Rotina",
    location: "Arquibancada Vazia, Academia Vargen",
    boss: { name: "Eco Silencioso", emoji: "👥" },
    reward: { badge: "Emblema do Eco", accessoryId: "jaqueta_academia" },
    intro: [
      { speaker: "Narrador", text: "A arquibancada está vazia — mas a cada treino registrado, um eco responde lá do alto." },
      { speaker: "Treinadora Aya", text: "Esse eco é o Guardião desta arena. Ele só desaparece quando sua rotina fica forte o bastante pra calar o silêncio." },
    ],
    victory: [
      { speaker: "Narrador", text: "O eco finalmente responde em uníssono — e você percebe: são todos os aprendizes que vieram antes, torcendo por você." },
      { speaker: "Treinadora Aya", text: "Você nunca treinou sozinha. Essa jaqueta é sua, aprendiz." },
    ],
  },
  {
    id: "desafio-aurora",
    num: 3,
    title: "O Desafio da Aurora",
    episodeLabel: "Capítulo 3 · O Desafio da Aurora",
    location: "Torre do Impulso, ao amanhecer",
    boss: { name: "Guardiã da Aurora", emoji: "🌅" },
    reward: { badge: "Emblema da Aurora", accessoryId: "garrafinha_guardiao" },
    intro: [
      { speaker: "Treinadora Aya", text: "De volta à primeira arena — mas ao amanhecer, ela se mostra diferente: mais rápida, mais exigente." },
      { speaker: "Treinadora Aya", text: "Olhe pra trás: você não é mais quem começou na Torre do Impulso." },
    ],
    victory: [
      { speaker: "Narrador", text: "A luz da Guardiã da Aurora se dissolve no amanhecer real." },
      { speaker: "Treinadora Aya", text: "Essa garrafinha carrega o símbolo do primeiro Guardião. Você fechou o círculo." },
    ],
  },
];

function getChapter(index) {
  return CHAPTERS[Math.min(index, CHAPTERS.length - 1)];
}

function uid() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStoryState() {
  return {
    chapterIndex: 0,
    chapterStartMonday: null, // quando setado, o capítulo só "abre" a partir dessa segunda-feira
    completedChapters: [], // ids de capítulos já vencidos
    introSeenFor: [], // ids de capítulos cuja cena de intro já foi vista
    victoryPendingFor: null, // id do capítulo com cena de vitória ainda não vista
    badges: [],
    accessories: [], // ids de acessórios (ITEM_CATALOG) desbloqueados pela história
  };
}

// ---------------------------------------------------------------
// Personagem: cores, itens desbloqueáveis e estado padrão
// ---------------------------------------------------------------

const SKIN_PRESETS = ["#8d5a3c", "#c68642", "#e0ac69", "#f1c27d", "#ffdbac"];
const HAIR_PRESETS = ["#1b1b1b", "#3b2412", "#6b3f1d", "#a65e2e", "#d9a441", "#e8e8e8"];
const OUTFIT_PRESETS = ["#16a34a", "#2563eb", "#db2777", "#f59e0b", "#7c3aed", "#334155"];

// Catálogo de itens equipáveis — alguns desbloqueiam por nível, outros por
// vencer um capítulo da Saga (igual a um jogo de RPG com guarda-roupa).
const ITEM_CATALOG = [
  { id: "tenis_branco", type: "shoe", name: "Tênis branco", emoji: "👟", color: "#f3f6f4",
    unlockType: "level", unlockLevel: 1, unlockLabel: "Disponível desde o início" },
  { id: "tenis_verde", type: "shoe", name: "Tênis verde", emoji: "🟢", color: "#22c55e",
    unlockType: "level", unlockLevel: 2, unlockLabel: "Alcance o nível 2" },
  { id: "faixa_eletrica", type: "headband", name: "Faixa Elétrica", emoji: "⚡",
    unlockType: "chapter", unlockChapter: "torre-impulso", unlockLabel: "Vença o Guardião da Inércia" },
  { id: "jaqueta_academia", type: "jacket", name: "Jaqueta da Academia", emoji: "🧥",
    unlockType: "chapter", unlockChapter: "eco-rotina", unlockLabel: "Vença o Eco Silencioso" },
  { id: "fones_verdes", type: "headphones", name: "Fones Verdes", emoji: "🎧",
    unlockType: "level", unlockLevel: 5, unlockLabel: "Alcance o nível 5" },
  { id: "garrafinha_guardiao", type: "bottle", name: "Garrafinha do Guardião", emoji: "🍶",
    unlockType: "chapter", unlockChapter: "desafio-aurora", unlockLabel: "Vença a Guardiã da Aurora" },
];

function isItemUnlocked(item, profile, level) {
  if (item.unlockType === "level") return level >= item.unlockLevel;
  if (item.unlockType === "chapter") return (profile.story.completedChapters || []).includes(item.unlockChapter);
  return false;
}

function defaultCharacter(profileName) {
  return {
    name: profileName || "Avatar",
    skin: SKIN_PRESETS[2],
    hair: HAIR_PRESETS[0],
    outfit: OUTFIT_PRESETS[0],
    photo: null, // quando definido (ex.: "preset-01.jpg"), usa foto em vez do avatar vetorial
    equipped: { shoe: "tenis_branco", headphones: false, jacket: false, bottle: false, headband: false },
  };
}

// Personagens prontos pra escolher rápido (estilo "roster" de anime esportivo).
// Os 3 primeiros são ilustrações vetoriais originais (cores diferentes);
// os demais usam fotos de referência enviadas pelo usuário.
const PRESET_CHARACTERS = [
  { id: "kiro", name: "Kiro", type: "svg", skin: SKIN_PRESETS[2], hair: "#1b1b1b", outfit: "#f59e0b" },
  { id: "sora", name: "Sora", type: "svg", skin: SKIN_PRESETS[4], hair: "#e8e8e8", outfit: "#334155" },
  { id: "nane", name: "Nane", type: "svg", skin: SKIN_PRESETS[1], hair: "#7a1f1f", outfit: "#db2777" },
  { id: "yara", name: "Yara", type: "photo", photo: "preset-01.jpg" },
  { id: "rin", name: "Rin", type: "photo", photo: "preset-03.jpg" },
  { id: "kael", name: "Kael", type: "photo", photo: "preset-02.jpg" },
];

// Preenche campos novos em perfis antigos sem apagar o que já existe
function ensureProfileDefaults(profile) {
  if (profile.weeklyGoal == null) profile.weeklyGoal = 3;
  if (!Array.isArray(profile.trainDays)) profile.trainDays = [1, 2, 3, 4, 5]; // seg-sex
  if (!profile.reminderTime) profile.reminderTime = "18:00";
  if (profile.reminderEnabled == null) profile.reminderEnabled = false;
  if (!profile.story || typeof profile.story.chapterIndex !== "number") {
    const old = profile.story || {};
    profile.story = { ...defaultStoryState(), badges: old.badges || [], accessories: old.accessories || [] };
  }
  if (!profile.character) profile.character = defaultCharacter(profile.name);
  if (!profile.character.equipped) profile.character.equipped = { shoe: "tenis_branco", headphones: false, jacket: false, bottle: false, headband: false };
  if (profile.character.equipped.headband === undefined) profile.character.equipped.headband = false;
  if (profile.character.lastSeenLevel == null) profile.character.lastSeenLevel = 1;
  if (profile.character.photo === undefined) profile.character.photo = null;
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

// Verifica se o XP cruzou um novo nível desde a última vez que o app
// mostrou isso, e dispara o toast de celebração com o item desbloqueado.
function checkLevelUp(profileId) {
  const profiles = loadProfiles();
  const profile = profiles.find((p) => p.id === profileId);
  if (!profile) return;
  const xp = computeXp(profileId);
  const newLevel = computeLevel(xp);
  if (newLevel > profile.character.lastSeenLevel) {
    const unlocked = ITEM_CATALOG.find((it) => it.unlockType === "level" && it.unlockLevel === newLevel) || null;
    profile.character.lastSeenLevel = newLevel;
    saveProfiles(profiles);
    showLevelUpToast(newLevel, unlocked);
  } else if (newLevel < profile.character.lastSeenLevel) {
    // corrigir um registro pode reduzir o XP; não perde o nível já visto
    // (preserva o progresso conquistado), só sincroniza o contador interno
    // se o XP real ficou bem abaixo do nível salvo.
    profile.character.lastSeenLevel = Math.max(newLevel, 1);
    saveProfiles(profiles);
  }
}

function mutateEntry(profileId, dateKey, mutator) {
  const data = loadData(profileId);
  const entry = data[dateKey] ? { ...defaultEntry(), ...data[dateKey] } : defaultEntry();
  mutator(entry);
  data[dateKey] = entry;
  saveData(profileId, data);
  checkBossVictory(profileId);
  checkLevelUp(profileId);
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
  const today = todayDate();
  const monday = getMonday(today);
  const goal = profile.weeklyGoal || 3;
  const chapter = getChapter(profile.story.chapterIndex);
  const isLastChapter = profile.story.chapterIndex >= CHAPTERS.length - 1 && profile.story.completedChapters.includes(chapter.id);

  // aguardando a próxima semana pra começar o próximo capítulo?
  const waiting = profile.story.chapterStartMonday && formatDateKey(monday) < profile.story.chapterStartMonday;

  const hits = waiting ? 0 : countExerciseInWeek(profile.id, monday);
  const hitsCapped = Math.min(hits, goal);
  const hp = Math.max(0, goal - hitsCapped);

  return {
    chapter,
    bossName: chapter.boss.name,
    bossEmoji: chapter.boss.emoji,
    goal,
    hits: hitsCapped,
    hitsLeft: hp,
    pctHp: goal > 0 ? (hp / goal) * 100 : 0,
    victoryNow: !waiting && hitsCapped >= goal,
    waiting,
    sagaComplete: isLastChapter,
  };
}

// Verifica se o chefe acabou de ser derrotado nesta semana e, se sim,
// registra a vitória do capítulo (emblema, acessório, cena) e agenda o
// próximo capítulo pra começar só na semana seguinte.
function checkBossVictory(profileId) {
  const profiles = loadProfiles();
  const profile = profiles.find((p) => p.id === profileId);
  if (!profile) return;
  const boss = getBossState(profile);
  const chapterId = boss.chapter.id;
  if (boss.victoryNow && !profile.story.completedChapters.includes(chapterId)) {
    profile.story.completedChapters.push(chapterId);
    profile.story.victoryPendingFor = chapterId;
    if (!profile.story.badges.includes(boss.chapter.reward.badge)) {
      profile.story.badges.push(boss.chapter.reward.badge);
    }
    if (!profile.story.accessories.includes(boss.chapter.reward.accessoryId)) {
      profile.story.accessories.push(boss.chapter.reward.accessoryId);
    }
    // próximo capítulo só comeca na semana que vem
    const monday = getMonday(todayDate());
    profile.story.chapterStartMonday = formatDateKey(addDays(monday, 7));
    if (profile.story.chapterIndex < CHAPTERS.length - 1) {
      profile.story.chapterIndex += 1;
    }
    saveProfiles(profiles);
  }
}

// XP: cada hábito concluído no dia vale 25 XP (água só ao bater 3L).
// Sempre recalculado a partir do histórico completo — nunca um contador
// manual — então marcar/desmarcar/marcar de novo dá sempre o mesmo total,
// e corrigir um dia passado ajusta o XP na hora.
function computeXp(profileId) {
  const data = loadData(profileId);
  let xp = 0;
  Object.values(data).forEach((raw) => {
    const entry = { ...defaultEntry(), ...raw };
    if (isAguaDone(entry)) xp += 25;
    if (entry.exercicio) xp += 25;
    if (entry.fibras) xp += 25;
    if (entry.dieta) xp += 25;
  });
  return xp;
}

function computeLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

function xpIntoLevel(xp) {
  return xp % 100;
}

function nextUnlockForLevel(level) {
  return ITEM_CATALOG.filter((it) => it.unlockType === "level").find((it) => it.unlockLevel > level) || null;
}

// ---------------------------------------------------------------
// Avatar SVG (ilustração original em vetor, recolorível por CSS vars)
// ---------------------------------------------------------------

function characterSvgMarkup(character) {
  const eq = character.equipped || {};
  const shoeItem = ITEM_CATALOG.find((i) => i.id === eq.shoe);
  const shoeColor = shoeItem ? shoeItem.color : "#f3f6f4";
  const classes = [
    "char-svg",
    eq.headphones ? "eq-headphones" : "",
    eq.jacket ? "eq-jacket" : "",
    eq.bottle ? "eq-bottle" : "",
    eq.headband ? "eq-headband" : "",
  ].filter(Boolean).join(" ");

  return `
<svg class="${classes}" viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg"
     style="--char-skin:${character.skin};--char-hair:${character.hair};--char-outfit:${character.outfit};--char-shoe:${shoeColor}">
  <ellipse cx="80" cy="188" rx="36" ry="7" fill="#000" opacity="0.3"/>
  <g class="char-rig">
    <!-- pernas / tenis -->
    <rect x="58" y="138" width="18" height="38" rx="8" class="char-skin" opacity="0.92"/>
    <rect x="84" y="138" width="18" height="38" rx="8" class="char-skin" opacity="0.92"/>
    <ellipse cx="66" cy="178" rx="13" ry="7" class="char-shoe"/>
    <ellipse cx="94" cy="178" rx="13" ry="7" class="char-shoe"/>

    <!-- braco esquerdo -->
    <rect class="char-skin char-arm-left" x="34" y="92" width="18" height="46" rx="9"/>
    <!-- tronco / roupa -->
    <rect x="48" y="84" width="64" height="58" rx="20" class="char-outfit"/>
    <rect x="48" y="84" width="64" height="58" rx="20" class="char-jacket char-jacket-layer"/>
    <!-- braco direito -->
    <rect class="char-skin char-arm-right" x="108" y="92" width="18" height="46" rx="9"/>

    <!-- garrafinha na mao direita -->
    <g class="char-bottle">
      <rect x="112" y="70" width="12" height="26" rx="4" fill="#38bdf8"/>
      <rect x="115" y="64" width="6" height="8" rx="2" fill="#0ea5e9"/>
    </g>

    <!-- cabeca -->
    <circle cx="80" cy="54" r="30" class="char-skin"/>
    <!-- cabelo (rabo de cavalo + franja) -->
    <path d="M50 44 Q48 10 80 12 Q112 10 110 44 Q110 20 80 24 Q50 20 50 44Z" class="char-hair"/>
    <path d="M46 40 Q30 60 40 92 Q50 70 54 46Z" class="char-hair"/>
    <!-- fones -->
    <g class="char-headphones">
      <path d="M50 46 Q80 16 110 46" fill="none" stroke="#1f2937" stroke-width="6"/>
      <rect x="42" y="42" width="12" height="18" rx="5" fill="#1f2937"/>
      <rect x="106" y="42" width="12" height="18" rx="5" fill="#1f2937"/>
    </g>
    <!-- faixa elétrica -->
    <g class="char-headband-layer">
      <path d="M48 40 Q80 22 112 40" fill="none" stroke="#b6ff3b" stroke-width="7" stroke-linecap="round"/>
    </g>
    <!-- rosto -->
    <circle cx="70" cy="54" r="3" fill="#1b1b1b"/>
    <circle cx="90" cy="54" r="3" fill="#1b1b1b"/>
    <path d="M70 64 Q80 70 90 64" fill="none" stroke="#1b1b1b" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>`.trim();
}

function renderCharacterInto(containerId, character, extraClasses) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (character.photo) {
    el.innerHTML = `<div class="char-photo-wrap"><img src="./avatars/${character.photo}" class="char-photo" alt="${character.name}"></div>`;
    if (extraClasses) el.querySelector(".char-photo-wrap").classList.add(...extraClasses.split(" "));
    return;
  }
  el.innerHTML = characterSvgMarkup(character);
  if (extraClasses) {
    const svg = el.querySelector("svg");
    svg.classList.add(...extraClasses.split(" "));
  }
}

// Dispara uma pose curta no(s) avatar(es) visíveis (some sozinha; respeita
// a preferência do sistema por movimento reduzido, pois a animação CSS
// só existe dentro de @media (prefers-reduced-motion: no-preference)).
function playCharacterPose(pose) {
  document.querySelectorAll(".char-svg, .char-photo-wrap").forEach((el) => {
    el.classList.add(pose);
    setTimeout(() => el.classList.remove(pose), 750);
  });
}

function showLevelUpToast(level, unlockedItem) {
  const toast = document.getElementById("levelToast");
  toast.textContent = unlockedItem
    ? `🎉 Nível ${level}! ${unlockedItem.emoji} ${unlockedItem.name} desbloqueado`
    : `🎉 Nível ${level} alcançado!`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function applyCharacterPreset(profileId, preset) {
  updateProfile(profileId, (p) => {
    if (preset.type === "photo") {
      p.character.photo = preset.photo;
    } else {
      p.character.photo = null;
      p.character.skin = preset.skin;
      p.character.hair = preset.hair;
      p.character.outfit = preset.outfit;
    }
  });
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

  renderCharacterMini(profile);

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

  document.getElementById("missionArcTitle").textContent = boss.chapter.episodeLabel;
  document.getElementById("bossName").textContent = boss.waiting ? "Capítulo concluído" : boss.bossName;
  document.getElementById("bossEmoji").textContent = boss.waiting ? "✅" : boss.bossEmoji;
  // A atleta que ataca é sempre o avatar escolhido para este perfil.
  renderCharacterInto("heroEmoji", profile.character);

  const fill = document.getElementById("bossHpFill");
  fill.style.width = `${boss.waiting ? 100 : Math.max(0, Math.min(100, boss.pctHp))}%`;
  fill.classList.toggle("defeated", boss.waiting);

  const progressEl = document.getElementById("bossProgressText");
  if (boss.waiting) {
    progressEl.textContent = "Próximo capítulo começa na semana que vem 🎉";
  } else if (boss.sagaComplete) {
    progressEl.textContent = `${boss.hits} de ${boss.goal} treinos · Saga concluída! 🏆`;
  } else if (boss.hitsLeft <= 0) {
    progressEl.textContent = `${boss.hits} de ${boss.goal} treinos · Chefe prestes a cair!`;
  } else if (boss.hitsLeft === 1) {
    progressEl.textContent = `${boss.hits} de ${boss.goal} treinos · Falta 1 golpe`;
  } else {
    progressEl.textContent = `${boss.hits} de ${boss.goal} treinos · Faltam ${boss.hitsLeft} golpes`;
  }

  card.classList.toggle("victory", boss.waiting);

  // círculos de progresso (um por treino da meta semanal)
  const circlesEl = document.getElementById("hitCircles");
  circlesEl.innerHTML = "";
  for (let i = 0; i < boss.goal; i++) {
    const c = document.createElement("span");
    c.className = "hit-circle" + (i < boss.hits ? " filled" : "");
    c.textContent = "✓";
    circlesEl.appendChild(c);
  }

  const statusEl = document.getElementById("missionStatusText");
  const btn = document.getElementById("btn-treino");
  const today = todayDate();
  const planned = isPlannedTrainingDay(profile, today);

  if (entry.exercicio) {
    statusEl.textContent = "Treino de hoje concluído 💪 Golpe já aplicado no chefe desta semana.";
    btn.innerHTML = "<span>✅</span> Treino concluído hoje";
  } else if (!planned) {
    statusEl.textContent = "😌 Dia de recuperação. Treinar hoje também conta para a meta, se quiser.";
    btn.innerHTML = "<span>🎧</span> Concluí meu treino";
  } else {
    statusEl.textContent = "Ainda sem treino registrado hoje.";
    btn.innerHTML = "<span>🎧</span> Concluí meu treino";
  }

  // cenas: vitória pendente tem prioridade sobre a intro do próximo capítulo
  if (profile.story.victoryPendingFor) {
    const doneChapter = CHAPTERS.find((c) => c.id === profile.story.victoryPendingFor);
    if (doneChapter) showVictoryScene(profile.id, doneChapter);
  } else if (!profile.story.introSeenFor.includes(boss.chapter.id)) {
    showIntroScene(profile.id, boss.chapter);
  }
}

function setToggleUI(habit, done, doneText, pendingText) {
  const card = document.querySelector(`.toggle-card[data-habit="${habit}"]`);
  card.classList.toggle("done", done);
  document.getElementById(`${habit}StatusText`).textContent = done ? doneText : pendingText;
  const chip = document.getElementById(`${habit}Chip`);
  if (chip) chip.textContent = done ? "✓ Hoje" : "Pendente";
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

function openStoryOverlay({ lines, reward, location }) {
  if (storyOverlayOpen) return;
  storyOverlayOpen = true;
  document.getElementById("storyLocation").textContent = location || "";
  renderDialogueLines(lines);
  const rewardBox = document.getElementById("storyRewardBox");
  if (reward) {
    document.getElementById("storyRewardBadge").textContent = reward.badge;
    const accessory = ITEM_CATALOG.find((i) => i.id === reward.accessoryId);
    document.getElementById("storyRewardAccessory").textContent = accessory ? `${accessory.emoji} ${accessory.name}` : "—";
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

function showIntroScene(profileId, chapter) {
  if (storyOverlayOpen) return;
  openStoryOverlay({ lines: chapter.intro, location: chapter.location });
  document.getElementById("storyContinueBtn").onclick = () => {
    updateProfile(profileId, (p) => { p.story.introSeenFor.push(chapter.id); });
    closeStoryOverlay();
    renderAll();
  };
}

function showVictoryScene(profileId, chapter) {
  if (storyOverlayOpen) return;
  openStoryOverlay({ lines: chapter.victory, reward: chapter.reward, location: chapter.location });
  document.getElementById("storyContinueBtn").onclick = () => {
    updateProfile(profileId, (p) => { p.story.victoryPendingFor = null; });
    closeStoryOverlay();
    renderAll();
  };
}

// Reexibe uma cena já desbloqueada (usado na aba Saga, não altera estado)
function replayScene(chapter, which) {
  if (storyOverlayOpen) return;
  const lines = which === "victory" ? chapter.victory : chapter.intro;
  openStoryOverlay({ lines, reward: which === "victory" ? chapter.reward : null, location: chapter.location });
  document.getElementById("storyContinueBtn").onclick = () => closeStoryOverlay();
}

// Sequência curta estilo mangá ao registrar o treino: personagem avança,
// aparece um traço de impacto, a vida do chefe diminui (CSS cuida disso
// via renderMission) e surge "Treino registrado · N golpe(s)".
function playHitSequence(hitsNow) {
  const hero = document.getElementById("heroEmoji");
  const boss = document.getElementById("bossEmoji");
  const slash = document.getElementById("impactSlash");
  hero.classList.add("attack");
  boss.classList.add("shake");
  slash.classList.add("hit");
  setTimeout(() => {
    hero.classList.remove("attack");
    boss.classList.remove("shake");
    slash.classList.remove("hit");
  }, 650);

  const toast = document.getElementById("hitToast");
  toast.textContent = `Treino registrado · ${hitsNow} golpe${hitsNow === 1 ? "" : "s"}`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// ---------------------------------------------------------------
// Render: Personagem
// ---------------------------------------------------------------

function renderCharacterMini(profile) {
  renderCharacterInto("characterMiniAvatar", profile.character);
  document.getElementById("characterMiniName").textContent = profile.character.name;
  const xp = computeXp(profile.id);
  const level = computeLevel(xp);
  const into = xpIntoLevel(xp);
  document.getElementById("characterMiniLevel").textContent = `Nível ${level}`;
  document.getElementById("characterMiniXpFill").style.width = `${into}%`;
  const xpPill = document.getElementById("xpPillText");
  if (xpPill) xpPill.textContent = `${into} / 100`;
}

function renderCharacterPage() {
  const profile = getActiveProfile();
  const character = profile.character;

  renderCharacterInto("characterBigAvatar", character);
  document.getElementById("characterNameInput").value = character.name;

  const xp = computeXp(profile.id);
  const level = computeLevel(xp);
  const into = xpIntoLevel(xp);
  document.getElementById("characterBigLevel").textContent = `Nível ${level}`;
  document.getElementById("characterBigXpFill").style.width = `${into}%`;
  document.getElementById("characterBigXpText").textContent = `${into}/100 XP`;

  const next = nextUnlockForLevel(level);
  document.getElementById("characterNextUnlockText").textContent = next
    ? `Faltam ${100 - into} XP para o nível ${level + 1} — desbloqueia ${next.emoji} ${next.name}`
    : "Todos os itens do guarda-roupa já foram desbloqueados!";

  renderPresetRow(profile, character);

  const customizeCard = document.getElementById("customizeCard");
  customizeCard.classList.toggle("hidden", !!character.photo);
  if (!character.photo) {
    renderSwatchRow("skinSwatches", SKIN_PRESETS, character.skin, (color) => {
      updateProfile(profile.id, (p) => { p.character.skin = color; });
      renderCharacterPage();
      renderCharacterMini(getActiveProfile());
    });
    renderSwatchRow("hairSwatches", HAIR_PRESETS, character.hair, (color) => {
      updateProfile(profile.id, (p) => { p.character.hair = color; });
      renderCharacterPage();
      renderCharacterMini(getActiveProfile());
    });
    renderSwatchRow("outfitSwatches", OUTFIT_PRESETS, character.outfit, (color) => {
      updateProfile(profile.id, (p) => { p.character.outfit = color; });
      renderCharacterPage();
      renderCharacterMini(getActiveProfile());
    });
  }

  renderItemGrid(profile, level);
}

function renderPresetRow(profile, character) {
  const row = document.getElementById("presetRow");
  row.innerHTML = "";
  PRESET_CHARACTERS.forEach((preset) => {
    const isActive = preset.type === "photo"
      ? character.photo === preset.photo
      : (!character.photo && character.skin === preset.skin && character.hair === preset.hair && character.outfit === preset.outfit);

    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "preset-tile" + (isActive ? " selected" : "");
    const thumb = document.createElement("div");
    thumb.className = "preset-thumb";
    if (preset.type === "photo") {
      thumb.innerHTML = `<img src="./avatars/${preset.photo}" alt="${preset.name}">`;
    } else {
      thumb.innerHTML = characterSvgMarkup({ skin: preset.skin, hair: preset.hair, outfit: preset.outfit, equipped: {} });
    }
    tile.appendChild(thumb);
    const label = document.createElement("span");
    label.textContent = preset.name;
    tile.appendChild(label);
    tile.addEventListener("click", () => {
      applyCharacterPreset(profile.id, preset);
      renderCharacterPage();
      renderCharacterMini(getActiveProfile());
      renderMission(getActiveProfile(), getEntry(getActiveProfile().id, todayKey()));
    });
    row.appendChild(tile);
  });
}

function renderSwatchRow(containerId, colors, selected, onPick) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  colors.forEach((color) => {
    const sw = document.createElement("button");
    sw.type = "button";
    sw.className = "swatch" + (color === selected ? " selected" : "");
    sw.style.background = color;
    sw.addEventListener("click", () => onPick(color));
    el.appendChild(sw);
  });
}

function renderItemGrid(profile, level) {
  const grid = document.getElementById("itemGrid");
  grid.innerHTML = "";
  ITEM_CATALOG.forEach((item) => {
    const locked = !isItemUnlocked(item, profile, level);
    const equippedBool = item.type === "shoe"
      ? profile.character.equipped.shoe === item.id
      : !!profile.character.equipped[item.type] && getEquippedIdForType(profile, item.type) === item.id;

    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "item-tile" + (locked ? " locked" : "") + (equippedBool ? " equipped" : "");
    tile.innerHTML = `
      <span class="item-emoji">${item.emoji}</span>
      <span class="item-name">${item.name}</span>
      <span class="item-level">${locked ? item.unlockLabel : (equippedBool ? "Equipado" : "Toque para equipar")}</span>
    `;
    if (!locked) {
      tile.addEventListener("click", () => toggleEquip(profile.id, item));
    }
    grid.appendChild(tile);
  });
}

// Para itens boolean (fones/jaqueta/garrafinha) guardamos um id "fixo";
// como só existe 1 opção de cada tipo por enquanto, equipped[type]=true
// já identifica esse item. Isso resolve o id pra comparação no grid.
function getEquippedIdForType(profile, type) {
  if (!profile.character.equipped[type]) return null;
  const item = ITEM_CATALOG.find((i) => i.type === type);
  return item ? item.id : null;
}

function toggleEquip(profileId, item) {
  updateProfile(profileId, (p) => {
    if (item.type === "shoe") {
      p.character.equipped.shoe = item.id;
    } else {
      p.character.equipped[item.type] = !p.character.equipped[item.type];
    }
  });
  renderCharacterPage();
  renderCharacterMini(getActiveProfile());
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
      await reg.showNotification("⚡ A arena abriu — teste", {
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
  document.body.classList.toggle("character-page-active", pageName === "personagem");
  document.body.dataset.page = pageName;
  if (pageName === "historico") renderHistory();
  if (pageName === "perfis") renderProfiles();
  if (pageName === "personagem") renderCharacterPage();
  if (pageName === "saga") renderSagaPage();
}

// ---------------------------------------------------------------
// Render: Saga (capas de capítulos em estilo mangá)
// ---------------------------------------------------------------

function renderSagaPage() {
  const profile = getActiveProfile();
  const boss = getBossState(profile);
  const list = document.getElementById("sagaList");
  list.innerHTML = "";

  CHAPTERS.forEach((chapter, idx) => {
    const done = profile.story.completedChapters.includes(chapter.id);
    const isCurrent = idx === profile.story.chapterIndex && !done;
    const locked = idx > profile.story.chapterIndex;

    const card = document.createElement("article");
    card.className = "saga-chapter" + (done ? " done" : "") + (isCurrent ? " current" : "") + (locked ? " locked" : "");

    const progressPct = locked ? 0 : done ? 100 : Math.max(0, Math.min(100, (boss.hits / boss.goal) * 100));
    let statusText;
    if (done) statusText = "Capítulo concluído — reveja as cenas abaixo.";
    else if (locked) statusText = "Vença o capítulo anterior para desbloquear.";
    else if (boss.waiting) statusText = "Aguardando a semana que vem para começar.";
    else statusText = `${boss.hits} de ${boss.goal} treinos · ${boss.hitsLeft <= 0 ? "pronto pra vencer!" : `faltam ${boss.hitsLeft} golpe${boss.hitsLeft === 1 ? "" : "s"}`}`;

    card.innerHTML = `
      <div class="saga-cover">
        <span class="saga-chapter-num">Capítulo ${chapter.num}</span>
        <h3 class="saga-chapter-title">${chapter.title}</h3>
        <p class="saga-chapter-location">${chapter.location}</p>
        <span class="saga-chapter-emoji">${chapter.boss.emoji}</span>
      </div>
      <div class="saga-chapter-body">
        <div class="saga-progress-bar"><div class="saga-progress-fill" style="width:${progressPct}%"></div></div>
        <p class="saga-status-text">${statusText}</p>
        <div class="saga-chapter-actions"></div>
      </div>
    `;

    const actions = card.querySelector(".saga-chapter-actions");
    if (!locked) {
      const introBtn = document.createElement("button");
      introBtn.className = "btn btn-outline";
      introBtn.textContent = "Rever abertura";
      introBtn.addEventListener("click", () => replayScene(chapter, "intro"));
      actions.appendChild(introBtn);
    }
    if (done) {
      const victoryBtn = document.createElement("button");
      victoryBtn.className = "btn btn-outline";
      victoryBtn.textContent = "Rever vitória";
      victoryBtn.addEventListener("click", () => replayScene(chapter, "victory"));
      actions.appendChild(victoryBtn);
    }

    list.appendChild(card);
  });
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
  // calendário (Hoje) abre o Histórico; botão "voltar" no Histórico volta pra Hoje
  document.getElementById("calendarBtn").addEventListener("click", () => goToPage("historico"));
  document.getElementById("historyBackBtn").addEventListener("click", () => goToPage("hoje"));

  // água (hoje)
  document.querySelectorAll('#card-agua [data-add]').forEach((btn) => {
    btn.addEventListener("click", () => {
      addWater(getActiveProfile().id, todayKey(), Number(btn.dataset.add));
      playCharacterPose("pose-water");
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
    if (v > 0) {
      addWater(getActiveProfile().id, todayKey(), v);
      playCharacterPose("pose-water");
    }
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
    if (!before && after) {
      const boss = getBossState(getActiveProfile());
      playHitSequence(boss.hits);
      playCharacterPose("pose-victory");
    }
  });
  ["fibras", "dieta"].forEach((habit) => {
    document.getElementById(`btn-${habit}`).addEventListener("click", () => {
      const profileId = getActiveProfile().id;
      const key = todayKey();
      const before = getEntry(profileId, key)[habit];
      toggleHabit(profileId, key, habit);
      const after = getEntry(profileId, key)[habit];
      if (!before && after) playCharacterPose("pose-celebrate");
    });
  });

  // personagem: nome
  document.getElementById("characterNameInput").addEventListener("change", (ev) => {
    const profile = getActiveProfile();
    const name = ev.target.value.trim() || "Avatar";
    updateProfile(profile.id, (p) => { p.character.name = name; });
    renderCharacterMini(getActiveProfile());
  });

  // história: botão "Saga" abre a aba de capítulos
  document.getElementById("missionStoryBtn").addEventListener("click", () => {
    goToPage("saga");
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
