import dotenv from "dotenv";
import express from "express";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");
const dataFile = path.join(dataDir, "homework.json");

const app = express();

//
// ====================== CORS（唯一版本，关键） ======================
//
function parseAllowedOrigins() {
  const raw =
    process.env.CORS_ALLOWED_ORIGINS ||
    "http://localhost:8080,https://brainywork-q2p3bsmok-isdingzhans-projects.vercel.app";

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = parseAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // 🔥 临时放开（确保一定成功）
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "1mb" }));

//
// ====================== 数据初始化 ======================
//
const DEFAULT_HOMEWORK = [
  {
    id: "hw_read_math_001",
    title: "语文朗读和数学口算",
    subject: "语文",
    content: "朗读课文并完成口算练习。",
    teacher: "李老师",
    dueDate: "2026-04-10T16:30:00.000Z",
    createdAt: "2026-04-10T08:30:00.000Z",
    status: "pending",
    priority: "high",
    attachments: [],
    voiceEnabled: true,
    audioUrl: "",
    source: "manual-demo",
    rawText: "",
    steps: [],
    childPreview: []
  }
];

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(
      dataFile,
      JSON.stringify(DEFAULT_HOMEWORK, null, 2),
      "utf8"
    );
  }
}

async function readHomeworkList() {
  await ensureStore();
  const content = await readFile(dataFile, "utf8");
  return JSON.parse(content);
}

async function writeHomeworkList(list) {
  await writeFile(dataFile, JSON.stringify(list, null, 2), "utf8");
}

//
// ====================== API ======================
//
app.get("/api/health", async (_req, res) => {
  const list = await readHomeworkList();
  res.json({
    ok: true,
    service: "brainywork-backend",
    timestamp: new Date().toISOString(),
    homeworkCount: list.length
  });
});

app.get("/api/homework", async (_req, res) => {
  const list = await readHomeworkList();
  res.json({ items: list });
});

app.get("/api/homework/:id", async (req, res) => {
  const list = await readHomeworkList();
  const item = list.find((h) => h.id === req.params.id);

  if (!item) {
    return res.status(404).json({ message: "Not found" });
  }

  res.json(item);
});

app.post("/api/homework", async (req, res) => {
  const list = await readHomeworkList();
  const item = {
    id: crypto.randomUUID(),
    ...req.body
  };

  list.unshift(item);
  await writeHomeworkList(list);

  res.status(201).json(item);
});

app.patch("/api/homework/:id", async (req, res) => {
  const list = await readHomeworkList();
  const index = list.findIndex((h) => h.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Not found" });
  }

  list[index] = { ...list[index], ...req.body };
  await writeHomeworkList(list);

  res.json(list[index]);
});

//
// ====================== 错误处理 ======================
//
app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

//
// ====================== 启动 ======================
//
const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || "0.0.0.0";

await ensureStore();

app.listen(port, host, () => {
  console.log(`backend running at http://${host}:${port}`);
});