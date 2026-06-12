import { LanguageProvider } from '@gfl/i18n';
import AdminDashboardModal from '@gfl/admin-ui';

/**
 * Standalone admin shell. The dashboard UI is the shared @gfl/admin-ui component
 * (also launched inside platform via LoginPage for admin users).
 *
 * NOTE: real auth/login is a follow-up — this shell renders the dashboard with a
 * placeholder admin user. At runtime the dashboard calls the backend via
 * @gfl/api-client (VITE_API_URL), so wire a real login + token before deploying
 * this app standalone.
 */
const PLACEHOLDER_ADMIN = { role: 'admin', name: 'Admin', email: '' };

export default function App() {
  return (
    <LanguageProvider>
      <AdminDashboardModal
        user={PLACEHOLDER_ADMIN}
        onLogout={() => {}}
        onClose={() => {}}
      />
    </LanguageProvider>
  );
}
