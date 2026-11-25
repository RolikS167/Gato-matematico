"use strict";


const MAX_ENTRIES = 100;
const RACE_TIME = 15500;     // czas wyścigu w ms (15 s)
const TRACK_LENGTH = 5000;   // długość trasy w px (krótsza, bo wyścig jest szybszy)
const START_X = 160;         // minimalna pozycja linii startu w świecie (przy dużej liczbie kotków przesuwa się w prawo)
const COLORS = ["#e58a2e", "#8a8f98", "#2a2a2e", "#f5f1e8", "#6d737d", "#c26a1c", "#d9a05b", "#c8b8a0"];


const TEXTS = {
  pl: {
    hint: "Dodaj od 2 Do 100 kotków", placeholder: "",
    add: "Dodać Kotków", clear: "Wyczyść listę", confirmClear: "Wyczyścić całą listę?",
    start: "Losujemy kto przyjdzie ", again: "Może jeszcze raz", removeWinner: "Wywalić tego gościa",
    close: "Zamknij", winner: "I do tablicy przyjdzie...", entries: "Wpisy", leader: "Prowadzi",
    results: "Wyniki", resultsWait: "Wyniki pojawią się po wyścigu",
    minError: "Dodaj co najmniej 2 kotka", dupes: "Na liście są duplikaty.",
    desc: "Wylosuj zwycięzcę: kotki ścigają się po ogrodzie.",
  },
  es: {
    hint: "Añade de 2 a 100 nombres", placeholder: "¡Adelante, Sra. Kasia!",
    add: "añadir un gatito", clear: "Borrar lista", confirmClear: "¿Borrar toda la lista?",
    start: "Empezar la carrera", again: "Correr otra vez", removeWinner: "Quitar al ganador de la lista",
    close: "Cerrar", winner: "y vendrá a la pizarra...", entries: "Participantes", leader: "Líder",
    results: "Resultados", resultsWait: "Los resultados aparecerán al terminar la carrera",
    minError: "añade al menos dos gatitos", dupes: "Hay nombres duplicados.",
    desc: "Sortea un ganador: los gatitos corren por el jardín.",
  },
};


const state = { names: [], lang: "pl", racing: false };
const $ = (selector) => document.querySelector(selector);
const text = (key) => TEXTS[state.lang][key];
const random = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function store(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { }
}
function load(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}


function secureInt(n) {
  const limit = Math.floor(2 ** 32 / n) * n;
  const buffer = new Uint32Array(1);
  do { crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
  return buffer[0] % n;
}


const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`;
const toUrl = (markup) => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;


function blades(w, h, count, palette, minLen, maxLen) {
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = random(0, w), len = random(minLen, maxLen), lean = random(-10, 10);
    for (const shift of [-w, 0, w]) {
      const bx = x + shift;
      out += `<path d="M${bx} ${h}Q${bx + lean / 2} ${h - len / 2} ${bx + lean} ${h - len}` +
             `Q${bx + lean / 2 + 4} ${h - len / 2} ${bx + 5} ${h}Z" fill="${palette[i % palette.length]}"/>`;
    }
  }
  return out;
}

function flowers(w, h, count) {
  const petals = ["#ffffff", "#ffd23f", "#ff7aa8", "#c9a7ff"];
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = random(12, w - 12), y = random(h * 0.35, h - 12);
    out += `<circle cx="${x}" cy="${y}" r="3.2" fill="${petals[i % 4]}"/><circle cx="${x}" cy="${y}" r="1.2" fill="#f2a900"/>`;
  }
  return out;
}

