const appState = {
  currentPage: "home",
  speechRate: 0.78,
  currentStepIndex: 0,
  timerId: null,
  timerLeft: 300,
  assignment: {
    title: "语文朗读和数学口算",
    teacher: "李老师",
    time: "今天 16:30",
    content: [
      "朗读《春天来了》第 1 到 2 段，慢慢读 5 分钟。",
      "完成口算本第 8 页第 1 到 10 题。",
      "完成后上传一段朗读录音或小视频。"
    ],
    childPreview: [
      "先读课文 5 分钟。",
      "再写 10 道口算题。",
      "最后拍一下完成的小作品。"
    ],
    steps: [
      { title: "大声朗读课文", simple: "把书翻到第 12 页，跟着语音慢慢读 5 分钟。", duration: 300, completion: "朗读 5 分钟就算完成。", type: "timer", done: false },
      { title: "完成口算练习", simple: "写完第 8 页前 10 题，写好后检查一遍。", duration: 0, completion: "10 道题都写完就可以。", type: "done", done: false },
      { title: "录一小段作业声音", simple: "按下录音按钮，读一句最满意的话给老师听。", duration: 0, completion: "录好一小段就可以。", type: "record", done: false }
    ]
  },
  memories: [
    { title: "第一次自己读课文", time: "今天 17:10", cheer: "奶奶点了赞", palette: "linear-gradient(135deg, #ffd88e, #ffbfb8)" },
    { title: "口算写得真整齐", time: "昨天 18:03", cheer: "爸爸说真认真", palette: "linear-gradient(135deg, #c7ecff, #9fd6ff)" },
    { title: "朗读越来越响亮", time: "前天 16:52", cheer: "妈妈送来小红花", palette: "linear-gradient(135deg, #d8f7ba, #a8e0ae)" },
    { title: "写字坐姿很端正", time: "4月7日 19:02", cheer: "外公夸你有进步", palette: "linear-gradient(135deg, #ffd7f0, #ffc7ad)" }
  ],
  uploadedImages: [],
  mediaRecorded: false
};

const pageOrder = ["home", "upload", "recognition", "detail", "step", "complete", "growth"];
const pageHistory = ["home"];
const pageElements = [...document.querySelectorAll(".page")];
const backButton = document.getElementById("backButton");
const homeButton = document.getElementById("homeButton");
const uploadInput = document.getElementById("uploadInput");
const uploadPreview = document.getElementById("uploadPreview");
const recognizeButton = document.getElementById("recognizeButton");
const recognitionSource = document.getElementById("recognitionSource");
const fieldTitle = document.getElementById("fieldTitle");
const fieldContent = document.getElementById("fieldContent");
const fieldTeacher = document.getElementById("fieldTeacher");
const fieldTime = document.getElementById("fieldTime");
const childPreview = document.getElementById("childPreview");
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

function updateHome() {
  const doneCount = appState.assignment.steps.filter(step => step.done).length;
  const totalCount = appState.assignment.steps.length;
  document.getElementById("homeAssignmentTitle").textContent = appState.assignment.title;
  document.getElementById("homeAssignmentStatus").textContent = doneCount === totalCount ? "已完成" : doneCount ? "进行中" : "还没开始";
  document.getElementById("progressText").textContent = `${doneCount} / ${totalCount}`;
  document.getElementById("starCount").textContent = `${12 + doneCount} 颗星星`;
}

