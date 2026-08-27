/* Renders the OG share cards from the canonical data — never hand-drawn.
   A tool, not a build step: run `node scripts/render-og.mjs` from apps/web-site
   whenever the canon or the wordmark changes, commit the PNGs.
   No dependencies: raw RGBA buffer + minimal PNG encoder via zlib. */
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";
import url from "node:url";

const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.join(here, "..");

/* load the site's own engines with a window stub — engines called, never edited */
const win = {};
globalThis.window = win;
eval(fs.readFileSync(path.join(root, "assets/pixelfont.js"), "utf8"));
const type = win.QevrType;
const data = JSON.parse(fs.readFileSync(path.join(root, "assets/qevr-expressions.json"), "utf8"));
const CROP = { x0: 6, y0: 5, w: 23, h: 25 };
const byName = {};
for (const e of data.expressions) byName[e.name] = e.rows.map((r) => r.split("").map(Number));

const INK = [9, 9, 11], LIME = [204, 255, 0], MUTED = [154, 154, 165], WHITE = [255, 255, 255];

function makeCanvas(w, h, bg) {
  const px = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) { px[i * 3] = bg[0]; px[i * 3 + 1] = bg[1]; px[i * 3 + 2] = bg[2]; }
  return { w, h, px };
}
function rect(c, x, y, w, h, col) {
  for (let yy = Math.max(0, y); yy < Math.min(c.h, y + h); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(c.w, x + w); xx++) {
      const i = (yy * c.w + xx) * 3;
      c.px[i] = col[0]; c.px[i + 1] = col[1]; c.px[i + 2] = col[2];
    }
  }
}
function frame(c, x, y, w, h, t, col) {
  rect(c, x, y, w, t, col); rect(c, x, y + h - t, w, t, col);
  rect(c, x, y, t, h, col); rect(c, x + w - t, y, t, h, col);
}
function face(c, name, ox, oy, cell, body) {
  const g = byName[name];
  for (let gy = 0; gy < CROP.h; gy++) for (let gx = 0; gx < CROP.w; gx++) {
    const v = g[gy + CROP.y0][gx + CROP.x0];
    if (!v) continue;
    rect(c, ox + gx * cell, oy + gy * cell, cell, cell, v === 2 ? INK : body);
  }
}
function word(c, text, ox, oy, cell, col) {
  const m = type.textMatrix(text);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (m.cells[y * m.w + x]) rect(c, ox + x * cell, oy + y * cell, cell, cell, col);
  }
  return m;
}

/* minimal PNG encoder: 8-bit RGB, no interlace */
function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(typeStr, dataBuf) {
  const len = Buffer.alloc(4); len.writeUInt32BE(dataBuf.length);
  const body = Buffer.concat([Buffer.from(typeStr, "ascii"), dataBuf]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePNG(c, file) {
  const raw = Buffer.alloc(c.h * (c.w * 3 + 1));
  for (let y = 0; y < c.h; y++) {
    raw[y * (c.w * 3 + 1)] = 0;
    c.px.copyWithin
      ? null
      : null;
    Buffer.from(c.px.buffer, y * c.w * 3, c.w * 3).copy(raw, y * (c.w * 3 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0); ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
  fs.writeFileSync(file, png);
  console.log(file, png.length, "bytes");
}

/* ---------- the site card: him fat-pixel on ink beside the mark and the stamp ---------- */
{
  const c = makeCanvas(1200, 630, INK);
  frame(c, 24, 24, 1152, 582, 10, LIME);
  face(c, "Default", 70, 95, 18, LIME);
  word(c, "QIQI", 540, 100, 17, LIME);
  word(c, "NOS VEMOS", 545, 330, 7, WHITE);
  word(c, "NA PISTA :)", 545, 410, 7, WHITE);
  word(c, "SAO PAULO", 545, 520, 4, MUTED);
  writePNG(c, path.join(root, "assets/og-card.png"));
}

/* ---------- the gallery card: the prototypes racked ---------- */
{
  const c = makeCanvas(1200, 630, INK);
  frame(c, 24, 24, 1152, 582, 10, [255, 0, 127]);
  word(c, "A GALERIA", 60, 50, 9, WHITE);
  word(c, "OS 23 PROTOTIPOS", 640, 78, 4, MUTED);
  const names = data.expressions.map((e) => e.name);
  names.forEach((n, i) => {
    const col = i % 8, row = Math.floor(i / 8);
    face(c, n, 66 + col * 140, 168 + row * 142, 5, LIME);
  });
  writePNG(c, path.join(root, "assets/og-galeria.png"));
}
