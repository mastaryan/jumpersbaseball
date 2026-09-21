const PAGES = [
  ["index.html", "Home"],
  ["program.html", "Program"],
  ["roster.html", "Roster"],
  ["schedule.html", "Schedule"],
  ["coaches.html", "Coaches"],
  ["alumni.html", "Alumni"],
  ["sponsors.html", "Sponsors"],
  ["shop.html", "Shop"],
  ["news.html", "News"],
  ["parents.html", "Parents"],
];

function here() {
  const file = location.pathname.split("/").pop() || "index.html";
  return file === "" ? "index.html" : file;
}

function mountChrome() {
  const current = here();
  const nav = document.getElementById("site-nav");
  const foot = document.getElementById("site-foot");
  if (nav) {
    nav.innerHTML = `
      <a class="brand" href="index.html">
        <img src="assets/img/brand/power-s.jpg" alt="Somerset Power S" />
        JUMPERS
      </a>
      <div class="links">
        ${PAGES.filter(([, l]) => l !== "Home").map(([h, l]) =>
          `<a href="${h}" ${h === current ? 'aria-current="page"' : ""}>${l}</a>`
        ).join("")}
      </div>
      <a class="pill" href="support.html">Support</a>
      <button class="menu" id="menu-btn" aria-label="Menu">☰</button>
    `;
    const drawer = document.createElement("div");
    drawer.className = "drawer";
    drawer.id = "drawer";
    drawer.innerHTML = PAGES.map(([h, l]) => `<a href="${h}">${l}</a>`).join("") + `<a href="support.html">Support</a>`;
    nav.insertAdjacentElement("afterend", drawer);
    document.getElementById("menu-btn")?.addEventListener("click", () => drawer.classList.toggle("open"));
  }
  if (foot) {
    foot.innerHTML = `
      <div>© Somerset Briar Jumpers Baseball · Charlie Taylor Field · 301 College St, Somerset, KY</div>
      <div>Player photography: Simple T Creations · <a href="https://www.instagram.com/jumpersbaseball/" target="_blank" rel="noreferrer">Instagram</a> · <a href="https://x.com/jumpersbaseball" target="_blank" rel="noreferrer">X</a></div>
    `;
  }
}

function cardHTML(item) {
  const img = item.photo
    ? `<img class="shot" src="${item.photo}" alt="${item.name}" />`
    : `<div class="sil-shot"><img src="assets/img/team/silhouette.jpg" alt="" /></div>`;
  const stats = (item.stats || []).map(([k, v]) =>
    `<div class="stat-row"><span>${k}</span><span>${v}</span></div>`
  ).join("");
  const links = (item.links || []).map((l) =>
    l.href
      ? `<a class="mini" href="${l.href}" target="_blank" rel="noreferrer">${l.label}</a>`
      : `<span class="mini">${l.label}</span>`
  ).join("");
  const crop = item.crop ? ` crop-${item.crop}` : "";
  const sample = item.backLine && String(item.backLine).toLowerCase().includes("sample")
    ? `<span class="sample-chip">Sample line</span>`
    : "";
  return `
    <article class="card${crop}" data-flip data-id="${item.id || ""}" data-year="${item.classYear || ""}">
      <div class="card-inner">
        <div class="face">
          ${item.number ? `<span class="num">${item.number}</span>` : ""}
          ${img}
          <div class="info">
            <div class="name">${item.name}</div>
            <div class="pos">${item.line || ""}</div>
          </div>
        </div>
        <div class="face back">
          ${sample}
          <div class="name">${item.backTitle || item.name}</div>
          <div class="pos" style="margin-bottom:12px">${item.backLine || item.featured || ""}</div>
          ${stats}
          <div class="links-row">${links}</div>
        </div>
      </div>
    </article>
  `;
}

function bindFlips(root = document) {
  root.querySelectorAll("[data-flip]").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("is-flipped"));
  });
}

function bindTilt(root = document) {
  root.querySelectorAll(".card, .coach, .hat-ph").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width - 0.5;
      const y = (e.clientY - b.top) / b.height - 0.5;
      el.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 8}deg) translateZ(8px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(path);
  return res.json();
}

