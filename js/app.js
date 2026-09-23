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

function isDeck() {
  return window.matchMedia("(max-width: 800px)").matches;
}

function bindTilt(root = document) {
  if (window.matchMedia("(hover: none)").matches) return;
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

function bindCoachCylinder(staff) {
  const scene = document.getElementById("cyl-scene");
  const ring = document.getElementById("cyl-ring");
  if (!scene || !ring || !staff.length) return;

  const n = staff.length;
  const step = 360 / n;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  ring.style.setProperty("--step", `${step}deg`);

  ring.innerHTML = staff.map((c, i) => {
    const family = c.id === "sizemore" || c.id === "davin" ? " crop-family" : "";
    return `
      <article class="cyl-card${family}" style="--i:${i}" data-i="${i}" data-id="${c.id}">
        <img src="${c.poster || c.photo}" alt="${c.name}" />
        <div class="cyl-info">
          <strong>${c.name}</strong>
          <em>${c.role}</em>
        </div>
      </article>
    `;
  }).join("");

  const cards = [...ring.querySelectorAll(".cyl-card")];
  const nameEl = document.getElementById("coach-name");
  const metaEl = document.getElementById("coach-meta");
  const countEl = document.getElementById("queue-count");

  let index = 0;
  let spinning = !reduced;
  let hovering = false;
  let dragging = false;
  let didDrag = false;
  let startX = 0;
  let startRot = 0;
  let rot = 0;
  let timer = 0;

  const size = () => {
    const slim = isDeck();
    scene.classList.toggle("is-deck", slim);
    ring.classList.toggle("is-deck", slim);
    if (slim) {
      scene.style.height = "";
      ring.style.transform = "";
      return;
    }
    const w = 240;
    const h = 360;
    const radius = Math.round((w / 2) / Math.tan(Math.PI / n) * 1.9);
    ring.style.setProperty("--w", `${w}px`);
    ring.style.setProperty("--h", `${h}px`);
    ring.style.setProperty("--radius", `${radius}px`);
    ring.style.setProperty("--tilt", "-12deg");
    scene.style.height = "560px";
  };

  const paint = (animate = true) => {
    const coach = staff[index];
    cards.forEach((card, i) => card.classList.toggle("is-front", i === index));
    if (nameEl) nameEl.textContent = coach.name;
    if (metaEl) metaEl.textContent = `${coach.role} · ${coach.years}`;
    if (countEl) countEl.textContent = `${index + 1} / ${n}`;
    if (isDeck()) {
      cards[index]?.scrollIntoView({ inline: "center", block: "nearest", behavior: animate ? "smooth" : "auto" });
      return;
    }
    if (!animate) scene.classList.add("is-drag");
    ring.style.setProperty("--rot", `${-index * step}deg`);
    rot = -index * step;
    if (!animate) requestAnimationFrame(() => scene.classList.remove("is-drag"));
  };

  const go = (dir) => {
    index = (index + dir + n) % n;
    paint();
  };

  const tick = () => {
    if (isDeck()) return;
    if (spinning && !hovering && !dragging) go(1);
  };

  const arm = () => {
    window.clearInterval(timer);
    if (!reduced) timer = window.setInterval(tick, 3200);
  };

  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      if (didDrag) return;
      if (i === index) {
        document.querySelector(`.card[data-id="${staff[i].id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      index = i;
      paint();
      arm();
    });
  });

  document.getElementById("coach-prev")?.addEventListener("click", () => { go(-1); arm(); });
  document.getElementById("coach-next")?.addEventListener("click", () => { go(1); arm(); });

  scene.addEventListener("mouseenter", () => { hovering = true; });
  scene.addEventListener("mouseleave", () => { hovering = false; });
  scene.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); arm(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); arm(); }
  });

  scene.addEventListener("pointerdown", (e) => {
    dragging = true;
    didDrag = false;
    startX = e.clientX;
    startRot = rot;
    scene.classList.add("is-drag");
    scene.setPointerCapture(e.pointerId);
  });
  scene.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 6) didDrag = true;
    rot = startRot + dx * 0.35;
    ring.style.setProperty("--rot", `${rot}deg`);
  });
  scene.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    scene.classList.remove("is-drag");
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 24) {
      const dir = dx < 0 ? 1 : -1;
      index = (index + dir + n) % n;
    } else {
      const raw = ((-rot / step) % n + n) % n;
      index = Math.round(raw) % n;
    }
    paint();
    arm();
  });

  window.addEventListener("resize", size);
  size();
  paint(false);
  arm();
}

function formerHTML(item) {
  if (item.photo) {
    return `
      <article class="former-card">
        <img src="${item.photo}" alt="${item.name}" />
        <div class="veil"></div>
        <div class="copy">
          <p class="kicker">${item.role}</p>
          <h3>${item.name}</h3>
          <p class="meta">${item.years}</p>
          <p class="lede" style="color:#e8e2f4">${item.bio}</p>
        </div>
      </article>
    `;
  }
  return `
    <article class="former-card plain">
      <div class="copy">
        <p class="kicker">${item.role}</p>
        <h3>${item.name}</h3>
        <p class="meta">${item.years}</p>
        <p class="lede">${item.bio}</p>
      </div>
    </article>
  `;
}

async function renderCoachesPage() {
  const cards = document.getElementById("coach-cards");
  const former = document.getElementById("former-grid");
  if (!cards && !document.getElementById("carousel")) return;
  try {
    const data = await loadJSON("data/coaches.json");
    const staff = data.staff || data;
    if (cards) {
      cards.innerHTML = staff.map(cardHTML).join("");
      bindFlips(cards);
      bindTilt(cards);
    }
    bindCoachCylinder(staff);
    if (former) former.innerHTML = (data.former || []).map(formerHTML).join("");
  } catch (e) {
    if (cards) cards.innerHTML = `<p class="meta">Serve this folder over http to load the staff.</p>`;
  }
}

function alumSlideHTML(item) {
  const gold = item.level && /mlb|affiliated/i.test(item.level)
    ? `<span class="gold-chip">MLB</span>`
    : "";
  return `
    <article class="alum-slide" data-id="${item.id}">
      ${item.number ? `<span class="num">${item.number}</span>` : ""}
      ${gold}
      <img src="${item.photo}" alt="${item.name}" />
      <div class="alum-info">
        <strong>${item.name}</strong>
        <em>${item.school || item.line}</em>
      </div>
    </article>
  `;
}

function bindAlumniCarousel(alumni) {
  const scene = document.getElementById("alum-scene");
  const track = document.getElementById("alum-track");
  if (!scene || !track || !alumni.length) return;

  track.innerHTML = alumni.map(alumSlideHTML).join("");
  const dots = document.getElementById("alum-dots");
  if (dots) {
    dots.innerHTML = alumni.map((_, i) =>
      `<button type="button" data-i="${i}" aria-label="Show ${alumni[i].name}"></button>`
    ).join("");
  }

  const slides = [...track.querySelectorAll(".alum-slide")];
  const nameEl = document.getElementById("alum-name");
  const metaEl = document.getElementById("alum-meta");
  const countEl = document.getElementById("alum-count");
  const n = alumni.length;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let hovering = false;
  let dragging = false;
  let didDrag = false;
  let startX = 0;
  let lastX = 0;
  let timer = 0;

  const paint = () => {
    const item = alumni[index];
    if (nameEl) nameEl.textContent = item.name;
    if (metaEl) metaEl.textContent = item.line;
    if (countEl) countEl.textContent = `${index + 1} / ${n}`;
    slides.forEach((slide, i) => {
      let offset = i - index;
      if (offset > n / 2) offset -= n;
      if (offset < -n / 2) offset += n;
      slide.classList.toggle("is-active", offset === 0);
      slide.classList.toggle("is-prev", offset === -1);
      slide.classList.toggle("is-next", offset === 1);
      slide.classList.toggle("is-far", Math.abs(offset) > 1);
      slide.style.setProperty("--off", String(offset));
      slide.style.zIndex = String(20 - Math.abs(offset));
    });
    dots?.querySelectorAll("button").forEach((b, i) => b.classList.toggle("is-on", i === index));
    if (isDeck()) {
      scene.classList.add("is-deck");
      slides[index]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    } else {
      scene.classList.remove("is-deck");
    }
  };

  const go = (dir) => {
    index = (index + dir + n) % n;
    paint();
  };

  const arm = () => {
    window.clearInterval(timer);
    if (!reduced && !isDeck()) timer = window.setInterval(() => {
      if (!hovering && !dragging) go(1);
    }, 3400);
  };

  document.getElementById("alum-prev")?.addEventListener("click", () => { go(-1); arm(); });
  document.getElementById("alum-next")?.addEventListener("click", () => { go(1); arm(); });
  dots?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-i]");
    if (!btn) return;
    index = Number(btn.dataset.i);
    paint();
    arm();
  });
  slides.forEach((slide, i) => {
    slide.addEventListener("click", () => {
      if (didDrag) return;
      if (i === index) {
        document.querySelector(`#alumni-grid .card[data-id="${alumni[i].id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      index = i;
      paint();
      arm();
    });
  });

  scene.addEventListener("mouseenter", () => { hovering = true; });
  scene.addEventListener("mouseleave", () => { hovering = false; });
  scene.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); arm(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); arm(); }
  });
  scene.addEventListener("pointerdown", (e) => {
    dragging = true;
    didDrag = false;
    startX = lastX = e.clientX;
    scene.setPointerCapture(e.pointerId);
  });
  scene.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    lastX = e.clientX;
    if (Math.abs(lastX - startX) > 8) didDrag = true;
  });
  scene.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    const dx = lastX - startX;
    if (dx > 40) go(-1);
    else if (dx < -40) go(1);
    arm();
  });

  paint();
  arm();
}

