/**
 * Builds the site monogram and every icon from it.
 *
 * 1. Reads the "A" and "J" glyph outlines from assets/fonts/InstrumentSerif-Regular.ttf
 *    with a tiny TrueType parser (no font dependency at render time) and writes
 *    assets/icon-src/icon.svg: a white serif "AJ" on a teal rounded square.
 * 2. Renders public/icons/{icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png,
 *    apple-touch-icon.png} and public/favicon.ico (16, 32 and 48 px PNGs in one ICO).
 *
 * Run: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const TEAL = "#137C72";
const FONT = "assets/fonts/InstrumentSerif-Regular.ttf";

/* ---------- minimal TrueType reader: cmap format 4, loca, glyf, hmtx ---------- */

function readFont(buf) {
  const tables = {};
  const numTables = buf.readUInt16BE(4);
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    tables[buf.toString("latin1", rec, rec + 4)] = buf.readUInt32BE(rec + 8);
  }
  const head = tables.head;
  const unitsPerEm = buf.readUInt16BE(head + 18);
  const longLoca = buf.readInt16BE(head + 50) === 1;
  const numHMetrics = buf.readUInt16BE(tables.hhea + 34);

  function glyphIndex(code) {
    const cmap = tables.cmap;
    const n = buf.readUInt16BE(cmap + 2);
    for (let i = 0; i < n; i++) {
      const platform = buf.readUInt16BE(cmap + 4 + i * 8);
      const encoding = buf.readUInt16BE(cmap + 6 + i * 8);
      const sub = cmap + buf.readUInt32BE(cmap + 8 + i * 8);
      if (platform !== 3 || encoding !== 1 || buf.readUInt16BE(sub) !== 4) continue;
      const segX2 = buf.readUInt16BE(sub + 6);
      const ends = sub + 14;
      const starts = ends + segX2 + 2;
      const deltas = starts + segX2;
      const ranges = deltas + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = buf.readUInt16BE(ends + s * 2);
        const start = buf.readUInt16BE(starts + s * 2);
        if (code < start || code > end) continue;
        const delta = buf.readInt16BE(deltas + s * 2);
        const rangeOffset = buf.readUInt16BE(ranges + s * 2);
        if (rangeOffset === 0) return (code + delta) & 0xffff;
        const at = ranges + s * 2 + rangeOffset + (code - start) * 2;
        const g = buf.readUInt16BE(at);
        return g === 0 ? 0 : (g + delta) & 0xffff;
      }
    }
    throw new Error(`No glyph for U+${code.toString(16)}`);
  }

  function advance(gid) {
    const i = Math.min(gid, numHMetrics - 1);
    return buf.readUInt16BE(tables.hmtx + i * 4);
  }

  function glyphOffset(gid) {
    const loca = tables.loca;
    return longLoca
      ? [buf.readUInt32BE(loca + gid * 4), buf.readUInt32BE(loca + gid * 4 + 4)]
      : [buf.readUInt16BE(loca + gid * 2) * 2, buf.readUInt16BE(loca + gid * 2 + 2) * 2];
  }

  /** Returns contours as arrays of { x, y, on }, in font units (y up). */
  function contours(gid) {
    const [start, end] = glyphOffset(gid);
    if (end === start) return [];
    const g = tables.glyf + start;
    const n = buf.readInt16BE(g);
    if (n < 0) throw new Error("Composite glyphs are not supported");
    const endPts = [];
    for (let i = 0; i < n; i++) endPts.push(buf.readUInt16BE(g + 10 + i * 2));
    const count = endPts[n - 1] + 1;
    let p = g + 10 + n * 2;
    p += 2 + buf.readUInt16BE(p);
    const flags = [];
    while (flags.length < count) {
      const f = buf.readUInt8(p++);
      flags.push(f);
      if (f & 8) {
        let r = buf.readUInt8(p++);
        while (r-- > 0) flags.push(f);
      }
    }
    const coords = (shortBit, sameBit) => {
      const out = [];
      let v = 0;
      for (const f of flags) {
        if (f & shortBit) {
          const d = buf.readUInt8(p++);
          v += f & sameBit ? d : -d;
        } else if (!(f & sameBit)) {
          v += buf.readInt16BE(p);
          p += 2;
        }
        out.push(v);
      }
      return out;
    };
    const xs = coords(2, 16);
    const ys = coords(4, 32);
    const result = [];
    let from = 0;
    for (const to of endPts) {
      const c = [];
      for (let i = from; i <= to; i++) c.push({ x: xs[i], y: ys[i], on: (flags[i] & 1) === 1 });
      result.push(c);
      from = to + 1;
    }
    return result;
  }

  return { unitsPerEm, glyphIndex, advance, contours };
}

