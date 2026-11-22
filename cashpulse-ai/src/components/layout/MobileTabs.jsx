import { useAppStore } from "../../store/AppStore.jsx";
import { NAV_ITEMS } from "./Sidebar.jsx";

export default function MobileTabs() {
  const { activeTab, setActiveTab, isAdmin } = useAppStore();
  const visibleItems = NAV_ITEMS.filter(
    (item) => isAdmin || item.key !== "runway",
  );

  return (
    <div className="overflow-x-auto border-b border-slate-200 bg-white py-3 dark:border-slate-800 dark:bg-slate-900">
      <nav className="flex gap-2 px-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              aria-current={isActive ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-[#ffdfca] text-[#ff6900] dark:bg-[#ff6900]/15 dark:text-[#ffb27a]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
