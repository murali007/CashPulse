import { useEffect, useRef, useState } from "react";
import { AppStoreProvider, useAppStore } from "./store/AppStore.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import ExecutiveDashboard from "./pages/ExecutiveDashboard.jsx";
import ReceivablesInvoices from "./pages/ReceivablesInvoices.jsx";
import CashRunway from "./pages/CashRunway.jsx";
import SmartIngest from "./pages/SmartIngest.jsx";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import LoadingScreen from "./components/common/LoadingScreen.jsx";
import MorningBriefing from "./components/MorningBriefing.jsx";
import { celebratePayment } from "./utils/celebrate.js";
import { formatINR } from "./utils/format.js";

const PAGES = {
  dashboard: ExecutiveDashboard,
  receivables: ReceivablesInvoices,
  runway: CashRunway,
  ingest: SmartIngest,
};

function AppShell() {
  const { activeTab, dbError, invoices } = useAppStore();
  const Page = PAGES[activeTab] ?? ExecutiveDashboard;

  // Ids of invoices already seen as paid. Seeded on first render so existing
  // paid invoices do not celebrate on load.
  const paidIdsRef = useRef(null);
  if (paidIdsRef.current === null) {
    paidIdsRef.current = new Set(
      invoices.filter((inv) => inv.status === "paid").map((inv) => inv.id)
    );
  }
  const [paidFlash, setPaidFlash] = useState(null);

  useEffect(() => {
    const previous = paidIdsRef.current;
    const newlyPaid = invoices.filter(
      (inv) => inv.status === "paid" && !previous.has(inv.id)
    );
    paidIdsRef.current = new Set(
      invoices.filter((inv) => inv.status === "paid").map((inv) => inv.id)
    );

    if (newlyPaid.length === 0) return undefined;

    celebratePayment();
    setPaidFlash(newlyPaid[0].amount);
    const timer = setTimeout(() => setPaidFlash(null), 2500);
    return () => clearTimeout(timer);
  }, [invoices]);

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
        <MorningBriefing />
        <Page />
      </AppLayout>
      {paidFlash !== null ? (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">
          {"+" + formatINR(paidFlash) + " received"}
        </div>
      ) : null}
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
