import { computed, reactive, ref, watch } from 'vue'
import { codeDetectApi } from '../services/codeDetectApi'

export function useCodeDetectPlatform() {
  const menuItems = [
    { id: 'scan', label: '提交扫描', desc: '选择目录和规则集' },
    { id: 'rulesets', label: '规则集', desc: '查看规则列表和详情' },
    { id: 'tasks', label: '任务', desc: '查看历史扫描任务' },
    { id: 'results', label: '检测结果', desc: '查看命中和代码上下文' }
  ]

  const activeSection = ref('scan')
  const serviceStatus = ref('API 检查中')
  const ruleSets = ref([])
  const tasks = ref([])
  const findings = ref([])
  const selectedTaskId = ref('')
  const selectedTask = ref(null)
  const selectedFinding = ref(null)
  const selectedDirectory = ref('')
  const selectedFiles = ref([])
  const currentRuleSetKey = ref('')
  const submitting = ref(false)
  const sourceFile = ref(null)
  const sourceLoading = ref(false)
  const sourceError = ref('')
  const pollingTimer = ref(null)
  const formAlert = ref({ type: '', text: '' })

  const form = reactive({
    projectName: 'demo',
    ruleset: 'rulesets/java/quickstart.xml'
  })

  const sortedTasks = computed(() => [...tasks.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))

  const currentRuleSet = computed(() => {
    const key = currentRuleSetKey.value || form.ruleset
    return ruleSets.value.find((item) => item.ruleset === key) || null
  })

  const selectedFindingKey = computed(() => (selectedFinding.value ? findingKey(selectedFinding.value) : ''))

  const codeLines = computed(() => {
    if (!sourceFile.value?.content || !selectedFinding.value) {
      return []
    }

    const normalized = sourceFile.value.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalized.split('\n')
    const startLine = Math.max(1, (selectedFinding.value.beginLine || 1) - 6)
    const endLine = Math.min(
      lines.length,
      Math.max(selectedFinding.value.endLine || selectedFinding.value.beginLine || 1, selectedFinding.value.beginLine || 1) + 6
    )

    return lines.slice(startLine - 1, endLine).map((text, index) => {
      const number = startLine + index
      const hitStart = selectedFinding.value.beginLine || 1
      const hitEnd = selectedFinding.value.endLine || hitStart
      return {
        number,
        text,
        hit: number >= hitStart && number <= hitEnd
      }
    })
  })

  const activeSectionLabel = computed(() => {
    const item = menuItems.find((entry) => entry.id === activeSection.value)
    return item ? item.label : ''
  })

  const activeSectionTitle = computed(() => {
    switch (activeSection.value) {
      case 'scan':
        return '提交扫描和规则集选择'
      case 'rulesets':
        return '规则集列表和详情'
      case 'tasks':
        return '任务列表和任务详情'
      default:
        return '检测结果和代码上下文'
    }
  })

  const serviceStatusClass = computed(() => {
    const value = serviceStatus.value
    if (value.includes('正常')) return 'ok'
    if (value.includes('异常')) return 'bad'
    return 'idle'
  })

  function setFormAlert(type, text) {
    formAlert.value = { type, text }
  }

  function clearFormAlert() {
    formAlert.value = { type: '', text: '' }
  }

  function openSection(sectionId) {
    activeSection.value = sectionId

    if (sectionId === 'results') {
      if (!selectedFinding.value && findings.value.length > 0) {
        selectedFinding.value = findings.value[0]
      }

      if (selectedFinding.value && !sourceFile.value && !sourceLoading.value) {
        void loadSourceFile(selectedFinding.value)
      }
    }
  }

  function findingKey(finding) {
    return `${finding.fileId || finding.filePath}-${finding.beginLine}-${finding.endLine}-${finding.rule}`
  }

  function statusClass(status) {
    return String(status || '').toLowerCase()
  }

  function severityClass(severity) {
    return String(severity || '').toLowerCase()
  }

  function formatTime(value) {
    if (!value) {
      return '-'
    }

    return new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(new Date(value))
  }

  async function checkHealth() {
    try {
      await codeDetectApi.checkHealth()
      serviceStatus.value = 'API 正常'
    } catch {
      serviceStatus.value = 'API 异常'
    }
  }

  function focusRuleSet(ruleset) {
    if (ruleset) {
      currentRuleSetKey.value = ruleset
    }
  }

  function openRuleSetDetail(ruleSet) {
    currentRuleSetKey.value = ruleSet.ruleset
    form.ruleset = ruleSet.ruleset
    activeSection.value = 'rulesets'
  }

  function useRuleSetForScan(ruleSet) {
    currentRuleSetKey.value = ruleSet.ruleset
    form.ruleset = ruleSet.ruleset
    activeSection.value = 'scan'
  }

  async function reloadRuleSets() {
    ruleSets.value = await codeDetectApi.listRuleSets()

    if (!ruleSets.value.length) {
      currentRuleSetKey.value = ''
      return
    }

    const matched = ruleSets.value.find((item) => item.ruleset === form.ruleset)
    if (matched) {
      currentRuleSetKey.value = matched.ruleset
      return
    }

    currentRuleSetKey.value = ruleSets.value[0].ruleset
    form.ruleset = ruleSets.value[0].ruleset
  }

  async function refreshTasks() {
    tasks.value = await codeDetectApi.listTasks()
  }

  async function loadSourceFile(finding) {
    if (!finding?.fileId || !selectedTaskId.value) {
      sourceFile.value = null
      sourceError.value = '当前命中没有可关联的源文件。'
      return
    }

    sourceLoading.value = true
    sourceError.value = ''

    try {
      sourceFile.value = await codeDetectApi.getSourceFile(selectedTaskId.value, finding.fileId)
    } catch (error) {
      sourceFile.value = null
      sourceError.value = error.message || '源代码加载失败。'
    } finally {
      sourceLoading.value = false
    }
  }

  async function selectFinding(finding, shouldLoadSource = true, switchSection = true) {
    selectedFinding.value = finding
    if (shouldLoadSource) {
      await loadSourceFile(finding)
    }

    if (switchSection) {
      activeSection.value = 'results'
    }
  }

  async function loadTask(id, includeFindings = true) {
    const task = await codeDetectApi.getTask(id)
    selectedTask.value = task
    selectedTaskId.value = id

    if (includeFindings) {
      findings.value = await codeDetectApi.getFindings(id)
      if (findings.value.length > 0) {
        await selectFinding(findings.value[0], true, false)
      } else {
        selectedFinding.value = null
        sourceFile.value = null
        sourceError.value = ''
      }
    }

    return task
  }

  function stopPolling() {
    if (pollingTimer.value) {
      clearInterval(pollingTimer.value)
      pollingTimer.value = null
    }
  }

  function startPolling(taskId) {
    stopPolling()
    pollingTimer.value = setInterval(async () => {
      try {
        const task = await loadTask(taskId, false)
        await refreshTasks()

        if (task.status === 'COMPLETED' || task.status === 'FAILED') {
          findings.value = await codeDetectApi.getFindings(taskId)
          if (findings.value.length > 0) {
            await selectFinding(findings.value[0], true, false)
          }
          stopPolling()
        }
      } catch (error) {
        setFormAlert('error', error.message || '轮询任务失败')
        stopPolling()
      }
    }, 1500)
  }

  async function openResultsFromCurrentTask() {
    if (!findings.value.length) {
      setFormAlert('warning', '当前任务还没有可查看的检测结果。')
      return
    }

    if (!selectedFinding.value && findings.value.length) {
      selectedFinding.value = findings.value[0]
    }

    if (selectedFinding.value && !sourceFile.value && !sourceLoading.value) {
      await loadSourceFile(selectedFinding.value)
    }

    activeSection.value = 'results'
  }

  async function selectTask(id) {
    stopPolling()
    activeSection.value = 'tasks'
    await loadTask(id, true)

    const task = tasks.value.find((item) => item.id === id)
    if (task && (task.status === 'PENDING' || task.status === 'RUNNING')) {
      startPolling(id)
    }
  }

  async function onDirectoryPick(event) {
    const files = [...(event.target.files || [])]
    if (!files.length) {
      selectedDirectory.value = ''
      selectedFiles.value = []
      setFormAlert('warning', '请先选择一个包含 Java 文件的目录。')
      return
    }

    const rootName = files[0].webkitRelativePath.split('/')[0] || files[0].name
    const javaFiles = files.filter((file) => file.name.endsWith('.java'))
    selectedDirectory.value = rootName
    selectedFiles.value = await Promise.all(
      javaFiles.map(async (file) => ({
        path: file.webkitRelativePath || file.name,
        content: await file.text()
      }))
    )

    if (selectedFiles.value.length === 0) {
      setFormAlert('warning', '这个目录里没有可提交的 Java 文件，请重新选择。')
      return
    }

    clearFormAlert()
  }

  async function submitScan() {
    if (!selectedDirectory.value.trim() || !selectedFiles.value.length) {
      setFormAlert('warning', '请先选择包含 Java 文件的目录，再提交扫描。')
      return
    }

    submitting.value = true
    try {
      clearFormAlert()
      const created = await codeDetectApi.submitScan({
        projectName: form.projectName.trim(),
        sourceDirectory: selectedDirectory.value.trim(),
        files: selectedFiles.value,
        ruleset: form.ruleset.trim()
      })

      await refreshTasks()
      await loadTask(created.id, false)
      findings.value = []
      selectedFinding.value = null
      sourceFile.value = null
      sourceError.value = ''
      activeSection.value = 'tasks'
      startPolling(created.id)
      setFormAlert('success', '扫描任务已提交，系统会自动轮询结果。')
    } catch (error) {
      setFormAlert('error', error.message || '提交失败，请稍后重试。')
    } finally {
      submitting.value = false
    }
  }

  async function initialize() {
    try {
      await checkHealth()
      await reloadRuleSets()
      await refreshTasks()

      if (sortedTasks.value.length > 0) {
        await selectTask(sortedTasks.value[0].id)
      }
    } catch (error) {
      setFormAlert('error', error.message || '初始化失败')
    }
  }

  watch(
    () => form.ruleset,
    (value) => {
      const matched = ruleSets.value.find((item) => item.ruleset === value)
      if (matched) {
        currentRuleSetKey.value = matched.ruleset
      }
    }
  )

  return {
    menuItems,
    activeSection,
    serviceStatus,
    serviceStatusClass,
    formAlert,
    form,
    selectedDirectory,
    selectedFiles,
    ruleSets,
    currentRuleSet,
    submitting,
    tasks,
    sortedTasks,
    selectedTaskId,
    selectedTask,
    findings,
    selectedFinding,
    selectedFindingKey,
    sourceFile,
    sourceLoading,
    sourceError,
    codeLines,
    activeSectionLabel,
    activeSectionTitle,
    openSection,
    reloadRuleSets,
    refreshTasks,
    focusRuleSet,
    openRuleSetDetail,
    useRuleSetForScan,
    onDirectoryPick,
    submitScan,
    selectTask,
    selectFinding,
    openResultsFromCurrentTask,
    initialize,
    stopPolling,
    statusClass,
    severityClass,
    formatTime
  }
}