async function renderAlumniPage() {
  const grid = document.getElementById("alumni-grid");
  if (!grid && !document.getElementById("alum-scene")) return;
  try {
    const alumni = await loadJSON("data/alumni.json");
    if (grid) {
      grid.innerHTML = alumni.map(cardHTML).join("");
      bindFlips(grid);
      bindTilt(grid);
    }
    bindAlumniCarousel(alumni);
  } catch (e) {
    if (grid) grid.innerHTML = `<p class="meta">Serve this folder over http to load alumni.</p>`;
  }
}

function hatCardHTML(hat) {
  const arriving = hat.status === "arriving"
    ? `<span class="sample-chip">Preview · arriving</span>`
    : "";
  return `
    <article class="card hat-card" data-id="${hat.id}">
      <div class="card-inner">
        <div class="face">
          ${arriving}
          <img class="shot hat-shot" src="${hat.front}" alt="${hat.name} front" />
          <div class="info">
            <div class="name">${hat.name}</div>
            <div class="pos">${hat.price} · ${hat.line}</div>
          </div>
        </div>
        <div class="face back hat-back">
          <img class="shot hat-shot" src="${hat.back}" alt="${hat.name} back" />
          <div class="info">
            <div class="name">${hat.name}</div>
            <div class="pos">${hat.backLine}</div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function fillHatSelect(hats) {
  const select = document.getElementById("hat-select");
  if (!select || !hats.length) return;
  select.innerHTML = hats.map((hat) =>
    `<option value="${hat.name}" data-amount="${hat.amount}">${hat.name} · ${hat.price}</option>`
  ).join("");
}

function bindHatDue() {
  const select = document.getElementById("hat-select");
  const qty = document.getElementById("hat-qty");
  const due = document.getElementById("hat-due");
  const field = document.getElementById("hat-due-field");
  if (!select || !qty) return;

  const paint = () => {
    const opt = select.options[select.selectedIndex];
    const amount = Number(opt?.dataset.amount || 30);
    const n = Math.max(1, Number(qty.value) || 1);
    const total = amount * n;
    const label = n === 1 ? `Due at pickup · $${total}` : `Due at pickup · ${n} × $${amount} = $${total}`;
    if (due) due.textContent = label;
    if (field) field.value = `$${total}`;
  };

  select.addEventListener("change", paint);
  qty.addEventListener("input", paint);
  paint();
}

function bindHatForm() {
  const form = document.getElementById("hat-form");
  if (!form) return;
  const ok = document.getElementById("hat-ok");
  const err = document.getElementById("hat-err");
  const btn = document.getElementById("hat-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (err) err.hidden = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending…";
    }
    const data = new FormData(form);
    data.set("_subject", `Jumpers hat reserve — ${data.get("hat")} ${data.get("size")}`);
    try {
      const res = await fetch("https://formsubmit.co/ajax/j.denney228@gmail.com", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      if (!res.ok) throw new Error("send");
      form.hidden = true;
      if (ok) ok.hidden = false;
      ok?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (ex) {
      if (err) err.hidden = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Reserve";
      }
    }
  });
}

function bindHatShelf(hats) {
  const shelf = document.getElementById("hat-shelf");
  if (!shelf || !hats.length) return;
  shelf.innerHTML = hats.map(hatCardHTML).join("");
  fillHatSelect(hats);

  const cards = [...shelf.querySelectorAll(".hat-card")];
  const nameEl = document.getElementById("hat-name");
  const metaEl = document.getElementById("hat-meta");
  const countEl = document.getElementById("hat-count");
  const select = document.getElementById("hat-select");
  let index = 0;

  const paint = () => {
    const hat = hats[index];
    if (nameEl) nameEl.textContent = hat.name;
    if (metaEl) metaEl.textContent = `${hat.price} · ${hat.model}`;
    if (countEl) countEl.textContent = `${index + 1} / ${hats.length}`;
    cards.forEach((card, i) => card.classList.toggle("is-lead", i === index));
    if (isDeck()) {
      cards[index]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
    if (select) {
      const opt = [...select.options].find((o) => o.value === hat.name);
      if (opt) {
        select.value = hat.name;
        select.dispatchEvent(new Event("change"));
      }
    }
  };

  const go = (dir) => {
    index = (index + dir + hats.length) % hats.length;
    paint();
  };

  document.getElementById("hat-prev")?.addEventListener("click", () => go(-1));
  document.getElementById("hat-next")?.addEventListener("click", () => go(1));
  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      if (i !== index) {
        cards[index].classList.remove("is-flipped");
        index = i;
        paint();
        return;
      }
      card.classList.toggle("is-flipped");
    });
  });
  paint();
}

async function renderShopPage() {
  if (!document.getElementById("hat-shelf") && !document.getElementById("hat-form")) return;
  bindHatForm();
  bindHatDue();
  try {
    const hats = await loadJSON("data/hats.json");
    bindHatShelf(hats);
    bindHatDue();
  } catch (e) {
    const shelf = document.getElementById("hat-shelf");
    if (shelf) shelf.innerHTML = `<p class="meta">Serve this folder over http to load hats.</p>`;
  }
}

function prettyDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDay(iso) {
  return prettyDate(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function formatLong(iso) {
  return prettyDate(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function formatTime(hhmm) {
  if (!hhmm) return "TBD";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return m ? `${hr}:${String(m).padStart(2, "0")} ${ampm}` : `${hr}:00 ${ampm}`;
}

function gameWhen(game) {
  const start = prettyDate(game.date);
  if (game.kind === "trip" && game.endDate) {
    const end = prettyDate(game.endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (game.kick) {
    const [h, m] = game.kick.split(":").map(Number);
    start.setHours(h, m, 0, 0);
  } else {
    start.setHours(23, 59, 0, 0);
  }
  const end = new Date(start);
  if (game.end) {
    const [h, m] = game.end.split(":").map(Number);
    end.setHours(h, m, 0, 0);
  } else {
    end.setHours(start.getHours() + 3, 0, 0, 0);
  }
  return { start, end };
}

function bindCalendarLinks() {
  const apple = document.getElementById("cal-apple");
  const google = document.getElementById("cal-google");
  if (!apple && !google) return;
  const ics = new URL("schedule.ics", location.href).href;
  const webcal = ics.replace(/^https:/, "webcal:").replace(/^http:/, "webcal:");
  if (apple) apple.href = webcal;
  if (google) {
    google.href = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(ics)}`;
  }
}

