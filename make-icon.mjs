// Writes a 1024x1024 app-icon.png (blue tile, white page, red markup box) with no dependencies.
import fs from 'node:fs';
import zlib from 'node:zlib';
const N = 1024, px = Buffer.alloc(N * N * 4);
const inRound = (x, y, x0, y0, x1, y1, r) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r), cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
const set = (x, y, [r, g, b, a]) => { const i = (y * N + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a; };
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  let c = [0, 0, 0, 0];
  if (inRound(x, y, 40, 40, 984, 984, 200)) c = [29, 95, 196, 255];
  if (inRound(x, y, 210, 250, 814, 774, 40)) c = [255, 255, 255, 255];
  for (const [ly, w] of [[340, 300], [420, 420], [600, 360], [680, 260]]) if (y >= ly && y < ly + 30 && x >= 270 && x < 270 + w) c = [196, 204, 214, 255];
  const outer = inRound(x, y, 330, 470, 860, 600, 30), inner = inRound(x, y, 362, 502, 828, 568, 6);
  if (outer && !inner) c = [227, 0, 27, 255];
  set(x, y, c);
}
const raw = Buffer.alloc(N * (N * 4 + 1));
for (let y = 0; y < N; y++) { raw[y * (N * 4 + 1)] = 0; px.copy(raw, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4); }
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 6;
fs.writeFileSync('app-icon.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('app-icon.png written');