async function renderGrid(id, path) {
  const el = document.getElementById(id);
  if (!el || el.children.length > 0) return;
  try {
    const data = await loadJSON(path);
    el.innerHTML = data.map(cardHTML).join("");
    bindFlips(el);
    bindTilt(el);
  } catch (e) {
    el.innerHTML = `<p class="meta">Serve this folder over http to load cards.</p>`;
  }
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function bindMotion() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const progress = document.getElementById("progress");
  const fieldBg = document.getElementById("field-bg");
  const heroVid = document.querySelector(".hero-video video");
  const scenes = [...document.querySelectorAll(".h-scene")];

  const tick = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.width = `${p * 100}%`;

    if (!reduced && fieldBg) {
      const pin = fieldBg.closest(".field-pin");
      if (pin) {
        const r = pin.getBoundingClientRect();
        const total = pin.offsetHeight - window.innerHeight;
        const passed = clamp(-r.top, 0, total);
        const t = total ? passed / total : 0;
        fieldBg.style.transform = `translate3d(0, ${t * 8}%, 0) scale(${1.08 - t * 0.08})`;
      }
    }

    if (!reduced && heroVid) {
      const r = heroVid.parentElement.getBoundingClientRect();
      const t = clamp(-r.top / window.innerHeight, 0, 1);
      heroVid.style.transform = `scale(${1.08 + t * 0.08}) translateY(${t * 8}%)`;
    }

    if (!reduced && window.innerWidth > 800) {
      scenes.forEach((scene) => {
        const track = scene.querySelector("[data-rail]");
        if (!track) return;
        const r = scene.getBoundingClientRect();
        const total = scene.offsetHeight - window.innerHeight;
        const passed = clamp(-r.top, 0, total);
        const t = total ? passed / total : 0;
        const maxX = Math.max(0, track.scrollWidth - window.innerWidth + 48);
        track.style.transform = `translate3d(${-t * maxX}px, 0, 0)`;
      });
    }
  };

  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      tick();
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", tick);
  tick();
}

function bindOrbit() {
  const stage = document.getElementById("coverflow");
  const cecil = document.getElementById("cecil-pose");
  if (!stage) return;
  const label = document.getElementById("active-coach");
  const cards = [...stage.querySelectorAll(".token")];
  const n = cards.length;
  if (!n) return;
  let index = 0;

  const layout = () => {
    const rx = Math.min(320, stage.clientWidth * 0.38);
    const ry = 150;
    cards.forEach((card, i) => {
      const t = ((i - index) / n) * Math.PI * 2;
      const x = Math.sin(t) * rx;
      const y = -Math.cos(t) * ry;
      const front = i === index;
      const depth = (y + ry) / (ry * 2);
      card.classList.toggle("is-lead", front);
      card.style.zIndex = String(Math.round(10 + depth * 20));
      card.style.opacity = String(0.55 + depth * 0.45);
      card.style.transform = `translate(${x}px, ${y}px) scale(${front ? 1.12 : 0.82 + depth * 0.15})`;
    });
    if (label && cards[index]) {
      label.innerHTML = `<strong>${cards[index].dataset.name}</strong> ${cards[index].dataset.role}`;
    }
    if (cecil) {
      cecil.classList.remove("is-turn");
      void cecil.offsetWidth;
      cecil.classList.add("is-turn");
    }
  };

  const go = (dir) => {
    index = (index + dir + n) % n;
    layout();
  };

  document.getElementById("orbit-prev")?.addEventListener("click", () => go(-1));
  document.getElementById("orbit-next")?.addEventListener("click", () => go(1));
  cards.forEach((card, i) => card.addEventListener("click", () => { index = i; layout(); }));

  let dragging = false;
  let startX = 0;
  let lastX = 0;
  const onDown = (x) => { dragging = true; startX = lastX = x; };
  const onMove = (x) => { if (dragging) lastX = x; };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    const dx = lastX - startX;
    if (dx > 50) go(-1);
    else if (dx < -50) go(1);
  };

  stage.addEventListener("pointerdown", (e) => onDown(e.clientX));
  window.addEventListener("pointermove", (e) => onMove(e.clientX));
  window.addEventListener("pointerup", onUp);
  stage.addEventListener("touchstart", (e) => onDown(e.changedTouches[0].clientX), { passive: true });
  stage.addEventListener("touchend", (e) => {
    lastX = e.changedTouches[0].clientX;
    onUp();
  }, { passive: true });

  layout();
}

function flowCardHTML(item) {
  const crop = item.crop === "wide" ? " crop-wide" : "";
  return `
    <article class="flow-card${crop}" data-id="${item.id}">
      ${item.number ? `<span class="num">${item.number}</span>` : ""}
      <img src="${item.photo}" alt="${item.name}" />
      <div class="flow-info">
        <strong>${item.name}</strong>
        <em>${item.pos} · ${item.classLabel}</em>
      </div>
    </article>
  `;
}

