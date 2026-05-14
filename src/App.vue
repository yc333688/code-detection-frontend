<template>
  <LoginView
    v-if="!authenticated"
    :username="loginForm.username"
    :password="loginForm.password"
    :submitting="loginSubmitting"
    :error="loginError"
    @update:username="(value) => (loginForm.username = value)"
    @update:password="(value) => (loginForm.password = value)"
    @submit="handleLogin"
  />

  <div v-else class="app-shell">
    <AppSidebar
      :menu-items="menuItems"
      :active-section="activeSection"
      :service-status="serviceStatus"
      :service-status-class="serviceStatusClass"
      :current-user="currentUser"
      @open-section="openSection"
      @reload-rule-sets="reloadRuleSets"
      @refresh-tasks="refreshTasks"
      @logout="handleLogout"
    />

    <main class="content">
      <header class="content-head">
        <div>
          <div class="section-eyebrow">{{ activeSectionLabel }}</div>
          <h2>{{ activeSectionTitle }}</h2>
        </div>
        <div v-if="formAlert.text" class="alert" :class="formAlert.type">{{ formAlert.text }}</div>
      </header>

      <ScanSection
        v-if="activeSection === 'scan'"
        :form="form"
        :selected-directory="selectedDirectory"
        :selected-files="selectedFiles"
        :rule-sets="ruleSets"
        :current-rule-set="currentRuleSet"
        :submitting="submitting"
        @reload-rule-sets="reloadRuleSets"
        @directory-picked="onDirectoryPick"
        @focus-rule-set="focusRuleSet"
        @open-rule-set="openRuleSetDetail"
        @use-rule-set="useRuleSetForScan"
        @submit-scan="submitScan"
        @goto-rulesets="openSection('rulesets')"
      />

      <RulesetSection
        v-else-if="activeSection === 'rulesets'"
        :rule-sets="ruleSets"
        :current-rule-set="currentRuleSet"
        @open-rule-set="openRuleSetDetail"
        @use-rule-set="useRuleSetForScan"
      />

      <TasksSection
        v-else-if="activeSection === 'tasks'"
        :tasks="sortedTasks"
        :selected-task="selectedTask"
        :selected-task-id="selectedTaskId"
        @select-task="selectTask"
        @show-results="openResultsFromCurrentTask"
        @refresh-tasks="refreshTasks"
      />

      <ResultsSection
        v-else
        :findings="findings"
        :selected-finding="selectedFinding"
        :selected-finding-key="selectedFindingKey"
        :selected-task="selectedTask"
        :source-file="sourceFile"
        :source-loading="sourceLoading"
        :source-error="sourceError"
        :code-lines="codeLines"
        @select-finding="selectFinding"
      />
    </main>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onBeforeUnmount, onMounted } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import LoginView from './components/LoginView.vue'
import ResultsSection from './components/ResultsSection.vue'
import RulesetSection from './components/RulesetSection.vue'
import ScanSection from './components/ScanSection.vue'
import TasksSection from './components/TasksSection.vue'
import { useCodeDetectPlatform } from './composables/useCodeDetectPlatform'
import { codeDetectApi } from './services/codeDetectApi'

const {
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
  stopPolling
} = useCodeDetectPlatform()

const authenticated = ref(false)
const currentUser = ref('')
const loginSubmitting = ref(false)
const loginError = ref('')
const loginForm = reactive({
  username: 'admin',
  password: ''
})

async function handleLogin() {
  if (!loginForm.username.trim() || !loginForm.password.trim()) {
    loginError.value = '请输入用户名和密码'
    return
  }

  loginSubmitting.value = true
  loginError.value = ''
  try {
    const result = await codeDetectApi.login({
      username: loginForm.username.trim(),
      password: loginForm.password
    })
    authenticated.value = true
    currentUser.value = result.username
    await initialize()
  } catch (error) {
    loginError.value = error.status === 401 ? '用户名或密码错误' : (error.message || '登录失败')
  } finally {
    loginSubmitting.value = false
  }
}

async function handleLogout() {
  try {
    await codeDetectApi.logout()
  } catch {
    // noop
  } finally {
    stopPolling()
    authenticated.value = false
    currentUser.value = ''
    loginForm.password = ''
    loginError.value = ''
  }
}

onMounted(async () => {
  try {
    const user = await codeDetectApi.currentUser()
    authenticated.value = true
    currentUser.value = user.username
    await initialize()
  } catch {
    authenticated.value = false
  }
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>
