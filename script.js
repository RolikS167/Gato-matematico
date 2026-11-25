"use strict";

const MAX_ENTRIES = 100;
const RACE_TIME = 18000;
const TRACK_LENGTH = 5000;
const START_X = 160;

const CAT_THEMES = [
  { body: "#f4a261", dark: "#d97b38", belly: "#fde4cf", nose: "#ff8fa3" },
  { body: "#8d99ae", dark: "#6c757d", belly: "#edf2f4", nose: "#ff8fa3" },
  { body: "#343a40", dark: "#212529", belly: "#6c757d", nose: "#ff758f" },
  { body: "#f8f9fa", dark: "#dee2e6", belly: "#ffffff", nose: "#ff8fa3" },
  { body: "#e9c46a", dark: "#cfa33e", belly: "#fefae0", nose: "#e76f51" },
  { body: "#bc6c25", dark: "#8c4a12", belly: "#dda15e", nose: "#ffb4a2" },
  { body: "#cdb4db", dark: "#a282b8", belly: "#f3e8fa", nose: "#ff758f" },
  { body: "#90be6d", dark: "#6a994e", belly: "#e9f5db", nose: "#ff8fa3" },
  { body: "#ffafcc", dark: "#e07a9e", belly: "#ffe5ec", nose: "#d6336c" },
  { body: "#72efdd", dark: "#48bfe3", belly: "#e0fbfc", nose: "#ff758f" }
];

const TEXTS = {
  pl: {
    hint: "Dodaj od 2 do 100 kotków",
    placeholder: "",
    add: "Dodaj kotki",
    clear: "Wyczyść listę",
    confirmClear: "Wyczyścić całą listę?",
    start: "Start wyścigu!",
    again: "Jeszcze raz!",
    removeWinner: "Usuń Tego Gościa",
    close: "Zamknij",
    winner: "I do tablicy przyjdzie...",
    entries: "Uczestnicy",
    leader: "Prowadzi",
    results: "",
    resultsWait: "Wyniki pojawią się podczas biegu",
    minError: "Dodaj co najmniej 2 kotki, aby rozpocząć!",
    desc: "Wylosuj zwycięzcę: kotki ścigają się po ogrodzie."
  },
  es: {
    hint: "Añade de 2 a 100 gatitos",
    placeholder: "",
    add: "Añadir gatitos",
    clear: "Borrar lista",
    confirmClear: "¿Borrar toda la lista?",
    start: "¡Empezar carrera!",
    again: "¡Correr otra vez!",
    removeWinner: "Quitar al ganador",
    close: "Cerrar",
    winner: "Y vendrá a la pizarra...",
    entries: "Participantes",
    leader: "Líder",
    results: "Resultados",
    resultsWait: "Los resultados aparecerán durante la carrera",
    minError: "¡Añade al menos 2 gatitos!",
    desc: "Sortea un ganador: los gatitos corren por el jardín."
  }
};

const state = {
  names: [],
  lang: "pl",
  racing: false
};

