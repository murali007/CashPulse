import { AppStoreProvider, useAppStore } from "./store/AppStore.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import ExecutiveDashboard from "./pages/ExecutiveDashboard.jsx";
import ReceivablesInvoices from "./pages/ReceivablesInvoices.jsx";
import CashRunway from "./pages/CashRunway.jsx";
import SmartIngest from "./pages/SmartIngest.jsx";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import LoadingScreen from "./components/common/LoadingScreen.jsx";

const PAGES = {
  dashboard: ExecutiveDashboard,
  receivables: ReceivablesInvoices,
  runway: CashRunway,
  ingest: SmartIngest,
};

function AppShell() {
  const { activeTab, dbError } = useAppStore();
  const Page = PAGES[activeTab] ?? ExecutiveDashboard;

  return (
    <>
      {dbError && (
        <div
          role="alert"
          className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
        >
          Storage unavailable: changes will not persist this session. ({dbError})
        </div>
      )}
      <AppLayout>
        <Page />
      </AppLayout>
    </>
  );
}

function AuthGate() {
  const { currentUser, isReady } = useAppStore();

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <AppStoreProvider>
      <AuthGate />
    </AppStoreProvider>
  );
}
