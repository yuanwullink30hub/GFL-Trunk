/**
 * Garden For Life — Backend API Client
 *
 * Calls the Express backend (multi-provider AI proxy + auth + assessment).
 * All archetype/OCEAN profile data is sent from the frontend with each request.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// ── Token Management ──

const TOKEN_KEY = 'gfl_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Auth ──

/**
 * Register a new account.
 * @returns {Promise<{ token: string, user: { id, email, displayName } }>}
 */
export async function register({ email, password, displayName }) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Registration failed (${response.status})`);
  }

  const data = await response.json();
  setToken(data.token);
  return data;
}

/**
 * Login with email + password.
 * @returns {Promise<{ token: string, user: { id, email, displayName } }>}
 */
export async function login({ email, password }) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Login failed (${response.status})`);
  }

  const data = await response.json();
  setToken(data.token);
  return data;
}

/**
 * Get current authenticated user.
 * @returns {Promise<{ id, email, displayName, createdAt }>}
 */
export async function getMe() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }
    throw new Error('Failed to get user');
  }

  return response.json();
}

/**
 * Logout — clear stored token.
 */
export function logout() {
  clearToken();
}

// ── Assessment Persistence ──

/**
 * Save an assessment result to the database.
 */
export async function saveAssessment(data) {
  const response = await fetch(`${API_BASE}/assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Save failed (${response.status})`);
  }

  return response.json();
}

/**
 * Get assessment history for the current user.
 * @param {{ limit?: number, skip?: number }} [opts]
 */
export async function getHistory(opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.skip) params.set('skip', opts.skip);

  const response = await fetch(`${API_BASE}/assessment/history?${params}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load history (${response.status})`);
  }

  return response.json();
}

/**
 * Get a single assessment by ID.
 */
export async function getAssessment(id) {
  const response = await fetch(`${API_BASE}/assessment/${id}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load assessment (${response.status})`);
  }

  return response.json();
}

/**
 * Call the AI analysis endpoint with archetype profile data + optional question.
 *
 * @param {Object} params
 * @param {string} params.archetypeKey - e.g. "JUDGE", "LOVER"
 * @param {string} [params.provider] - "openai" | "gemini" | "grok" (default: openai)
 * @param {string} [params.model] - override provider default model
 * @param {string} [params.supportGroup] - e.g. "RULING", "RELATIONAL"
 * @param {string} [params.extendedArchetypeName] - e.g. "The Arbiter"
 * @param {string} [params.userQuestion] - Free-text question
 * @param {Object} [params.oceanScores] - e.g. { O: 4, C: 9, E: 4, A: 3, N: 3 }
 * @param {string} [params.coreProfile] - Core archetype profile text
 * @param {string} [params.extendedDescription] - Extended archetype description
 * @param {string} [params.neuroticismTrigger] - Neuroticism trigger text
 * @param {string} [params.systemPrompt] - Full system prompt override
 * @returns {Promise<{
 *   archetypeKey: string,
 *   supportGroup: string|null,
 *   extendedArchetypeName: string|null,
 *   analysis: string,
 *   provider: string,
 *   model: string,
 *   promptTokens: number,
 *   completionTokens: number
 * }>}
 */
export async function analyzeAssessment({
  archetypeKey,
  provider,
  model,
  supportGroup,
  extendedArchetypeName,
  userQuestion,
  oceanScores,
  coreProfile,
  extendedDescription,
  neuroticismTrigger,
  systemPrompt,
}) {
  const response = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      archetypeKey,
      provider: provider || undefined,
      model: model || undefined,
      supportGroup: supportGroup || undefined,
      extendedArchetypeName: extendedArchetypeName || undefined,
      userQuestion: userQuestion || undefined,
      oceanScores: oceanScores || undefined,
      coreProfile: coreProfile || undefined,
      extendedDescription: extendedDescription || undefined,
      neuroticismTrigger: neuroticismTrigger || undefined,
      systemPrompt: systemPrompt || undefined,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `API error ${response.status}`);
  }

  return response.json();
}

/**
 * Get available AI providers and backend status.
 */
export async function getApiStatus() {
  const response = await fetch(`${API_BASE}/status`);
  if (!response.ok) throw new Error(`Status check failed: ${response.status}`);
  return response.json();
}

/**
 * Get list of configured AI providers.
 */
export async function getProviders() {
  const response = await fetch(`${API_BASE}/ai/providers`);
  if (!response.ok) throw new Error(`Providers check failed: ${response.status}`);
  return response.json();
}

// ── PDF ──

/**
 * Download a PDF for a saved assessment (triggers browser download).
 * @param {string} assessmentId
 */
