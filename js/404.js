/**
 * 麗探祭 404 — Immersive Inquiry Experience
 * Network particle system + interactive compass + micro-interactions
 * Designed exclusively from the 麗探祭 poster aesthetic
 */
(function () {
  "use strict";

  // ----------------------------------------------------------
  // Network Particle Canvas (matches poster circuit lines)
  // ----------------------------------------------------------
  const canvas = document.getElementById("network-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  let nodes = [];
  let mouse = { x: -9999, y: -9999 };
  let rafId = null;

  const CONFIG = {
    nodeCount: 0,          // computed by size
    maxDist: 140,
    mouseDist: 180,
    speed: 0.35,
    gold: "212, 175, 55",
    green: "45, 90, 39",
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const density = Math.floor((w * h) / 14000);
    CONFIG.nodeCount = Math.max(28, Math.min(70, density));
    initNodes();
  }

  function initNodes() {
    nodes = [];
    for (let i = 0; i < CONFIG.nodeCount; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * CONFIG.speed,
        vy: (Math.random() - 0.5) * CONFIG.speed,
        r: Math.random() * 1.8 + 0.8,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // subtle background radial
    const grd = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, w * 0.7);
    grd.addColorStop(0, "rgba(10, 47, 26, 0.15)");
    grd.addColorStop(1, "rgba(3, 26, 13, 0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // update & draw connections
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
      a.pulse += 0.02;

      if (a.x < -20) a.x = w + 20;
      if (a.x > w + 20) a.x = -20;
      if (a.y < -20) a.y = h + 20;
      if (a.y > h + 20) a.y = -20;

      // mouse attraction
      const dxm = mouse.x - a.x;
      const dym = mouse.y - a.y;
      const dm = Math.sqrt(dxm * dxm + dym * dym);
      if (dm < CONFIG.mouseDist && dm > 1) {
        a.vx += (dxm / dm) * 0.015;
        a.vy += (dym / dm) * 0.015;
      }

      // damping
      a.vx *= 0.995;
      a.vy *= 0.995;

      // clamp speed
      const sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
      if (sp > 1.2) {
        a.vx = (a.vx / sp) * 1.2;
        a.vy = (a.vy / sp) * 1.2;
      }

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.maxDist) {
          const alpha = (1 - dist / CONFIG.maxDist) * 0.22;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${CONFIG.gold}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // node glow
      const pulseR = a.r + Math.sin(a.pulse) * 0.4;
      const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, pulseR * 4);
      g.addColorStop(0, `rgba(${CONFIG.gold}, 0.35)`);
      g.addColorStop(1, `rgba(${CONFIG.gold}, 0)`);
      ctx.beginPath();
      ctx.fillStyle = g;
      ctx.arc(a.x, a.y, pulseR * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(${CONFIG.gold}, 0.7)`;
      ctx.arc(a.x, a.y, pulseR, 0, Math.PI * 2);
      ctx.fill();
    }

    // mouse hub
    if (mouse.x > 0) {
      const hg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 60);
      hg.addColorStop(0, "rgba(212, 175, 55, 0.12)");
      hg.addColorStop(1, "rgba(212, 175, 55, 0)");
      ctx.beginPath();
      ctx.fillStyle = hg;
      ctx.arc(mouse.x, mouse.y, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(draw);
  }

  // ----------------------------------------------------------
  // Gold floating particles (DOM)
  // ----------------------------------------------------------
  function spawnGoldParticles() {
    const container = document.getElementById("gold-particles");
    if (!container) return;
    const count = Math.min(28, Math.floor(window.innerWidth / 40));
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "gp";
      el.style.left = Math.random() * 100 + "%";
      el.style.animationDuration = 8 + Math.random() * 14 + "s";
      el.style.animationDelay = Math.random() * 10 + "s";
      el.style.width = el.style.height = 2 + Math.random() * 4 + "px";
      container.appendChild(el);
    }
  }

  // ----------------------------------------------------------
  // Interactive Compass
  // ----------------------------------------------------------
  function initCompass() {
    const compass = document.getElementById("compass");
    const needle = document.getElementById("needle");
    if (!compass || !needle) return;

    let angle = 0;
    let targetAngle = 0;
    let dragging = false;
    let startAngle = 0;
    let pointerStart = 0;

    const destinations = [
      { name: "HOME", href: "/reitansai/index.html", angle: 0 },
      { name: "EVENT", href: "/reitansai/pages/event.html", angle: 90 },
      { name: "ABOUT", href: "/reitansai/pages/aboutsite.html", angle: 180 },
      { name: "ZEMI", href: "/reitansai/pages/zemi/data-science-ai.html", angle: 270 },
    ];

    function getAngleFromEvent(e) {
      const rect = compass.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    }

    function onStart(e) {
      e.preventDefault();
      dragging = true;
      pointerStart = getAngleFromEvent(e);
      startAngle = angle;
      compass.style.cursor = "grabbing";
    }

    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();
      const current = getAngleFromEvent(e);
      angle = startAngle + (current - pointerStart);
      needle.style.transform = `rotate(${angle}deg)`;
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      compass.style.cursor = "grab";

      // snap to nearest
      let norm = ((angle % 360) + 360) % 360;
      let nearest = destinations[0];
      let minDiff = 999;
      destinations.forEach((d) => {
        let diff = Math.abs(norm - d.angle);
        if (diff > 180) diff = 360 - diff;
        if (diff < minDiff) {
          minDiff = diff;
          nearest = d;
        }
      });

      // animate snap
      targetAngle = nearest.angle + Math.round(angle / 360) * 360;
      if (Math.abs(targetAngle - angle) > 180) {
        targetAngle -= Math.sign(targetAngle - angle) * 360;
      }

      const start = angle;
      const diff = targetAngle - start;
      const startTime = performance.now();
      const duration = 450;

      function snapAnim(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        angle = start + diff * ease;
        needle.style.transform = `rotate(${angle}deg)`;
        if (t < 1) {
          requestAnimationFrame(snapAnim);
        } else {
          // soft navigation after snap
          setTimeout(() => {
            if (minDiff < 45) {
              window.location.href = nearest.href;
            }
          }, 280);
        }
      }
      requestAnimationFrame(snapAnim);
    }

    compass.addEventListener("mousedown", onStart);
    compass.addEventListener("touchstart", onStart, { passive: false });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchend", onEnd);

    // idle gentle sway
    let idleT = 0;
    function idleSway() {
      if (!dragging) {
        idleT += 0.008;
        const sway = Math.sin(idleT) * 4;
        needle.style.transform = `rotate(${angle + sway}deg)`;
      }
      requestAnimationFrame(idleSway);
    }
    idleSway();
  }

  // ----------------------------------------------------------
  // Digit hover micro-interaction + random explore
  // ----------------------------------------------------------
  function initDigits() {
    document.querySelectorAll(".digit").forEach((d) => {
      d.addEventListener("mouseenter", () => {
        d.style.transform = "translateY(-10px) scale(1.1) rotate(" + (Math.random() * 8 - 4) + "deg)";
      });
      d.addEventListener("mouseleave", () => {
        d.style.transform = "";
      });
    });
  }

  function initRandomExplore() {
    const btn = document.getElementById("randomExplore");
    if (!btn) return;
    const links = [
      "/reitansai/index.html",
      "/reitansai/pages/takimura_t.html",
      "/reitansai/pages/event.html",
      "/reitansai/pages/aboutsite.html",
      "/reitansai/pages/settings.html",
      "/reitansai/pages/zemi/data-science-ai.html",
      "/reitansai/pages/zemi/kyoiku.html",
      "/reitansai/pages/zemi/kokusai-chiiki.html",
      "/reitansai/pages/zemi/bungei-shosetsu-sosaku.html",
      "/reitansai/pages/zemi/kagaku.html",
      "/reitansai/pages/zemi/bungaku.html",
      "/reitansai/pages/zemi/media.html",
      "/reitansai/pages/zemi/shakai.html",
      "/reitansai/pages/zemi/nogyo.html",
      "/reitansai/pages/zemi/kanko.html",
      "/reitansai/pages/zemi/gengo.html",
      "/reitansai/pages/zemi/asobi-tankyu.html",
      "/reitansai/pages/zemi/mieta/eizo-henshu.html",
      "/reitansai/pages/zemi/mieta/digital-content-create.html",
      "/reitansai/pages/zemi/mieta/event-kikaku.html",
    ];
    btn.addEventListener("click", () => {
      btn.classList.add("spinning");
      const pick = links[Math.floor(Math.random() * links.length)];
      setTimeout(() => {
        window.location.href = pick;
      }, 600);
    });
  }

  // ----------------------------------------------------------
  // Mouse tracking for network
  // ----------------------------------------------------------
  function onPointerMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    mouse.x = clientX;
    mouse.y = clientY;
  }

  function onPointerLeave() {
    mouse.x = -9999;
    mouse.y = -9999;
  }

  // ----------------------------------------------------------
  // Boot
  // ----------------------------------------------------------
  function boot() {
    resize();
    spawnGoldParticles();
    initCompass();
    initDigits();
    initRandomExplore();
    draw();

    window.addEventListener("resize", () => {
      clearTimeout(window.__404resize);
      window.__404resize = setTimeout(resize, 150);
    });
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);

    // entrance: slight delay for fonts
    document.body.classList.add("ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