const SCENERY = {
  clouds() {
    const spots = [[90, 70], [300, 45], [520, 85], [640, 40]];
    return svg(700, 140, spots.map(([x, y]) =>
      `<g fill="#fff" opacity=".9"><ellipse cx="${x}" cy="${y}" rx="48" ry="15"/>` +
      `<ellipse cx="${x - 14}" cy="${y - 10}" rx="26" ry="17"/><ellipse cx="${x + 18}" cy="${y - 7}" rx="22" ry="14"/></g>`
    ).join(""));
  },
  hills() {
    return svg(1000, 140,
      `<path d="M0 140V70Q250 10 500 65T1000 70V140Z" fill="#8cc08a"/>` +
      `<path d="M0 140V95Q200 50 420 92T800 85T1000 95V140Z" fill="#6fae63"/>`);
  },
  trees() {
    return svg(500, 120, [60, 170, 280, 390].map((x, i) =>
      `<rect x="${x - 4}" y="70" width="8" height="50" fill="#6b4a2b"/>` +
      `<circle cx="${x}" cy="55" r="${28 - i}" fill="#3f7d3a"/>` +
      `<circle cx="${x - 12}" cy="66" r="18" fill="#4a8d43"/><circle cx="${x + 12}" cy="66" r="18" fill="#4a8d43"/>`
    ).join(""));
  },
  fence() {
    return svg(80, 60,
      `<rect y="14" width="80" height="6" fill="#d8b98a"/><rect y="36" width="80" height="6" fill="#d8b98a"/>` +
      `<rect x="8" y="2" width="12" height="58" rx="3" fill="#caa472"/><rect x="48" y="2" width="12" height="58" rx="3" fill="#caa472"/>`);
  },
  lawn() {
    return svg(240, 70,
      blades(240, 70, 110, ["#4f9a34", "#5fb040", "#3f8a2c", "#74c24c"], 12, 34) + flowers(240, 70, 4));
  },
  front() {
    return svg(320, 90, blades(320, 90, 45, ["#2f7a24", "#3b8a2c", "#25681d"], 40, 85));
  },
};


function setupLayers() {
  return [...document.querySelectorAll(".layer")].map((layer) => {
    layer.style.setProperty("--tile", toUrl(SCENERY[layer.dataset.scene]()));
    return { layer, speed: Number(layer.dataset.speed) };
  });
}


function catSVG(index) {
  const accessory = [
    "",
    `<rect x="42" y="21" width="8" height="3" fill="#e63946"/>`,
    `<path d="M46 6l4 3-4 3zM54 6l-4 3 4 3z" fill="#ff5fa2"/>`,
    `<rect x="42" y="21" width="8" height="3" fill="#2a9d8f"/>`,
  ][Math.floor(index / 8) % 4];
  const leg = (x, extra) =>
    `<path class="leg ${extra}" d="M${x} 24v12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`;

  return `<svg viewBox="0 0 64 40" style="--color:${COLORS[index % 8]};filter:hue-rotate(${(index >> 3) * 7 % 40}deg)">
    <g class="tail"><path d="M10 18Q-2 10 6 3" stroke="currentColor" fill="none" stroke-width="4" stroke-linecap="round"/></g>
    ${leg(18, "")}${leg(24, "b")}${leg(38, "b")}${leg(44, "")}
    <ellipse cx="30" cy="20" rx="19" ry="9" fill="currentColor"/>
    <circle cx="50" cy="14" r="9" fill="currentColor"/>
    <path d="M43 8l2-8 5 6zM57 8l-2-8-5 6z" fill="currentColor"/>
    <circle cx="53" cy="13" r="1.6" fill="#222"/><circle cx="47" cy="13" r="1.6" fill="#222"/>
    <path d="M56 17h6M56 19l5 2" stroke="#222" stroke-width=".6"/>
    ${accessory}
  </svg>`;
}


function validate() {
  const count = state.names.length;
  const unique = new Set(state.names.map((n) => n.toLowerCase())).size;
  $("#count").textContent = `${count} / ${MAX_ENTRIES}`;
  $("#error").textContent = count < 2 ? text("minError") : "";
  $("#warning").textContent = unique < count ? `⚠ ${text("dupes")}` : "";
  $("#start").disabled = state.racing || count < 2;
  for (const id of ["#add", "#clear", "#input"]) $(id).disabled = state.racing;
  renderList();
}

function renderList() {
  const list = $("#list");
  list.innerHTML = "";
  state.names.forEach((name, i) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const remove = document.createElement("button");
    label.textContent = name;
    remove.textContent = "✕";
    remove.disabled = state.racing;
    remove.onclick = () => { state.names.splice(i, 1); saveNames(); validate(); };
    item.append(label, remove);
    list.append(item);
  });
}

const saveNames = () => store("kotki-names", JSON.stringify(state.names));

function addNames() {
  const lines = $("#input").value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  state.names = state.names.concat(lines).slice(0, MAX_ENTRIES);
  $("#input").value = "";
  saveNames();
  validate();
}

function setLanguage(lang) {
  state.lang = lang;
  store("kotki-lang", lang);
  document.documentElement.lang = lang;
  document.title = $("h1").textContent;
  $("meta[name=description]").content = text("desc");
  document.querySelectorAll("[data-i18n]").forEach((e) => (e.textContent = text(e.dataset.i18n)));
  document.querySelectorAll("[data-i18n-ph]").forEach((e) => (e.placeholder = text(e.dataset.i18nPh)));
  $("#lang-pl").classList.toggle("active", lang === "pl");
  $("#lang-es").classList.toggle("active", lang === "es");
  validate();
}


