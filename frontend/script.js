import { createHomework, getHomeworkDetail, getHomeworkList, updateHomework } from "./api.js";

const appState = {
  currentPage: "home",
  speechRate: 0.78,
  currentStepIndex: 0,
  timerId: null,
  timerLeft: 300,
  homeworkList: [],
  currentHomework: null,
  currentHomeworkId: "",
  uploadedImages: [],
  mediaRecorded: false,
  memories: [
    { title: "第一次自己读课文", time: "今天 17:10", cheer: "奶奶点了赞", palette: "linear-gradient(135deg, #ffd88e, #ffbfb8)" },
    { title: "口算写得真整齐", time: "昨天 18:03", cheer: "爸爸说真认真", palette: "linear-gradient(135deg, #c7ecff, #9fd6ff)" },
    { title: "朗读越来越响亮", time: "前天 16:52", cheer: "妈妈送来小红花", palette: "linear-gradient(135deg, #d8f7ba, #a8e0ae)" },
    { title: "写字坐姿很端正", time: "4月7日 19:02", cheer: "外公夸你有进步", palette: "linear-gradient(135deg, #ffd7f0, #ffc7ad)" }
  ]
};

const pageOrder = ["home", "upload", "recognition", "detail", "step", "complete", "growth"];
const pageHistory = ["home"];
const pageElements = [...document.querySelectorAll(".page")];
const backButton = document.getElementById("backButton");
const homeButton = document.getElementById("homeButton");
const homeworkList = document.getElementById("homeworkList");
const homeworkListState = document.getElementById("homeworkListState");
const homeworkCountBadge = document.getElementById("homeworkCountBadge");
const homeStartButton = document.getElementById("homeStartButton");
const uploadInput = document.getElementById("uploadInput");
const uploadPreview = document.getElementById("uploadPreview");
const recognizeButton = document.getElementById("recognizeButton");
const recognitionSource = document.getElementById("recognitionSource");
const fieldTitle = document.getElementById("fieldTitle");
const fieldSubject = document.getElementById("fieldSubject");
const fieldContent = document.getElementById("fieldContent");
const fieldTeacher = document.getElementById("fieldTeacher");
const fieldDueDate = document.getElementById("fieldDueDate");
const fieldPriority = document.getElementById("fieldPriority");
const fieldVoiceEnabled = document.getElementById("fieldVoiceEnabled");
const childPreview = document.getElementById("childPreview");
const recognitionSaveState = document.getElementById("recognitionSaveState");
const detailState = document.getElementById("detailState");
const stepList = document.getElementById("stepList");
const stepActionZone = document.getElementById("stepActionZone");
const stepTitle = document.getElementById("stepTitle");
const stepDescription = document.getElementById("stepDescription");
const encourageText = document.getElementById("encourageText");
const nextStepButton = document.getElementById("nextStepButton");
const doneList = document.getElementById("doneList");
const journalList = document.getElementById("journalList");
const homeMemoryStrip = document.getElementById("homeMemoryStrip");
const pauseSpeechButton = document.getElementById("pauseSpeechButton");
const completionMediaInput = document.getElementById("completionMediaInput");
const completionMediaLabel = document.getElementById("completionMediaLabel");
const voiceStatusText = document.getElementById("voiceStatusText");
const voiceAudio = document.getElementById("voiceAudio");
const playTeacherAudioButton = document.getElementById("playTeacherAudioButton");

const encouragements = [
  "你已经开始啦，慢慢来就很好。",
  "这一小步做完，就离完成更近了。",
  "做得不错，继续按顺序来。",
  "你能自己做到，真厉害。"
];

function formatDate() {
  const now = new Date();
  const weekMap = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  document.getElementById("todayDate").textContent = `${now.getMonth() + 1}月${now.getDate()}日 ${weekMap[now.getDay()]}`;
}

