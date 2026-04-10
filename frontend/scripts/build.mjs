import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "..");
const distDir = path.join(frontendDir, "build");

await mkdir(distDir, { recursive: true });

const filesToCopy = ["index.html", "styles.css", "script.js", "api.js"];

for (const file of filesToCopy) {
  await cp(path.join(frontendDir, file), path.join(distDir, file));
}

const apiBaseUrl = process.env.FRONTEND_API_BASE_URL || "http://localhost:3001/api";
const configContent = `window.APP_CONFIG = ${JSON.stringify({ apiBaseUrl }, null, 2)};\n`;
await writeFile(path.join(distDir, "config.js"), configContent, "utf8");

const sourceHtml = await readFile(path.join(distDir, "index.html"), "utf8");
if (!sourceHtml.includes("./config.js")) {
  throw new Error("index.html must include config.js before script.js");
}
