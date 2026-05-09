<template>
  <section class="page-section">
    <div class="section-grid">
      <div class="panel">
        <div class="section-head">
          <h3>提交扫描</h3>
          <button type="button" class="link-button" @click="$emit('reload-rule-sets')">重新加载规则集</button>
        </div>

        <form class="form" @submit.prevent="$emit('submit-scan')">
          <label class="field">
            <span>项目名称</span>
            <input v-model="props.form.projectName" type="text" required />
          </label>

          <label class="field">
            <span>选择目录</span>
            <input type="file" webkitdirectory directory multiple @change="$emit('directory-picked', $event)" />
          </label>

          <div class="meta-row">
            <div class="meta-chip">已选目录：{{ props.selectedDirectory || '未选择' }}</div>
            <div class="meta-chip">Java 文件：{{ props.selectedFiles.length }}</div>
          </div>

          <label class="field">
            <span>规则集</span>
            <select v-model="props.form.ruleset" @change="$emit('focus-rule-set', props.form.ruleset)">
              <option value="">请选择一个规则集</option>
              <option v-for="ruleSet in props.ruleSets" :key="ruleSet.ruleset" :value="ruleSet.ruleset">
                {{ ruleSet.displayName }} - {{ ruleSet.ruleCount }} 条规则
              </option>
            </select>
          </label>

          <label class="field">
            <span>规则集路径</span>
            <input
              v-model="props.form.ruleset"
              type="text"
              placeholder="rulesets/java/quickstart.xml"
              list="rule-set-paths"
              @change="$emit('focus-rule-set', props.form.ruleset)"
            />
            <datalist id="rule-set-paths">
              <option v-for="ruleSet in props.ruleSets" :key="ruleSet.ruleset" :value="ruleSet.ruleset" />
            </datalist>
          </label>

          <div
            v-if="props.currentRuleSet"
            class="detail-card clickable"
            @click="$emit('open-rule-set', props.currentRuleSet)"
          >
            <div class="detail-card-head">
              <div>
                <div class="detail-title">{{ props.currentRuleSet.displayName }}</div>
                <div class="meta">{{ props.currentRuleSet.ruleset }}</div>
              </div>
              <button type="button" class="ghost-button" @click.stop="$emit('open-rule-set', props.currentRuleSet)">
                查看详情
              </button>
            </div>
            <div class="detail-copy">
              {{ props.currentRuleSet.description || '这个规则集没有单独描述。' }}
            </div>
          </div>

          <button type="submit" :disabled="props.submitting">
            {{ props.submitting ? '提交中...' : '提交扫描' }}
          </button>
        </form>
      </div>

      <div class="panel">
        <div class="section-head">
          <h3>当前规则集摘要</h3>
          <button type="button" class="link-button" @click="$emit('goto-rulesets')">去规则集</button>
        </div>

        <template v-if="props.currentRuleSet">
          <div class="summary-title">{{ props.currentRuleSet.displayName }}</div>
          <div class="meta">{{ props.currentRuleSet.ruleset }}</div>
          <div class="detail-copy">{{ props.currentRuleSet.description || '暂无描述' }}</div>
          <div class="summary-row">
            <span class="summary-pill">规则数 {{ props.currentRuleSet.ruleCount }}</span>
            <button type="button" class="ghost-button" @click="$emit('use-rule-set', props.currentRuleSet)">
              打开详情
            </button>
          </div>
        </template>
        <div v-else class="empty-state">先选一个规则集，这里会显示摘要。</div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  selectedDirectory: {
    type: String,
    required: true
  },
  selectedFiles: {
    type: Array,
    required: true
  },
  ruleSets: {
    type: Array,
    required: true
  },
  currentRuleSet: {
    type: Object,
    default: null
  },
  submitting: {
    type: Boolean,
    required: true
  }
})

defineEmits(['reload-rule-sets', 'directory-picked', 'focus-rule-set', 'open-rule-set', 'use-rule-set', 'submit-scan', 'goto-rulesets'])
</script>
