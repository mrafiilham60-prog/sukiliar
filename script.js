(() => {
  "use strict";

  const rain = document.getElementById("rain");
  const audio = document.getElementById("song");
  const musicButton = document.getElementById("musicToggle");
  const viewer = document.getElementById("photoViewer");
  const viewerImage = document.getElementById("viewerImage");
  const viewerClose = document.getElementById("viewerClose");
  const viewerBackdrop = document.getElementById("viewerBackdrop");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const photos = [
    { src: "assets/foto1.webp", alt: "Foto kenangan 1" },
    { src: "assets/foto2.webp", alt: "Foto kenangan 2" },
    { src: "assets/foto3.webp", alt: "Foto kenangan 3" },
    { src: "assets/foto4.webp", alt: "Foto kenangan 4" },
    { src: "assets/foto5.webp", alt: "Foto kenangan 5" },
    { src: "assets/foto6.webp", alt: "Foto kenangan 6" },
  ];

  // Muat & decode semua foto lebih dulu (selama layar awal), supaya bingkai putih
  // tidak muncul kosong sebelum gambarnya siap.
  photos.forEach((p) => {
    const img = new Image();
    img.decoding = "async";
    img.src = p.src;
    if (img.decode) img.decode().catch(() => {});
  });

  const randomBetween = (min, max) => min + Math.random() * (max - min);

  function buildPhotoRain() {
    if (!rain) return;

    rain.replaceChildren();

    const isStatic = reducedMotionQuery.matches;
    const compact = window.matchMedia("(max-width: 700px)").matches;
    const total = isStatic ? photos.length : (compact ? 14 : 24);
    const lanes = compact ? 5 : 8;
    const laneStride = compact ? 2 : 3; // lompat antar lintasan agar foto beruntun tidak bersebelahan
    const slotsPerLane = Math.ceil(total / lanes);
    const laneSpan = compact ? 72 : 78;
    const offset = Math.floor(Math.random() * photos.length);
    const fragment = document.createDocumentFragment();

    rain.classList.toggle("is-static", isStatic);

    for (let index = 0; index < total; index += 1) {
      const photoIndex = (index + offset) % photos.length;
      const photo = photos[photoIndex];

      const card = document.createElement("div");
      card.className = "rise-photo is-loading"; // tersembunyi sampai gambarnya siap

      const size = isStatic
        ? 0
        : compact
          ? randomBetween(60, 94)
          : randomBetween(86, 140);

      const lane = (index * laneStride) % lanes;
      const slot = Math.floor(index / lanes);
      const duration = randomBetween(16, 21);
      // Foto muncul satu per satu (delay positif berurutan), jadi hujan menebal perlahan.
      const delay = -4.5 + index * (compact ? 1.4 : 1) + randomBetween(0, 0.5);
      const swayDuration = randomBetween(5, 8);
      const swayDelay = -randomBetween(0, swayDuration);

      // Satu lintasan horizontal per lane, dengan fase vertikal yang berjarak.
      // Lebar area dikurangi lebar foto, jadi lintasan kiri-kanan terbagi rata
      // di seluruh lebar layar (foto paling kanan tidak keluar dari tepi).
      const laneFrac = lanes === 1 ? 0.5 : lane / (lanes - 1);
      const areaW = Math.max(0, (rain.clientWidth || window.innerWidth) - size);
      const edge = 0.03; // sisakan sedikit ruang di tepi untuk goyangan foto
      const frac = Math.min(1, Math.max(0, edge + laneFrac * (1 - 2 * edge) + randomBetween(-0.03, 0.03)));
      const x = frac * areaW;

      card.style.setProperty("--x", `${x}px`);
      card.style.setProperty("--size", `${size}px`);
      card.style.setProperty("--duration", `${duration}s`);
      card.style.setProperty("--delay", `${delay}s`);
      card.style.setProperty("--sway-duration", `${swayDuration}s`);
      card.style.setProperty("--sway-delay", `${swayDelay}s`);
      card.style.setProperty("--rotation", `${randomBetween(-14, 14)}deg`);
      card.style.setProperty("--sway-a", `${randomBetween(-20, -5)}px`);
      card.style.setProperty("--sway-b", `${randomBetween(5, 20)}px`);
      card.style.setProperty("--photo-opacity", randomBetween(0.78, 1).toFixed(2));
      card.style.zIndex = String(Math.round(size) || 1);

      const sway = document.createElement("div");
      sway.className = "rise-photo__sway";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "rise-photo__button";
      button.setAttribute("aria-label", `Perbesar foto: ${photo.alt}`);

      const frame = document.createElement("div");
      frame.className = "rise-photo__frame";

      const image = document.createElement("img");
      image.src = photo.src;
      image.alt = "";
      image.width = 900;
      image.height = 1125;
      image.loading = "eager";
      image.decoding = "async";
      image.draggable = false;

      const revealCard = () => card.classList.remove("is-loading");
      if (image.decode) {
        image.decode().then(revealCard, revealCard);
      } else {
        image.addEventListener("load", revealCard, { once: true });
        image.addEventListener("error", revealCard, { once: true });
      }

      frame.append(image);
      button.append(frame);
      sway.append(button);
      card.append(sway);
      fragment.append(card);

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openViewer(photo.src, photo.alt, button);
      });
    }

    rain.append(fragment);
  }

  /* -------------------------------------------------------
     Rose Petals Animation
     ------------------------------------------------------- */
  const petalsCanvas = document.getElementById("petalsCanvas");
  if (petalsCanvas) {
    const pCtx = petalsCanvas.getContext("2d");
    let petals = [];

    function resizePetals() {
      petalsCanvas.width = window.innerWidth;
      petalsCanvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizePetals);
    resizePetals();

    const petalCount = window.matchMedia("(max-width: 700px)").matches ? 18 : 28;
    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: randomBetween(8, 16),
        speedY: randomBetween(0.8, 1.8),
        speedX: randomBetween(-0.8, 0.8),
        angle: Math.random() * 360,
        angularSpeed: randomBetween(-1.5, 1.5),
        opacity: randomBetween(0.35, 0.75)
      });
    }

    function animatePetals() {
      if (!reducedMotionQuery.matches) {
        pCtx.clearRect(0, 0, petalsCanvas.width, petalsCanvas.height);
        petals.forEach((p) => {
          p.y += p.speedY;
          p.x += Math.sin(p.y * 0.015) * p.speedX;
          p.angle += p.angularSpeed;

          if (p.y > petalsCanvas.height + 20) {
            p.y = -20;
            p.x = Math.random() * petalsCanvas.width;
          }

          pCtx.save();
          pCtx.translate(p.x, p.y);
          pCtx.rotate((p.angle * Math.PI) / 180);
          pCtx.globalAlpha = p.opacity;

          pCtx.beginPath();
          pCtx.moveTo(0, 0);
          pCtx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size / 2, p.size / 2, 0, p.size);
          pCtx.bezierCurveTo(p.size / 2, p.size / 2, p.size / 2, -p.size / 2, 0, 0);
          pCtx.fillStyle = "#8a2434";
          pCtx.fill();

          pCtx.restore();
        });
      }
      requestAnimationFrame(animatePetals);
    }
    animatePetals();
  }

  /* -------------------------------------------------------
     Photo Open Burst Animation
     ------------------------------------------------------- */
  const burstCanvas = document.getElementById("burstCanvas");
  let fireBurst = () => {};

  if (burstCanvas) {
    const bCtx = burstCanvas.getContext("2d");
    let burstParticles = [];

    function resizeBurst() {
      burstCanvas.width = window.innerWidth;
      burstCanvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeBurst);
    resizeBurst();

    fireBurst = (originX, originY) => {
      if (reducedMotionQuery.matches) return;
      const x = originX || window.innerWidth / 2;
      const y = originY || window.innerHeight / 2;
      const colors = ["#d7b27b", "#f7eddb", "#e04b63", "#ffffff", "#b88a50", "#9b2c3d"];
      const count = window.matchMedia("(max-width: 700px)").matches ? 70 : 105;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomBetween(4, 16);
        const type = Math.random();
        burstParticles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.5,
          gravity: 0.28,
          friction: 0.96,
          size: randomBetween(6, 12),
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: randomBetween(-9, 9),
          opacity: 1,
          shape: type < 0.5 ? "rect" : type < 0.8 ? "star" : "heart"
        });
      }
    };

    function drawStar(ctx, size) {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(Math.cos(((18 + i * 90) * Math.PI) / 180) * size, -Math.sin(((18 + i * 90) * Math.PI) / 180) * size);
        ctx.lineTo(Math.cos(((63 + i * 90) * Math.PI) / 180) * (size * 0.35), -Math.sin(((63 + i * 90) * Math.PI) / 180) * (size * 0.35));
      }
      ctx.closePath();
      ctx.fill();
    }

    function drawHeart(ctx, size) {
      ctx.beginPath();
      const topCurveHeight = size * 0.3;
      ctx.moveTo(0, topCurveHeight);
      ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
      ctx.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, size, 0, size * 1.15);
      ctx.bezierCurveTo(0, size, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
      ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
      ctx.closePath();
      ctx.fill();
    }

    function animateBurst() {
      bCtx.clearRect(0, 0, burstCanvas.width, burstCanvas.height);
      burstParticles = burstParticles.filter((p) => p.opacity > 0.02);

      burstParticles.forEach((p) => {
        p.vx *= p.friction;
        p.vy = (p.vy + p.gravity) * p.friction;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.013;

        bCtx.save();
        bCtx.translate(p.x, p.y);
        bCtx.rotate((p.rotation * Math.PI) / 180);
        bCtx.globalAlpha = Math.max(0, p.opacity);
        bCtx.fillStyle = p.color;

        if (p.shape === "rect") {
          bCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        } else if (p.shape === "star") {
          drawStar(bCtx, p.size);
        } else {
          drawHeart(bCtx, p.size);
        }

        bCtx.restore();
      });

      requestAnimationFrame(animateBurst);
    }
    animateBurst();
  }

  /* -------------------------------------------------------
     Penampil foto
     ------------------------------------------------------- */

  let viewerTrigger = null;

  function openViewer(src, alt, trigger) {
    if (!viewer || !viewerImage) return;

    viewerTrigger = trigger || null;
    viewerImage.src = src;
    viewerImage.alt = alt || "";

    const rect = trigger ? trigger.getBoundingClientRect() : null;
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    fireBurst(originX, originY);

    viewer.inert = false;
    viewer.removeAttribute("aria-hidden");
    viewer.classList.add("is-open");
    document.body.classList.add("viewer-open");

    window.requestAnimationFrame(() => {
      viewerClose?.focus({ preventScroll: true });
    });
  }

  function closeViewer() {
    if (!viewer || !viewer.classList.contains("is-open")) return;

    viewer.classList.remove("is-open");
    viewer.setAttribute("aria-hidden", "true");
    viewer.inert = true;
    document.body.classList.remove("viewer-open");

    // Jangan fokuskan ulang foto yang sedang bergerak; cukup lepas fokusnya
    // supaya animasinya tidak tertahan setelah viewer ditutup.
    if (viewerTrigger && viewerTrigger.isConnected) {
      viewerTrigger.blur();
    }
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    viewerTrigger = null;
  }

  viewerClose?.addEventListener("click", closeViewer);
  viewerBackdrop?.addEventListener("click", closeViewer);

  const greetingTitle = document.querySelector(".greeting__title");
  greetingTitle?.addEventListener("click", (e) => {
    fireBurst(e.clientX, e.clientY);
  });

  viewer?.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      viewerClose?.focus({ preventScroll: true });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && viewer?.classList.contains("is-open")) {
      event.preventDefault();
      closeViewer();
    }
  });

  /* -------------------------------------------------------
     Lagu
     ------------------------------------------------------- */

  function syncMusicState() {
    const isPlaying = !audio.paused;
    musicButton.classList.toggle("is-playing", isPlaying);
    musicButton.setAttribute("aria-pressed", String(isPlaying));
    musicButton.setAttribute("aria-label", isPlaying ? "Jeda musik" : "Putar musik");
  }

  function removeUnlockListeners() {
    document.removeEventListener("pointerdown", unlockMusic, true);
    document.removeEventListener("keydown", unlockMusic, true);
  }

  function attemptPlay() {
    const attempt = audio.play();
    if (attempt && typeof attempt.then === "function") {
      attempt.then(removeUnlockListeners).catch(() => {
        // Autoplay bersuara biasanya ditahan browser sampai ada gestur.
      });
    } else {
      removeUnlockListeners();
    }
  }

  function unlockMusic(event) {
    if (musicButton.contains(event.target)) return;

    removeUnlockListeners();
    startExperience();
    if (audio.paused) {
      attemptPlay();
    }
  }

  /* -------------------------------------------------------
     Pesan & Doa Melayang
     ------------------------------------------------------- */
  const quotes = [
    "✨ Semoga selalu dikelilingi orang baik!",
    "🥂 Bahagia di setiap langkahmu!",
    "🌟 Sukses untuk semua impianmu!",
    "🤍 Selalu jadi teman yang terbaik!",
    "🎂 Happy Birthday, Kawann!",
    "🌸 Semoga harimu penuh senyuman!"
  ];

  let quotesRunning = false;

  function startFloatingQuotes() {
    if (quotesRunning) return; // cegah jadwal ucapan ganda, walau terpanggil dua kali
    quotesRunning = true;
    let quoteLayer = document.getElementById("quoteLayer");
    if (!quoteLayer) {
      quoteLayer = document.createElement("div");
      quoteLayer.id = "quoteLayer";
      quoteLayer.className = "quote-layer";
      quoteLayer.setAttribute("aria-hidden", "true");
      document.body.appendChild(quoteLayer);
    }

    if (reducedMotionQuery.matches || !rain) return;

    let quoteSide = false;

    function spawnQuote() {
      const bubble = document.createElement("div");
      bubble.className = "quote-bubble";
      // Pilih ucapan yang belum sedang tampil, supaya tidak ada kalimat kembar di layar.
      const onScreen = Array.from(quoteLayer.children, (el) => el.textContent);
      const available = quotes.filter((q) => !onScreen.includes(q));
      const pool = available.length ? available : quotes;
      bubble.textContent = pool[Math.floor(Math.random() * pool.length)];

      const duration = randomBetween(11, 15);
      bubble.style.animationDuration = `${duration}s`;

      quoteLayer.appendChild(bubble);

      // Ukur lebar gelembung supaya tidak terpotong di tepi layar, dan
      // geser bergantian ke sisi kiri/kanan agar tidak bertumpuk.
      const margin = 12;
      const maxLeft = Math.max(margin, window.innerWidth - bubble.offsetWidth - margin);
      const half = Math.max(0, (maxLeft - margin) / 2);
      quoteSide = !quoteSide;
      const minX = margin + (quoteSide ? half : 0);
      const left = minX + Math.random() * half;
      bubble.style.left = `${Math.min(maxLeft, left)}px`;
      setTimeout(() => bubble.remove(), duration * 1000);
    }

    // Satu jadwal saja: ucapan pertama setelah 3,5 detik, lalu tiap 3,8 detik.
    setTimeout(() => {
      spawnQuote();
      setInterval(spawnQuote, 3800);
    }, 3500);
  }

  /* -------------------------------------------------------
     Mulai: foto & ucapan baru muncul setelah lagu berjalan
     (otomatis bila autoplay diizinkan, atau saat layar diketuk pertama kali)
     ------------------------------------------------------- */
  let started = false;
  let photosReady = false;

  function startExperience() {
    if (started) return;
    started = true;
    document.body.classList.add("is-started");
    if (rain) {
      setTimeout(() => {
        photosReady = true;
        buildPhotoRain();
        startFloatingQuotes();
      }, 3000);
    }
  }

  reducedMotionQuery.addEventListener?.("change", () => {
    if (photosReady) buildPhotoRain();
  });

  if (!(audio && musicButton)) {
    startExperience();
  }

  if (audio && musicButton) {
    musicButton.hidden = false;
    audio.volume = 0.55;
    audio.loop = true;

    musicButton.addEventListener("click", () => {
      removeUnlockListeners();
      startExperience();

      if (audio.paused) {
        attemptPlay();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", syncMusicState);
    audio.addEventListener("play", startExperience);
    audio.addEventListener("pause", syncMusicState);
    audio.addEventListener("ended", syncMusicState);

    syncMusicState();
  }

})();