const stage = $("#stage");
const world = $("#world");
let layers = [];
let cats = [];
let winnerIndex = -1;
let camera = 0;
let lastFrame = 0;
let lastRanking = 0;
let leaderIndex = -1;
let startX = START_X;      


function makeProfile(finalPosition) {
  const steps = 10;
  const keys = [0];
  for (let j = 1; j < steps; j++) {
    const x = j / steps;
    const swing = 0.04 * Math.min(1, (1 - x) / 0.2);
    keys.push(finalPosition * (x + random(-swing, swing)));
  }
  keys.push(finalPosition);
  return keys;
}

function positionAt(keys, x) {
  const scaled = x * (keys.length - 1);
  const j = Math.min(Math.floor(scaled), keys.length - 2);
  const t = scaled - j;
  const eased = (t + t * t * (3 - 2 * t)) / 2;  // lekkie wygładzenie zmian prędkości
  return keys[j] + (keys[j + 1] - keys[j]) * eased;
}

function buildCats() {
  world.querySelectorAll(".cat").forEach((c) => c.remove());
  const n = state.names.length;
  const height = stage.clientHeight;
  const width = clamp(92 - n * 0.8, 44, 90);
  const catHeight = width * 40 / 64;
  const laneTop = height * 0.5;
  const laneSpace = height * 0.44 - catHeight;


  const maxRows = Math.max(1, Math.floor(laneSpace / (catHeight * 0.75)) + 1);
  const cols = Math.ceil(n / maxRows);
  const rows = Math.ceil(n / cols);
  const colGap = width * 1.08;
  startX = START_X + (cols - 1) * colGap;
  const finishLeft = startX + TRACK_LENGTH;   


  const rivals = state.names.map((_, i) => i).filter((i) => i !== winnerIndex).sort(() => Math.random() - 0.5);
  const closeOnes = new Set(rivals.slice(0, 3));

  world.classList.toggle("simple", n > 40);
  world.classList.remove("paused");
  $("#finish").style.left = `${finishLeft + width}px`;
  $("#startline").style.left = `${startX + width}px`;

  cats = state.names.map((name, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const from = startX - col * colGap;
    const gap = i === winnerIndex ? 0 : closeOnes.has(i) ? random(0.004, 0.02) : random(0.03, 0.1);
    const element = document.createElement("div");
    element.className = "cat" + (n <= 15 ? " show" : "");
    element.style.width = `${width}px`;
    element.style.left = `${from}px`;
    element.style.top = `${laneTop + (rows > 1 ? (row / (rows - 1)) * laneSpace : laneSpace / 2)}px`;
    element.style.zIndex = row;   // niższy rząd = bliżej widza, więc zasłania wyższy
    element.innerHTML = catSVG(i) + `<span class="tag"></span>`;
    element.querySelector(".tag").textContent = name;
    world.append(element);
    return { element, keys: makeProfile(1 - gap), progress: 0, from, span: finishLeft - from };
  });
}

function updateCamera(leaderProgress, dt) {
  const view = stage.clientWidth;
  const worldWidth = startX + TRACK_LENGTH + 300;
  const target = clamp(startX + leaderProgress * TRACK_LENGTH - view * 0.6, 0, worldWidth - view);
  camera += (target - camera) * (1 - Math.exp(-dt * 5));
  world.style.transform = `translateX(${-camera}px)`;
  layers.forEach(({ layer, speed }) => { layer.style.backgroundPositionX = `${-camera * speed}px`; });
}


function renderRanking(final) {
  const medals = ["🥇", "🥈", "🥉"];
  const top5 = cats.map((c, i) => i).sort((a, b) => cats[b].progress - cats[a].progress).slice(0, 5);
  const list = $("#ranking");
  list.classList.toggle("final", final);
  list.innerHTML = "";
  top5.forEach((i, place) => {
    const item = document.createElement("li");
    const mark = document.createElement("span");
    const name = document.createElement("span");
    mark.textContent = final && place < 3 ? medals[place] : `${place + 1}.`;
    name.textContent = state.names[i];
    if (final) item.style.animationDelay = `${place * 0.15}s`;
    item.append(mark, name);
    list.append(item);
  });
}

