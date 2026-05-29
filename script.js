const root = document.documentElement;
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const toTop = document.querySelector("[data-to-top]");
const storedTheme = localStorage.getItem("theme");

root.dataset.theme = storedTheme || "dark";

navToggle.addEventListener("click", () => {
  nav.classList.toggle("open");
});

nav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    nav.classList.remove("open");
  }
});

themeToggle.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("theme", nextTheme);
});

toTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", () => {
  toTop.classList.toggle("visible", window.scrollY > 560);
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  observer.observe(element);
});

/* ============================================================
   SPOTLIGHT OVERLAY — pure canvas
   On touch devices the spotlight is disabled (no cursor to follow)
   ============================================================ */
(function initSpotlight() {
  // Detect touch-only devices — skip spotlight, it's not useful there
  const isTouchOnly = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  const canvas = document.createElement("canvas");
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let mx = -9999, my = -9999;
  const RADIUS = 400;
  const BG = "rgba(5, 7, 12, 0.88)";

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  if (!isTouchOnly) {
    // Mouse devices: spotlight follows cursor
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
    });
    window.addEventListener("mouseleave", () => {
      mx = -9999; my = -9999;
    });
  }

  function frame() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const headerEl = document.querySelector(".header");
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;

    if (isTouchOnly) {
      // On touch: just draw a lighter static overlay so particles are still visible
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(7, 11, 20, 0.55)";
      ctx.fillRect(0, headerHeight, w, h - headerHeight);
      requestAnimationFrame(frame);
      return;
    }

    // Step 1: dark overlay (skip header)
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = BG;
    ctx.fillRect(0, headerHeight, w, h - headerHeight);

    // Step 2: punch transparent circle at mouse
    if (mx > -100) {
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, RADIUS);
      grad.addColorStop(0,   "rgba(0,0,0,0.85)");
      grad.addColorStop(0.5, "rgba(0,0,0,0.6)");
      grad.addColorStop(1,   "rgba(0,0,0,0)");

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    // Step 3: purple tint bloom at cursor
    if (mx > -100) {
      ctx.globalCompositeOperation = "source-over";
      const bloom = ctx.createRadialGradient(mx, my, 0, mx, my, RADIUS * 0.7);
      bloom.addColorStop(0,   "rgba(107, 0, 255, 0.12)");
      bloom.addColorStop(0.5, "rgba(91, 200, 245, 0.05)");
      bloom.addColorStop(1,   "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(mx, my, RADIUS * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  frame();
})();

/* ============================================================
   ILLUSTRATION SCALER
   Typing scene is a fixed 560×520px CSS canvas.
   Hero art is a responsive container that lottie fills natively.
   We watch the section width and scale the typing-scene so it
   always fits without overflow, on every viewport size.
   ============================================================ */
(function initIllustrationScaler() {
  const SCENE_W = 560;   // design width of .typing-scene
  const SCENE_H = 520;   // design height of .typing-scene
  const MAX_SCALE = 1;   // never upscale beyond natural size
  const PADDING = 40;    // breathing room on each side (px)

  const scene = document.querySelector(".typing-scene");
  if (!scene) return;

  // Wrap scene in a clip div to hide overflow + collapse height
  const clip = document.createElement("div");
  clip.className = "typing-scene-clip";
  scene.parentNode.insertBefore(clip, scene);
  clip.appendChild(scene);

  function updateScale() {
    // Available width = clip wrapper width (same as section column)
    const available = clip.offsetWidth - PADDING;
    const scale = Math.min(MAX_SCALE, available / SCENE_W);
    const scaledH = Math.round(SCENE_H * scale);

    scene.style.setProperty("--typing-scale", scale);
    // Also set transform directly so it works even without CSS var support
    scene.style.transform = `scale(${scale})`;
    scene.style.marginBottom = `${(scale - 1) * SCENE_H}px`;
    // Set clip height so it collapses to actual rendered height
    clip.style.height = scaledH + "px";
  }

  // Run on load and on any resize
  updateScale();
  const ro = new ResizeObserver(updateScale);
  ro.observe(clip);
  window.addEventListener("resize", updateScale);
})();


document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("tsparticles");
  if (!container) return;

  // Reduce particle count on mobile for better performance
  const isMobile = window.innerWidth < 820;

  tsParticles.load("tsparticles", {
    fullScreen: { enable: false },
    fpsLimit: 60,

    interactivity: {
      detectsOn: "window",
      events: {
        onHover: {
          enable: !isMobile,
          mode: "grab",
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 180,
          links: { opacity: 1, color: "#7c3aed" },
        },
      },
    },

    particles: {
      color: {
        value: ["#8b5cf6", "#5bc8f5", "#c4b5fd", "#ffffff"],
      },
      links: {
        color: "#7c3aed",
        distance: 150,
        enable: true,
        opacity: 0.55,
        width: 1.2,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "bounce" },
        random: true,
        speed: 0.9,
        straight: false,
      },
      number: {
        density: { enable: true, area: 850 },
        value: isMobile ? 35 : 75,
      },
      opacity: {
        value: { min: 0.5, max: 0.85 },
        animation: {
          enable: true,
          speed: 0.6,
          minimumValue: 0.3,
          sync: false,
        },
      },
      shape: { type: "circle" },
      size: {
        value: { min: 1.5, max: 3.5 },
      },
    },

    detectRetina: true,
  });
});