const TAG_CHIPS = {
  scrimmage: "Scrimmage",
  district: "District",
  senior: "Senior Night",
  alumni: "Alumni Night",
  prom: "Prom",
  triangle: "Triangle",
};

function tagChips(game) {
  const tags = game.tags || (game.star ? ["scrimmage"] : []);
  const chips = [];
  if (game.team) chips.push(`<span class="chip">${game.team}</span>`);
  if (game.label && !tags.includes("senior") && !tags.includes("alumni") && !tags.includes("triangle")) {
    chips.push(`<span class="chip">${game.label}</span>`);
  }
  tags.forEach((t) => {
    if (TAG_CHIPS[t]) chips.push(`<span class="chip">${TAG_CHIPS[t]}</span>`);
  });
  return chips.join("");
}

function heroHTML(game, data) {
  const vs = game.home ? "Home" : "Away";
  const vsWord = game.kind === "off" || game.kind === "trip" ? "" : (game.home ? "vs" : "at");
  const range = game.kind === "trip"
    ? `${formatLong(game.date)} – ${formatDay(game.endDate)}`
    : formatLong(game.date);
  const time = !game.kick ? (game.note || "TBD") : formatTime(game.kick);
  const title = vsWord ? `${vsWord} ${game.opponent}` : game.opponent;
  const place = game.kind === "off" ? (game.note || "Off day") : `${vs} · ${game.venue} · ${time}`;
  return `
    <article class="game-hero">
      <p class="kicker">Next up</p>
      <p class="game-when">${range}</p>
      <h2>${title}</h2>
      <p class="lede">${place}</p>
      <div class="chips">
        ${game.kind !== "off" ? `<span class="chip">${vs}</span>` : ""}
        ${tagChips(game)}
      </div>
    </article>
  `;
}