function updateHud(now) {
  const leader = cats.reduce((best, c, i) => (c.progress > cats[best].progress ? i : best), 0);
  if (leader !== leaderIndex) {
    if (leaderIndex >= 0) cats[leaderIndex].element.classList.remove("leader");
    cats[leader].element.classList.add("leader");
    leaderIndex = leader;
  }
  $("#bar").style.width = `${cats[leader].progress * 100}%`;
  if (now - lastRanking < 200) return;
  lastRanking = now;
  $("#leader").textContent = state.names[leader];
  renderRanking(false);
}

function frame(now, startTime) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  const x = clamp((now - startTime) / RACE_TIME, 0, 1);
  cats.forEach((c) => {
    c.progress = positionAt(c.keys, x);
    c.element.style.left = `${c.from + c.progress * c.span}px`;
  });
  updateHud(now);
  updateCamera(Math.max(...cats.map((c) => c.progress)), dt);
  if (x < 1) requestAnimationFrame((t) => frame(t, startTime));
  else finishRace();
}

function finishRace() {
  $("#leader").textContent = state.names[winnerIndex];
  renderRanking(true);
  world.classList.add("paused");
  $("#winner-name").textContent = state.names[winnerIndex];
  $("#winner-cat").style.setProperty("--color", COLORS[winnerIndex % 8]);
  $("#winner-cat").innerHTML = catSVG(winnerIndex);
  $("#winner-overlay").classList.add("show");
  launchConfetti();
}

function launchConfetti() {
  const palette = ["#e8742c", "#e63946", "#2a9d8f", "#ffd23f", "#6a4c93", "#4cc9f0"];
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    piece.style.left = `${random(0, 100)}vw`;
    piece.style.background = palette[i % palette.length];
    piece.style.borderRadius = i % 2 ? "50%" : "0";
    piece.style.animationDuration = `${random(2, 4.5)}s`;
    piece.style.animationDelay = `${random(0, 1)}s`;
    document.body.append(piece);
    setTimeout(() => piece.remove(), 6000);
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const meow = new Audio("dragon-studio-cute-cat-meow-472372.mp3");
function playMeow() {
  meow.currentTime = 0;
  meow.play().catch(() => {});  
}

async function startRace() {
  if (state.racing || state.names.length < 2) return;
  state.racing = true;
  validate();
  $("#winner-overlay").classList.remove("show");

  winnerIndex = secureInt(state.names.length);   
  buildCats();
  camera = 0;
  leaderIndex = -1;
  lastRanking = 0;
  updateCamera(0, 1);

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cats.forEach((c, i) => {
      c.progress = i === winnerIndex ? 1 : c.keys[10];
      c.element.style.left = `${c.from + c.progress * c.span}px`;
    });
    finishRace();
    return;
  }

  const overlay = $("#countdown-overlay");
  overlay.classList.add("show");
  for (const label of ["3", "2", "1", "🏁"]) {
    $("#countdown").textContent = label;
    if (label === "🏁") playMeow();   // miau w momencie startu
    await wait(800);
  }
  overlay.classList.remove("show");

  const startTime = performance.now();
  lastFrame = startTime;
  requestAnimationFrame((t) => frame(t, startTime));
}

function endRace() {
  state.racing = false;
  validate();
}


$("#add").onclick = addNames;
$("#input").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNames(); });
$("#clear").onclick = () => {
  if (state.names.length && confirm(text("confirmClear"))) { state.names = []; saveNames(); validate(); }
};
$("#start").onclick = startRace;
$("#again").onclick = () => { $("#winner-overlay").classList.remove("show"); endRace(); startRace(); };
$("#close").onclick = () => { $("#winner-overlay").classList.remove("show"); endRace(); };
$("#remove").onclick = () => {
  state.names.splice(winnerIndex, 1);
  saveNames();
  $("#winner-overlay").classList.remove("show");
  endRace();
};
$("#lang-pl").onclick = () => setLanguage("pl");
$("#lang-es").onclick = () => setLanguage("es");
$("#fullscreen").onclick = () => {
  try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {}
};

try {
  state.names = JSON.parse(load("kotki-names") || "[]").filter((n) => typeof n === "string").slice(0, MAX_ENTRIES);
} catch (e) { state.names = []; }

layers = setupLayers();
updateCamera(0, 1);
const browserLang = (navigator.language || "").toLowerCase().startsWith("es") ? "es" : "pl";
setLanguage(load("kotki-lang") || browserLang);
