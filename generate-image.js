const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");

async function generateImage(prompt, outputPath) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  console.log(`Generating image: ${path.basename(outputPath)}...`);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: {
      responseModalities: ["image", "text"],
    },
  });

  // Find the image part in the response
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const imageData = Buffer.from(part.inlineData.data, "base64");
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outputPath, imageData);
      console.log(`Saved: ${outputPath} (${(imageData.length / 1024).toFixed(0)} KB)`);
      return;
    }
  }
  console.error("No image data in response");
}

const prompt = process.argv[2];
const output = process.argv[3];

if (!prompt || !output) {
  console.error("Usage: node generate-image.js <prompt> <output-path>");
  process.exit(1);
}

generateImage(prompt, output).catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
