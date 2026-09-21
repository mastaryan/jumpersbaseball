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
  return `
    <article class="card" data-flip>
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
          <div class="name">${item.backTitle || item.name}</div>
          <div class="pos" style="margin-bottom:12px">${item.backLine || ""}</div>
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

document.addEventListener("DOMContentLoaded", () => {
  mountChrome();
  bindFlips();
  bindTilt();
  bindMotion();
  bindOrbit();
  renderGrid("alumni-grid", "data/alumni.json");
  renderGrid("roster-grid", "data/roster.json");
});