function rowHTML(game) {
  const vs = game.home ? "Home" : "Away";
  const vsWord = game.kind === "off" || game.kind === "trip" ? "" : (game.home ? "vs" : "at");
  const time = !game.kick ? (game.note || "TBD") : formatTime(game.kick);
  const day = prettyDate(game.date);
  const mon = day.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dateLabel = game.kind === "trip"
    ? `${day.getDate()}–${prettyDate(game.endDate).getDate()}`
    : String(day.getDate());
  const title = vsWord ? `${vsWord} ${game.opponent}` : game.opponent;
  const detail = game.kind === "off"
    ? (game.note || "Off day")
    : `${vs} · ${game.venue} · ${time}`;
  const tags = (game.tags || []).join(" ");
  const side = TAG_CHIPS[(game.tags || [])[0]] || game.team || "";
  return `
    <article class="game-row" data-home="${game.home}" data-team="${game.team || ""}" data-kind="${game.kind}" data-tags="${tags}">
      <div class="game-date">
        <span>${mon}</span>
        <strong>${dateLabel}</strong>
      </div>
      <div class="game-body">
        <div class="name">${title}</div>
        <div class="pos">${detail}</div>
      </div>
      <div class="game-side">
        ${side ? `<span class="chip">${side}</span>` : ""}
      </div>
    </article>
  `;
}

