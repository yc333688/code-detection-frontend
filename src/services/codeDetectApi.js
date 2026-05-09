const apiBase = ''

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

export const codeDetectApi = {
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
