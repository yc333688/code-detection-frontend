<template>
  <section class="page-section">
    <div class="panel">
      <div class="section-head">
        <h3>检测结果</h3>
        <div class="meta">{{ props.findings.length }} 条命中</div>
      </div>

      <div v-if="props.selectedTask?.errorMessage" class="alert error task-error">
        {{ props.selectedTask.errorMessage }}
      </div>

      <div class="results-layout">
        <div class="results-list">
          <div v-if="props.findings.length === 0" class="empty-state">当前任务还没有命中结果。</div>
          <div
            v-for="finding in props.findings"
            :key="findingKey(finding)"
            class="card finding-card"
            :class="{ active: props.selectedFindingKey === findingKey(finding) }"
            @click="$emit('select-finding', finding)"
          >
            <div class="card-title">
              <span>{{ finding.rule }}</span>
              <span class="badge">{{ finding.severity }}</span>
            </div>
            <div class="card-sub">{{ finding.filePath }}:{{ finding.beginLine }}-{{ finding.endLine }}</div>
            <div class="card-sub">{{ finding.message }}</div>
          </div>
        </div>

        <div class="detail-pane">
          <template v-if="props.selectedFinding">
            <div class="detail-head">
              <div>
                <div class="detail-title">{{ props.selectedFinding.rule }}</div>
                <div class="meta">
                  {{ props.selectedFinding.filePath }}:{{ props.selectedFinding.beginLine }}-{{ props.selectedFinding.endLine }}
                </div>
              </div>
              <span class="badge" :class="severityClass(props.selectedFinding.severity)">
                {{ props.selectedFinding.severity }}
              </span>
            </div>

            <div class="detail-copy">{{ props.selectedFinding.message }}</div>

            <div v-if="props.sourceFile" class="source-meta">
              源文件：{{ props.sourceFile.relativePath }}
            </div>

            <div v-if="props.sourceLoading" class="empty-state">正在加载源代码...</div>
            <div v-else-if="props.sourceError" class="alert error">{{ props.sourceError }}</div>
            <div v-else-if="props.codeLines.length" class="code-viewport">
              <div
                v-for="line in props.codeLines"
                :key="line.number"
                class="code-line"
                :class="{ hit: line.hit }"
              >
                <div class="line-number">{{ line.number }}</div>
                <pre class="line-code">{{ line.text || ' ' }}</pre>
              </div>
            </div>
            <div v-else class="empty-state">选择一个命中项后，这里会显示代码上下文。</div>
          </template>

          <div v-else class="empty-state">点左侧任意一条命中，这里会展开代码上下文。</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  findings: {
    type: Array,
    required: true
  },
  selectedFinding: {
    type: Object,
    default: null
  },
  selectedFindingKey: {
    type: String,
    required: true
  },
  selectedTask: {
    type: Object,
    default: null
  },
  sourceFile: {
    type: Object,
    default: null
  },
  sourceLoading: {
    type: Boolean,
    required: true
  },
  sourceError: {
    type: String,
    required: true
  },
  codeLines: {
    type: Array,
    required: true
  }
})

function findingKey(finding) {
  return `${finding.fileId || finding.filePath}-${finding.beginLine}-${finding.endLine}-${finding.rule}`
}

function severityClass(severity) {
  return String(severity || '').toLowerCase()
}

defineEmits(['select-finding'])
</script>
