/* Schwarz General & Feed Store — site behaviour (no dependencies) */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Preloader: first visit per session only, hard-capped ---------- */
  function liftPreloader() {
    if (doc.classList.contains("pl-done")) return;
    doc.classList.add("pl-done");
    try { sessionStorage.setItem("sz-seen", "1"); } catch (e) {}
    var pl = document.querySelector(".pl");
    if (pl) setTimeout(function () { pl.remove(); }, 700);
  }
  if (doc.classList.contains("pl-skip")) {
    var stale = document.querySelector(".pl");
    if (stale) stale.remove();
  } else {
    var MIN = reduce ? 0 : 700;   // performance.now() counts from navigation start
    var MAX = 2000;               // never hold the page hostage
    var hero = document.querySelector("[data-hero]");
    var fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    var img = new Promise(function (res) {
      if (!hero || hero.complete) return res();
      hero.addEventListener("load", res, { once: true });
      hero.addEventListener("error", res, { once: true });
    });
    Promise.all([fonts, img]).then(function () {
      setTimeout(liftPreloader, Math.max(0, MIN - performance.now()));
    });
    setTimeout(liftPreloader, MAX);
  }

  /* ---------- Compact dropdown menu ---------- */
  var bar = document.querySelector(".bar");
  var btn = document.querySelector(".menu-btn");
  if (bar && btn) {
    var label = btn.querySelector(".lbl");
    var setOpen = function (open) {
      bar.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (label) label.textContent = open ? "Close" : "Menu";
    };
    btn.addEventListener("click", function (e) { e.stopPropagation(); setOpen(!bar.classList.contains("is-open")); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && bar.classList.contains("is-open")) { setOpen(false); btn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (bar.classList.contains("is-open") && !e.target.closest(".nav")) setOpen(false);
    });
    window.addEventListener("resize", function () { if (window.innerWidth >= 920) setOpen(false); });
  }

  /* ---------- Reveal photos once ---------- */
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Videos: load + play only while on screen ---------- */
  document.querySelectorAll("video[data-auto]").forEach(function (v) {
    var toggle = v.parentElement.querySelector(".vid-toggle");
    var paused = reduce;
    var sync = function () { if (toggle) toggle.textContent = v.paused ? "Play" : "Pause"; };
    if (toggle) toggle.addEventListener("click", function () {
      paused = !v.paused;
      if (v.paused) { v.play().catch(function () {}); } else { v.pause(); }
    });
    v.addEventListener("play", sync);
    v.addEventListener("pause", sync);
    sync();
    if (!("IntersectionObserver" in window)) { if (!paused) v.play().catch(function () {}); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (v.preload === "none") v.preload = "auto";
          if (!paused) v.play().catch(function () {});
        } else if (!v.paused) { v.pause(); }
      });
    }, { threshold: 0.25 }).observe(v);
  });

  /* ---------- Menu board tabs (ARIA tabs pattern) ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus({ preventScroll: true });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t, false); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") n = tabs[0];
        if (e.key === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- Gallery lightbox ---------- */
  var lb = document.querySelector(".lightbox");
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-lb]"));
  if (lb && items.length && typeof lb.showModal === "function") {
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector("figcaption");
    var idx = 0;
    var show = function (i) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      lbImg.src = it.getAttribute("data-lb");
      lbImg.alt = it.querySelector("img").alt;
      lbCap.textContent = it.getAttribute("data-cap") || "";
    };
    items.forEach(function (it, i) {
      it.addEventListener("click", function () { show(i); lb.showModal(); });
    });
    lb.querySelector(".lb-close").addEventListener("click", function () { lb.close(); });
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-fig")) lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
    });
    var sx = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- Map facade: load Google Maps only when asked ---------- */
  document.querySelectorAll("[data-map]").forEach(function (b) {
    b.addEventListener("click", function () {
      var card = b.closest(".map-card");
      var f = document.createElement("iframe");
      f.src = b.getAttribute("data-map");
      f.title = "Map to Schwarz General & Feed Store";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      card.appendChild(f);
      var fac = card.querySelector(".map-facade");
      if (fac) fac.remove();
    });
  });

  /* ---------- Year ---------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
