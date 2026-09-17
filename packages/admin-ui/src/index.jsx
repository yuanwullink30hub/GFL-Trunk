// Management dashboard + invoice/credit-note/email templates. Used ONLY by the local management app
// (apps/admin). The website and the desktop app never import this package, so none of it ships to users.
import { extendTranslations } from '@gfl/i18n';
import adminTranslations from './translations.js';

// The `admin` copy lives here, not in @gfl/i18n, so it stays out of the public bundle.
extendTranslations(adminTranslations);

export { default } from './AdminDashboardModal.jsx';
export { default as AdminDashboardModal } from './AdminDashboardModal.jsx';
export { default as InvoiceTemplate } from './InvoiceTemplate.jsx';
export { default as CreditNoteTemplate } from './CreditNoteTemplate.jsx';
export { default as EmailTemplate } from './EmailTemplate.jsx';