function bindRosterCoverflow(players) {
  const stage = document.getElementById("coverflow-roster");
  const track = document.getElementById("coverflow-track");
  if (!stage || !track || !players.length) return;

  track.innerHTML = players.map(flowCardHTML).join("");
  const cards = [...track.querySelectorAll(".flow-card")];
  const nameEl = document.getElementById("shelf-name");
  const metaEl = document.getElementById("shelf-meta");
  const countEl = document.getElementById("shelf-count");
  let index = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = () => window.matchMedia("(max-width: 800px)").matches;

  const paint = () => {
    const p = players[index];
    if (nameEl) nameEl.textContent = p.name;
    if (metaEl) metaEl.textContent = `#${p.number} · ${p.pos} · ${p.classLabel} · ${p.classYear}`;
    if (countEl) countEl.textContent = `${index + 1} / ${players.length}`;

    if (mobile()) {
      cards.forEach((c, i) => c.classList.toggle("is-lead", i === index));
      cards[index]?.scrollIntoView({ inline: "center", block: "nearest", behavior: reduced ? "auto" : "smooth" });
      return;
    }

    const spacing = Math.min(195, stage.clientWidth * 0.16);
    cards.forEach((card, i) => {
      const offset = i - index;
      const abs = Math.abs(offset);
      const rot = offset * -32;
      const x = offset * spacing;
      const z = -abs * 90;
      const scale = Math.max(0.62, 1 - abs * 0.11);
      card.classList.toggle("is-lead", i === index);
      card.classList.toggle("is-away", abs > 4);
      card.style.zIndex = String(40 - abs);
      card.style.opacity = abs > 4 ? "0" : String(1 - abs * 0.12);
      card.style.transform = `translate3d(${x}px, ${abs * 10}px, ${z}px) rotateY(${rot}deg) scale(${scale})`;
    });
  };

  const go = (dir) => {
    index = (index + dir + players.length) % players.length;
    paint();
  };

  document.getElementById("shelf-prev")?.addEventListener("click", () => go(-1));
  document.getElementById("shelf-next")?.addEventListener("click", () => go(1));
  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      if (i === index) {
        document.querySelector(`.card[data-id="${players[i].id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      index = i;
      paint();
    });
  });

  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });

  let dragging = false;
  let startX = 0;
  let lastX = 0;
  stage.addEventListener("pointerdown", (e) => { dragging = true; startX = lastX = e.clientX; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", (e) => { if (dragging) lastX = e.clientX; });
  stage.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    const dx = lastX - startX;
    if (dx > 50) go(-1);
    else if (dx < -50) go(1);
  });

  window.addEventListener("resize", paint);
  paint();
}

function bindClassFilters() {
  const bar = document.getElementById("class-filters");
  if (!bar) return;
  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-year]");
    if (!btn) return;
    bar.querySelectorAll("[data-year]").forEach((b) => b.classList.toggle("is-on", b === btn));
    const year = btn.dataset.year;
    document.querySelectorAll(".roster-class").forEach((sec) => {
      sec.hidden = year !== "all" && sec.dataset.year !== year;
    });
  });
}

async function renderRosterPage() {
  const host = document.getElementById("roster-sections");
  if (!host) return;
  try {
    const players = await loadJSON("data/roster.json");
    const order = ["2027", "2028", "2029"];
    const labels = { "2027": "Seniors", "2028": "Juniors", "2029": "Sophomores" };
    host.innerHTML = order.map((year) => {
      const group = players.filter((p) => p.classYear === year);
      if (!group.length) return "";
      return `
        <div class="roster-class" data-year="${year}">
          <h3>${labels[year] || year}</h3>
          <p class="meta">Class of ${year} · ${group.length} ${group.length === 1 ? "portrait" : "portraits"}</p>
          <div class="grid">${group.map(cardHTML).join("")}</div>
        </div>
      `;
    }).join("");
    bindFlips(host);
    bindTilt(host);
    bindClassFilters();
    bindRosterCoverflow(players);
  } catch (e) {
    host.innerHTML = `<p class="meta">Serve this folder over http to load cards.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  mountChrome();
  bindFlips();
  bindTilt();
  bindMotion();
  bindOrbit();
  renderGrid("alumni-grid", "data/alumni.json");
  renderRosterPage();
});
