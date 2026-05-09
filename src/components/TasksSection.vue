<template>
  <section class="page-section">
    <div class="split-layout">
      <div class="panel">
        <div class="section-head">
          <h3>任务列表</h3>
          <button type="button" class="link-button" @click="$emit('refresh-tasks')">刷新</button>
        </div>

        <div class="list">
          <div v-if="props.tasks.length === 0" class="empty-state">暂无任务。</div>
          <div
            v-for="task in props.tasks"
            :key="task.id"
            class="card"
            :class="{ active: task.id === props.selectedTaskId }"
            @click="$emit('select-task', task.id)"
          >
            <div class="card-title">
              <span>{{ task.projectName }}</span>
              <span class="badge" :class="statusClass(task.status)">{{ task.status }}</span>
            </div>
            <div class="card-sub">{{ task.sourceLabel || task.sourceDirectory }}</div>
            <div class="card-sub">命中 {{ task.findingCount || 0 }} 条</div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="section-head">
          <h3>任务详情</h3>
          <button
            type="button"
            class="ghost-button"
            :disabled="!props.selectedTask || !(props.selectedTask.findingCount > 0)"
            @click="$emit('show-results')"
          >
            查看结果
          </button>
        </div>

        <template v-if="props.selectedTask">
          <div class="detail-grid">
            <div class="detail-field">
              <span class="detail-label">项目</span>
              <span>{{ props.selectedTask.projectName }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">状态</span>
              <span>{{ props.selectedTask.status }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">规则集</span>
              <span class="break-all">{{ props.selectedTask.ruleset || '-' }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">源目录</span>
              <span class="break-all">{{ props.selectedTask.sourceDirectory }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">开始</span>
              <span>{{ formatTime(props.selectedTask.startedAt) }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">结束</span>
              <span>{{ formatTime(props.selectedTask.finishedAt) }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">命中数</span>
              <span>{{ props.selectedTask.findingCount || 0 }}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">创建时间</span>
              <span>{{ formatTime(props.selectedTask.createdAt) }}</span>
            </div>
          </div>

          <div v-if="props.selectedTask.errorMessage" class="alert error task-error">
            {{ props.selectedTask.errorMessage }}
          </div>
        </template>
        <div v-else class="empty-state">先在左侧选一个任务。</div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  tasks: {
    type: Array,
    required: true
  },
  selectedTask: {
    type: Object,
    default: null
  },
  selectedTaskId: {
    type: String,
    required: true
  }
})

const formatTime = (value) => {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(new Date(value))
}

const statusClass = (status) => String(status || '').toLowerCase()

defineEmits(['select-task', 'show-results', 'refresh-tasks'])
</script>
