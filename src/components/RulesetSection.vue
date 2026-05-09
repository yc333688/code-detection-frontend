<template>
  <section class="page-section">
    <div class="split-layout">
      <div class="panel">
        <div class="section-head">
          <h3>规则集列表</h3>
          <div class="meta">{{ props.ruleSets.length }} 个可用规则集</div>
        </div>

        <div class="list">
          <div
            v-for="ruleSet in props.ruleSets"
            :key="ruleSet.ruleset"
            class="card"
            :class="{ active: props.currentRuleSet?.ruleset === ruleSet.ruleset }"
            @click="$emit('open-rule-set', ruleSet)"
          >
            <div class="card-title">
              <span>{{ ruleSet.displayName }}</span>
              <span class="badge">{{ ruleSet.ruleCount }}</span>
            </div>
            <div class="card-sub">{{ ruleSet.ruleset }}</div>
            <div class="card-sub">{{ ruleSet.description || '暂无描述' }}</div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="section-head">
          <h3>规则集详情</h3>
          <button
            v-if="props.currentRuleSet"
            type="button"
            class="ghost-button"
            @click="$emit('use-rule-set', props.currentRuleSet)"
          >
            用于扫描
          </button>
        </div>

        <template v-if="props.currentRuleSet">
          <div class="summary-title">{{ props.currentRuleSet.displayName }}</div>
          <div class="meta">{{ props.currentRuleSet.ruleset }}</div>
          <div class="detail-copy">{{ props.currentRuleSet.description || '暂无描述' }}</div>

          <div class="rules-grid">
            <div v-for="rule in props.currentRuleSet.rules" :key="rule.name" class="rule-card">
              <div class="card-title">
                <span>{{ rule.name }}</span>
                <span class="badge">{{ rule.priority || 'UNKNOWN' }}</span>
              </div>
              <div class="card-sub">{{ rule.description || '暂无规则说明' }}</div>
              <div class="card-sub">
                <span>Since: {{ rule.since || '-' }}</span>
                <span v-if="rule.deprecated"> · Deprecated</span>
              </div>
              <div v-if="rule.externalInfoUrl" class="card-sub break-all">
                {{ rule.externalInfoUrl }}
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">点击左侧规则集，可以在这里查看规则明细。</div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  ruleSets: {
    type: Array,
    required: true
  },
  currentRuleSet: {
    type: Object,
    default: null
  }
})

defineEmits(['open-rule-set', 'use-rule-set'])
</script>
