<template>
  <div class="login-page">
    <div class="login-panel">
      <h1>代码检测平台</h1>
      <p class="login-subtitle">请先登录后再提交扫描任务</p>
      <form class="form" @submit.prevent="$emit('submit')">
        <label class="field">
          <span>用户名</span>
          <input :value="username" type="text" autocomplete="username" @input="$emit('update:username', $event.target.value)" />
        </label>
        <label class="field">
          <span>密码</span>
          <input :value="password" type="password" autocomplete="current-password" @input="$emit('update:password', $event.target.value)" />
        </label>
        <div v-if="error" class="alert error">{{ error }}</div>
        <button type="submit" :disabled="submitting">
          {{ submitting ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
defineProps({
  username: { type: String, required: true },
  password: { type: String, required: true },
  submitting: { type: Boolean, required: true },
  error: { type: String, default: '' }
})

defineEmits(['update:username', 'update:password', 'submit'])
</script>
