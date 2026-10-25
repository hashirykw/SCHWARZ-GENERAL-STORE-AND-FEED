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
    if (pl) setTimeout(function () { pl.remove(); }, 800);
  }
  if (doc.classList.contains("pl-skip")) {
    var p = document.querySelector(".pl");
    if (p) p.remove();
  } else {
    var start = 0;                 // performance.now() is measured from navigation start
    var MIN = reduce ? 0 : 950;    // long enough for the stamp + bar to read
    var MAX = 2000;                // never hold the page hostage
    var ready = function () {
      var wait = Math.max(0, MIN - (performance.now() - start));
      setTimeout(liftPreloader, wait);
    };
    var hero = document.querySelector("[data-hero]");
    var fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    var img = new Promise(function (res) {
      if (!hero || hero.complete) return res();
      hero.addEventListener("load", res, { once: true });
      hero.addEventListener("error", res, { once: true });
    });
    Promise.all([fonts, img]).then(ready);
    setTimeout(liftPreloader, MAX);
  }

  /* ---------- Mobile menu ---------- */
  var bar = document.querySelector(".bar");
  var btn = document.querySelector(".menu-btn");
  if (bar && btn) {
    var setOpen = function (open) {
      bar.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Close" : "Menu";
    };
    btn.addEventListener("click", function () { setOpen(!bar.classList.contains("is-open")); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && bar.classList.contains("is-open")) { setOpen(false); btn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (bar.classList.contains("is-open") && !bar.contains(e.target)) setOpen(false);
    });
  }

  /* ---------- Reveal photos once ---------- */
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Videos: load + play only while on screen ---------- */
  var vids = document.querySelectorAll("video[data-auto]");
  vids.forEach(function (v) {
    var wrap = v.parentElement;
    var toggle = wrap.querySelector(".vid-toggle");
    var paused = reduce;               // reduced motion: start paused, user can play
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
          if (v.preload === "none") { v.preload = "auto"; }
          if (!paused) v.play().catch(function () {});
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.25 }).observe(v);
  });

  /* ---------- Year ---------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
