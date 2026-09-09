import { POLICY_CONTENT_NL } from './policyContent.jsx';
import { POLICY_CONTENT_EN } from './policyContent.en.jsx';

/**
 * Select the policy document set for the active language.
 * Both sets expose the same keys (terms, privacy, cookies, ai, ip, usage,
 * retention, register), so callers can index either one identically.
 */
export function getPolicyContent(language) {
  return language === 'en' ? POLICY_CONTENT_EN : POLICY_CONTENT_NL;
}

export { POLICY_CONTENT_NL, POLICY_CONTENT_EN };