function formatDateTime(value) {
  if (!value) return "待安排";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function getStatusText(status) {
  return {
    pending: "还没开始",
    in_progress: "进行中",
    completed: "已完成"
  }[status] || "待处理";
}

function getPriorityText(priority) {
  return {
    high: "高优先",
    medium: "中优先",
    low: "低优先"
  }[priority] || "普通";
}

function deriveChildPreviewFromContent(content) {
  const lines = content
    .split(/\n|。/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (lines.length) return lines;
  return ["先看清楚老师布置的内容。", "按顺序完成每一步。", "做完记得提交作业。"];
}

function computeHomeworkStatus(homework) {
  if (!homework?.steps?.length) return "pending";
  const doneCount = homework.steps.filter((step) => step.done).length;
  if (doneCount === 0) return "pending";
  if (doneCount === homework.steps.length) return "completed";
  return "in_progress";
}

function computeDurationText(steps = []) {
  const totalSeconds = steps.reduce((sum, step) => sum + (Number(step.duration) || 0), 0);
  if (!totalSeconds) return `${steps.length || 1} 个步骤`;
  return `约 ${Math.max(1, Math.round(totalSeconds / 60))} 分钟`;
}

function setInlineState(element, text = "", type = "info") {
  element.textContent = text;
  element.classList.toggle("hidden", !text);
  element.dataset.state = text ? type : "";
}

function getCurrentHomework() {
  return appState.currentHomework;
}

function updateHome() {
  const homework = getCurrentHomework();
  const title = document.getElementById("homeAssignmentTitle");
  const status = document.getElementById("homeAssignmentStatus");
  const hint = document.getElementById("homeAssignmentHint");
  const progressText = document.getElementById("progressText");
  const starCount = document.getElementById("starCount");

  if (!homework) {
    title.textContent = "暂无作业";
    status.textContent = "等待老师布置";
    hint.textContent = "后端已接通，但当前还没有可展示的作业。";
    progressText.textContent = "0 / 0";
    starCount.textContent = "12 颗星星";
    return;
  }

  const doneCount = homework.steps.filter((step) => step.done).length;
  const totalCount = homework.steps.length;

  title.textContent = homework.title;
  status.textContent = getStatusText(homework.status);
  hint.textContent = `${homework.subject} · ${getPriorityText(homework.priority)} · 截止 ${formatDateTime(homework.dueDate)}`;
  progressText.textContent = `${doneCount} / ${totalCount}`;
  starCount.textContent = `${12 + doneCount} 颗星星`;
}

function renderHomeworkList() {
  homeworkList.innerHTML = "";
  homeworkCountBadge.textContent = `${appState.homeworkList.length} 项`;

  if (!appState.homeworkList.length) {
    setInlineState(homeworkListState, "当前没有作业，家长可以先上传截图创建。", "empty");
    return;
  }

  setInlineState(homeworkListState, "");

  appState.homeworkList.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `homework-item ${appState.currentHomeworkId === item.id ? "active" : ""}`;
    card.dataset.homeworkSelect = item.id;
    const preview = (item.childPreview || []).slice(0, 2).join(" ");
    card.innerHTML = `
      <div>
        <p class="eyebrow">${item.subject} · ${getPriorityText(item.priority)}</p>
        <strong>${item.title}</strong>
        <p>${preview || item.content}</p>
      </div>
      <div class="homework-item-meta">
        <span class="status-badge">${getStatusText(item.status)}</span>
        <small>${formatDateTime(item.dueDate)}</small>
      </div>
    `;
    homeworkList.appendChild(card);
  });
}

function renderMemoryTiles() {
  homeMemoryStrip.innerHTML = "";
  appState.memories.slice(0, 3).forEach((memory) => {
    const tile = document.createElement("article");
    tile.className = "memory-tile";
    tile.style.setProperty("--tile-bg", memory.palette);
    tile.innerHTML = `<strong>${memory.title}</strong><small>${memory.time}</small>`;
    homeMemoryStrip.appendChild(tile);
  });
}

function renderJournal() {
  journalList.innerHTML = "";
  appState.memories.forEach((memory, index) => {
    const card = document.createElement("article");
    card.className = "journal-card";
    card.innerHTML = `
      <div class="journal-thumb" style="--tile-bg:${memory.palette}"></div>
      <div class="journal-meta">
        <p class="eyebrow">第 ${index + 1} 条成长记录</p>
        <strong>${memory.title}</strong>
        <p>${memory.time}</p>
        <p>${memory.cheer}</p>
        <div class="cheer-row">
          <span class="cheer-pill">点赞 +1</span>
          <span class="cheer-pill">继续加油</span>
        </div>
      </div>
    `;
    journalList.appendChild(card);
  });
}

