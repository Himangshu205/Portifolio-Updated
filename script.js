/* ==========================================================
   Himangshu Sikder: portfolio behaviour
   No libraries, no build step. Sections:
   1. Settings   2. Theme   3. Background animation   4. Cursor
   5. Scroll (progress, reveal)   6. Menu   7. Accordions
   8. Screenshot galleries and viewer   9. Copy email
   ========================================================== */
(() => {
  "use strict";

  /* ---------- 1. Settings ---------- */
  // Your email is never shown on the page. The logo copies it.
  const EMAIL = ["denji200525", "gmail.com"].join("@");

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smooth = reduceMotion ? "auto" : "smooth";

  /* ---------- 2. Theme ---------- */
  let netColor = "108,182,255"; // background dots: blue in dark mode, black in light mode

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === "dark";
    netColor = dark ? "108,182,255" : "0,0,0";
    $$(".js-theme").forEach((btn) => {
      btn.setAttribute("aria-label", "Switch to " + (dark ? "light" : "dark") + " theme");
      btn.querySelector("use").setAttribute("href", dark ? "#i-sun" : "#i-moon");
    });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#08080A" : "#FAFAFA");
    if (reduceMotion && typeof drawNet === "function") drawNet();
  }

  let savedTheme = "dark";
  try { savedTheme = localStorage.getItem("theme") || "dark"; } catch (e) { /* storage blocked */ }
  $$(".js-theme").forEach((btn) =>
    btn.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) { /* storage blocked */ }
    })
  );

  /* ---------- 3. Background animation (dots and lines that react to the mouse) ---------- */
  const canvas = $("#bg");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const mouse = { x: -9999, y: -9999 };
  let w = 0, h = 0, pts = [], raf = 0;

  function initNet() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(65, Math.floor((w * h) / 19000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));
    if (reduceMotion) drawNet();
  }

  function drawNet() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (!reduceMotion) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 110 && d > 0) { p.x += (dx / d); p.y += (dy / d); }
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.9, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + netColor + ",.8)";
      ctx.fill();
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 140) {
          ctx.strokeStyle = "rgba(" + netColor + "," + (1 - d / 140) * 0.32 + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
      const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (dm < 170) {
        ctx.strokeStyle = "rgba(" + netColor + "," + (1 - dm / 170) * 0.6 + ")";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
    if (!reduceMotion) raf = requestAnimationFrame(drawNet);
  }

  window.addEventListener("resize", initNet);
  window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  root.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });

  applyTheme(savedTheme);
  initNet();
  if (!reduceMotion) drawNet();

  /* ---------- 4. Custom cursor (mouse devices only) ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const dot = $(".cursor-dot");
    const ring = $(".cursor-ring");
    let x = -100, y = -100, rx = -100, ry = -100, visible = false;
    root.classList.add("custom-cursor");

    const show = (v) => { visible = v; dot.style.opacity = ring.style.opacity = v ? "1" : "0"; };
    window.addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      if (!visible) { rx = x; ry = y; show(true); }
      const hot = e.target.closest && e.target.closest("a, button, input, textarea, label, [role='button']");
      ring.classList.toggle("hot", Boolean(hot));
    });
    window.addEventListener("pointerdown", () => ring.classList.add("down"));
    window.addEventListener("pointerup", () => ring.classList.remove("down"));
    root.addEventListener("mouseleave", () => show(false));

    (function loop() {
      const k = reduceMotion ? 1 : 0.16;
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      dot.style.transform = "translate3d(" + x + "px," + y + "px,0) translate(-50%,-50%)";
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- 5. Scroll: progress bar and reveal ---------- */
  const progress = $("#progress");
  function onScroll() {
    const max = Math.max(1, root.scrollHeight - root.clientHeight);
    progress.style.width = (root.scrollTop / max) * 100 + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- 6. Full-screen menu ---------- */
  const menu = $("#menu");
  const menuOpenBtn = $("#menu-open");

  function lockScroll() { document.body.style.overflow = (menu.hidden && lightbox.hidden) ? "" : "hidden"; }
  function openMenu() {
    menu.hidden = false;
    menuOpenBtn.setAttribute("aria-expanded", "true");
    lockScroll();
    $("#menu-close").focus();
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    menuOpenBtn.setAttribute("aria-expanded", "false");
    lockScroll();
  }
  menuOpenBtn.addEventListener("click", openMenu);
  $("#menu-close").addEventListener("click", () => { closeMenu(); menuOpenBtn.focus({ preventScroll: true }); });
  $$(".menu-link").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.getAttribute("href");
      closeMenu();
      setTimeout(() => {
        const target = $(id);
        if (target) target.scrollIntoView({ behavior: smooth });
        history.replaceState(null, "", id);
      }, 60);
    })
  );

  /* ---------- 7. Accordions (experience and project rows) ---------- */
  function setPanel(btn, open) {
    btn.setAttribute("aria-expanded", String(open));
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    panel.classList.toggle("open", open);
    panel.inert = !open; // keeps hidden links out of the tab order
  }
  $$(".row-btn").forEach((btn) => {
    setPanel(btn, btn.getAttribute("aria-expanded") === "true");
    btn.addEventListener("click", () => setPanel(btn, btn.getAttribute("aria-expanded") !== "true"));
  });

  /* ---------- 8. Screenshot galleries and viewer ---------- */
  const lightbox = $("#lightbox");
  const lbImg = $("#lb-img");
  const lbCap = $("#lb-cap");
  let lbGallery = null;

  function lbRender() {
    const item = lbGallery.items[lbGallery.index];
    const n = lbGallery.items.length;
    lbImg.src = item.src;
    lbImg.alt = item.caption;
    lbCap.textContent = item.caption + (n > 1 ? " (" + (lbGallery.index + 1) + " / " + n + ")" : "");
    $$(".lb-nav").forEach((b) => (b.hidden = n < 2));
  }
  function openLightbox(g) {
    lbGallery = g;
    lbRender();
    lightbox.hidden = false;
    lockScroll();
    $("#lb-close").focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    lbGallery = null;
    lockScroll();
  }
  $("#lb-prev").addEventListener("click", () => { lbGallery.step(-1); lbRender(); });
  $("#lb-next").addEventListener("click", () => { lbGallery.step(1); lbRender(); });
  $("#lb-close").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

  function buildGallery(el) {
    const items = $$(".gallery-src img", el).map((img) => ({ src: img.getAttribute("src"), caption: img.alt }));
    if (!items.length) return;
    const n = items.length;
    let index = 0;

    el.innerHTML =
      '<div class="gal-frame">' +
        '<div class="gal-bar"><span class="gal-dot"></span><span class="gal-dot"></span><span class="gal-dot"></span><span class="gal-url"></span></div>' +
        '<div class="gal-stage">' +
          '<button type="button" class="gal-main"><img alt=""></button>' +
          '<button type="button" class="icon-btn still gal-arrow prev" aria-label="Previous screenshot"><svg class="ico"><use href="#i-left"/></svg></button>' +
          '<button type="button" class="icon-btn still gal-arrow next" aria-label="Next screenshot"><svg class="ico"><use href="#i-right"/></svg></button>' +
        "</div>" +
      "</div>" +
      '<div class="gal-meta"><p class="gal-caption"></p><span class="gal-count"></span></div>' +
      '<ul class="gal-thumbs"></ul>';

    const main = $(".gal-main", el);
    const mainImg = $("img", main);
    const caption = $(".gal-caption", el);
    const count = $(".gal-count", el);
    const thumbsEl = $(".gal-thumbs", el);
    $(".gal-url", el).textContent = el.dataset.host || "";

    const thumbs = items.map((item, k) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "thumb";
      b.setAttribute("aria-label", "Show screenshot " + (k + 1) + ": " + item.caption);
      const im = document.createElement("img");
      im.src = item.src;
      im.alt = "";
      b.appendChild(im);
      b.addEventListener("click", () => show(k));
      li.appendChild(b);
      thumbsEl.appendChild(li);
      return b;
    });

    function show(k, scrollThumb = true) {
      index = (k + n) % n;
      mainImg.src = items[index].src;
      mainImg.alt = items[index].caption;
      main.setAttribute("aria-label", "Enlarge: " + items[index].caption);
      caption.textContent = items[index].caption;
      count.textContent = n > 1 ? index + 1 + " / " + n : "";
      thumbs.forEach((b, i) => {
        b.classList.toggle("active", i === index);
        b.setAttribute("aria-current", String(i === index));
      });
      if (scrollThumb && n > 1) {
        // centre the active thumbnail inside its own strip (does not move the page)
        const t = thumbs[index].getBoundingClientRect();
        const c = thumbsEl.getBoundingClientRect();
        thumbsEl.scrollBy({ left: t.left - c.left - (c.width - t.width) / 2, behavior: smooth });
      }
    }

    const gallery = {
      items,
      get index() { return index; },
      step(d) { show(index + d); },
    };

    if (n < 2) {
      $$(".gal-arrow", el).forEach((b) => b.remove());
      thumbsEl.remove();
    } else {
      $(".gal-arrow.prev", el).addEventListener("click", () => show(index - 1));
      $(".gal-arrow.next", el).addEventListener("click", () => show(index + 1));
    }
    main.addEventListener("click", () => openLightbox(gallery));
    show(0, false);
  }
  $$(".gallery").forEach(buildGallery);

  document.addEventListener("keydown", (e) => {
    if (!lightbox.hidden) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") { lbGallery.step(-1); lbRender(); }
      else if (e.key === "ArrowRight") { lbGallery.step(1); lbRender(); }
      return;
    }
    if (!menu.hidden && e.key === "Escape") { closeMenu(); menuOpenBtn.focus({ preventScroll: true }); }
  });

  /* ---------- 9. Copy email (the logo is the button) ---------- */
  $$(".js-copy-email").forEach((btn) => {
    const note = btn.closest(".email-copy").querySelector(".copy-note");
    const idleText = note.textContent;
    let timer;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(EMAIL);
      } catch (err) {
        const ta = document.createElement("textarea");
        ta.value = EMAIL;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e2) { /* nothing else to try */ }
        document.body.removeChild(ta);
      }
      note.textContent = "Email copied to your clipboard";
      note.classList.add("done");
      clearTimeout(timer);
      timer = setTimeout(() => { note.textContent = idleText; note.classList.remove("done"); }, 2500);
    });
  });
})();
