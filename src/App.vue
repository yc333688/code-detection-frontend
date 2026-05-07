<template>
  <div class="shell">
    <header class="topbar">
      <div>
        <div class="eyebrow">Code Detection</div>
        <h1>Java 代码检测平台</h1>
      </div>
      <div class="status">{{ serviceStatus }}</div>
    </header>

    <main class="grid">
      <section class="panel">
        <h2>提交扫描</h2>
        <form class="form" @submit.prevent="submitScan">
          <label>
            项目名
            <input v-model="form.projectName" type="text" required />
          </label>

          <label>
            选择目录
            <input type="file" webkitdirectory directory multiple @change="onDirectoryPick" />
          </label>

          <div class="meta" v-if="selectedDirectory">已选择：{{ selectedDirectory }}</div>
          <div class="meta" v-if="selectedFiles.length">已读取 {{ selectedFiles.length }} 个文件</div>

          <label>
            规则集
            <input v-model="form.ruleset" type="text" placeholder="rulesets/java/quickstart.xml" />
          </label>

          <button type="submit" :disabled="!selectedFiles.length">提交扫描</button>
        </form>
      </section>

      <section class="panel">
        <h2>任务列表</h2>
        <div class="list">
          <div v-if="tasks.length === 0" class="meta">暂无任务</div>
          <div v-for="task in sortedTasks" :key="task.id" class="card" @click="selectTask(task.id)">
            <div class="title">
              <span>{{ task.projectName }}</span>
              <span class="badge" :class="statusClass(task.status)">{{ task.status }}</span>
            </div>
            <div class="sub">{{ task.sourceLabel || task.sourceDirectory }}</div>
            <div class="sub">findings: {{ task.findingCount || 0 }}</div>
          </div>
        </div>
      </section>

      <section class="panel full">
        <h2>任务详情</h2>
        <pre class="code">{{ taskDetail }}</pre>
      </section>

      <section class="panel full">
        <h2>检测结果</h2>
        <div class="meta">{{ findings.length }} items</div>
        <div class="list">
          <div v-if="findings.length === 0" class="meta">当前任务没有命中结果</div>
          <div v-for="finding in findings" :key="`${finding.filePath}-${finding.beginLine}-${finding.rule}`" class="card">
            <div class="title">
              <span>{{ finding.rule }}</span>
              <span class="badge">{{ finding.severity }}</span>
            </div>
            <div class="sub">{{ finding.filePath }}:{{ finding.beginLine }}-{{ finding.endLine }}</div>
            <div class="sub">{{ finding.message }}</div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

const apiBase = ''

const serviceStatus = ref('API: checking...')
const tasks = ref([])
const findings = ref([])
const taskDetail = ref('请选择一个任务。')
const selectedDirectory = ref('')
const selectedFiles = ref([])

const form = reactive({
  projectName: 'demo',
  ruleset: 'rulesets/java/quickstart.xml'
})

const sortedTasks = computed(() =>
  [...tasks.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
)

function statusClass(status) {
  return String(status || '').toLowerCase()
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  return response.json()
}

async function loadTasks() {
  tasks.value = await request('/api/scans')
}

async function selectTask(id) {
  const task = await request(`/api/scans/${id}`)
  taskDetail.value = JSON.stringify(task, null, 2)
  findings.value = await request(`/api/scans/${id}/findings`)
}

async function onDirectoryPick(event) {
  const files = [...(event.target.files || [])]
  if (!files.length) {
    selectedDirectory.value = ''
    selectedFiles.value = []
    return
  }

  const rootName = files[0].webkitRelativePath.split('/')[0] || files[0].name
  selectedDirectory.value = rootName
  selectedFiles.value = await Promise.all(
    files
      .filter((file) => file.name.endsWith('.java'))
      .map(async (file) => ({
        path: file.webkitRelativePath || file.name,
        content: await file.text()
      }))
  )
}

async function submitScan() {
  const created = await request('/api/scans', {
    method: 'POST',
    body: JSON.stringify({
      projectName: form.projectName.trim(),
      sourceDirectory: selectedDirectory.value.trim(),
      files: selectedFiles.value,
      ruleset: form.ruleset.trim()
    })
  })

  taskDetail.value = JSON.stringify(created, null, 2)
  await loadTasks()
  await selectTask(created.id)
}

async function checkHealth() {
  try {
    await request('/api/health')
    serviceStatus.value = 'API: online'
  } catch {
    serviceStatus.value = 'API: offline'
  }
}

onMounted(async () => {
  try {
    await checkHealth()
    await loadTasks()
  } catch (error) {
    taskDetail.value = error.message
  }
})
</script>
