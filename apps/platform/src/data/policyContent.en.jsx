import React from 'react';
import { RetentionForm } from './policyShared.jsx';
import { POLICY_EN_PART1 } from './policyContent.en.part1.jsx';
import { POLICY_EN_PART2 } from './policyContent.en.part2.jsx';

/**
 * English policy documents — mirrors the keys of POLICY_CONTENT_NL exactly.
 * Split across two part files so the corpus stays editable in chunks.
 */
export const POLICY_CONTENT_EN = {
  ...POLICY_EN_PART1,
  ...POLICY_EN_PART2,
  retention: <RetentionForm language="en" />,
};
