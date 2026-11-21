import { AppStoreProvider, useAppStore } from "./store/AppStore.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import ExecutiveDashboard from "./pages/ExecutiveDashboard.jsx";
import ReceivablesInvoices from "./pages/ReceivablesInvoices.jsx";
import CashRunway from "./pages/CashRunway.jsx";
import SmartIngest from "./pages/SmartIngest.jsx";

const PAGES = {
  dashboard: ExecutiveDashboard,
  receivables: ReceivablesInvoices,
  runway: CashRunway,
  ingest: SmartIngest,
};

function AppShell() {
  const { activeTab } = useAppStore();
  const Page = PAGES[activeTab] ?? ExecutiveDashboard;

  return (
    <AppLayout>
      <Page />
    </AppLayout>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <AppShell />
    </AppStoreProvider>
  );
}
