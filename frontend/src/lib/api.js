const BASE = '/api'

function token() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const headers = { ...options.headers }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token()) headers['Authorization'] = `Bearer ${token()}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur')
  return data
}

export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  },
  content: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/content${q ? '?' + q : ''}`)
    },
    listPage: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/content${q ? '?' + q : ''}`)
    },
    get: (id) => request(`/content/${id}`),
    create: (formData) => fetch(`${BASE}/content`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
      body: formData,
    }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d }),
    update: (id, formData) => fetch(`${BASE}/content/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token()}` },
      body: formData,
    }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d }),
    delete: (id) => request(`/content/${id}`, { method: 'DELETE' }),
  },
  reviews: {
    list: (contentId) => request(`/content/${contentId}/reviews`),
    create: (contentId, body) => request(`/content/${contentId}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
    delete: (contentId) => request(`/content/${contentId}/reviews`, { method: 'DELETE' }),
  },
  admin: {
    users: () => request('/admin/users'),
    approve: (id) => request(`/admin/users/${id}/approve`, { method: 'PATCH' }),
    revoke: (id) => request(`/admin/users/${id}/revoke`, { method: 'PATCH' }),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  },
  contributors: {
    list: () => request('/content/contributors'),
  },
  activity: {
    get: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/activity${q ? '?' + q : ''}`)
    },
  },
  tags: {
    list: (type) => request(`/tags${type ? `?type=${type}` : ''}`),
    create: (data) => request('/tags', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/tags/${id}`, { method: 'DELETE' }),
  },
  votes: {
    get: (contentId) => request(`/content/${contentId}/votes`),
    cast: (contentId, type) => request(`/content/${contentId}/votes`, { method: 'POST', body: JSON.stringify({ type }) }),
  },
  users: {
    updatePreferences: (data) => request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  linkPreview: (url) => request(`/link-preview?url=${encodeURIComponent(url)}`),
}