/** Quadratic TrueType contours to an SVG path, with a transform applied to points. */
function contoursToPath(list, tx) {
  const fmt = (n) => Number(n.toFixed(2));
  const pt = (q) => {
    const [x, y] = tx(q.x, q.y);
    return `${fmt(x)} ${fmt(y)}`;
  };
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true });
  let d = "";
  for (const c of list) {
    if (c.length === 0) continue;
    let startIdx = c.findIndex((q) => q.on);
    let pts;
    if (startIdx === -1) {
      const m = mid(c[c.length - 1], c[0]);
      pts = [m, ...c];
      startIdx = 0;
    } else {
      pts = [...c.slice(startIdx), ...c.slice(0, startIdx)];
    }
    d += `M${pt(pts[0])}`;
    for (let i = 1; i <= pts.length; i++) {
      const cur = pts[i % pts.length];
      if (cur.on) {
        if (i === pts.length) break;
        d += `L${pt(cur)}`;
      } else {
        const next = pts[(i + 1) % pts.length];
        const end = next.on ? next : mid(cur, next);
        d += `Q${pt(cur)} ${pt(end)}`;
        if (next.on) i++;
      }
    }
    d += "Z";
  }
  return d;
}

/* ---------- monogram ---------- */

const font = readFont(await readFile(FONT));
const letters = ["A", "J"].map((ch) => {
  const gid = font.glyphIndex(ch.charCodeAt(0));
  return { contours: font.contours(gid), advance: font.advance(gid) };
});

// Lay the two glyphs out on one baseline with a slight tightening, then measure.
const TRACK = -0.04 * font.unitsPerEm;
let penX = 0;
const placed = letters.map((l) => {
  const at = penX;
  penX += l.advance + TRACK;
  return { ...l, at };
});
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const l of placed) {
  for (const c of l.contours) {
    for (const q of c) {
      minX = Math.min(minX, q.x + l.at);
      maxX = Math.max(maxX, q.x + l.at);
      minY = Math.min(minY, q.y);
      maxY = Math.max(maxY, q.y);
    }
  }
}

/**
 * Path for "AJ" fitted into a 512 box. `extent` is the share of the box the
 * monogram's larger side may take, which keeps the maskable variant inside its
 * 80% safe zone.
 */
function monogramPath(extent) {
  const w = maxX - minX;
  const h = maxY - minY;
  const scale = (512 * extent) / Math.max(w, h);
  const ox = 256 - (w * scale) / 2;
  const oy = 256 + (h * scale) / 2;
  return placed
    .map((l) =>
      contoursToPath(l.contours, (x, y) => [ox + (x + l.at - minX) * scale, oy - (y - minY) * scale])
    )
    .join("");
}

/**
 * The icon as SVG. `rounded` gives the browser icon its soft square; full-bleed
 * variants (maskable, Apple) are opaque squares the platform masks itself.
 * `stroke` thickens the hairline serifs for 16 to 48 px renders.
 */
function iconSvg({ rounded = true, extent = 0.62, stroke = 0 } = {}) {
  const rx = rounded ? 112 : 0;
  const strokeAttrs = stroke > 0 ? ` stroke="#fff" stroke-width="${stroke}" stroke-linejoin="round"` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="AJ monogram">` +
    `<rect width="512" height="512" rx="${rx}" fill="${TEAL}"/>` +
    `<path d="${monogramPath(extent)}" fill="#fff"${strokeAttrs}/>` +
    `</svg>\n`
  );
}

await mkdir("assets/icon-src", { recursive: true });
await mkdir("public/icons", { recursive: true });

const master = iconSvg();
await writeFile("assets/icon-src/icon.svg", master);
await writeFile("public/icons/icon.svg", master);
console.log("wrote assets/icon-src/icon.svg, public/icons/icon.svg");

const render = (svg, size) =>
  sharp(Buffer.from(svg), { density: 72 * Math.max(1, size / 512) * 2 })
    .resize(size, size)
    .png({ compressionLevel: 9, palette: false });

const jobs = [
  { file: "public/icons/icon-192.png", size: 192, svg: iconSvg({ stroke: 4 }) },
  { file: "public/icons/icon-512.png", size: 512, svg: master },
  // Maskable: full-bleed teal, monogram well inside the central 80% circle.
  { file: "public/icons/icon-maskable-512.png", size: 512, svg: iconSvg({ rounded: false, extent: 0.5 }) },
  // Apple: opaque square, iOS rounds the corners itself.
  { file: "public/icons/apple-touch-icon.png", size: 180, svg: iconSvg({ rounded: false, extent: 0.58, stroke: 4 }) },
];
for (const { file, size, svg } of jobs) {
  let img = render(svg, size);
  if (file.includes("apple") || file.includes("maskable")) img = img.flatten({ background: TEAL });
  await img.toFile(file);
  console.log("wrote", file);
}

// favicon.ico: an ICO directory followed by PNG images, which every current browser reads.
const icoSizes = [16, 32, 48];
const pngs = await Promise.all(
  icoSizes.map((size) =>
    render(iconSvg({ rounded: true, extent: 0.7, stroke: size <= 16 ? 18 : size <= 32 ? 12 : 8 }), size).toBuffer()
  )
);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = 6 + 16 * pngs.length;
const entries = pngs.map((png, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(icoSizes[i], 0);
  entry.writeUInt8(icoSizes[i], 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += png.length;
  return entry;
});
await writeFile("public/favicon.ico", Buffer.concat([header, ...entries, ...pngs]));
console.log("wrote public/favicon.ico");
