import { useEffect, useState } from "react";
import { Calendar, Eye, EyeOff, LogOut, Moon, Sun, Zap } from "lucide-react";
import { useAppStore } from "../../store/AppStore.jsx";
import { SIMULATED_DATE_LABEL, VERTICALS } from "../../data/mockData.js";
import { formatCurrency } from "../../utils/format.js";
import { ROLES } from "../../data/users.js";
import Badge from "../common/Badge.jsx";
import JudgeDemoTour from "../JudgeDemoTour.jsx";
import NotificationCenter from "../NotificationCenter";


const THEME_KEY = "cashpulse-theme";

export default function Header() {
  const {
    bankBalance,
    currentUser,
    isAdmin,
    signOut,
    currentVertical,
    switchVertical,
    currency,
    setCurrency,
    privacyMode,
    togglePrivacyMode,
  } = useAppStore();
  const [isDark, setIsDark] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

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
  const isAdminRole = currentUser?.role === ROLES.ADMIN;

  const currencyOptions = [
    { code: "INR", label: "₹ INR" },
    { code: "USD", label: "$ USD" },
    { code: "EUR", label: "€ EUR" },
  ];

  return (
    <header className="sticky top-0 z-40 min-h-[4rem] luxury-panel backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 sm:gap-4 sm:px-6">
        <div className="flex flex-wrap gap-2 items-center min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6900] text-white shadow-sm">
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
          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden md:inline text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              🏢 Industry:
            </span>
            <select
              aria-label="Select industry"
              value={currentVertical}
              onChange={(e) => switchVertical(e.target.value)}
              className="min-w-0 max-w-[12rem] md:max-w-xs truncate rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs md:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ff6900]"
            >
              {Object.values(VERTICALS).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-sm text-slate-600 md:flex dark:text-slate-300">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          <span>{SIMULATED_DATE_LABEL}</span>
        </div>

        <div className="flex flex-wrap gap-2 items-center min-w-0">
          {currentUser && (
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {currentUser.name}
                </span>
                <Badge tone={isAdminRole ? "emerald" : "sky"}>
                  {isAdminRole ? "Admin" : "Associate"}
                </Badge>
              </div>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {isAdmin && (
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
                <span className={privacyMode ? "privacy-blur" : undefined}>
                  {formatCurrency(bankBalance, currency)}
                </span>
              </span>
            </div>
          )}

          <div
            role="group"
            aria-label="Currency"
            className="inline-flex rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-0.5 text-xs font-semibold"
          >
            {currencyOptions.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                aria-pressed={currency === code}
                onClick={() => setCurrency(code)}
                className={`rounded-full px-2.5 py-1 transition ${
                  currency === code
                    ? "bg-[#ff6900] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
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

          <button
            type="button"
            onClick={togglePrivacyMode}
            aria-label={privacyMode ? "Show amounts" : "Hide amounts"}
            title={privacyMode ? "Show amounts" : "Hide amounts"}
            aria-pressed={privacyMode}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {privacyMode ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <NotificationCenter />

          <button
            type="button"
            aria-label="Open 60-second judge tour"
            onClick={() => setTourOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#ff6900] hover:bg-[#e05d00] px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_18px_rgba(255,105,0,0.55)] whitespace-nowrap"
          >
            ✨ 60-Sec Judge Tour (All Features)
          </button>
        </div>
      </div>

      <JudgeDemoTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </header>
  );
}
