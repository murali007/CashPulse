import { Wallet, Receipt, AlertTriangle, MessageCircle, LineChart, PlusCircle } from "lucide-react";
import { useAppStore } from "../store/AppStore.jsx";
import Card from "../components/common/Card.jsx";
import Metric from "../components/common/Metric.jsx";
import Badge from "../components/common/Badge.jsx";
import { formatINR, formatDate, daysBetween } from "../utils/format.js";
import { agingBucket } from "../utils/finance.js";

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

  const overdueInvoices = invoices.filter(
    (inv) => agingBucket(inv, today) !== "paid" && inv.status === "overdue"
  );
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  const runway = getRunway(30);

  const queue = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "overdue")
    .map((inv) => ({
      inv,
      daysOverdue: Math.max(0, daysBetween(inv.dueDate, today)),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Executive Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your live cash position and the receivables to chase first.
        </p>
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
    </div>
  );
}