const $ = (selector) => document.querySelector(selector);
const text = (key) => TEXTS[state.lang][key];
const random = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function store(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

function load(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function secureInt(n) {
  const limit = Math.floor(2 ** 32 / n) * n;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % n;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`;

const toUrl = (markup) =>
  `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;

function blades(w, h, count, palette, minLen, maxLen) {
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = random(0, w);
    const len = random(minLen, maxLen);
    const lean = random(-8, 8);
    for (const shift of [-w, 0, w]) {
      const bx = x + shift;
      out += `<path d="M${bx} ${h}Q${bx + lean / 2} ${h - len / 2} ${bx + lean} ${h - len}Q${bx + lean / 2 + 4} ${h - len / 2} ${bx + 5} ${h}Z" fill="${palette[i % palette.length]}"/>`;
    }
  }
  return out;
}

function flowers(w, h, count) {
  const petals = ["#ffffff", "#ffe066", "#ff8fab", "#bdb2ff"];
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = random(15, w - 15);
    const y = random(h * 0.25, h - 15);
    const c = petals[i % petals.length];
    out += `<circle cx="${x - 2.5}" cy="${y}" r="2.5" fill="${c}"/>`;
    out += `<circle cx="${x + 2.5}" cy="${y}" r="2.5" fill="${c}"/>`;
    out += `<circle cx="${x}" cy="${y - 2.5}" r="2.5" fill="${c}"/>`;
    out += `<circle cx="${x}" cy="${y + 2.5}" r="2.5" fill="${c}"/>`;
    out += `<circle cx="${x}" cy="${y}" r="2" fill="#f59f00"/>`;
  }
  return out;
}

const SCENERY = {
  clouds() {
    const spots = [[100, 65], [320, 42], [540, 80], [720, 48]];
    return svg(820, 140, spots.map(([x, y]) =>
      `<g fill="#fff" opacity=".92">` +
      `<ellipse cx="${x}" cy="${y}" rx="52" ry="16"/>` +
      `<ellipse cx="${x - 18}" cy="${y - 11}" rx="28" ry="18"/>` +
      `<ellipse cx="${x + 20}" cy="${y - 8}" rx="24" ry="15"/>` +
      `</g>`
    ).join(""));
  },
  hills() {
    return svg(1000, 150,
      `<path d="M0 150V75Q250 15 500 70T1000 75V150Z" fill="#82c985"/>` +
      `<path d="M0 150V100Q220 55 460 95T840 88T1000 100V150Z" fill="#63b365"/>`
    );
  },
  trees() {
    return svg(540, 130, [65, 195, 330, 460].map((x, i) =>
      `<rect x="${x - 5}" y="72" width="10" height="58" rx="3" fill="#7f5539"/>` +
      `<circle cx="${x}" cy="56" r="${30 - i}" fill="#388e3c"/>` +
      `<circle cx="${x - 15}" cy="68" r="20" fill="#4caf50"/>` +
      `<circle cx="${x + 15}" cy="68" r="20" fill="#43a047"/>`
    ).join(""));
  },
  fence() {
    return svg(90, 64,
      `<rect y="16" width="90" height="7" fill="#e6ccb2"/>` +
      `<rect y="38" width="90" height="7" fill="#e6ccb2"/>` +
      `<rect x="10" y="4" width="13" height="60" rx="4" fill="#ddb892"/>` +
      `<rect x="55" y="4" width="13" height="60" rx="4" fill="#ddb892"/>`
    );
  },
  lawn() {
    return svg(260, 80,
      blades(260, 80, 95, ["#52b738", "#69c949", "#439e2b", "#82db5c"], 10, 26) +
      flowers(260, 80, 5)
    );
  },
  front() {
    return svg(340, 75,
      blades(340, 75, 42, ["#2b7a1e", "#379127", "#216116"], 32, 68)
    );
  }
};

function setupLayers() {
  return [...document.querySelectorAll(".layer")].map((layer) => {
    layer.style.setProperty("--tile", toUrl(SCENERY[layer.dataset.scene]()));
    return {
      layer,
      speed: Number(layer.dataset.speed)
    };
  });
}

function catSVG(index, rawLabel) {
  const theme = CAT_THEMES[index % CAT_THEMES.length];
  const label = String(rawLabel || "").trim();

  const len = label.length;
  const fontSize = len <= 2 ? 12.5 : len <= 4 ? 10.5 : len <= 7 ? 8.2 : 6.8;
  const displayLabel = len > 10 ? label.slice(0, 9) + "…" : label;

  const accessoryType = Math.floor(index / CAT_THEMES.length) % 4;
  let accessory = "";
  if (accessoryType === 1) {
    accessory = `<path d="M68 35 Q73 41 79 37" stroke="#e63946" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="75" cy="40" r="2.2" fill="#ffd166"/>`;
  } else if (accessoryType === 2) {
    accessory = `<path d="M68 35 Q73 41 79 37" stroke="#3a86ff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="75" cy="40" r="2.2" fill="#ffffff"/>`;
  } else if (accessoryType === 3) {
    accessory = `<path d="M66 35 L78 38 L70 43 Z" fill="#ff006e"/>`;
  }

  return `
    <svg viewBox="0 0 110 66" aria-label="${escapeHTML(label)}">
      <ellipse class="cat-shadow" cx="54" cy="60" rx="30" ry="5" fill="#14360e"/>

      <g class="cat-tail">
        <path d="M22 36 C6 30, 4 14, 15 11 C21 9, 23 17, 17 20"
              stroke="${theme.body}" stroke-width="7.5" fill="none" stroke-linecap="round"/>
        <path d="M15 11 C21 9, 23 17, 17 20"
              stroke="${theme.belly}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      </g>

      <rect class="leg-back" x="30" y="42" width="7.5" height="16" rx="3.8" fill="${theme.dark}"/>
      <rect class="leg-front" x="64" y="42" width="7.5" height="16" rx="3.8" fill="${theme.dark}"/>

      <rect x="22" y="25" width="56" height="26" rx="13" fill="${theme.body}"/>
      <path d="M36 25.5 V30 M44 25.5 V31 M52 25.5 V30" stroke="${theme.dark}" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>

      <rect x="26" y="29.5" width="46" height="17" rx="8.5" fill="${theme.belly}" stroke="${theme.dark}" stroke-width="1.2"/>
      <text x="49" y="38.5"
            text-anchor="middle"
            dominant-baseline="central"
            fill="#1e2d2c"
            font-family="'Segoe UI', system-ui, sans-serif"
            font-weight="800"
            font-size="${fontSize}px">${escapeHTML(displayLabel)}</text>

      <rect class="leg-front" x="35" y="43" width="8" height="16" rx="4" fill="${theme.body}" stroke="${theme.dark}" stroke-width="0.8"/>
      <rect class="leg-back" x="69" y="43" width="8" height="16" rx="4" fill="${theme.body}" stroke="${theme.dark}" stroke-width="0.8"/>

      ${accessory}

      <g class="cat-head">
        <path d="M69 17 L72 4 L82 14 Z" fill="${theme.body}" stroke="${theme.dark}" stroke-width="1" stroke-linejoin="round"/>
        <path d="M72 15 L73.5 7.5 L79.5 13.5 Z" fill="${theme.nose}" opacity="0.7"/>
        
        <path d="M84 14 L92 4 L95 18 Z" fill="${theme.body}" stroke="${theme.dark}" stroke-width="1" stroke-linejoin="round"/>
        <path d="M86 14 L91 7.5 L92.5 16 Z" fill="${theme.nose}" opacity="0.7"/>

        <ellipse cx="84" cy="24" rx="15" ry="13.5" fill="${theme.body}"/>
        <ellipse cx="87" cy="27" rx="9" ry="7" fill="${theme.belly}" opacity="0.65"/>

        <circle cx="80" cy="21.5" r="2.6" fill="#1e272e"/>
        <circle cx="80.8" cy="20.7" r="0.9" fill="#ffffff"/>

        <circle cx="91.5" cy="21.5" r="2.6" fill="#1e272e"/>
        <circle cx="92.3" cy="20.7" r="0.9" fill="#ffffff"/>

        <ellipse cx="76.5" cy="25.5" rx="2.4" ry="1.3" fill="${theme.nose}" opacity="0.45"/>
        <ellipse cx="95" cy="25.5" rx="2.4" ry="1.3" fill="${theme.nose}" opacity="0.45"/>

        <polygon points="85.5,24.5 88.5,24.5 87,26.8" fill="${theme.nose}"/>
        <path d="M84.5 28 Q87 30 87 26.8 Q87 30 89.5 28" stroke="#1e272e" stroke-width="1.2" fill="none" stroke-linecap="round"/>

        <path d="M75 24 L67 22.5 M75 26.5 L67 27.5" stroke="#1e272e" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
        <path d="M96 24 L104 22.5 M96 26.5 L104 27.5" stroke="#1e272e" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
      </g>
    </svg>
  `;
}

function validate() {
  const count = state.names.length;
  $("#count").textContent = `${count} / ${MAX_ENTRIES}`;
  $("#error").textContent = count < 2 ? text("minError") : "";
  $("#start").disabled = state.racing || count < 2;

  for (const id of ["#add", "#clear", "#input", "#auto-add", "#auto-count"]) {
    $(id).disabled = state.racing;
  }
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
    remove.onclick = () => {
      state.names.splice(i, 1);
      saveNames();
      validate();
    };

    item.append(label, remove);
    list.append(item);
  });
}

