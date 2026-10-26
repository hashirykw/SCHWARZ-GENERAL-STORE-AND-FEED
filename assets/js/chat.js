/* "Ask the Counter" — a small on-page helper for Schwarz General & Feed.
 * Answers common questions from a fixed list; no data leaves the page. */
(function () {
  "use strict";
  var launcher = document.querySelector(".chat-launcher");
  var panel = document.getElementById("chat");
  if (!launcher || !panel) return;

  var log = panel.querySelector(".chat-log");
  var form = panel.querySelector(".chat-form");
  var input = form.querySelector("input");
  var quick = panel.querySelector(".chat-quick");
  var closeBtn = panel.querySelector(".chat-x");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var FB = "https://www.facebook.com/p/Schwarz-General-Feed-Store-61573037642657/";
  var IG = "https://www.instagram.com/schwarz_general_and_feed_store/";
  var MAPS = "https://www.google.com/maps/dir/?api=1&destination=417+S+Kansas+Ave,+Lane,+KS+66042";
  var a = function (href, text, ext) {
    return '<a href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + text + "</a>";
  };

  var INTENTS = [
    { id: "hours", keys: ["hour", "open", "close", "closing", "today", "time", "when are you", "sunday", "monday", "saturday", "weekend"],
      reply: "Our hours change with the season, so we post them on " + a(FB, "Facebook", true) + " first. Give it a quick look before you make the drive." },
    { id: "where", keys: ["where", "address", "direction", "location", "locate", "find you", "map", "how far", "drive", "kansas city", "parking"],
      reply: "We're at <strong>417 S Kansas Ave, Lane, KS 66042</strong>, roughly an hour southwest of Kansas City. " + a(MAPS, "Open directions", true) + " or see the " + a("/visit", "visit page") + "." },
    { id: "menu", keys: ["menu", "food", "eat", "lunch", "dinner", "kitchen", "dish", "plate", "special", "serve", "hungry", "broken wheel"],
      reply: "Broken Wheel is our scratch kitchen inside the store: hand-breaded sandwiches, country-fried plates with cream gravy, blackened fish over grits, farm breakfasts and cinnamon rolls. The board changes with what's fresh. " + a("/kitchen", "See the kitchen") + "." },
    { id: "breakfast", keys: ["breakfast", "egg", "morning", "sausage", "toast"],
      reply: "Mornings mean the farm breakfast: eggs how you like them, buttered toast and sausage links. Check " + a(FB, "Facebook", true) + " for today's breakfast times." },
    { id: "rolls", keys: ["cinnamon", "roll", "bake", "bakery", "pastry", "dessert", "sweet"],
      reply: "The cinnamon rolls are made from the same hand-kneaded dough and iced thick. They tend to go early, so come by in the morning or message us to save a box." },
    { id: "fish", keys: ["fish", "grits", "blackened", "seafood"],
      reply: "The blackened fish is spice-crusted and seared hard, served over buttery yellow grits with a charred lemon. Ask at the counter if it's on today's board." },
    { id: "sandwich", keys: ["sandwich", "tenderloin", "burger", "bun"],
      reply: "Our hand-breaded sandwich is pounded thin, breaded by hand and fried until the crust cracks. It hangs off the bun on purpose." },
    { id: "cfs", keys: ["country fried", "chicken fried", "gravy", "steak", "mashed", "fried chicken"],
      reply: "The country-fried plate comes crisp and golden under peppered cream gravy, with real mashed potatoes and green beans." },
    { id: "price", keys: ["price", "cost", "how much", "expensive", "cheap", "$"],
      reply: "Prices are on the board at the counter and can change with the season. For something specific, send us a message on " + a(FB, "Facebook", true) + "." },
    { id: "feed", keys: ["feed", "livestock", "cattle", "horse", "goat", "pig", "poultry", "chicken feed", "coop", "dog", "cat", "pet", "seed", "grocer", "staples", "milk", "store", "stock", "supplies"],
      reply: "The store side carries feed for livestock and poultry, dog and cat food, and everyday staples so you can skip the 26-mile drive. Stock turns with the season, so " + a(FB, "message us", true) + " before you come for something specific. More on the " + a("/store", "store page") + "." },
    { id: "order", keys: ["order", "to go", "takeout", "take out", "pickup", "pick up", "call ahead", "big order", "catering", "party", "group", "cater"],
      reply: "Walk in and order at the counter, to stay or to go. For bigger orders or a group, message us on " + a(FB, "Facebook", true) + " ahead of time so the kitchen can get ready." },
    { id: "event", keys: ["car show", "cars", "event", "show", "festival", "classic"],
      reply: "Our second annual car show filled South Kansas Avenue on June 13, 2026, all makes, models and years. The next date goes up on Facebook first. " + a("/events", "See the car show") + "." },
    { id: "contact", keys: ["contact", "phone", "call", "number", "email", "message", "reach", "instagram", "facebook", "social"],
      reply: "The quickest way to reach us is a message on " + a(FB, "Facebook", true) + " or " + a(IG, "Instagram", true) + "." },
    { id: "hello", keys: ["hello", "hi", "hey", "howdy", "good morning", "good afternoon", "yo"],
      reply: "Howdy! Ask me about hours, directions, the kitchen, feed, or the car show." },
    { id: "thanks", keys: ["thank", "thanks", "appreciate", "great", "awesome", "bye", "see you"],
      reply: "Anytime. We'll see you on South Kansas Avenue. It's worth the drive." }
  ];
  var FALLBACK = "I'm not sure about that one. I can help with hours, directions, the menu, feed and the car show, or you can message the folks behind the counter on " + a(FB, "Facebook", true) + ".";
  var GREETING = "Howdy, welcome to Schwarz General & Feed! I can help with hours, directions, the Broken Wheel kitchen, feed, and the car show. What can I find for you?";

  function match(text) {
    var t = " " + text.toLowerCase().replace(/[^a-z0-9$' ]+/g, " ") + " ";
    var best = null, score = 0;
    INTENTS.forEach(function (it) {
      var s = 0;
      it.keys.forEach(function (k) {
        if (k.length <= 3 ? t.indexOf(" " + k + " ") > -1 || t.indexOf(" " + k + "s ") > -1 : t.indexOf(k) > -1) s += k.length > 5 ? 2 : 1;
      });
      if (s > score) { score = s; best = it; }
    });
    return best ? best.reply : FALLBACK;
  }

  /* transcript persists for the browser session */
  var history = [];
  try { history = JSON.parse(sessionStorage.getItem("sz-chat") || "[]"); } catch (e) { history = []; }
  function save() { try { sessionStorage.setItem("sz-chat", JSON.stringify(history.slice(-30))); } catch (e) {} }

  function bubble(who, html) {
    var el = document.createElement("div");
    el.className = "msg " + who;
    if (who === "user") { el.textContent = html; } else { el.innerHTML = html; }
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  function botSay(html) {
    var t = document.createElement("div");
    t.className = "msg bot typing";
    t.setAttribute("aria-label", "Typing");
    t.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(t);
    log.scrollTop = log.scrollHeight;
    setTimeout(function () {
      t.remove();
      bubble("bot", html);
      history.push(["bot", html]); save();
    }, reduce ? 0 : 520);
  }
  function ask(text) {
    text = text.trim();
    if (!text) return;
    bubble("user", text);
    history.push(["user", text]); save();
    botSay(match(text));
  }

  var started = false;
  function start() {
    if (started) return;
    started = true;
    if (history.length) {
      history.forEach(function (h) { bubble(h[0], h[1]); });
    } else {
      bubble("bot", GREETING);
      history.push(["bot", GREETING]); save();
    }
  }

  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) panel.removeAttribute("inert"); else panel.setAttribute("inert", "");
    launcher.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      start();
      launcher.classList.add("seen");
      try { sessionStorage.setItem("sz-chat-seen", "1"); } catch (e) {}
      setTimeout(function () { if (window.innerWidth > 640) input.focus(); }, 60);
    }
  }
  try { if (sessionStorage.getItem("sz-chat-seen")) launcher.classList.add("seen"); } catch (e) {}

  launcher.addEventListener("click", function () { setOpen(!panel.classList.contains("is-open")); });
  closeBtn.addEventListener("click", function () { setOpen(false); launcher.focus(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("is-open")) { setOpen(false); launcher.focus(); }
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); input.value = ""; });
  quick.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b) ask(b.getAttribute("data-q") || b.textContent);
  });
  /* any link with data-chat opens the helper */
  document.querySelectorAll("[data-chat]").forEach(function (l) {
    l.addEventListener("click", function (e) { e.preventDefault(); setOpen(true); });
  });
})();
