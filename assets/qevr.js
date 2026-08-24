/* Qevr on the web. Same rules as the app: stepped, hard, no easing, no round corners.
   Renders the canonical 34x34 grids from handoff/qevr-expressions.json. Only the face
   band changes between expressions; the silhouette is constant. */
(function () {
  "use strict";

  var DATA = null;
  var byName = {};

  /* The 34x34 grid is half empty: nothing is drawn outside columns 6..28 or
     rows 5..29. Rendering the whole grid means rendering a black margin as wide
     as he is. Every draw crops to the real bounds, which are identical across
     all 23 faces because the silhouette is constant. */
  var CROP = { x0: 6, y0: 5, w: 23, h: 25 };

  function decode(expr) {
    var n = expr.rows.length;
    var m = new Uint8Array(n * n);
    for (var y = 0; y < n; y++) {
      var row = expr.rows[y];
      for (var x = 0; x < n; x++) m[y * n + x] = row.charCodeAt(x) - 48;
    }
    return { n: n, cells: m, name: expr.name };
  }

  function load(url) {
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      DATA = j;
      j.expressions.forEach(function (e) { byName[e.name] = decode(e); });
      return Object.keys(byName);
    });
  }

  /* cells that differ between two faces, for the redraw cascade */
  function faceDiff(a, b) {
    var out = [];
    for (var i = 0; i < a.cells.length; i++) if (a.cells[i] !== b.cells[i]) out.push(i);
    return out;
  }

  function shuffle(arr, rnd) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor((rnd ? rnd() : Math.random()) * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  var IDLE_POOL = ["Content", "Bored", "Unamused", "Naughty", "Default"];
  var TAP_POOL = ["Happy", "Joy", "Anime", "Surprised", "Laughing", "Adoring", "Stars", "Lovely", "Blissful"];

  var reduceMotion = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function Mascot(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.host = opts.host || canvas.parentElement;
    this.cell = opts.cell || 4;
    this.face = byName[opts.face || "Default"] || byName.Default;
    this.render = new Uint8Array(this.face.cells);
    this.n = this.face.n;
    this.gen = 0;
    this.alive = true;
    this.pos = { x: 0, y: 0 };
    this.squash = 1;
    this.lastBehavior = null;
    this.cooldowns = {};
    this.ignoredSince = Date.now();
    this._timers = [];
    this.resize();
    this.paint();
  }

  Mascot.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var w = CROP.w * this.cell, h = CROP.h * this.cell;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  };

  Mascot.prototype.setCell = function (c) { this.cell = c; this.resize(); this.paint(); };

  Mascot.prototype.paint = function () {
    var ctx = this.ctx, n = this.n, c = this.cell;
    var css = getComputedStyle(document.documentElement);
    var body = css.getPropertyValue("--brand").trim() || "#CCFF00";
    var ink = css.getPropertyValue("--qevr-ink").trim() || "#09090B";
    ctx.clearRect(0, 0, CROP.w * c, CROP.h * c);
    for (var y = 0; y < n; y++) {
      var gy = y - CROP.y0;
      if (gy < 0 || gy >= CROP.h) continue;
      var shear = this._shear && this._shear[y] ? this._shear[y] : 0;
      for (var x = 0; x < n; x++) {
        var v = this.render[y * n + x];
        if (!v) continue;
        var sx = ((x + shear) % n + n) % n - CROP.x0;
        if (sx < 0 || sx >= CROP.w) continue;
        ctx.fillStyle = v === 2 ? ink : body;
        ctx.fillRect(sx * c, gy * c, c, c);
      }
    }
  };

  Mascot.prototype._step = function (ms) {
    var self = this;
    return new Promise(function (res) {
      var t = setTimeout(res, reduceMotion ? 0 : ms);
      self._timers.push(t);
    });
  };

  Mascot.prototype._live = function (g) { return this.alive && g === this.gen; };

  /* the QR redraw cascade: only differing cells flip, in random chunks over ~4 frames */
  Mascot.prototype.setFace = function (name, instant) {
    var target = byName[name];
    if (!target || target === this.face) return Promise.resolve();
    var g = ++this.gen;
    var diff = shuffle(faceDiff({ cells: this.render }, target));
    this.face = target;
    if (instant || reduceMotion || !diff.length) {
      this.render.set(target.cells);
      this.paint();
      return Promise.resolve();
    }
    var frames = 4, per = Math.ceil(diff.length / frames), i = 0, self = this;
    function chunk() {
      if (!self._live(g)) return Promise.resolve();
      var slice = diff.slice(i, i + per); i += per;
      slice.forEach(function (idx) { self.render[idx] = target.cells[idx]; });
      self.paint();
      if (i >= diff.length) return Promise.resolve();
      return self._step(45).then(chunk);
    }
    return chunk();
  };

  Mascot.prototype.applyTransform = function () {
    if (!this.host) return;
    this.host.style.transform =
      "translate3d(" + this.pos.x + "px," + this.pos.y + "px,0) scale(1," + this.squash + ")";
  };

  /* --- behaviors --- */

  Mascot.prototype.blink = function () {
    var was = this.face.name;
    if (was === "Eyes Closed" || was === "Dead") return Promise.resolve();
    var self = this;
    return this.setFace("Eyes Closed", true)
      .then(function () { return self._step(90); })
      .then(function () { self.face = byName[was]; self.render.set(byName[was].cells); self.paint(); });
  };

  Mascot.prototype.glitch = function () {
    var self = this, g = this.gen, frames = 2 + Math.floor(Math.random() * 3), i = 0;
    function frame() {
      if (!self._live(g)) return Promise.resolve();
      self._shear = {};
      var band = 8 + Math.floor(Math.random() * 18);
      var depth = 1 + Math.floor(Math.random() * 3);
      for (var k = 0; k < depth; k++) {
        self._shear[band + k] = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3));
      }
      self.paint();
      i++;
      if (i >= frames) { self._shear = null; return self._step(50).then(function () { self.paint(); }); }
      return self._step(50).then(frame);
    }
    return frame();
  };

  Mascot.prototype.rowwave = function () {
    var self = this, g = this.gen, y = 4;
    function frame() {
      if (!self._live(g) || y > self.n - 4) { self._shear = null; self.paint(); return Promise.resolve(); }
      self._shear = {}; self._shear[y] = 1; self._shear[y + 1] = 1;
      self.paint(); y += 2;
      return self._step(40).then(frame);
    }
    return frame();
  };

  Mascot.prototype.hop = function (bounds) {
    var self = this, g = this.gen;
    var hops = 1 + Math.floor(Math.random() * 3), done = 0;
    function one() {
      if (!self._live(g) || done >= hops) { self.squash = 1; self.applyTransform(); return Promise.resolve(); }
      done++;
      var tx = (Math.random() * 2 - 1) * bounds.x;
      var ty = (Math.random() * 2 - 1) * bounds.y;
      self.squash = 0.86; self.applyTransform();
      return self._step(70).then(function () {
        if (!self._live(g)) return;
        self.squash = 1.08;
        self.pos.x = tx; self.pos.y = ty - 10; self.applyTransform();
        return self._step(80);
      }).then(function () {
        if (!self._live(g)) return;
        self.squash = 1; self.pos.y = ty; self.applyTransform();
        return self._step(60);
      }).then(function () {
        /* ~25% of multi hops he changes his mind mid route */
        if (done < hops && Math.random() < 0.25) {
          return self.setFace("Surprised").then(function () { return self._step(320); })
            .then(function () { return self.setFace(pick(IDLE_POOL)); });
        }
        return one();
      });
    }
    return one();
  };

  Mascot.prototype.stare = function (dir) {
    var self = this, g = this.gen;
    var nothing = Math.random() < 0.6;
    var dx = dir ? Math.max(-10, Math.min(10, dir.x)) : (Math.random() < 0.5 ? -9 : 9);
    var ox = self.pos.x;
    self.pos.x = ox + dx; self.applyTransform();
    return self.setFace(nothing ? "Bored" : "Shocked")
      .then(function () { return self._step(nothing ? 520 : 200); })
      .then(function () {
        if (!self._live(g)) return;
        if (!nothing) { self.pos.x = ox - dx * 0.6; self.applyTransform(); return self._step(160); }
      })
      .then(function () {
        if (!self._live(g)) return;
        self.pos.x = ox; self.applyTransform();
        return self.setFace(pick(IDLE_POOL));
      });
  };

  Mascot.prototype.fakeCommit = function () {
    var self = this;
    self.squash = 0.8; self.applyTransform();
    return self._step(180).then(function () {
      self.squash = 1; self.applyTransform();
      return self.setFace("Bored");
    });
  };

  Mascot.prototype.micro = function () {
    var self = this;
    var idle = Date.now() - self.ignoredSince;
    var name = idle > 20000 && Math.random() < 0.5 ? "Bored" : pick(IDLE_POOL);
    return self.setFace(name);
  };

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* irregular rest drawn from weighted buckets, biased short. never metronomic. */
  function restMs() {
    var r = Math.random();
    if (r < 0.45) return 900 + Math.random() * 1400;
    if (r < 0.78) return 2300 + Math.random() * 2200;
    if (r < 0.95) return 4500 + Math.random() * 2600;
    return 7000 + Math.random() * 2200;
  }

  var BEHAVIORS = [
    { k: "micro", w: 26, cd: 1 },
    { k: "hop", w: 20, cd: 2 },
    { k: "stare", w: 16, cd: 3 },
    { k: "glitch", w: 12, cd: 4 },
    { k: "rowwave", w: 10, cd: 4 },
    { k: "fakeCommit", w: 8, cd: 5 }
  ];

  Mascot.prototype.start = function (bounds) {
    if (reduceMotion) { this.paint(); return; }
    var self = this;
    self._bounds = bounds || { x: 26, y: 20 };
    self._running = true;
    self._tick = 0;

    (function blinkLoop() {
      if (!self._running) return;
      var t = setTimeout(function () {
        if (!self._busy) self.blink();
        blinkLoop();
      }, 2000 + Math.random() * 4000);
      self._timers.push(t);
    })();

    (function loop() {
      if (!self._running) return;
      var t = setTimeout(function () {
        if (!self._running) return;
        self._tick++;
        var pool = BEHAVIORS.filter(function (b) {
          if (b.k === self.lastBehavior) return false;             /* no repeat */
          return !(self.cooldowns[b.k] > self._tick);              /* per behavior cooldown */
        });
        var total = pool.reduce(function (s, b) { return s + b.w; }, 0);
        var r = Math.random() * total, chosen = pool[0];
        for (var i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) { chosen = pool[i]; break; } }
        self.lastBehavior = chosen.k;
        self.cooldowns[chosen.k] = self._tick + chosen.cd;
        self._busy = true;
        var run = chosen.k === "hop" ? self.hop(self._bounds)
          : chosen.k === "stare" ? self.stare(self._look)
            : self[chosen.k]();
        Promise.resolve(run).then(function () { self._busy = false; loop(); });
      }, restMs());
      self._timers.push(t);
    })();
  };

  Mascot.prototype.stop = function () {
    this._running = false;
    this.alive = false;
    this._timers.forEach(clearTimeout);
    this._timers = [];
  };

  Mascot.prototype.poke = function () {
    this.ignoredSince = Date.now();
    var self = this;
    self.squash = 0.82; self.applyTransform();
    return self.setFace(pick(TAP_POOL)).then(function () {
      self.squash = 1.1; self.pos.y -= 8; self.applyTransform();
      return self._step(90);
    }).then(function () {
      self.squash = 1; self.pos.y += 8; self.applyTransform();
    });
  };

  window.Qevr = {
    CROP: CROP,
    load: load,
    Mascot: Mascot,
    names: function () { return Object.keys(byName); },
    matrix: function (name) { return byName[name]; },
    reduceMotion: reduceMotion
  };
})();
