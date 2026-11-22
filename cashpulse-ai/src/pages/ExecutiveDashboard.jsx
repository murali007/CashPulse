import { useState } from "react";
import { Wallet, Receipt, AlertTriangle, MessageCircle, LineChart, PlusCircle } from "lucide-react";
import { useAppStore } from "../store/AppStore.jsx";
import Card from "../components/common/Card.jsx";
import DefendRentModal from "../components/modals/DefendRentModal.jsx";
import Metric from "../components/common/Metric.jsx";
import Badge from "../components/common/Badge.jsx";
import { formatINR, formatDate, daysBetween } from "../utils/format.js";
import { agingBucket } from "../utils/finance.js";

const TAX_RATE = 0.18;

function reliabilityTone(score) {
  if (score >= 80) return "emerald";
  if (score >= 50) return "amber";
  return "rose";
}

export default function ExecutiveDashboard() {
  const {
    bankBalance,
    invoices,
    outstanding,
    today,
    getRunway,
    markInvoicePaid,
    setActiveTab,
  } = useAppStore();

  const [warRoomOpen, setWarRoomOpen] = useState(false);

  const overdueInvoices = invoices.filter(
    (inv) => agingBucket(inv, today) !== "paid" && inv.status === "overdue"
  );
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  const runway = getRunway(30);

  const gross = bankBalance;
  const vault = Math.round(gross * TAX_RATE);
  const spendable = gross - vault;
  const spendablePct = Math.round((1 - TAX_RATE) * 100);
  const taxPct = Math.round(TAX_RATE * 100);

  const queue = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "overdue")
    .map((inv) => ({
      inv,
      daysOverdue: Math.max(0, daysBetween(inv.dueDate, today)),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <h2 className="text-white font-semibold text-lg">
            Good evening, Ravi • 30-Day Working Capital Defense Active
          </h2>
        </div>
        <p className="mt-2 text-indigo-200 text-sm">
          {"Live cash runway: " +
            formatINR(bankBalance) +
            " liquid • Next major bill: Office Rent (₹35k on Dec 01)"}
        </p>
      </section>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Executive Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your live cash position and the receivables to chase first.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWarRoomOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-4 py-2 shadow-lg animate-pulse"
        >
          🚨 Defend My Rent
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <Metric
            label="Live Balance"
            value={formatINR(bankBalance)}
            icon={Wallet}
            tone="emerald"
          />
        </Card>
        <Card className="p-5">
          <Metric
            label="Outstanding"
            value={formatINR(outstanding)}
            icon={Receipt}
            tone="sky"
          />
        </Card>
        <Card className="p-5">
          <Metric
            label="Overdue"
            value={formatINR(overdueTotal)}
            hint={`${overdueInvoices.length} overdue invoice${overdueInvoices.length === 1 ? "" : "s"}`}
            icon={AlertTriangle}
            tone="rose"
          />
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          🛡️ Smart Tax & GST Reserve Vault
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tax Rate: {taxPct}% standard GST / Advance Tax
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Locked Tax Vault ({taxPct}%)
            </p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {formatINR(vault)}
            </p>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Quarantined</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Spendable Operating Cash ({spendablePct}%)
            </p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {formatINR(spendable)}
            </p>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Safe for Rent & Salaries
            </p>
          </div>
        </div>
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            role="img"
            aria-label={`${spendablePct}% Spendable Operating Capital`}
            title={`${spendablePct}% Spendable Operating Capital`}
            className="h-full bg-emerald-500"
            style={{ width: `${spendablePct}%` }}
          />
          <div
            role="img"
            aria-label={`${taxPct}% Protected Tax Buffer`}
            title={`${taxPct}% Protected Tax Buffer`}
            className="h-full bg-amber-400"
            style={{ width: `${taxPct}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {spendablePct}% Spendable Operating Capital
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            {taxPct}% Protected Tax Buffer
          </span>
        </div>
        <div className="mt-4">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            🛡️ Tax Compliant • Protected from Overhead Expenses
          </span>
        </div>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          {"⚠️ Financial Hygiene Rule: Your gross bank balance is " +
            formatINR(gross) +
            ", but only " +
            formatINR(spendable) +
            " is safe to spend. " +
            formatINR(vault) +
            " is locked in your virtual vault for quarterly GST & tax liability."}
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            30-day runway
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Ending balance</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">
                {formatINR(runway.endingBalance)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Minimum balance</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100">
                {formatINR(runway.minBalance)}
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            {runway.negativeOnDate === null ? (
              <Badge tone="emerald">Safe</Badge>
            ) : (
              <Badge tone="rose">
                Crunch on {formatDate(runway.negativeOnDate)}
              </Badge>
            )}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Priority cash recovery
          </h2>
          {queue.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No unpaid invoices. Nothing to chase right now.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
              {queue.map(({ inv, daysOverdue }) => (
                <li
                  key={inv.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {inv.clientName}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {inv.projectTitle}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatINR(inv.amount)}
                    </span>
                    <span
                      className={
                        daysOverdue > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-500 dark:text-slate-400"
                      }
                    >
                      {daysOverdue > 0
                        ? `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`
                        : `Due ${formatDate(inv.dueDate)}`}
                    </span>
                    <Badge tone={reliabilityTone(inv.reliabilityScore ?? 0)}>
                      {`${inv.reliabilityScore ?? 0}%`}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => markInvoicePaid(inv.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Mark paid
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Quick actions
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setActiveTab("receivables")}
            className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
            <span>Send follow-ups</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("runway")}
            className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LineChart className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
            <span>Stress-test runway</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ingest")}
            className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
            <span>Log new invoice</span>
          </button>
        </div>
      </Card>

      <DefendRentModal open={warRoomOpen} onClose={() => setWarRoomOpen(false)} />
    </div>
  );
}