function renderMemoryTiles() {
  homeMemoryStrip.innerHTML = "";
  appState.memories.slice(0, 3).forEach(memory => {
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
    recognitionSource.innerHTML = `<div class="source-shot"><div style="padding:18px;color:#6f8791;">暂时没有截图，系统已放入示例作业。</div></div>`;
    return;
  }
  appState.uploadedImages.forEach(src => {
    const item = document.createElement("div");
    item.className = "source-shot";
    item.innerHTML = `<img src="${src}" alt="作业截图">`;
    recognitionSource.appendChild(item);
  });
}

function renderChildPreview() {
  childPreview.innerHTML = `<ul>${appState.assignment.childPreview.map(item => `<li>${item}</li>`).join("")}</ul>`;
}

function renderAssignmentFields() {
  fieldTitle.value = appState.assignment.title;
  fieldContent.value = appState.assignment.content.join("\n");
  fieldTeacher.value = appState.assignment.teacher;
  fieldTime.value = appState.assignment.time;
  renderChildPreview();
  renderDetail();
}

function renderDetail() {
  document.getElementById("detailTitle").textContent = appState.assignment.title;
  document.getElementById("detailMeta").textContent = `${appState.assignment.teacher} · ${appState.assignment.time}`;
  document.getElementById("tipWhat").textContent = appState.assignment.childPreview.join(" ");
  stepList.innerHTML = "";
  appState.assignment.steps.forEach((step, index) => {
    const card = document.createElement("article");
    card.className = `step-card ${step.done ? "done" : ""}`;
    card.innerHTML = `
      <p class="eyebrow">第 ${index + 1} 步</p>
      <h3>${step.title}</h3>
      <p>${step.simple}</p>
      <p class="eyebrow">${step.completion}</p>
      <div class="step-actions">
        <button class="primary-button" data-step-start="${index}">${step.done ? "再看一遍" : "开始这一步"}</button>
        <button class="soft-button" data-step-speak="${index}">单独语音</button>
      </div>
    `;
    stepList.appendChild(card);
  });
}

function renderDoneList() {
  doneList.innerHTML = appState.assignment.steps.map((step, index) => `<li>第 ${index + 1} 步：${step.title}</li>`).join("");
}

function updateNav() {
  document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.go === appState.currentPage));
  backButton.classList.toggle("hidden", appState.currentPage === "home");
}

function goToPage(page, pushHistory = true) {
  if (!pageOrder.includes(page)) return;
  pageElements.forEach(section => section.classList.toggle("active", section.dataset.page === page));
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
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = appState.speechRate;
  utterance.pitch = document.getElementById("childModeToggle")?.checked ? 1.08 : 1;
  window.speechSynthesis.speak(utterance);
}

function buildSpeakContent(mode) {
  if (mode === "assignmentFull") return `今天的作业是：${appState.assignment.title}。${appState.assignment.childPreview.join("。")}。`;
  if (mode === "stepByStep") return appState.assignment.steps.map((step, index) => `第${index + 1}步，${step.simple}`).join("。");
  if (mode === "currentStep") {
    const step = appState.assignment.steps[appState.currentStepIndex];
    return `现在开始。${step.simple}。${step.completion}`;
  }
  return "";
}

