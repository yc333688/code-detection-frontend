const API_BASE = "http://localhost:8080";

const serviceStatus = document.getElementById("serviceStatus");
const scanForm = document.getElementById("scanForm");
const taskList = document.getElementById("taskList");
const taskDetail = document.getElementById("taskDetail");
const findingList = document.getElementById("findingList");
const findingCount = document.getElementById("findingCount");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
}

function badgeClass(status) {
  return String(status || "").toLowerCase();
}

function renderTasks(tasks) {
  taskList.innerHTML = "";
  if (!tasks.length) {
    taskList.innerHTML = '<div class="meta">暂无任务</div>';
    return;
  }

  tasks
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((task) => {
      const item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
        <div class="title">
          <span>${task.projectName}</span>
          <span class="badge ${badgeClass(task.status)}">${task.status}</span>
        </div>
        <div class="sub">${task.sourceDirectory}</div>
        <div class="sub">findings: ${task.findingCount || 0}</div>
      `;
      item.addEventListener("click", () => selectTask(task.id));
      taskList.appendChild(item);
    });
}

function renderFindings(findings) {
  findingList.innerHTML = "";
  findingCount.textContent = `${findings.length} items`;
  if (!findings.length) {
    findingList.innerHTML = '<div class="meta">当前任务没有命中结果</div>';
    return;
  }

  findings.forEach((finding) => {
    const item = document.createElement("div");
    item.className = "card";
    item.innerHTML = `
      <div class="title">
        <span>${finding.rule}</span>
        <span class="badge">${finding.severity}</span>
      </div>
      <div class="sub">${finding.filePath}:${finding.beginLine}-${finding.endLine}</div>
      <div class="sub">${finding.message || ""}</div>
    `;
    findingList.appendChild(item);
  });
}

async function loadTasks() {
  const tasks = await request("/api/scans");
  renderTasks(tasks);
}

async function selectTask(id) {
  const task = await request(`/api/scans/${id}`);
  taskDetail.textContent = JSON.stringify(task, null, 2);
  const findings = await request(`/api/scans/${id}/findings`);
  renderFindings(findings);
}

async function checkHealth() {
  try {
    await request("/api/health");
    serviceStatus.textContent = "API: online";
  } catch (error) {
    serviceStatus.textContent = "API: offline";
  }
}

scanForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = {
    projectName: document.getElementById("projectName").value.trim(),
    sourceDirectory: document.getElementById("sourceDirectory").value.trim(),
    ruleset: document.getElementById("ruleset").value.trim()
  };
  const created = await request("/api/scans", {
    method: "POST",
    body: JSON.stringify(body)
  });
  taskDetail.textContent = JSON.stringify(created, null, 2);
  await loadTasks();
  await selectTask(created.id);
});

async function bootstrap() {
  await checkHealth();
  await loadTasks();
}

bootstrap().catch((error) => {
  taskDetail.textContent = error.message;
});
