import cors from "cors";
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

const DEFAULT_HOMEWORK = [
  {
    id: "hw_read_math_001",
    title: "语文朗读和数学口算",
    subject: "语文",
    content: "朗读《春天来了》第 1 到 2 段 5 分钟，再完成口算本第 8 页前 10 题，最后上传一段朗读录音或小视频。",
    teacher: "李老师",
    dueDate: "2026-04-10T16:30:00.000Z",
    createdAt: "2026-04-10T08:30:00.000Z",
    status: "pending",
    priority: "high",
    attachments: [
      {
        id: "att_reading_card",
        name: "朗读提示卡",
        type: "image",
        url: "",
        status: "placeholder"
      }
    ],
    voiceEnabled: true,
    audioUrl: "",
    source: "manual-demo",
    rawText: "朗读课文《春天来了》前两段，完成口算本第 8 页第 1-10 题，并上传朗读录音。",
    steps: [
      {
        id: "step_1",
        title: "大声朗读课文",
        description: "把书翻到第 12 页，跟着语音慢慢读 5 分钟。",
        completionText: "朗读满 5 分钟就算完成。",
        type: "timer",
        duration: 300,
        done: false
      },
      {
        id: "step_2",
        title: "完成口算练习",
        description: "写完第 8 页前 10 题，写好后检查一遍。",
        completionText: "10 道题都写完就可以继续。",
        type: "done",
        duration: 0,
        done: false
      },
      {
        id: "step_3",
        title: "录一小段作业声音",
        description: "读一句你最满意的话给老师听。",
        completionText: "录好一小段就可以。",
        type: "record",
        duration: 0,
        done: false
      }
    ],
    childPreview: [
      "先读课文 5 分钟。",
      "再写 10 道口算题。",
      "最后录一小段声音。"
    ]
  },
  {
    id: "hw_copy_002",
    title: "生字描红和英语跟读",
    subject: "综合",
    content: "描红《小小的船》生字 2 遍，英语跟读 Unit 3 单词 3 次。",
    teacher: "王老师",
    dueDate: "2026-04-11T09:00:00.000Z",
    createdAt: "2026-04-10T09:10:00.000Z",
    status: "in_progress",
    priority: "medium",
    attachments: [],
    voiceEnabled: false,
    audioUrl: "",
    source: "manual-demo",
    rawText: "描红《小小的船》生字两遍，英语 Unit 3 单词跟读三次。",
    steps: [
      {
        id: "step_1",
        title: "描红生字",
        description: "先把今天的生字描红 2 遍。",
        completionText: "写完并检查整洁度。",
        type: "done",
        duration: 0,
        done: true
      },
      {
        id: "step_2",
        title: "英语跟读",
        description: "打开英语书，跟读 Unit 3 单词 3 次。",
        completionText: "读满 3 次即可。",
        type: "record",
        duration: 0,
        done: false
      }
    ],
    childPreview: [
      "先描红今天的生字。",
      "再跟读英语单词。",
      "做完就可以休息。"
    ]
  }
];

function normalizeHomework(input = {}, existing = {}) {
  const createdAt = existing.createdAt || input.createdAt || new Date().toISOString();
  const dueDate = input.dueDate || existing.dueDate || createdAt;
  const content = typeof input.content === "string"
    ? input.content.trim()
    : Array.isArray(input.content)
      ? input.content.filter(Boolean).join("\n")
      : existing.content || "";
  const childPreview = Array.isArray(input.childPreview)
    ? input.childPreview.filter(Boolean)
    : existing.childPreview || buildChildPreview(content);
  const steps = Array.isArray(input.steps) && input.steps.length
    ? input.steps.map((step, index) => ({
        id: step.id || existing.steps?.[index]?.id || `step_${index + 1}`,
        title: step.title || `步骤 ${index + 1}`,
        description: step.description || "",
        completionText: step.completionText || "",
        type: step.type || "done",
        duration: Number(step.duration) || 0,
        done: Boolean(step.done)
      }))
    : existing.steps || buildDefaultSteps(childPreview);

  return {
    id: existing.id || input.id || crypto.randomUUID(),
    title: input.title?.trim() || existing.title || "未命名作业",
    subject: input.subject?.trim() || existing.subject || "未分类",
    content,
    teacher: input.teacher?.trim() || existing.teacher || "老师",
    dueDate,
    createdAt,
    status: input.status || existing.status || "pending",
    priority: input.priority || existing.priority || "medium",
    attachments: Array.isArray(input.attachments) ? input.attachments : existing.attachments || [],
    voiceEnabled: typeof input.voiceEnabled === "boolean" ? input.voiceEnabled : existing.voiceEnabled ?? true,
    audioUrl: input.audioUrl ?? existing.audioUrl ?? "",
    source: input.source || existing.source || "manual",
    rawText: input.rawText || existing.rawText || content,
    steps,
    childPreview
  };
}

function buildChildPreview(content = "") {
  const lines = content
    .split(/\n|。/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!lines.length) {
    return ["先看清楚老师布置的内容。", "按顺序完成每一步。", "做完记得提交作业。"];
  }

  return lines;
}

function buildDefaultSteps(preview = []) {
  return preview.map((item, index) => ({
    id: `step_${index + 1}`,
    title: `步骤 ${index + 1}`,
    description: item,
    completionText: "完成这一项后继续下一步。",
    type: index === 0 ? "timer" : "done",
    duration: index === 0 ? 300 : 0,
    done: false
  }));
}

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(DEFAULT_HOMEWORK, null, 2), "utf8");
  }
}

async function readHomeworkList() {
  await ensureStore();
  const content = await readFile(dataFile, "utf8");
  const parsed = JSON.parse(content);
  return parsed.map((item) => normalizeHomework(item));
}

async function writeHomeworkList(list) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(list, null, 2), "utf8");
}

function parseAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS
    || "http://localhost:8080,http://127.0.0.1:8080,https://brainywork-mdyc7uqtx-isdingzhans-projects.vercel.app";
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = parseAllowedOrigins();

    // 允许没有 origin 的请求（如 curl、移动端应用、同源请求）
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // 拒绝但不抛出错误，返回 false 让 cors 中间件处理
    callback(null, false);
  },
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 204,
  preflightContinue: false
};

// CORS 中间件会自动处理 OPTIONS 预检请求
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

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
  res.json({
    items: list.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  });
});

app.get("/api/homework/:id", async (req, res) => {
  const list = await readHomeworkList();
  const item = list.find((homework) => homework.id === req.params.id);

  if (!item) {
    res.status(404).json({ message: "Homework not found." });
    return;
  }

  res.json(item);
});

app.post("/api/homework", async (req, res) => {
  const list = await readHomeworkList();
  const item = normalizeHomework(req.body);
  list.unshift(item);
  await writeHomeworkList(list);
  res.status(201).json(item);
});

app.patch("/api/homework/:id", async (req, res) => {
  const list = await readHomeworkList();
  const index = list.findIndex((homework) => homework.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ message: "Homework not found." });
    return;
  }

  const updated = normalizeHomework(req.body, list[index]);
  list[index] = updated;
  await writeHomeworkList(list);
  res.json(updated);
});

// 404 处理 - 放在错误处理之前
app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

// 错误处理中间件 - 必须放在最后
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ message });
});

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || "0.0.0.0";

await ensureStore();

app.listen(port, host, () => {
  console.log(`brainywork backend listening on http://${host}:${port}`);
});
