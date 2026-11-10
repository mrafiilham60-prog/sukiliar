(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const rain = $("#rain"), audio = $("#song"), dock = $("#dock"), playBtn = $("#play"), progress = $("#progress");
  const lb = $("#lb"), lbImg = $("#lbImg"), frame = $("#frame"), lbCount = $("#lbCount"), lbClose = $("#lbClose");
  const rm = matchMedia("(prefers-reduced-motion: reduce)");
  const rand = (a, b) => a + Math.random() * (b - a);

  // Ganti foto di sini: [nomor file, lebar, tinggi].
  const photos = [[1, 1080, 810], [2, 1080, 1080], [3, 1080, 810], [4, 1080, 1080], [5, 1080, 810], [6, 1080, 720]]
    .map(([n, w, h]) => ({ src: `assets/foto${n}.webp`, w, h, alt: `Foto kenangan ${n}` }));
  const wishes = [
    "♡Semoga selalu dikelilingi orang baik.♡",
    "♡Bahagia di setiap langkahmu.♡",
    "♡Sukses untuk semua impianmu.♡",
    "♡Terima kasih sudah jadi teman yang baik.♡",
    "♡Semoga harimu penuh senyuman.♡",
    "♡Happy birthday, kak! ♡"
  ];

  // Muat foto lebih dulu supaya bingkai tidak kosong saat naik.
  photos.forEach((p) => { const im = new Image(); im.src = p.src; im.decode?.().catch(() => {}); });

  /* ---------- Hujan foto ---------- */
  new ResizeObserver(() => rain.style.setProperty("--rh", `${rain.clientHeight}px`)).observe(rain);

  function build() {
    rain.replaceChildren();
    const compact = matchMedia("(max-width: 700px)").matches;
    const isStatic = rm.matches;
    rain.classList.toggle("static", isStatic);
    const total = isStatic ? photos.length : compact ? 12 : 20;
    const lanes = compact ? 4 : 7;
    const offset = Math.floor(Math.random() * photos.length);
    const frag = document.createDocumentFragment();

    for (let i = 0; i < total; i++) {
      const p = photos[(i + offset) % photos.length];
      const size = compact ? rand(88, 124) : rand(120, 180);
      const lane = (i * 3) % lanes;
      const areaW = Math.max(0, rain.clientWidth - size);
      const frac = Math.min(1, Math.max(0, 0.03 + (lane / (lanes - 1)) * 0.94 + rand(-0.03, 0.03)));
      const sd = rand(5, 8);

      const card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.setAttribute("aria-label", `Perbesar ${p.alt.toLowerCase()}`);
      const v = {
        x: `${frac * areaW}px`, w: `${size}px`, z: Math.round(size), op: rand(0.88, 1).toFixed(2),
        dur: `${rand(8, 13)}s`, delay: `${(i * (compact ? 1.0 : 0.7) + rand(0, 0.3)).toFixed(2)}s`,
        ch: `${size * 1.3 + 50}px`, sd: `${sd}s`, sdel: `-${rand(0, sd).toFixed(2)}s`,
        sa: `${rand(-18, -5)}px`, sb: `${rand(5, 18)}px`, rot: `${rand(-10, 10).toFixed(1)}deg`
      };
      for (const k in v) card.style.setProperty(`--${k}`, v[k]);

      const sway = document.createElement("span");
      sway.className = "sway";
      const pol = document.createElement("span");
      pol.className = "pol";
      const im = new Image();
      im.src = p.src; im.alt = ""; im.width = p.w; im.height = p.h; im.decoding = "async"; im.draggable = false;
      pol.append(im); sway.append(pol); card.append(sway); frag.append(card);
      card.addEventListener("click", () => openLB((i + offset) % photos.length));
    }
    rain.append(frag);
  }

  let rw = innerWidth, timer;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (Math.abs(innerWidth - rw) > 30) { rw = innerWidth; build(); } }, 250);
  });
  rm.addEventListener?.("change", build);

  /* ---------- Penampil foto ---------- */
  let cur = 0, startX = null;
  function paint() {
    const p = photos[cur];
    lbImg.src = p.src; lbImg.alt = p.alt;
    lbCount.textContent = `${cur + 1} / ${photos.length}`;
    frame.classList.remove("in"); void frame.offsetWidth; frame.classList.add("in");
  }
  function openLB(i) {
    cur = i; paint();
    lb.inert = false; lb.classList.add("on"); document.body.classList.add("lb-open");
    lbClose.focus({ preventScroll: true });
    $("#hint")?.remove();
  }
  function closeLB() {
    if (!lb.classList.contains("on")) return;
    lb.classList.remove("on"); lb.inert = true; document.body.classList.remove("lb-open");
    document.activeElement?.blur();
  }
  const step = (d) => { cur = (cur + d + photos.length) % photos.length; paint(); };

  lbClose.onclick = closeLB;
  $("#lbPrev").onclick = () => step(-1);
  $("#lbNext").onclick = () => step(1);
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.id === "stage") closeLB(); });
  lb.addEventListener("pointerdown", (e) => { startX = e.clientX; });
  lb.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX; startX = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("on")) return;
    if (e.key === "Escape") closeLB();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "Tab") {
      const f = [lbClose, $("#lbPrev"), $("#lbNext")];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  /* ---------- Musik ---------- */
  audio.volume = 0.6;
  function sync() {
    const on = !audio.paused;
    dock.classList.toggle("playing", on);
    playBtn.setAttribute("aria-pressed", String(on));
    playBtn.setAttribute("aria-label", on ? "Jeda musik" : "Putar musik");
  }
  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);
  audio.addEventListener("timeupdate", () => {
    if (audio.duration) progress.style.transform = `scaleX(${audio.currentTime / audio.duration})`;
  });
  playBtn.onclick = () => (audio.paused ? audio.play().catch(() => {}) : audio.pause());

  // Status di pemutar: file lagu cukup besar, jadi di HP bisa butuh beberapa detik sebelum bunyi.
  const sub = $("#sub");
  audio.addEventListener("waiting", () => { sub.textContent = "Memuat lagu…"; });
  audio.addEventListener("playing", () => { sub.textContent = "Tulus"; });

  function tryPlay() {
    const p = audio.play();
    if (!p || !p.catch) return;
    p.catch(() => {
      // Diblokir browser: beri petunjuk, dan coba lagi pada ketukan berikutnya di mana saja.
      sub.textContent = "Ketuk ▶ untuk memutar";
      document.addEventListener("pointerdown", (e) => {
        if (audio.paused && !playBtn.contains(e.target)) tryPlay();
      }, { once: true, capture: true });
    });
  }

  /* ---------- Ucapan bergantian ---------- */
  const wish = $("#wish");
  let w = 0;
  function showWish() {
    wish.classList.remove("show");
    setTimeout(() => { wish.textContent = wishes[w++ % wishes.length]; wish.classList.add("show"); }, rm.matches ? 0 : 450);
  }

  /* ---------- Hujan Kertas Pesta (Continuous Party Paper Rain) ---------- */
  const canvas = $("#paperRain");
  const ctx = canvas ? canvas.getContext("2d") : null;
  let particles = [];
  let animId = null;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const confettiColors = [
    "#c63f5b", "#f2d38c", "#e76f51", "#2a9d8f", "#e9c46a",
    "#9b5de5", "#f4a261", "#3b2a26", "#ffd166", "#f7efe3"
  ];

  function createParticle(initialY) {
    const isRibbon = Math.random() > 0.4;
    return {
      x: Math.random() * (canvas ? canvas.width : 500),
      y: initialY !== undefined ? initialY : -20 - Math.random() * 50,
      w: isRibbon ? rand(5, 8) : rand(7, 11),
      h: isRibbon ? rand(14, 24) : rand(7, 11),
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      speedY: rand(1.3, 2.9),
      drift: rand(0.5, 1.6),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: rand(0.04, 0.08),
      rot: Math.random() * 360,
      rotSpeed: rand(-3, 3),
      flip: Math.random() * Math.PI,
      flipSpeed: rand(0.05, 0.1)
    };
  }

  function startPaperRain() {
    if (!canvas || !ctx || rm.matches) return;
    const count = window.innerWidth < 700 ? 55 : 85;
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(Math.random() * canvas.height));
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const h = canvas.height;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.wobble += p.wobbleSpeed;
        p.x += Math.sin(p.wobble) * p.drift;
        p.flip += p.flipSpeed;
        p.rot += p.rotSpeed;

        if (p.y > h + 25) {
          particles[i] = createParticle(-20);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.scale(1, Math.cos(p.flip)); // Efek melayang 3D bolak-balik
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    }

    if (!animId) {
      render();
    }
  }

  /* ---------- Pop Tambahan saat Buka Kejutan ---------- */
  function firePartyPaperBomb() {
    if (typeof confetti !== "function") return;
    const colors = ["#c63f5b", "#f2d38c", "#e76f51", "#2a9d8f", "#e9c46a", "#3b2a26", "#f4a261"];

    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6, x: 0.5 },
      colors: colors,
      startVelocity: 38,
      ticks: 250,
      gravity: 0.85
    });
  }

  // Sentuh / klik judul setelah terbuka untuk ledakan kertas lagi
  $(".intro")?.addEventListener("click", () => {
    if (document.body.classList.contains("opened") && typeof confetti === "function") {
      confetti({
        particleCount: 40,
        spread: 75,
        origin: { y: 0.3, x: 0.5 },
        colors: ["#c63f5b", "#f2d38c", "#e76f51", "#2a9d8f", "#e9c46a", "#3b2a26"],
        startVelocity: 30,
        ticks: 200
      });
    }
  });

  /* ---------- Buka kejutan: satu ketukan memulai lagu, judul, dan hujan foto ---------- */
  $("#open").onclick = () => {
    tryPlay(); // paling awal, agar masih dihitung sebagai gestur ketukan (aturan autoplay di HP)
    document.body.classList.add("opened");
    $("#cover").inert = true;
    dock.hidden = false;
    playBtn.focus({ preventScroll: true });

    // Mulai hujan kertas pesta terus-menerus!
    startPaperRain();

    // Efek pop pembuka
    setTimeout(firePartyPaperBomb, 350);

    setTimeout(() => { showWish(); setInterval(showWish, 5200); }, 1500);
  };

  build();
})();
