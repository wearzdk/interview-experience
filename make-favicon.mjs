import sharp from "sharp";
import fs from "fs";

const svgBuffer = fs.readFileSync("public/favicon.svg");
sharp(svgBuffer)
  .resize(64, 64)
  .png()
  .toFile("/tmp/favicon-64.png")
  .then(() => console.log("PNG generated"))
  .catch(err => console.error(err));
