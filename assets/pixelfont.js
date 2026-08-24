/* QEVR cell type. 5x7 uppercase base, 2 accent rows above, 1 descender row below.
   Headings are drawn from the same square cells the mascot is made of, so they can
   glitch, shear and cascade exactly like his face. Body copy stays real SpaceMono. */
(function () {
  "use strict";

  var B = {
    A: "01110 10001 10001 11111 10001 10001 10001",
    B: "11110 10001 10001 11110 10001 10001 11110",
    C: "01110 10001 10000 10000 10000 10001 01110",
    D: "11110 10001 10001 10001 10001 10001 11110",
    E: "11111 10000 10000 11110 10000 10000 11111",
    F: "11111 10000 10000 11110 10000 10000 10000",
    G: "01110 10001 10000 10111 10001 10001 01111",
    H: "10001 10001 10001 11111 10001 10001 10001",
    I: "11111 00100 00100 00100 00100 00100 11111",
    J: "00111 00010 00010 00010 00010 10010 01100",
    K: "10001 10010 10100 11000 10100 10010 10001",
    L: "10000 10000 10000 10000 10000 10000 11111",
    M: "10001 11011 10101 10101 10001 10001 10001",
    N: "10001 11001 10101 10011 10001 10001 10001",
    O: "01110 10001 10001 10001 10001 10001 01110",
    P: "11110 10001 10001 11110 10000 10000 10000",
    Q: "01110 10001 10001 10001 10101 10010 01101",
    R: "11110 10001 10001 11110 10100 10010 10001",
    S: "01111 10000 10000 01110 00001 00001 11110",
    T: "11111 00100 00100 00100 00100 00100 00100",
    U: "10001 10001 10001 10001 10001 10001 01110",
    V: "10001 10001 10001 10001 10001 01010 00100",
    W: "10001 10001 10001 10101 10101 11011 10001",
    X: "10001 10001 01010 00100 01010 10001 10001",
    Y: "10001 10001 01010 00100 00100 00100 00100",
    Z: "11111 00001 00010 00100 01000 10000 11111",
    "0": "01110 10011 10101 10101 11001 10001 01110",
    "1": "00100 01100 00100 00100 00100 00100 01110",
    "2": "01110 10001 00001 00110 01000 10000 11111",
    "3": "11111 00010 00100 00010 00001 10001 01110",
    "4": "00010 00110 01010 10010 11111 00010 00010",
    "5": "11111 10000 11110 00001 00001 10001 01110",
    "6": "00110 01000 10000 11110 10001 10001 01110",
    "7": "11111 00001 00010 00100 01000 01000 01000",
    "8": "01110 10001 10001 01110 10001 10001 01110",
    "9": "01110 10001 10001 01111 00001 00010 01100",
    ".": "00000 00000 00000 00000 00000 01100 01100",
    ",": "00000 00000 00000 00000 01100 01100 01000",
    "'": "00100 00100 01000 00000 00000 00000 00000",
    "/": "00001 00010 00010 00100 01000 01000 10000",
    "-": "00000 00000 00000 11111 00000 00000 00000",
    ":": "00000 01100 01100 00000 01100 01100 00000",
    "?": "01110 10001 00001 00110 00100 00000 00100",
    " ": "00000 00000 00000 00000 00000 00000 00000"
  };

  /* two rows that sit above the base glyph */
  var ACC = {
    acute: ["00010", "00100"],
    grave: ["01000", "00100"],
    circ: ["00100", "01010"],
    tilde: ["01101", "10110"]
  };
  /* one row that sits below the base glyph */
  var DESC = { cedilla: "00110" };

  var ACCENTED = {
    "Á": ["A", "acute"], "À": ["A", "grave"], "Ã": ["A", "tilde"], "Â": ["A", "circ"],
    "É": ["E", "acute"], "Ê": ["E", "circ"],
    "Í": ["I", "acute"],
    "Ó": ["O", "acute"], "Õ": ["O", "tilde"], "Ô": ["O", "circ"],
    "Ú": ["U", "acute"],
    "Ç": ["C", "cedilla"]
  };

  var GW = 5, GH = 7, ACC_H = 2, DESC_H = 1, BOX_H = ACC_H + GH + DESC_H; // 10

  var cache = {};

  function glyph(ch) {
    if (cache[ch]) return cache[ch];
    var rows = new Array(BOX_H);
    for (var i = 0; i < BOX_H; i++) rows[i] = "00000";

    var base = ch, deco = null;
    if (ACCENTED[ch]) { base = ACCENTED[ch][0]; deco = ACCENTED[ch][1]; }
    var src = B[base];
    if (!src) src = B[" "];
    var parts = src.split(" ");
    for (var r = 0; r < GH; r++) rows[ACC_H + r] = parts[r];

    if (deco) {
      if (ACC[deco]) { rows[0] = ACC[deco][0]; rows[1] = ACC[deco][1]; }
      else if (DESC[deco]) { rows[ACC_H + GH] = DESC[deco]; }
    }
    cache[ch] = rows;
    return rows;
  }

  /* Returns { w, h, get(x,y) } for a whole string. Space between letters is 1 cell,
     word space is 3. Cells are 1 (on) or 0 (off). */
  function textMatrix(str, opts) {
    opts = opts || {};
    var tracking = opts.tracking == null ? 1 : opts.tracking;
    var wordGap = opts.wordGap == null ? 3 : opts.wordGap;
    var chars = String(str).toUpperCase().split("");

    var total = 0, i;
    for (i = 0; i < chars.length; i++) {
      if (chars[i] === " ") { total += wordGap; continue; }
      total += GW;
      if (i < chars.length - 1 && chars[i + 1] !== " ") total += tracking;
      else if (i < chars.length - 1) total += 0;
    }

    var w = Math.max(1, total), h = BOX_H;
    var cells = new Uint8Array(w * h);
    var x = 0;
    for (i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (ch === " ") { x += wordGap; continue; }
      var g = glyph(ch);
      for (var r = 0; r < h; r++) {
        var row = g[r];
        for (var c = 0; c < GW; c++) {
          if (row.charCodeAt(c) === 49) cells[r * w + (x + c)] = 1;
        }
      }
      x += GW;
      if (i < chars.length - 1 && chars[i + 1] !== " ") x += tracking;
    }
    return { w: w, h: h, cells: cells, baseTop: ACC_H, baseHeight: GH };
  }

  window.QevrType = { textMatrix: textMatrix, GW: GW, GH: GH, BOX_H: BOX_H };
})();
