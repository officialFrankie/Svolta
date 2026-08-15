/**
 * Genera le icone PWA senza dipendenze: PNG scritto a mano (zlib di Node).
 * Design: sfondo dark #101318, anello verde #16EC9A stile "Svolta Score"
 * con gap in alto a destra (anello al 78%), punto luminoso al capo.
 * Uso: npm run icons
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

const BG = [0x10, 0x13, 0x18];
const GREEN = [0x16, 0xec, 0x9a];
const TRACK = [0x2b, 0x33, 0x3e];

function crc32(buf) {
  let c,
    table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // riga per riga con filtro 0
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Disegna l'icona: anello con arco al 78% partendo dall'alto, antialiasing manuale. */
function drawIcon(size, { padded = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  // maskable: safe zone all'80% → anello più piccolo
  const scale = padded ? 0.62 : 0.78;
  const rOuterMid = (size / 2) * scale;
  const stroke = size * 0.115;
  const rIn = rOuterMid - stroke / 2;
  const rOut = rOuterMid + stroke / 2;
  const ARC = 0.78 * Math.PI * 2; // 78% dell'anello

  // capo dell'arco (punto luminoso)
  const endAngle = -Math.PI / 2 + ARC;
  const dotX = cx + rOuterMid * Math.cos(endAngle);
  const dotY = cy + rOuterMid * Math.sin(endAngle);
  const dotR = stroke * 0.72;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      let col = BG;
      let alpha = 255;

      // dentro la banda dell'anello?
      const band = Math.max(rIn - d, d - rOut); // <0 dentro, >0 fuori
      if (band < 1) {
        // angolo da ore-12 in senso orario
        let ang = Math.atan2(dy, dx) - -Math.PI / 2;
        while (ang < 0) ang += Math.PI * 2;
        const inArc = ang <= ARC;
        const ringCol = inArc ? GREEN : TRACK;
        const cov = band <= 0 ? 1 : 1 - band; // antialias sul bordo
        col = mix(BG, ringCol, Math.max(0, Math.min(1, cov)));
      }

      // punto luminoso al capo dell'arco
      const dd = Math.hypot(x + 0.5 - dotX, y + 0.5 - dotY);
      if (dd < dotR + 1) {
        const cov = dd <= dotR ? 1 : 1 - (dd - dotR);
        col = mix(col, GREEN, Math.max(0, Math.min(1, cov)));
      }

      const i = (y * size + x) * 4;
      rgba[i] = Math.round(col[0]);
      rgba[i + 1] = Math.round(col[1]);
      rgba[i + 2] = Math.round(col[2]);
      rgba[i + 3] = alpha;
    }
  }
  return encodePNG(size, rgba);
}

for (const [name, size, opts] of [
  ["icon-192.png", 192, {}],
  ["icon-512.png", 512, {}],
  ["icon-512-maskable.png", 512, { padded: true }],
  ["apple-touch-icon.png", 180, {}],
]) {
  writeFileSync(join(OUT, name), drawIcon(size, opts));
  console.log(`✓ ${name}`);
}
