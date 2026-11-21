const ICON_TONE_CLASSES = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function Metric({ label, value, hint, icon: Icon, tone = "slate" }) {
  const iconToneClass = ICON_TONE_CLASSES[tone] ?? ICON_TONE_CLASSES.slate;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        ) : null}
      </div>
      {Icon ? (
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconToneClass}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}
