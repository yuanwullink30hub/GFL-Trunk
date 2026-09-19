/**
 * Leave-the-report guard.
 *
 * The report is a single instance in the tab: unpaid, leaving deletes it (and the option to
 * unlock it); paid, the downloaded PDF is the only copy. Every in-app exit that would unmount
 * the report (back to Deltawerken, create account) goes through requestLeaveReport(); the mounted
 * results modal registers a handler that shows the final warning (Doorgaan / Teruggaan) and only
 * calls `proceed` on Doorgaan. With no report mounted, `proceed` runs immediately.
 * Tab close / reload is covered by the modal's own beforeunload prompt (browser-generic text).
 */
let handler = null;

/** Register the warning dialog. Returns an unregister function. */
export function registerLeaveHandler(fn) {
  handler = fn;
  return () => { if (handler === fn) handler = null; };
}

/**
 * Ask to leave the report; `proceed` runs now (no report) or after the user chooses Doorgaan. On
 * Doorgaan it gets `{ toAccount }` — true once the paid PDF is downloaded (then leave to the account page).
 */
export function requestLeaveReport(proceed) {
  if (handler) handler(proceed);
  else proceed();
}