function onUploadChange(event) {
  const files = [...event.target.files];
  appState.uploadedImages = [];
  uploadPreview.innerHTML = "";
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target.result;
      appState.uploadedImages.push(src);
      const item = document.createElement("div");
      item.className = "preview-item";
      item.innerHTML = `<img src="${src}" alt="${file.name}">`;
      uploadPreview.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

function runRecognition() {
  renderRecognitionSource();
  renderAssignmentFields();
  goToPage("recognition");
}

function saveRecognition() {
  appState.assignment.title = fieldTitle.value.trim() || appState.assignment.title;
  appState.assignment.content = fieldContent.value.split("\n").map(line => line.trim()).filter(Boolean);
  appState.assignment.teacher = fieldTeacher.value.trim() || appState.assignment.teacher;
  appState.assignment.time = fieldTime.value.trim() || appState.assignment.time;
  appState.assignment.childPreview = [
    `先做：${appState.assignment.content[0] || "先完成第一项作业"}`,
    `再做：${appState.assignment.content[1] || "再完成第二项作业"}`,
    `最后：${appState.assignment.content[2] || "最后提交作品"}`
  ];
  renderAssignmentFields();
  updateHome();
  goToPage("detail");
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

function markStepComplete(index) {
  appState.assignment.steps[index].done = true;
  nextStepButton.classList.remove("hidden");
  updateHome();
  renderDetail();
}

function buildStepAction(step) {
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
    document.getElementById("recordToggle").addEventListener("click", () => {
      appState.mediaRecorded = true;
      encourageText.textContent = "声音真清楚，已经录好了。";
      markStepComplete(appState.currentStepIndex);
      buildStepAction(appState.assignment.steps[appState.currentStepIndex]);
    });
    return;
  }
  stepActionZone.innerHTML = `
    <div class="done-panel">
      <span>写完后点这里</span>
      <strong>这一步只要完成就可以继续</strong>
      <button class="soft-button" id="finishCurrentStep">我做完了</button>
    </div>
  `;
  document.getElementById("finishCurrentStep").addEventListener("click", () => {
    encourageText.textContent = "这一步完成了，做得很好。";
    markStepComplete(appState.currentStepIndex);
  });
}

function toggleTimer() {
  if (appState.timerId) {
    stopTimer();
    buildStepAction(appState.assignment.steps[appState.currentStepIndex]);
    return;
  }
  appState.timerId = setInterval(() => {
    appState.timerLeft -= 1;
    const display = document.getElementById("timerDisplay");
    if (display) display.textContent = formatTime(appState.timerLeft);
    if (appState.timerLeft <= 0) {
      stopTimer();
      appState.timerLeft = 0;
      encourageText.textContent = "时间到了，你坚持完成了。";
      markStepComplete(appState.currentStepIndex);
      buildStepAction(appState.assignment.steps[appState.currentStepIndex]);
    }
  }, 1000);
  buildStepAction(appState.assignment.steps[appState.currentStepIndex]);
}

function openStep(index) {
  stopTimer();
  appState.currentStepIndex = index;
  appState.timerLeft = appState.assignment.steps[index].duration || 300;
  nextStepButton.classList.toggle("hidden", !appState.assignment.steps[index].done);
  stepTitle.textContent = `第 ${index + 1} 步：${appState.assignment.steps[index].title}`;
  stepDescription.textContent = appState.assignment.steps[index].simple;
  encourageText.textContent = encouragements[index % encouragements.length];
  buildStepAction(appState.assignment.steps[index]);
  goToPage("step");
}

function goNextStep() {
  const nextIndex = appState.currentStepIndex + 1;
  if (nextIndex < appState.assignment.steps.length) return openStep(nextIndex);
  renderDoneList();
  goToPage("complete");
}

function markAllDone() {
  appState.assignment.steps.forEach(step => { step.done = true; });
  renderDetail();
  updateHome();
  renderDoneList();
  goToPage("complete");
}

document.addEventListener("click", event => {
  const goTarget = event.target.closest("[data-go]");
  const speakTarget = event.target.closest("[data-speak]");
  const stepStart = event.target.closest("[data-step-start]");
  const stepSpeak = event.target.closest("[data-step-speak]");

  if (goTarget) return goToPage(goTarget.dataset.go);
  if (speakTarget) return speakText(buildSpeakContent(speakTarget.dataset.speak));
  if (stepStart) return openStep(Number(stepStart.dataset.stepStart));
  if (stepSpeak) return speakText(appState.assignment.steps[Number(stepSpeak.dataset.stepSpeak)].simple);
});

document.querySelectorAll(".segment").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    appState.speechRate = Number(button.dataset.rate);
  });
});

fieldContent.addEventListener("input", () => {
  const lines = fieldContent.value.split("\n").map(line => line.trim()).filter(Boolean);
  childPreview.innerHTML = `<ul>${lines.slice(0, 3).map(line => `<li>${line}</li>`).join("")}</ul>`;
});

uploadInput.addEventListener("change", onUploadChange);
recognizeButton.addEventListener("click", runRecognition);
document.getElementById("saveRecognitionButton").addEventListener("click", saveRecognition);
document.getElementById("markAssignmentDone").addEventListener("click", markAllDone);
nextStepButton.addEventListener("click", goNextStep);
pauseSpeechButton.addEventListener("click", () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); });
completionMediaInput.addEventListener("change", event => {
  const file = event.target.files[0];
  completionMediaLabel.textContent = file ? `已选择：${file.name}` : "选择文件";
});
backButton.addEventListener("click", goBack);
homeButton.addEventListener("click", () => goToPage("home"));

formatDate();
updateHome();
renderMemoryTiles();
renderJournal();
renderAssignmentFields();
renderDoneList();
