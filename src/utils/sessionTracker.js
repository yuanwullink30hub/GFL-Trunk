/**
 * Garden For Life — Dev Activity Tracker
 *
 * Logs developer activity events to the backend.
 * Git hooks handle commit/push events automatically.
 * This module provides a helper for logging edit events from the frontend.
 */
import { logActivity } from './apiClient';

/** Log a dev edit event (e.g. saving a prompt, updating a question). */
export function logEdit(message = '') {
  logActivity({ type: 'edit', message }).catch(() => {});
}
}
