import { useState } from "react";
import { useAppStore } from "../store/AppStore.jsx";
import { formatINR } from "../utils/format.js";

const OUTFLOWS = [
  { id: "rent", label: "Studio Rent", amount: 35000, note: "Due Dec 12", fixed: true },
  { id: "cloud", label: "Cloud & Hosting (AWS/OpenAI)", amount: 8500, note: "Subscription", fixed: false },
  { id: "design", label: "Design Stack (Adobe/Figma)", amount: 5200, note: "Subscription", fixed: false },
];

export default function BurnRateTracker() {
  const { bankBalance } = useAppStore();
  const [active, setActive] = useState({ rent: true, cloud: true, design: true });

  const toggle = (id) => setActive((prev) => ({ ...prev, [id]: !prev[id] }));

  // Rent is fixed and always counted; subscriptions count only while toggled on.
  const burn = OUTFLOWS.reduce(
    (sum, o) => (active[o.id] ? sum + o.amount : sum),
    0
  );
  const netFree = bankBalance - burn;
  const coverage = burn > 0 ? bankBalance / burn : Infinity;

  let coverageBadge;
  if (burn === 0) {
    coverageBadge = (
      <span className="bg-amber-100 text-amber-800 px-2.5 py-1 text-xs font-semibold rounded-full">
        No fixed burn
      </span>
    );
  } else if (coverage >= 1.5) {
    coverageBadge = (
      <span className="badge-peach px-2.5 py-1 text-xs font-semibold">
        {coverage.toFixed(1)}x Burn Coverage Safe
      </span>
    );
  } else {
    coverageBadge = (
      <span className="bg-amber-100 text-amber-800 px-2.5 py-1 text-xs font-semibold rounded-full">
        {coverage.toFixed(1)}x Burn Coverage — Below 1.5x
      </span>
    );
  }

  return (
    <section className="luxury-card p-5">
      <h2 className="text-base font-semibold text-[#282828] dark:text-slate-100">
        🔥 Monthly Burn Rate
      </h2>

      <ul className="mt-3">
        {OUTFLOWS.map((o) => {
          const on = active[o.id];
          const inputId = `burn-${o.id}`;
          return (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ffdfca] py-2.5"
            >
              <label htmlFor={inputId} className="flex min-w-0 items-start gap-2.5">
                <input
                  id={inputId}
                  type="checkbox"
                  className="mt-1 accent-[#ff6900]"
                  checked={on}
                  disabled={o.fixed}
                  onChange={() => toggle(o.id)}
                  aria-label={"Include " + o.label + " in burn"}
                />
                <span>
                  <span className="block text-sm text-slate-800 dark:text-slate-100">
                    {o.label}
                  </span>
                  <span className="block text-xs text-slate-500">{o.note}</span>
                </span>
              </label>
              <span
                className={
                  "text-sm font-semibold " +
                  (on ? "" : "line-through text-slate-400")
                }
              >
                {formatINR(o.amount)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex justify-between">
        <span className="text-base font-bold text-[#ff6900]">
          Total Monthly Burn
        </span>
        <span className="text-base font-bold text-[#ff6900]">
          {formatINR(burn)}/mo
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border border-[#ffdfca] rounded-xl bg-white p-3">
          <p className="text-xs text-slate-500">Net Free Cashflow</p>
          <p
            className={
              "text-lg font-bold " +
              (netFree >= 0 ? "text-emerald-700" : "text-red-700")
            }
          >
            {(netFree >= 0 ? "+" : "") + formatINR(netFree)}
          </p>
        </div>
        <div className="border border-[#ffdfca] rounded-xl bg-white p-3">
          {coverageBadge}
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Rent is always included. Toggle subscriptions to test runway coverage.
      </p>
    </section>
  );
}
