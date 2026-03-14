/**
 * Garden For Life — Backend API Client
 *
 * Calls the Express backend (multi-provider AI proxy + auth + assessment).
 * All archetype/OCEAN profile data is sent from the frontend with each request.
 */

const API_BASE = process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8080/api'
    : 'https://gfl-api.onrender.com/api');

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
 * Call the AI analysis endpoint with streaming SSE progress.
 *
 * @param {Object} params - Assessment data (archetypeKey, supportArchetype, etc.)
 * @param {(stage: number, message: string) => void} [onProgress] - Progress callback (stage 1-3)
 * @returns {Promise<{ analysis, provider, model, promptTokens, completionTokens, ... }>}
 */
export async function analyzeAssessment(params, onProgress) {
  const response = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `API error ${response.status}`);
  }

  // Parse SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse complete SSE events from buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // keep incomplete line in buffer

    let eventType = null;
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (eventType === 'progress' && onProgress) {
          onProgress(data.stage, data.message);
        } else if (eventType === 'result') {
          result = data;
        } else if (eventType === 'error') {
          throw new Error(data.error || 'AI analysis failed');
        }
        eventType = null;
      }
    }
  }

  if (!result) {
    throw new Error('No result received from AI analysis');
  }

  return result;
}

/**
 * Send assessment results PDF via email.
 * @param {{ recipientName: string, recipientEmail: string, result: Object }} data
 */
export async function sendResultsEmail({ recipientEmail, result }) {
  // Serialize the result for the backend — convert Date to ISO string
  const serialized = {
    ...result,
    timestamp: result.timestamp instanceof Date ? result.timestamp.toISOString() : result.timestamp,
  };

  const response = await fetch(`${API_BASE}/ai/send-results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientEmail, result: serialized }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Email failed (${response.status})`);
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

// ── Assessment Reviews ──

/**
 * Submit a user review/feedback for an assessment.
 */
export async function submitAssessmentReview(data) {
  const token = getToken();
  const response = await fetch(`${API_BASE}/assessment/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  return response.json();
}

/**
 * Get all assessment reviews (admin only).
 * @param {Object} opts - Options (limit, skip, includeAssessment)
 */
export async function getAdminReviews(opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.skip) params.set('skip', opts.skip);
  if (opts.includeAssessment) params.set('includeAssessment', 'true');

  const response = await fetch(`${API_BASE}/admin/reviews?${params}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Admin reviews failed (${response.status})`);
  return response.json();
}

/**
 * Get single review detail with full assessment context (admin only).
 * @param {string} id - Review ObjectId
 */
export async function getAdminReview(id) {
  const response = await fetch(`${API_BASE}/admin/reviews/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Review detail failed (${response.status})`);
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

// ── Context Documents (uploaded by admin, included in AI calls) ──

/**
 * Upload a context document (Word/PDF/TXT) for AI system prompt inclusion.
 * @param {File} file - The file to upload
 * @returns {Promise<{ success: boolean, document: Object }>}
 */
export async function uploadPromptDocument(file) {
  const formData = new FormData();
  formData.append('document', file);

  const response = await fetch(`${API_BASE}/admin/prompts/documents`, {
    method: 'POST',
    headers: authHeaders(), // No Content-Type — browser sets multipart boundary
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Upload failed (${response.status})`);
  }
  return response.json();
}

/**
 * List all uploaded context documents (metadata only, no text).
 * @returns {Promise<{ documents: Array }>}
 */
export async function getPromptDocuments() {
  const response = await fetch(`${API_BASE}/admin/prompts/documents`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Document list failed (${response.status})`);
  return response.json();
}

/**
 * Delete an uploaded context document.
 * @param {string} docId - MongoDB ObjectId
 * @returns {Promise<{ success: boolean }>}
 */
export async function deletePromptDocument(docId) {
  const response = await fetch(`${API_BASE}/admin/prompts/documents/${docId}`, {
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
 * Verify all uploaded context documents are valid and readable by the AI.
 * @returns {Promise<{ success: boolean, verified: boolean, totalDocuments: number, totalChars: number, documents: Array }>}
 */
export async function verifyPromptDocuments() {
  const response = await fetch(`${API_BASE}/admin/prompts/documents/verify`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Verification failed (${response.status})`);
  }
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

// ── Form Email (Formulieren) — instant send only, no server storage ──

/** Send a form directly via email (no DB storage) */
export async function sendFormDirect(data) {
  const response = await fetch(`${API_BASE}/admin/forms/send-direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Direct send failed (${response.status})`);
  }
  return response.json();
}

/** Check email SMTP configuration status */
export async function getEmailStatus() {
  const response = await fetch(`${API_BASE}/admin/email/status`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Email status check failed (${response.status})`);
  }
  return response.json();
}

// ── Dev Activity Audit Log ──

/** Log a dev activity event (no auth — called from git hooks or frontend) */
export async function logActivity(data) {
  const response = await fetch(`${API_BASE}/admin/sessions/activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) return null;
  return response.json();
}

/** Get computed dev sessions (admin only) */
export async function getSessions(limit = 200) {
  const response = await fetch(`${API_BASE}/admin/sessions?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Session list failed (${response.status})`);
  }
  return response.json();
}

/** Clear all dev activity data (admin only) */
export async function clearSessions() {
  const response = await fetch(`${API_BASE}/admin/sessions`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Session clear failed (${response.status})`);
  }
  return response.json();
}

// ── Beta Access ──

const BETA_KEY = 'gfl_beta_access';

/**
 * Verify a beta passkey against the backend.
 * On success, stores the validated passkey in localStorage.
 * @returns {Promise<boolean>} true if valid
 */
export async function verifyBetaPasskey(passkey) {
  const response = await fetch(`${API_BASE}/beta/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passkey }),
  });
  if (!response.ok) return false;
  const data = await response.json();
  if (data.valid) {
    localStorage.setItem(BETA_KEY, passkey);
  }
  return data.valid;
}

/**
 * Check if the user has a stored beta passkey.
 * Does NOT re-verify against the server (offline-friendly).
 */
export function hasBetaAccess() {
  return !!localStorage.getItem(BETA_KEY);
}

/**
 * Clear stored beta access.
 */
export function clearBetaAccess() {
  localStorage.removeItem(BETA_KEY);
}