export async function downloadPdf(assessmentId) {
  const response = await fetch(`${API_BASE}/pdf/${assessmentId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`PDF download failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GFL-Assessment-${assessmentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Admin ──

/**
 * Get admin dashboard stats.
 * @returns {Promise<{ userCount, assessmentCount, recentAssessments }>}
 */
export async function getAdminStats() {
  const response = await fetch(`${API_BASE}/admin/stats`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Admin stats failed (${response.status})`);
  return response.json();
}

/**
 * List all users (admin only).
 */
export async function getAdminUsers(opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.skip) params.set('skip', opts.skip);

  const response = await fetch(`${API_BASE}/admin/users?${params}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Admin users failed (${response.status})`);
  return response.json();
}

/**
 * Change a user's role (admin only).
 */
export async function setUserRole(userId, role) {
  const response = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Role change failed (${response.status})`);
  }
  return response.json();
}

/**
 * Delete a user and their assessments (admin only).
 * @param {string} userId
 */
export async function deleteUser(userId) {
  const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Delete user failed (${response.status})`);
  }
  return response.json();
}

/**
 * Get all assessments (admin only).
 */
export async function getAdminAssessments(opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.skip) params.set('skip', opts.skip);

  const response = await fetch(`${API_BASE}/admin/assessments?${params}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Admin assessments failed (${response.status})`);
  return response.json();
}

/**
 * Get full assessment detail (admin — any user's assessment).
 * @param {string} id — assessment ObjectId
 */
export async function getAdminAssessment(id) {
  const response = await fetch(`${API_BASE}/admin/assessments/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Assessment detail failed (${response.status})`);
  }
  return response.json();
}

/**
 * Delete an assessment (admin only).
 * @param {string} id — assessment ObjectId
 */
export async function deleteAssessment(id) {
  const response = await fetch(`${API_BASE}/admin/assessments/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Delete failed (${response.status})`);
  }
  return response.json();
}

/**
 * Get AI prompt configuration (admin only).
 */
export async function getPromptConfig() {
  const response = await fetch(`${API_BASE}/admin/prompts`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Prompt config failed (${response.status})`);
  return response.json();
}

/**
 * Update AI prompt configuration (admin only).
 */
export async function updatePromptConfig(config) {

  const response = await fetch(`${API_BASE}/admin/prompts`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error(`Prompt update failed (${response.status})`);
  return response.json();
}

// ── Questions (stored in MongoDB, editable by admin) ──

/**
 * Fetch all assessment questions/layers from the backend.
 * Public endpoint — no auth required.
 * @returns {Promise<{ layers: Array, seeded: boolean }>}
 */
export async function getQuestions() {
  const response = await fetch(`${API_BASE}/questions`);
  if (!response.ok) throw new Error(`Questions fetch failed (${response.status})`);
  return response.json();
}

/**
 * Seed the default questions into MongoDB (admin only).
 * @param {{ force?: boolean }} opts — pass force:true to wipe & re-seed
 */
export async function seedQuestions({ force = false } = {}) {
  const url = force
    ? `${API_BASE}/questions/seed?force=1`
    : `${API_BASE}/questions/seed`;
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Seed failed (${response.status})`);
  }
  return response.json();
}

/**
 * Export all questions as clean JSON (admin only).
 * @returns {Promise<Array>} — array of layer objects without _id fields
 */
export async function exportQuestions() {
  const response = await fetch(`${API_BASE}/questions/export`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Export failed (${response.status})`);
  }
  return response.json();
}

/**
 * Bulk import questions (admin only). Replaces ALL existing questions.
 * @param {Array} layers — array of layer objects
 */
export async function importQuestions(layers) {
  const response = await fetch(`${API_BASE}/questions/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ layers }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Import failed (${response.status})`);
  }
  return response.json();
}

/**
 * Update a single question (admin only).
 * @param {number} questionId — 1-60
 * @param {{ text?: string, domain?: string, answers?: Array<{ text: string }> }} data
 */
export async function updateQuestion(questionId, data) {
  const response = await fetch(`${API_BASE}/questions/${questionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Question update failed (${response.status})`);
  }
  return response.json();
}

/**
 * Export questions as Word document (.docx) — admin only.
 * Returns a Blob for download.
 */
export async function exportQuestionsDocx() {
  const response = await fetch(`${API_BASE}/questions/export/docx`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `DOCX export failed (${response.status})`);
  }
  return response.blob();
}

/**
 * Import questions from a Word document (.docx) — admin only.
 * @param {File} file — .docx file
 */
export async function importQuestionsDocx(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/questions/import/docx`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `DOCX import failed (${response.status})`);
  }
  return response.json();
}

/**
 * Update an entire layer (admin only).
 * @param {number} layerIndex — 0-4
 * @param {Object} data — layer fields to update
 */
export async function updateLayer(layerIndex, data) {
  const response = await fetch(`${API_BASE}/questions/layer/${layerIndex}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Layer update failed (${response.status})`);
  }
  return response.json();
}