const saveNames = () => {
  // Nie zapisujemy już listy do localStorage, dzięki czemu przy odświeżeniu zawsze startuje pusta
  try { localStorage.removeItem("kotki-names"); } catch (e) {}
};

function addNames() {
  const lines = $("#input").value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  state.names = state.names.concat(lines).slice(0, MAX_ENTRIES);
  $("#input").value = "";
  saveNames();
  validate();
}

function addAutomaticNumbers() {
  const field = $("#auto-count");
  const value = Number(field.value);

  if (!Number.isInteger(value) || value < 1 || value > MAX_ENTRIES) {
    field.setCustomValidity(`Wpisz liczbę od 1 do ${MAX_ENTRIES}.`);
    field.reportValidity();
    return;
  }

  field.setCustomValidity("");
  const existing = new Set(state.names.map((name) => name.trim().toLowerCase()));

  for (let i = 1; i <= value && state.names.length < MAX_ENTRIES; i++) {
    const name = String(i);
    if (!existing.has(name.toLowerCase())) {
      state.names.push(name);
      existing.add(name.toLowerCase());
    }
  }

  field.value = "";
  saveNames();
  validate();
}

function setLanguage(lang) {
  state.lang = lang;
  store("kotki-lang", lang);
  document.documentElement.lang = lang;
  document.title = $("h1").textContent;
  $("meta[name=description]").content = text("desc");

  document.querySelectorAll("[data-i18n]").forEach((e) => {
    e.textContent = text(e.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((e) => {
    e.placeholder = text(e.dataset.i18nPh);
  });

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
let trackBounds = { minTop: 200, maxTop: 420 };

function makeProfile(finalPosition, isWinner) {
  const steps = 24;
  const weights = [];
  const style = Math.floor(Math.random() * 3);
  let sum = 0;

  for (let j = 0; j < steps; j++) {
    const t = j / steps;
    let base = 1.0;

    if (style === 0) {
      base = t < 0.35 ? random(1.2, 1.7) : t < 0.75 ? random(0.5, 0.95) : random(0.9, 1.4);
    } else if (style === 1) {
      base = t < 0.45 ? random(0.5, 0.9) : t < 0.8 ? random(0.95, 1.4) : random(1.3, 1.8);
    } else {
      base = random(0.4, 1.8);
    }

    weights.push(base);
    sum += base;
  }

  const keys = [0];
  let acc = 0;
  for (let j = 0; j < steps; j++) {
    acc += weights[j] / sum;
    keys.push(acc * finalPosition);
  }

  if (isWinner) {
    keys[steps] = 1;
  }
  return keys;
}

function positionAt(keys, x) {
  const scaled = x * (keys.length - 1);
  const j = Math.min(Math.floor(scaled), keys.length - 2);
  const t = scaled - j;
  const eased = t * t * t * (t * (t * 6 - 15) + 10);
  return keys[j] + (keys[j + 1] - keys[j]) * eased;
}

function buildCats() {
  world.querySelectorAll(".cat").forEach((c) => c.remove());

  const n = state.names.length;
  const height = stage.clientHeight;

  const width = clamp(120 - n * 0.25, 88, 120);
  const catHeight = width * (66 / 110);

  const laneTop = height * 0.42;
  const laneSpace = Math.max(50, height * 0.52 - catHeight);
  trackBounds = { minTop: laneTop - 8, maxTop: laneTop + laneSpace + 8 };

  const rows = Math.min(4, n);
  const cols = Math.ceil(n / rows);

  const colGap = width * 1.35;
  startX = START_X + (cols - 1) * colGap;
  const finishLeft = startX + TRACK_LENGTH;

  const rivals = state.names
    .map((_, i) => i)
    .filter((i) => i !== winnerIndex)
    .sort(() => Math.random() - 0.5);
  const closeOnes = new Set(rivals.slice(0, 4));

  world.classList.toggle("simple", n > 45);
  world.classList.remove("paused");

  $("#finish").style.left = `${finishLeft + width * 0.85}px`;
  $("#startline").style.left = `${startX + width * 0.85}px`;

  cats = state.names.map((name, i) => {
    const row = i % rows;
    const col = Math.floor(i / rows);

    const from = startX - col * colGap + random(-6, 6);
    const baseTop = laneTop + (rows > 1 ? (row / (rows - 1)) * laneSpace : laneSpace / 2);

    const gap = i === winnerIndex
      ? 0
      : closeOnes.has(i)
        ? random(0.004, 0.02)
        : random(0.025, 0.095);

    const element = document.createElement("div");
    element.className = "cat";
    element.style.width = `${width}px`;
    element.style.left = `${from}px`;
    element.style.top = `${baseTop}px`;
    element.style.zIndex = Math.round(baseTop);

    element.innerHTML = catSVG(i, name);

    const gallopDuration = random(0.26, 0.42).toFixed(2);
    const animDelay = `-${random(0, 0.5).toFixed(2)}s`;
    const svgEl = element.querySelector("svg");
    svgEl.style.animationDuration = `${gallopDuration}s`;
    svgEl.style.animationDelay = animDelay;

    element.querySelectorAll(".leg-front, .leg-back, .cat-shadow").forEach((el) => {
      el.style.animationDuration = `${gallopDuration}s`;
      el.style.animationDelay = animDelay;
    });

    const tailEl = element.querySelector(".cat-tail");
    if (tailEl) {
      tailEl.style.animationDuration = `${random(0.32, 0.62).toFixed(2)}s`;
      tailEl.style.animationDelay = animDelay;
    }

    world.append(element);

    return {
      element,
      keys: makeProfile(1 - gap, i === winnerIndex),
      progress: 0,
      prevProgress: 0,
      x: from,
      y: baseTop,
      baseTop,
      width,
      height: catHeight,
      from,
      span: finishLeft - from,
      swayAmp: random(4, 10),
      swayFreq: random(2.0, 4.0),
      swayPhase: random(0, Math.PI * 2)
    };
  });
}

function updateCamera(leaderProgress, dt) {
  const view = stage.clientWidth;
  const worldWidth = startX + TRACK_LENGTH + 320;

  const target = clamp(
    startX + leaderProgress * TRACK_LENGTH - view * 0.55,
    0,
    worldWidth - view
  );

  camera += (target - camera) * (1 - Math.exp(-dt * 4.5));
  world.style.transform = `translateX(${-camera}px)`;

  layers.forEach(({ layer, speed }) => {
    layer.style.backgroundPositionX = `${-camera * speed}px`;
  });
}

function renderRanking(final) {
  const medals = ["🥇", "🥈", "🥉"];
  const top5 = cats
    .map((c, i) => i)
    .sort((a, b) => cats[b].progress - cats[a].progress)
    .slice(0, 5);

  const list = $("#ranking");
  list.classList.toggle("final", final);
  list.innerHTML = "";

  top5.forEach((i, place) => {
    const item = document.createElement("li");
    const mark = document.createElement("span");
    const name = document.createElement("span");

    mark.textContent = final && place < 3 ? medals[place] : `${place + 1}.`;
    name.textContent = state.names[i];

    if (final) {
      item.style.animationDelay = `${place * 0.14}s`;
    }

    item.append(mark, name);
    list.append(item);
  });
}

function updateHud(now) {
  const leader = cats.reduce(
    (best, c, i) => (c.progress > cats[best].progress ? i : best),
    0
  );

  if (leader !== leaderIndex) {
    if (leaderIndex >= 0) {
      cats[leaderIndex].element.classList.remove("leader");
    }
    cats[leader].element.classList.add("leader");
    leaderIndex = leader;
  }

  $("#bar").style.width = `${Math.min(100, cats[leader].progress * 100)}%`;

  if (now - lastRanking < 180) return;
  lastRanking = now;

  $("#leader").textContent = state.names[leader];
  renderRanking(false);
}

function frame(now, startTime) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000) || 0.016;
  lastFrame = now;

  const xRatio = clamp((now - startTime) / RACE_TIME, 0, 1);

  cats.forEach((c) => {
    c.prevProgress = c.progress;
    c.progress = positionAt(c.keys, xRatio);
    c.x = c.from + c.progress * c.span;

    const wave = Math.sin(xRatio * Math.PI * c.swayFreq + c.swayPhase) * c.swayAmp * Math.sin(xRatio * Math.PI);
    const desiredY = c.baseTop + wave;
    c.y += (desiredY - c.y) * Math.min(1, dt * 6);
  });

  const minDistX = cats[0] ? cats[0].width * 0.75 : 80;
  const minDistY = cats[0] ? cats[0].height * 0.5 : 30;

  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const a = cats[i];
      const b = cats[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;

      if (Math.abs(dx) < minDistX && Math.abs(dy) < minDistY) {
        const overlapY = minDistY - Math.abs(dy);
        const pushDir = dy === 0 ? (i % 2 === 0 ? -1 : 1) : Math.sign(dy);
        const pushAmount = overlapY * 0.4;

        a.y += pushDir * pushAmount;
        b.y -= pushDir * pushAmount;
      }
    }
  }

  cats.forEach((c) => {
    c.y = clamp(c.y, trackBounds.minTop, trackBounds.maxTop);

    const instantSpeed = (c.progress - c.prevProgress) / dt;
    const tilt = clamp((instantSpeed - 0.05) * 45, -3.5, 7.5);

    c.element.style.left = `${c.x.toFixed(1)}px`;
    c.element.style.top = `${c.y.toFixed(1)}px`;
    c.element.style.transform = `rotate(${tilt.toFixed(1)}deg)`;

    if (!c.element.classList.contains("leader")) {
      c.element.style.zIndex = Math.round(c.y);
    }
  });

  updateHud(now);
  updateCamera(Math.max(...cats.map((c) => c.progress)), dt);

  if (xRatio < 1) {
    requestAnimationFrame((t) => frame(t, startTime));
  } else {
    finishRace();
  }
}

function finishRace() {
  $("#leader").textContent = state.names[winnerIndex];
  renderRanking(true);
  world.classList.add("paused");

  const winnerLabel = state.names[winnerIndex];
  $("#winner-name").textContent = winnerLabel;
  $("#winner-cat").innerHTML = catSVG(winnerIndex, winnerLabel);

  $("#winner-overlay").classList.add("show");
  launchConfetti();

  state.racing = false;
  validate();
}

function launchConfetti() {
  const palette = ["#f39c12", "#e63946", "#2a9d8f", "#ffd166", "#8338ec", "#3a86ff"];
  for (let i = 0; i < 75; i++) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    piece.style.left = `${random(0, 100)}vw`;
    piece.style.background = palette[i % palette.length];
    piece.style.borderRadius = i % 2 ? "50%" : "2px";
    piece.style.animationDuration = `${random(2.2, 4.4)}s`;
    piece.style.animationDelay = `${random(0, 0.9)}s`;
    document.body.append(piece);
    setTimeout(() => piece.remove(), 5500);
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
      c.progress = i === winnerIndex ? 1 : c.keys[c.keys.length - 1];
      c.element.style.left = `${c.from + c.progress * c.span}px`;
    });
    finishRace();
    return;
  }

  const overlay = $("#countdown-overlay");
  overlay.classList.add("show");

  for (const label of ["3", "2", "1", "🐾"]) {
    $("#countdown").textContent = label;
    if (label === "🐾") {
      playMeow();
    }
    await wait(750);
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
$("#auto-add").onclick = addAutomaticNumbers;

$("#auto-count").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addAutomaticNumbers();
});

$("#input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNames();
});

$("#clear").onclick = () => {
  if (state.names.length && confirm(text("confirmClear"))) {
    state.names = [];
    saveNames();
    validate();
  }
};

$("#start").onclick = startRace;

$("#again").onclick = () => {
  $("#winner-overlay").classList.remove("show");
  endRace();
  startRace();
};

$("#close").onclick = () => {
  $("#winner-overlay").classList.remove("show");
  endRace();
};

$("#remove").onclick = () => {
  state.names.splice(winnerIndex, 1);
  saveNames();
  $("#winner-overlay").classList.remove("show");
  endRace();
};

$("#lang-pl").onclick = () => setLanguage("pl");
$("#lang-es").onclick = () => setLanguage("es");

$("#fullscreen").onclick = () => {
  try {
    document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen();
  } catch (e) {}
};

// Zamiast wczytywać zapisane imiona, lista zawsze startuje jako pusta przy wejściu/odświeżeniu
state.names = [];

layers = setupLayers();
updateCamera(0, 1);

const browserLang = (navigator.language || "").toLowerCase().startsWith("es") ? "es" : "pl";
setLanguage(load("kotki-lang") || browserLang);