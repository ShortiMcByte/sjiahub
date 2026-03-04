const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const files = [
  { in: "static/images/logo-mark.png",       out: "static/images/logo-mark.webp",       q: 90 },
  { in: "static/images/og-image.png",         out: "static/images/og-image.webp",         q: 85 },
  { in: "static/images/hero-bg.png",           out: "static/images/hero-bg.webp",           q: 80 },
  { in: "static/images/book-placeholder.png", out: "static/images/book-placeholder.webp", q: 85 },
];

(async () => {
  for (const f of files) {
    if (!fs.existsSync(f.in)) { console.log(`SKIP (not found): ${f.in}`); continue; }
    await sharp(f.in).webp({ quality: f.q }).toFile(f.out);
    const size = (fs.statSync(f.out).size / 1024).toFixed(0);
    console.log(`✓ ${f.out} (${size} KB)`);
  }
})();
