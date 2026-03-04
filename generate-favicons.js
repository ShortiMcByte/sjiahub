const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SOURCE = "static/images/logo-mark.png";
const STATIC = "static";

async function generateFavicons() {
  const source = sharp(SOURCE);
  const metadata = await source.metadata();
  console.log(`Source: ${metadata.width}x${metadata.height}`);

  // Determine the square crop area (center crop to square)
  const size = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - size) / 2);
  const top = Math.floor((metadata.height - size) / 2);

  const cropped = sharp(SOURCE).extract({
    left,
    top,
    width: size,
    height: size,
  });

  // Generate PNG favicons at each size
  const sizes = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "android-chrome-192x192.png", size: 192 },
    { name: "android-chrome-512x512.png", size: 512 },
  ];

  for (const { name, size: s } of sizes) {
    const outPath = path.join(STATIC, name);
    await sharp(SOURCE)
      .extract({ left, top, width: size, height: size })
      .resize(s, s, { fit: "cover" })
      .png()
      .toFile(outPath);
    const stat = fs.statSync(outPath);
    console.log(`Created: ${outPath} (${s}x${s}, ${(stat.size / 1024).toFixed(1)} KB)`);
  }

  // Generate favicon.ico (multi-size ICO using 16, 32, 48px PNGs)
  // ICO format: header + directory entries + image data
  const icoSizes = [16, 32, 48];
  const pngBuffers = [];

  for (const s of icoSizes) {
    const buf = await sharp(SOURCE)
      .extract({ left, top, width: size, height: size })
      .resize(s, s, { fit: "cover" })
      .png()
      .toBuffer();
    pngBuffers.push({ size: s, data: buf });
  }

  // Build ICO file
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * numImages;

  let dataOffset = headerSize + dirSize;
  const dirEntries = [];
  const imageDataParts = [];

  for (const { size: s, data } of pngBuffers) {
    dirEntries.push({
      width: s < 256 ? s : 0,
      height: s < 256 ? s : 0,
      dataSize: data.length,
      offset: dataOffset,
    });
    imageDataParts.push(data);
    dataOffset += data.length;
  }

  const totalSize = dataOffset;
  const ico = Buffer.alloc(totalSize);

  // ICO header: reserved(2) + type(2, 1=ICO) + count(2)
  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(numImages, 4);

  // Directory entries
  let pos = headerSize;
  for (const entry of dirEntries) {
    ico.writeUInt8(entry.width, pos);
    ico.writeUInt8(entry.height, pos + 1);
    ico.writeUInt8(0, pos + 2); // color palette
    ico.writeUInt8(0, pos + 3); // reserved
    ico.writeUInt16LE(1, pos + 4); // color planes
    ico.writeUInt16LE(32, pos + 6); // bits per pixel
    ico.writeUInt32LE(entry.dataSize, pos + 8);
    ico.writeUInt32LE(entry.offset, pos + 12);
    pos += dirEntrySize;
  }

  // Image data
  for (const data of imageDataParts) {
    data.copy(ico, pos);
    pos += data.length;
  }

  const icoPath = path.join(STATIC, "favicon.ico");
  fs.writeFileSync(icoPath, ico);
  console.log(`Created: ${icoPath} (multi-size ICO, ${(ico.length / 1024).toFixed(1)} KB)`);

  console.log("\nAll favicons generated!");
}

generateFavicons().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
