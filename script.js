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
   SPOTLIGHT OVERLAY — pure canvas, no tsParticles dependency
   Strategy:
     1. Particles are rendered bright (opacity 0.5–0.8)
     2. A fixed canvas sits ON TOP of particles (z-index: 1)
        and paints a dark semi-transparent rectangle over
        the ENTIRE screen every frame
     3. Then we ERASE a circular hole at the mouse position
        using "destination-out" on a second pass so the
        particles show through only near the cursor
   Result: dark everywhere, lit circle follows the mouse
   Works at any scroll depth because we use clientX/clientY
   ============================================================ */
(function initSpotlight() {
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
  const BG = "rgba(7, 11, 20, 0.88)"; // matches body background

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
  });
  window.addEventListener("mouseleave", () => {
    mx = -9999; my = -9999;
  });

  function frame() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Step 1: fill entire canvas with the dark overlay
   // Step 1: fill entire canvas with the dark overlay
    // but SKIP the header area (first 96px) so it's never dimmed
    const headerHeight = document.querySelector(".header").offsetHeight;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = BG;
    ctx.fillRect(0, headerHeight, w, h - headerHeight);

    // Step 2: punch a transparent circle at the mouse
    // "destination-out" erases pixels proportional to alpha
    if (mx > -100) {
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, RADIUS);
      // Center fully erased → edges blend back to solid dark
    grad.addColorStop(0,   "rgba(0,0,0,0.85)");  // slightly dimmed even at cursor
grad.addColorStop(0.5, "rgba(0,0,0,0.6)");   // soft mid fade
grad.addColorStop(1,   "rgba(0,0,0,0)");     // no erase at edge

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    // Step 3: add a faint purple tint bloom at cursor on top
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
   TSPARTICLES — bright so they show through the spotlight hole
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("tsparticles");
  if (!container) return;

  tsParticles.load("tsparticles", {
    fullScreen: { enable: false },
    fpsLimit: 60,

    interactivity: {
      detectsOn: "window",
      events: {
        onHover: {
          enable: true,
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
        value: 75,
      },
      opacity: {
        // Bright — the overlay canvas darkens them outside the spotlight
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