function renderRecognitionSource() {
  recognitionSource.innerHTML = "";
  if (!appState.uploadedImages.length) {
    recognitionSource.innerHTML = '<div class="source-shot"><div style="padding:18px;color:#6f8791;">暂时没有截图，先用当前作业内容做人工确认。</div></div>';
    return;
  }

  appState.uploadedImages.forEach((file) => {
    const item = document.createElement("div");
    item.className = "source-shot";
    item.innerHTML = `<img src="${file.src}" alt="${file.name}">`;
    recognitionSource.appendChild(item);
  });
}

function renderChildPreview() {
  const preview = deriveChildPreviewFromContent(fieldContent.value);
  childPreview.innerHTML = `<ul>${preview.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function renderRecognitionFields(homework = getCurrentHomework()) {
  const data = homework || {};
  fieldTitle.value = data.title || "";
  fieldSubject.value = data.subject || "语文";
  fieldContent.value = data.content || "";
  fieldTeacher.value = data.teacher || "";
  fieldDueDate.value = formatDateTimeInput(data.dueDate || new Date().toISOString());
  fieldPriority.value = data.priority || "medium";
  fieldVoiceEnabled.value = String(data.voiceEnabled ?? true);
  renderChildPreview();
}

function renderDetail() {
  const homework = getCurrentHomework();
  const detailTitle = document.getElementById("detailTitle");
  const detailMeta = document.getElementById("detailMeta");
  const detailStatus = document.getElementById("detailStatus");
  const tipWhat = document.getElementById("tipWhat");
  const tipDuration = document.getElementById("tipDuration");
  const tipComplete = document.getElementById("tipComplete");

  if (!homework) {
    detailTitle.textContent = "请选择一项作业";
    detailMeta.textContent = "老师 · 截止时间";
    detailStatus.textContent = "待开始";
    tipWhat.textContent = "请选择一项作业查看。";
    tipDuration.textContent = "等待作业数据";
    tipComplete.textContent = "每一步都点完成，最后上传作品。";
    voiceStatusText.textContent = "待生成";
    playTeacherAudioButton.disabled = true;
    stepList.innerHTML = '<article class="empty-card">暂无步骤</article>';
    renderDoneList();
    return;
  }

  detailTitle.textContent = homework.title;
  detailMeta.textContent = `${homework.teacher} · 截止 ${formatDateTime(homework.dueDate)}`;
  detailStatus.textContent = getStatusText(homework.status);
  tipWhat.textContent = (homework.childPreview || []).join(" ");
  tipDuration.textContent = computeDurationText(homework.steps);
  tipComplete.textContent = homework.steps.at(-1)?.completionText || "完成所有步骤即可。";

  if (homework.audioUrl) {
    voiceStatusText.textContent = "老师语音已生成";
    playTeacherAudioButton.disabled = false;
    voiceAudio.src = homework.audioUrl;
  } else if (homework.voiceEnabled) {
    voiceStatusText.textContent = "待生成，可先使用页面朗读";
    playTeacherAudioButton.disabled = true;
    voiceAudio.removeAttribute("src");
  } else {
    voiceStatusText.textContent = "当前作业未开启语音";
    playTeacherAudioButton.disabled = true;
    voiceAudio.removeAttribute("src");
  }

  stepList.innerHTML = "";
  homework.steps.forEach((step, index) => {
    const card = document.createElement("article");
    card.className = `step-card ${step.done ? "done" : ""}`;
    card.innerHTML = `
      <p class="eyebrow">第 ${index + 1} 步</p>
      <h3>${step.title}</h3>
      <p>${step.description}</p>
      <p class="eyebrow">${step.completionText}</p>
      <div class="step-actions">
        <button class="primary-button" data-step-start="${index}">${step.done ? "再看一遍" : "开始这一步"}</button>
        <button class="soft-button" data-step-speak="${index}">单独语音</button>
      </div>
    `;
    stepList.appendChild(card);
  });

  renderDoneList();
}

function renderDoneList() {
  const homework = getCurrentHomework();
  if (!homework?.steps?.length) {
    doneList.innerHTML = "<li>还没有完成的作业。</li>";
    return;
  }

  doneList.innerHTML = homework.steps.map((step, index) => `<li>第 ${index + 1} 步：${step.title}</li>`).join("");
}

function updateNav() {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.go === appState.currentPage));
  backButton.classList.toggle("hidden", appState.currentPage === "home");
}

function goToPage(page, pushHistory = true) {
  if (!pageOrder.includes(page)) return;
  pageElements.forEach((section) => section.classList.toggle("active", section.dataset.page === page));
  appState.currentPage = page;
  if (pushHistory && pageHistory[pageHistory.length - 1] !== page) pageHistory.push(page);
  updateNav();
}

function goBack() {
  if (pageHistory.length <= 1) return goToPage("home", false);
  pageHistory.pop();
  goToPage(pageHistory[pageHistory.length - 1], false);
}

function speakText(text) {
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = appState.speechRate;
  utterance.pitch = document.getElementById("childModeToggle")?.checked ? 1.08 : 1;
  window.speechSynthesis.speak(utterance);
}

function buildSpeakContent(mode) {
  const homework = getCurrentHomework();
  if (!homework) return "还没有可朗读的作业。";
  if (mode === "assignmentFull") return `今天的作业是，${homework.title}。${(homework.childPreview || []).join("。")}。`;
  if (mode === "stepByStep") return homework.steps.map((step, index) => `第 ${index + 1} 步，${step.description}`).join("。");
  if (mode === "currentStep") {
    const step = homework.steps[appState.currentStepIndex];
    if (!step) return "当前没有步骤。";
    return `现在开始。${step.description}。${step.completionText}`;
  }
  return "";
}

function onUploadChange(event) {
  const files = [...event.target.files];
  appState.uploadedImages = [];
  uploadPreview.innerHTML = "";

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const entry = { name: file.name, type: file.type, src: loadEvent.target.result };
      appState.uploadedImages.push(entry);
      const item = document.createElement("div");
      item.className = "preview-item";
      item.innerHTML = `<img src="${entry.src}" alt="${file.name}">`;
      uploadPreview.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

function runRecognition() {
  renderRecognitionSource();
  renderRecognitionFields();
  setInlineState(recognitionSaveState, "");
  goToPage("recognition");
}

async function loadHomeworkCollection({ preserveCurrent = true } = {}) {
  setInlineState(homeworkListState, "正在加载作业列表...", "loading");

  const list = await getHomeworkList();
  appState.homeworkList = list;
  renderHomeworkList();

  if (!list.length) {
    appState.currentHomeworkId = "";
    appState.currentHomework = null;
    updateHome();
    renderDetail();
    return;
  }

  const preferredId = preserveCurrent ? appState.currentHomeworkId : "";
  const nextId = list.find((item) => item.id === preferredId)?.id || list[0].id;
  await setCurrentHomework(nextId, { navigate: false });
}

async function setCurrentHomework(id, { navigate = false } = {}) {
  if (!id) {
    appState.currentHomeworkId = "";
    appState.currentHomework = null;
    renderHomeworkList();
    updateHome();
    renderDetail();
    return;
  }

  setInlineState(detailState, "正在加载作业详情...", "loading");
  const detail = await getHomeworkDetail(id);
  detail.status = computeHomeworkStatus(detail);
  appState.currentHomeworkId = detail.id;
  appState.currentHomework = detail;
  appState.timerLeft = detail.steps[0]?.duration || 300;
  renderHomeworkList();
  updateHome();
  renderDetail();
  setInlineState(detailState, "");

  if (navigate) goToPage("detail");
}

async function saveRecognition() {
  try {
    setInlineState(recognitionSaveState, "正在保存作业...", "loading");
    const content = fieldContent.value.trim();
    const childPreview = deriveChildPreviewFromContent(content);
    const payload = {
      title: fieldTitle.value.trim() || "未命名作业",
      subject: fieldSubject.value.trim() || "未分类",
      content,
      teacher: fieldTeacher.value.trim() || "老师",
      dueDate: fieldDueDate.value ? new Date(fieldDueDate.value).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: "pending",
      priority: fieldPriority.value,
      attachments: appState.uploadedImages.map((file, index) => ({
        id: `upload_${Date.now()}_${index}`,
        name: file.name,
        type: file.type || "image",
        url: "",
        status: "uploaded-local-preview"
      })),
      voiceEnabled: fieldVoiceEnabled.value === "true",
      audioUrl: "",
      source: appState.uploadedImages.length ? "manual-upload" : "manual-form",
      rawText: content,
      childPreview,
      steps: childPreview.map((item, index) => ({
        id: `step_${index + 1}`,
        title: `步骤 ${index + 1}`,
        description: item,
        completionText: index === childPreview.length - 1 ? "完成后记得提交作品。" : "完成这一项后继续下一步。",
        type: index === 0 ? "timer" : "done",
        duration: index === 0 ? 300 : 0,
        done: false
      }))
    };

    const created = await createHomework(payload);
    setInlineState(recognitionSaveState, "保存成功，正在跳转到作业详情。", "success");
    await loadHomeworkCollection({ preserveCurrent: false });
    await setCurrentHomework(created.id, { navigate: true });
  } catch (error) {
    setInlineState(recognitionSaveState, error.message || "保存失败，请稍后再试。", "error");
  }
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function stopTimer() {
  if (appState.timerId) clearInterval(appState.timerId);
  appState.timerId = null;
}

async function persistCurrentHomework() {
  const homework = getCurrentHomework();
  if (!homework) return;
  homework.status = computeHomeworkStatus(homework);
  const updated = await updateHomework(homework.id, homework);
  updated.status = computeHomeworkStatus(updated);
  appState.currentHomework = updated;
  appState.homeworkList = appState.homeworkList.map((item) => item.id === updated.id ? updated : item);
  renderHomeworkList();
  updateHome();
  renderDetail();
}

async function markStepComplete(index) {
  const homework = getCurrentHomework();
  if (!homework?.steps[index]) return;

  homework.steps[index].done = true;
  nextStepButton.classList.remove("hidden");
  await persistCurrentHomework();
}

function buildStepAction(step) {
  if (!step) {
    stepActionZone.innerHTML = '<div class="done-panel"><span>暂无步骤</span><strong>请先选择一项作业</strong></div>';
    return;
  }

  if (step.type === "timer") {
    stepActionZone.innerHTML = `
      <div class="timer-panel">
        <span class="timer-label">朗读倒计时</span>
        <strong id="timerDisplay">${formatTime(appState.timerLeft)}</strong>
        <button class="soft-button" id="timerToggle">${appState.timerId ? "暂停计时" : "开始计时"}</button>
      </div>
    `;
    document.getElementById("timerToggle").addEventListener("click", toggleTimer);
    return;
  }

  if (step.type === "record") {
    stepActionZone.innerHTML = `
      <div class="record-panel">
        <span>读一句你最满意的话</span>
        <strong>${appState.mediaRecorded ? "已经录好啦" : "按一下开始录音"}</strong>
        <button class="soft-button" id="recordToggle">${appState.mediaRecorded ? "重新录一段" : "开始录音"}</button>
      </div>
    `;
    document.getElementById("recordToggle").addEventListener("click", async () => {
      appState.mediaRecorded = true;
      encourageText.textContent = "声音真清楚，已经录好了。";
      await markStepComplete(appState.currentStepIndex);
      buildStepAction(getCurrentHomework()?.steps[appState.currentStepIndex]);
    });
    return;
  }

  stepActionZone.innerHTML = `
    <div class="done-panel">
      <span>做完后点这里</span>
      <strong>这一项完成后就可以继续</strong>
      <button class="soft-button" id="finishCurrentStep">我做完了</button>
    </div>
  `;
  document.getElementById("finishCurrentStep").addEventListener("click", async () => {
    encourageText.textContent = "这一项完成了，做得很好。";
    await markStepComplete(appState.currentStepIndex);
  });
}

function toggleTimer() {
  const homework = getCurrentHomework();
  const step = homework?.steps[appState.currentStepIndex];
  if (!step) return;

  if (appState.timerId) {
    stopTimer();
    buildStepAction(step);
    return;
  }

  appState.timerId = setInterval(async () => {
    appState.timerLeft -= 1;
    const display = document.getElementById("timerDisplay");
    if (display) display.textContent = formatTime(appState.timerLeft);
    if (appState.timerLeft <= 0) {
      stopTimer();
      appState.timerLeft = 0;
      encourageText.textContent = "时间到了，你坚持完成了。";
      await markStepComplete(appState.currentStepIndex);
      buildStepAction(getCurrentHomework()?.steps[appState.currentStepIndex]);
    }
  }, 1000);

  buildStepAction(step);
}

function openStep(index) {
  const homework = getCurrentHomework();
  if (!homework?.steps[index]) return;

  stopTimer();
  appState.currentStepIndex = index;
  appState.timerLeft = homework.steps[index].duration || 300;
  nextStepButton.classList.toggle("hidden", !homework.steps[index].done);
  stepTitle.textContent = `第 ${index + 1} 步：${homework.steps[index].title}`;
  stepDescription.textContent = homework.steps[index].description;
  encourageText.textContent = encouragements[index % encouragements.length];
  buildStepAction(homework.steps[index]);
  goToPage("step");
}

function goNextStep() {
  const homework = getCurrentHomework();
  const nextIndex = appState.currentStepIndex + 1;
  if (homework && nextIndex < homework.steps.length) return openStep(nextIndex);
  renderDoneList();
  goToPage("complete");
}

async function markAllDone() {
  const homework = getCurrentHomework();
  if (!homework) return;

  homework.steps.forEach((step) => {
    step.done = true;
  });
  homework.status = "completed";
  await persistCurrentHomework();
  renderDoneList();
  goToPage("complete");
}

async function handleHomeworkSelection(id, navigate = true) {
  try {
    await setCurrentHomework(id, { navigate });
  } catch (error) {
    setInlineState(detailState, error.message || "加载作业详情失败。", "error");
    if (navigate) goToPage("detail");
  }
}

async function bootstrap() {
  formatDate();
  renderMemoryTiles();
  renderJournal();
  renderRecognitionSource();
  renderRecognitionFields();
  renderDetail();

  try {
    await loadHomeworkCollection();
  } catch (error) {
    setInlineState(homeworkListState, error.message || "作业列表加载失败。", "error");
    setInlineState(detailState, "后端连接失败，请先启动 backend 服务。", "error");
    updateHome();
    renderDetail();
  }
}

document.addEventListener("click", (event) => {
  const goTarget = event.target.closest("[data-go]");
  const speakTarget = event.target.closest("[data-speak]");
  const stepStart = event.target.closest("[data-step-start]");
  const stepSpeak = event.target.closest("[data-step-speak]");
  const homeworkSelect = event.target.closest("[data-homework-select]");

  if (goTarget) return goToPage(goTarget.dataset.go);
  if (speakTarget) return speakText(buildSpeakContent(speakTarget.dataset.speak));
  if (stepStart) return openStep(Number(stepStart.dataset.stepStart));
  if (stepSpeak) return speakText(getCurrentHomework()?.steps[Number(stepSpeak.dataset.stepSpeak)]?.description || "");
  if (homeworkSelect) return handleHomeworkSelection(homeworkSelect.dataset.homeworkSelect, true);
});

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    appState.speechRate = Number(button.dataset.rate);
  });
});

fieldContent.addEventListener("input", renderChildPreview);
uploadInput.addEventListener("change", onUploadChange);
recognizeButton.addEventListener("click", runRecognition);
document.getElementById("saveRecognitionButton").addEventListener("click", saveRecognition);
document.getElementById("markAssignmentDone").addEventListener("click", markAllDone);
nextStepButton.addEventListener("click", goNextStep);
pauseSpeechButton.addEventListener("click", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  voiceAudio.pause();
});
playTeacherAudioButton.addEventListener("click", () => {
  if (voiceAudio.src) {
    voiceAudio.currentTime = 0;
    void voiceAudio.play();
  }
});
completionMediaInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  completionMediaLabel.textContent = file ? `已选择：${file.name}` : "选择文件";
});
backButton.addEventListener("click", goBack);
homeButton.addEventListener("click", () => goToPage("home"));
homeStartButton.addEventListener("click", () => {
  if (appState.currentHomeworkId) {
    void handleHomeworkSelection(appState.currentHomeworkId, true);
  }
});

void bootstrap();