function bindSchedFilters() {
  const bar = document.getElementById("sched-filters");
  const list = document.getElementById("sched-list");
  if (!bar || !list) return;
  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    bar.querySelectorAll("[data-filter]").forEach((b) => b.classList.toggle("is-on", b === btn));
    const f = btn.dataset.filter;
    list.querySelectorAll(".game-row").forEach((row) => {
      const home = row.dataset.home === "true";
      const team = row.dataset.team || "";
      let on = true;
      const tags = row.dataset.tags || "";
      if (f === "home") on = home && row.dataset.kind !== "off";
      if (f === "away") on = !home && row.dataset.kind !== "off";
      if (f === "varsity") on = /V|Varsity/i.test(team);
      if (f === "jv") on = /JV/i.test(team);
      if (f === "district") on = /district/.test(tags);
      row.hidden = !on;
    });
  });
}

async function renderSchedulePage() {
  const list = document.getElementById("sched-list");
  if (!list) return;
  bindCalendarLinks();
  try {
    const data = await loadJSON("data/schedule.json");
    const revised = document.getElementById("cal-revised");
    if (revised && data.revised) {
      const d = prettyDate(data.revised);
      revised.textContent = `Last revised ${d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · ${data.source}`;
    }
    const now = new Date();
    const upcoming = data.games.filter((g) => gameWhen(g).end >= now);
    const past = data.games.filter((g) => gameWhen(g).end < now);
    const next = upcoming.find((g) => g.kind === "game") || upcoming[0] || data.games[data.games.length - 1];
    const hero = document.getElementById("hero-slot");
    if (hero && next) hero.innerHTML = heroHTML(next, data);
    list.innerHTML = data.games.map(rowHTML).join("");
    bindSchedFilters();
  } catch (e) {
    list.innerHTML = `<p class="meta">Serve this folder over http to load the 2027 rail.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  mountChrome();
  bindFlips();
  bindTilt();
  bindMotion();
  bindOrbit();
  renderRosterPage();
  renderCoachesPage();
  renderAlumniPage();
  renderShopPage();
  renderSchedulePage();
});



