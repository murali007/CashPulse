import { useState } from "react";
import { useAppStore } from "../store/AppStore.jsx";
import Card from "../components/common/Card.jsx";
import Metric from "../components/common/Metric.jsx";
import Badge from "../components/common/Badge.jsx";
import RunwayChart from "../components/runway/RunwayChart.jsx";
import { formatINR, formatDate } from "../utils/format.js";
import {
  AlertTriangle,
  TrendingDown,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

const HORIZONS = [30, 60, 90];
const DELAY_PRESETS = [0, 7, 14, 30];
const BUFFER_THRESHOLD = 20000;

const TONE_CLASSES = {
  rose: {
    box: "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40",
    title: "text-rose-900 dark:text-rose-200",
    body: "text-rose-800 dark:text-rose-300",
    icon: "text-rose-600 dark:text-rose-400",
  },
  amber: {
    box: "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40",
    title: "text-amber-900 dark:text-amber-200",
    body: "text-amber-800 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    box: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40",
    title: "text-emerald-900 dark:text-emerald-200",
    body: "text-emerald-800 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
};

function AlertRow({ tone, icon: Icon, title, children }) {
  const t = TONE_CLASSES[tone];
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${t.box}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${t.icon}`} aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        <p className={`text-sm font-semibold ${t.title}`}>{title}</p>
        <div className={`text-xs leading-relaxed ${t.body}`}>{children}</div>
      </div>
    </div>
  );
}

export default function CashRunway() {
  const { bankBalance, today, delayDays, setDelayDays, getRunway } = useAppStore();
  const [horizon, setHorizon] = useState(30);
  const runway = getRunway(horizon);

  const alerts = [];
  if (runway.negativeOnDate) {
    alerts.push(
      <AlertRow
        key="crunch"
        tone="rose"
        icon={AlertTriangle}
        title={`Liquidity crunch on ${formatDate(runway.negativeOnDate)} — balance falls below zero`}
      >
        <span className="flex items-center gap-1.5">
          <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Chase overdue invoices or defer a recurring bill
        </span>
      </AlertRow>
    );
  } else if (runway.minBalance >= 0 && runway.minBalance < BUFFER_THRESHOLD) {
    alerts.push(
      <AlertRow
        key="buffer"
        tone="amber"
        icon={AlertTriangle}
        title={`Cash buffer below ${formatINR(BUFFER_THRESHOLD)} on ${formatDate(runway.minBalanceDate)}`}
      >
        Balance stays positive but is thin; a small payment delay could push it below zero.
      </AlertRow>
    );
  } else {
    alerts.push(
      <AlertRow
        key="healthy"
        tone="emerald"
        icon={ShieldCheck}
        title={`No crunch in the next ${horizon}d at this delay`}
      >
        Lowest projected balance is {formatINR(runway.minBalance)} on{" "}
        {formatDate(runway.minBalanceDate)}.
      </AlertRow>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and horizon toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Cash Runway & Stress-Test
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Forecast your balance over the next 30–90 days and see how late payments change the picture.
          </p>
        </div>
        <div
          role="group"
          aria-label="Forecast horizon"
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
        >
          {HORIZONS.map((h) => {
            const active = horizon === h;
            return (
              <button
                key={h}
                type="button"
                aria-pressed={active}
                onClick={() => setHorizon(h)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {h} days
              </button>
            );
          })}
        </div>
      </div>

      {/* What-if slider */}
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <label
              htmlFor="delay-slider"
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              What if clients pay {delayDays} days late?
            </label>
          </div>
          <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            +{delayDays} days
          </span>
        </div>

        <input
          id="delay-slider"
          type="range"
          min="0"
          max="60"
          step="1"
          value={delayDays}
          onChange={(e) => setDelayDays(Number(e.target.value))}
          className="h-2 w-full cursor-pointer rounded-lg bg-slate-200 accent-indigo-600 dark:bg-slate-700"
        />

        <div className="flex justify-between font-mono text-[11px] text-slate-400 dark:text-slate-500">
          <span>0d</span>
          <span>15d</span>
          <span>30d</span>
          <span>45d</span>
          <span>60d</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">Presets:</span>
          {DELAY_PRESETS.map((d) => {
            const active = delayDays === d;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => setDelayDays(d)}
                className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:text-indigo-300"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Each unpaid invoice's collection is pushed back by {delayDays} days.
        </p>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <Metric
            label="Starting Balance"
            value={formatINR(bankBalance)}
            hint={`As of ${formatDate(today)}`}
            icon={ShieldCheck}
            tone="sky"
          />
        </Card>
        <Card className="p-5">
          <Metric
            label={`Projected Ending (${horizon}d)`}
            value={formatINR(runway.endingBalance)}
            hint={`At a +${delayDays} day delay`}
            icon={TrendingDown}
            tone={runway.endingBalance < 0 ? "rose" : "emerald"}
          />
        </Card>
        <Card className="p-5">
          <Metric
            label="Lowest Point"
            value={formatINR(runway.minBalance)}
            hint={`on ${formatDate(runway.minBalanceDate)}`}
            icon={AlertTriangle}
            tone={runway.minBalance < 0 ? "rose" : "emerald"}
          />
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Projected Cash Balance ({horizon} days)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hover the curve to inspect the projected balance on any day.
            </p>
          </div>
          <Badge tone={delayDays > 0 ? "amber" : "slate"}>
            {delayDays > 0 ? `+${delayDays} days late` : "On-time collections"}
          </Badge>
        </div>
        <div className="mt-4">
          <RunwayChart series={runway.series} height={280} />
        </div>
      </Card>

      {/* Liquidity crunch alerts */}
      <Card className="space-y-3 p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Liquidity Alerts
        </h2>
        {alerts}
      </Card>
    </div>
  );
}
