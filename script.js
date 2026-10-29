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
    { src: "assets/foto6.webp", alt: "Foto kenangan 6" }
  ];

  const randomBetween = (min, max) => min + Math.random() * (max - min);

  function buildPhotoRain() {
    if (!rain) return;

    rain.replaceChildren();

    const isStatic = reducedMotionQuery.matches;
    const compact = window.matchMedia("(max-width: 700px)").matches;
    const total = isStatic ? photos.length : (compact ? 12 : 18);
    const lanes = compact ? 4 : 5;
    const slotsPerLane = Math.ceil(total / lanes);
    const laneSpan = compact ? 71 : 77;
    const offset = Math.floor(Math.random() * photos.length);
    const fragment = document.createDocumentFragment();

    rain.classList.toggle("is-static", isStatic);

    for (let index = 0; index < total; index += 1) {
      const photoIndex = (index + offset) % photos.length;
      const photo = photos[photoIndex];

      const card = document.createElement("div");
      card.className = "rise-photo";

      const size = isStatic
        ? 0
        : compact
          ? randomBetween(60, 94)
          : randomBetween(86, 140);

      const lane = index % lanes;
      const slot = Math.floor(index / lanes);
      const duration = randomBetween(15, 24);
      const phase = (slot + randomBetween(0.05, 0.45)) / slotsPerLane;
      const delay = -phase * duration;
      const swayDuration = randomBetween(5, 8);
      const swayDelay = -randomBetween(0, swayDuration);

      // Satu lintasan horizontal per lane, dengan fase vertikal yang berjarak.
      const laneStart = lanes === 1 ? 0 : (lane / (lanes - 1)) * laneSpan;
      const x = Math.min(82, Math.max(0, 1 + laneStart + randomBetween(-1, 2.5)));

      card.style.setProperty("--x", `${x}%`);
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
     Penampil foto
     ------------------------------------------------------- */

  let viewerTrigger = null;

  function openViewer(src, alt, trigger) {
    if (!viewer || !viewerImage) return;

    viewerTrigger = trigger || null;
    viewerImage.src = src;
    viewerImage.alt = alt || "";

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
    if (audio.paused) {
      attemptPlay();
    }
  }

  if (rain) {
    reducedMotionQuery.addEventListener?.("change", buildPhotoRain);
    buildPhotoRain();
  }

  if (audio && musicButton) {
    musicButton.hidden = false;
    audio.volume = 0.55;
    audio.loop = true;

    document.addEventListener("pointerdown", unlockMusic, true);
    document.addEventListener("keydown", unlockMusic, true);

    musicButton.addEventListener("click", () => {
      removeUnlockListeners();

      if (audio.paused) {
        attemptPlay();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", syncMusicState);
    audio.addEventListener("pause", syncMusicState);
    audio.addEventListener("ended", syncMusicState);

    syncMusicState();
    attemptPlay();
  }

})();
