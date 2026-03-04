const sharp = require("sharp");
const path = require("path");

async function removeWhiteBg(inputPath, outputPath, threshold = 240) {
  const image = sharp(inputPath);
  const { width, height, channels } = await image.metadata();

  // Get raw pixel data
  const raw = await image.ensureAlpha().raw().toBuffer();

  // Replace near-white pixels with transparent
  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      raw[i + 3] = 0; // set alpha to 0
    }
  }

  await sharp(raw, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);

  const stat = require("fs").statSync(outputPath);
  console.log(`Created: ${outputPath} (${(stat.size / 1024).toFixed(0)} KB)`);
}

async function main() {
  // Remove bg from logo
  await removeWhiteBg("assets/images/logo-new.png", "assets/images/logo.png");
  // Remove bg from favicon source
  await removeWhiteBg("static/favicon-source.png", "static/favicon-source-transparent.png");
}

main().catch((err) => { console.error(err); process.exit(1); });
