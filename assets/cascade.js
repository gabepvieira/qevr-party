/* The QR cascade. Same entrance the app runs when you walk into Qevr's chat:
   ink cells arriving and leaving in stepped batches, with a few brand sparks.
   Discrete state at ~45ms per frame. No fades, no easing. */
(function () {
  "use strict";

  var CELL = 14, FRAMES = 7, FRAME_MS = 42;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function makeCanvas() {
    var c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    c.setAttribute("data-qevr-cascade", "");
    c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:9999;pointer-events:none;display:block;";
    document.body.appendChild(c);
    return c;
  }

  function grid(c) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    var ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL);
    var order = [];
    for (var i = 0; i < cols * rows; i++) order.push(i);
    for (var j = order.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = order[j]; order[j] = order[k]; order[k] = t;
    }
    return { ctx: ctx, cols: cols, rows: rows, order: order };
  }

  function ink() {
    return getComputedStyle(document.documentElement).getPropertyValue("--qevr-ink").trim() || "#09090B";
  }
  function brand() {
    return getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#CCFF00";
  }
  /* the chat glitch sparks in both brand colours, never one */
  function other() {
    var css = getComputedStyle(document.documentElement);
    var lime = css.getPropertyValue("--qevr-body").trim() || "#CCFF00";
    var pink = css.getPropertyValue("--qevr-pink").trim() || "#FF007F";
    return brand() === pink ? lime : pink;
  }

  /* fill the screen in stepped batches, then hand over */
  function cover(done) {
    if (reduce) { done(); return; }
    var c = makeCanvas(), g = grid(c), on = new Uint8Array(g.cols * g.rows);
    var per = Math.ceil(g.order.length / FRAMES), i = 0, frame = 0;
    var inkC = ink(), brandC = brand(), otherC = other();

    function draw() {
      g.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var n = 0; n < on.length; n++) {
        if (!on[n]) continue;
        g.ctx.fillStyle = on[n] === 3 ? otherC : (on[n] === 2 ? brandC : inkC);
        g.ctx.fillRect((n % g.cols) * CELL, Math.floor(n / g.cols) * CELL, CELL, CELL);
      }
    }
    function step() {
      var slice = g.order.slice(i, i + per); i += per; frame++;
      for (var n = 0; n < slice.length; n++) {
        /* a few brand pixels spark before they settle to ink */
        var r = Math.random();
        on[slice[n]] = r < 0.010 ? 2 : (r < 0.018 ? 3 : 1);
      }
      draw();
      if (i < g.order.length) { setTimeout(step, FRAME_MS); return; }
      setTimeout(function () { done(c); }, FRAME_MS);
    }
    step();
  }

  /* dissolve an already covered screen away */
  function reveal(c) {
    if (reduce) { if (c && c.parentNode) c.parentNode.removeChild(c); return; }
    var own = !c;
    if (!c) c = makeCanvas();
    var g = grid(c), on = new Uint8Array(g.cols * g.rows);
    for (var n = 0; n < on.length; n++) on[n] = 1;
    var inkC = ink(), brandC = brand(), otherC = other();
    var per = Math.ceil(g.order.length / FRAMES), i = 0;

    function draw() {
      g.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var n = 0; n < on.length; n++) {
        if (!on[n]) continue;
        g.ctx.fillStyle = on[n] === 3 ? otherC : (on[n] === 2 ? brandC : inkC);
        g.ctx.fillRect((n % g.cols) * CELL, Math.floor(n / g.cols) * CELL, CELL, CELL);
      }
    }
    draw();
    function step() {
      var slice = g.order.slice(i, i + per); i += per;
      for (var n = 0; n < slice.length; n++) on[slice[n]] = 0;
      /* sparks on the cells that are about to go */
      var nxt = g.order.slice(i, i + per);
      for (var m = 0; m < nxt.length; m++) {
        var rr = Math.random();
        if (rr < 0.026) on[nxt[m]] = 2; else if (rr < 0.046) on[nxt[m]] = 3;
      }
      draw();
      if (i < g.order.length) { setTimeout(step, FRAME_MS); return; }
      if (c.parentNode) c.parentNode.removeChild(c);
    }
    setTimeout(step, own ? FRAME_MS : 0);
  }

  /* cover, run the change, dissolve: for in-page moves */
  function through(change) {
    if (reduce) { if (change) change(); return; }
    cover(function (c) {
      if (change) change();
      reveal(c);
    });
  }

  /* cover, then leave the page. the next page reveals on load. */
  function leave(href) {
    if (reduce) { location.href = href; return; }
    cover(function () { location.href = href; });
  }

  function wireLinks(selector) {
    [].forEach.call(document.querySelectorAll(selector), function (a) {
      a.addEventListener("click", function (e) {
        var href = a.getAttribute("href");
        if (!href || href.charAt(0) === "#" || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        leave(href);
      });
    });
  }

  window.QevrCascade = { cover: cover, reveal: reveal, through: through, leave: leave, wireLinks: wireLinks };

  /* every page arrives out of the cascade */
  if (!reduce) {
    document.addEventListener("DOMContentLoaded", function () { reveal(null); });
  }

  /* back/forward restores a bfcache snapshot taken mid-cover: a black screen.
     drop any leftover cover and arrive out of the cascade again. */
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    [].forEach.call(document.querySelectorAll("[data-qevr-cascade]"), function (c) {
      if (c.parentNode) c.parentNode.removeChild(c);
    });
    if (!reduce) reveal(null);
  });
})();
