<template>
  <aside class="sidebar">
    <div class="brand-block">
      <div class="eyebrow">Code Detection</div>
      <h1>Java 代码检测平台</h1>
      <p class="brand-copy">先做 PMD 规则扫描，后面再平滑接入大模型。</p>
    </div>

    <div class="sidebar-status">
      <span class="status-dot" :class="props.serviceStatusClass"></span>
      <span>{{ props.serviceStatus }}</span>
    </div>

    <nav class="menu">
      <button
        v-for="item in props.menuItems"
        :key="item.id"
        type="button"
        class="menu-item"
        :class="{ active: props.activeSection === item.id }"
        @click="$emit('open-section', item.id)"
      >
        <span class="menu-label">{{ item.label }}</span>
        <span class="menu-desc">{{ item.desc }}</span>
      </button>
    </nav>

    <div class="sidebar-actions">
      <button type="button" class="ghost-button" @click="$emit('reload-rule-sets')">刷新规则集</button>
      <button type="button" class="ghost-button" @click="$emit('refresh-tasks')">刷新任务</button>
    </div>
  </aside>
</template>

<script setup>
const props = defineProps({
  menuItems: {
    type: Array,
    required: true
  },
  activeSection: {
    type: String,
    required: true
  },
  serviceStatus: {
    type: String,
    required: true
  },
  serviceStatusClass: {
    type: String,
    required: true
  }
})

defineEmits(['open-section', 'reload-rule-sets', 'refresh-tasks'])
</script>
