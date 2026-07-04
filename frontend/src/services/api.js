import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tpp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tpp_token')
      localStorage.removeItem('tpp_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  completeRegistration: (data) => api.post('/auth/complete-registration', data),
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export const quizApi = {
  submit: (answers) => api.post('/quiz/submit', { answers }),
  getQuestions: () => api.get('/quiz/questions'),
}

// ─── House ────────────────────────────────────────────────────────────────────
export const houseApi = {
  select: (house) => api.post('/house/select', { house }),
}

// ─── Articles ─────────────────────────────────────────────────────────────────
export const articleApi = {
  getLatest: (page = 1, limit = 10) => api.get(`/articles/latest?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/articles/${id}`),
  search: (q, page = 1) => api.get(`/articles/search?q=${encodeURIComponent(q)}&page=${page}`),
  getByJournalist: (journalistId, page = 1) => api.get(`/articles/journalist/${journalistId}?page=${page}`),
  getDashboard: () => api.get('/articles/dashboard/me'),
  create: (formData) => api.post('/articles', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.patch(`/articles/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submit: (id) => api.post(`/articles/${id}/submit`),
}

// ─── Journalist ───────────────────────────────────────────────────────────────
export const journalistApi = {
  apply: () => api.post('/journalist/apply'),
  getCloudinarySignature: () => api.get('/journalist/cloudinary-signature'),
  saveDocumentUrls: (documents) => api.post('/journalist/documents/save-urls', { documents }),
  uploadDocumentsBackend: (formData) => api.post('/journalist/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 min timeout for backend upload
  }),
  getProfile: (id) => api.get(`/journalist/profile/${id}`),
  getMyProfile: () => api.get('/journalist/my/profile'),
  getDocuments: (id) => api.get(`/journalist/${id}/documents`),
  reviewDocument: (docId, data) => api.patch(`/journalist/documents/${docId}/review`, data),
}

// ─── Fact Check ───────────────────────────────────────────────────────────────
export const factCheckApi = {
  getUnverified: (page = 1) => api.get(`/factcheck/unverified?page=${page}`),
  submit: (articleId, data) => api.post(`/factcheck/article/${articleId}`, data),
  getForArticle: (articleId) => api.get(`/factcheck/article/${articleId}`),
}

// ─── Credibility ──────────────────────────────────────────────────────────────
export const credibilityApi = {
  getLeaderboard: () => api.get('/credibility/leaderboard'),
  getScore: (journalistId) => api.get(`/credibility/${journalistId}`),
  getHistory: (journalistId) => api.get(`/credibility/${journalistId}/history`),
}

// ─── Comparison ───────────────────────────────────────────────────────────────
export const comparisonApi = {
  getSideBySide: (articleId) => api.get(`/compare/${articleId}`),
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export const commentApi = {
  getComments: (articleId, page = 1) => api.get(`/comments/${articleId}?page=${page}`),
  addComment: (articleId, content) => api.post(`/comments/${articleId}`, { content }),
  deleteComment: (commentId) => api.delete(`/comments/comment/${commentId}`),
}

// ─── Rewards ──────────────────────────────────────────────────────────────────
export const rewardApi = {
  sendTip: (articleId, amount) => api.post(`/rewards/tip/${articleId}`, { amount }),
  getArticleTips: (articleId) => api.get(`/rewards/tips/${articleId}`),
  getEarnings: (page = 1) => api.get(`/rewards/earnings?page=${page}`),
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptionApi = {
  subscribe: (journalistId, tier = 'FREE') => api.post(`/subscriptions/${journalistId}`, { tier }),
  unsubscribe: (journalistId) => api.delete(`/subscriptions/${journalistId}`),
  getMySubscriptions: () => api.get('/subscriptions'),
  getMySubscribers: () => api.get('/subscriptions/my/subscribers'),
  getFeed: (page = 1) => api.get(`/subscriptions/my/feed?page=${page}`),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationApi = {
  getAll: (page = 1) => api.get(`/notifications?page=${page}`),
  markRead: (ids) => api.patch('/notifications/read', { ids }),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
}

// ─── Moderation ───────────────────────────────────────────────────────────────
export const moderationApi = {
  flagArticle: (articleId, reason) => api.post(`/moderation/flag/${articleId}`, { reason }),
  getArticleFlags: (articleId) => api.get(`/moderation/flags/${articleId}`),
  getFlagged: (page = 1) => api.get(`/moderation/flagged?page=${page}`),
  takeDown: (articleId, reason) => api.patch(`/moderation/takedown/${articleId}`, { reason }),
  restore: (articleId, reason) => api.patch(`/moderation/restore/${articleId}`, { reason }),
  warn: (journalistId, reason) => api.post(`/moderation/warn/${journalistId}`, { reason }),
  getLog: (page = 1) => api.get(`/moderation/log?page=${page}`),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getPendingJournalists: () => api.get('/admin/journalists/pending'),
  approveJournalist: (id) => api.patch(`/admin/journalists/${id}/approve`),
  rejectJournalist: (id) => api.delete(`/admin/journalists/${id}/reject`),
  getPendingArticles: () => api.get('/admin/articles/pending'),
  approveArticle: (id) => api.patch(`/admin/articles/${id}/approve`),
  rejectArticle: (id, reason) => api.patch(`/admin/articles/${id}/reject`, { reason }),
  requestCorrection: (id, reason) => api.patch(`/admin/articles/${id}/correct`, { reason }),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getMyAnalytics: () => api.get('/analytics/me'),
  getArticleAnalytics: (articleId) => api.get(`/analytics/article/${articleId}`),
  getPlatformAnalytics: () => api.get('/analytics/platform'),
}

// ─── Quiz Questions ───────────────────────────────────────────────────────────
export const quizQuestionsApi = {
  getPublic: () => api.get('/quiz/questions'),
  getAdmin: () => api.get('/admin/quiz-questions'),
  update: (questions) => api.put('/admin/quiz-questions', { questions }),
}

// ─── Direct Cloudinary Upload (browser → Cloudinary, bypasses backend) ────────
// This avoids Docker networking issues on Windows during development
export const uploadToCloudinaryDirect = async (file, signature, timestamp, folder, cloudName, apiKey) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('signature', signature)
  formData.append('timestamp', timestamp)
  formData.append('folder', folder)
  formData.append('api_key', apiKey)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }

  return await response.json() // { secure_url, public_id, ... }
}
