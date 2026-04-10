import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "..");
const distDir = path.join(frontendDir, "build");
const productionApiBaseUrl = "https://seashell-app-kch93.ondigitalocean.app/api";
const localApiBaseUrl = "http://localhost:3001/api";

await mkdir(distDir, { recursive: true });

const filesToCopy = ["index.html", "styles.css", "script.js", "api.js"];

for (const file of filesToCopy) {
  const content = await readFile(path.join(frontendDir, file), "utf8");
  await writeFile(path.join(distDir, file), content, "utf8");
}

const configuredApiBaseUrl = process.env.FRONTEND_API_BASE_URL || productionApiBaseUrl;
const configTemplate = await readFile(path.join(frontendDir, "config.js"), "utf8");
const configContent = configTemplate.replace(
  'const injectedApiBaseUrl = "__API_BASE_URL__";',
  `const injectedApiBaseUrl = ${JSON.stringify(configuredApiBaseUrl)};`
);

if (configContent.includes("__API_BASE_URL__")) {
  throw new Error("config.js placeholder replacement failed.");
}

if (configuredApiBaseUrl === localApiBaseUrl) {
  console.warn("Building frontend with local API base URL.");
}

await writeFile(path.join(distDir, "config.js"), configContent, "utf8");

const sourceHtml = await readFile(path.join(distDir, "index.html"), "utf8");
if (!sourceHtml.includes("./config.js")) {
  throw new Error("index.html must include config.js before script.js");
}
