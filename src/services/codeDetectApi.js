const apiBase = ''

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  if (!response.ok) {
    const text = await response.text()
    const error = new Error(text || `HTTP ${response.status}`)
    error.status = response.status
    throw error
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const codeDetectApi = {
  login(payload) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  logout() {
    return request('/api/auth/logout', {
      method: 'POST'
    })
  },

  currentUser() {
    return request('/api/auth/me')
  },

  checkHealth() {
    return request('/api/health')
  },

  listRuleSets() {
    return request('/api/rulesets')
  },

  listTasks() {
    return request('/api/scans')
  },

  getTask(taskId) {
    return request(`/api/scans/${taskId}`)
  },

  getFindings(taskId) {
    return request(`/api/scans/${taskId}/findings`)
  },

  getSourceFile(taskId, fileId) {
    return request(`/api/scans/${taskId}/files/${fileId}`)
  },

  submitScan(payload) {
    return request('/api/scans', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }
}
