import { useEffect, useState } from "react";
import { Calendar, Moon, Sun, Zap } from "lucide-react";
import { useAppStore } from "../../store/AppStore.jsx";
import { SIMULATED_DATE_LABEL } from "../../data/mockData.js";
import { formatINR } from "../../utils/format.js";

const THEME_KEY = "cashpulse-theme";

export default function Header() {
  const { bankBalance } = useAppStore();
  const [isDark, setIsDark] = useState(false);

  // On mount: read saved theme, falling back to the OS preference.
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const dark =
      stored === "dark" || stored === "light"
        ? stored === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(dark);
  }, []);

  // Apply the theme to the document root.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleToggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  const balancePositive = bankBalance >= 0;

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 shadow-sm">
            <Zap className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">
              CashPulse AI
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Working-capital copilot
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-sm text-slate-600 md:flex dark:text-slate-300">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          <span>{SIMULATED_DATE_LABEL}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Current Balance:
            </span>
            <span
              className={`text-sm font-semibold ${
                balancePositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatINR(bankBalance)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isDark ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
