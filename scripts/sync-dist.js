const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "frontend", "dist");
const targetDir = path.join(rootDir, "dist");

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Frontend build output was not found: ${sourceDir}`);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Copied ${path.relative(rootDir, sourceDir)} to ${path.relative(rootDir, targetDir)}`);
