import http from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = process.env.STATIC_ROOT ? path.resolve(process.env.STATIC_ROOT) : __dirname;
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 8080;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

http.createServer(async (req, res) => {
  const requestPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const filePath = path.normalize(path.join(rootDir, requestPath));

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const info = await stat(filePath);
  if (info.isDirectory()) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const extension = path.extname(filePath);
  res.writeHead(200, {
    "Content-Type": contentTypes[extension] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(res);
}).listen(port, host, () => {
  console.log(`brainywork frontend listening on http://${host}:${port}`);
});
