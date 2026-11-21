import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "../../store/AppStore.jsx";

export const NAV_ITEMS = [
  { key: "dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
  { key: "receivables", label: "Receivables & Invoices", icon: Receipt },
  { key: "runway", label: "Cash Runway & Stress-Test", icon: TrendingUp },
  { key: "ingest", label: "Smart Ingest", icon: Sparkles },
];

export default function Sidebar() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <aside className="hidden lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-slate-200 lg:py-6 lg:dark:border-slate-800">
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
