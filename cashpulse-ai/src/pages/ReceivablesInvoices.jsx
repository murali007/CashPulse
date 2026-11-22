import { useMemo, useState } from "react";
import { useAppStore } from "../store/AppStore.jsx";
import Card from "../components/common/Card.jsx";
import Badge from "../components/common/Badge.jsx";
import WhatsAppModal from "../components/receivables/WhatsAppModal.jsx";
import InvoiceModal from "../components/receivables/InvoiceModal.jsx";
import RiskDossier from "../components/receivables/RiskDossier.jsx";
import { formatINR, formatDate, daysBetween } from "../utils/format.js";
import { MessageCircle, CheckCircle2, FileText } from "lucide-react";

const BUCKET_TONE = {
  current: "sky",
  "1-14": "amber",
  "15-30": "amber",
  "30+": "rose",
};

const BUCKET_TEXT = {
  sky: "text-sky-600 dark:text-sky-400",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  slate: "text-slate-700 dark:text-slate-300",
};

const STATUS_TONE = { paid: "emerald", pending: "sky", overdue: "rose" };

const CLIENT_AVATARS = {
  "Northwind Labs": { initials: "NL", gradient: "bg-gradient-to-br from-indigo-500 to-blue-600" },
  "Bluepeak Media": { initials: "BM", gradient: "bg-gradient-to-br from-cyan-400 to-sky-600" },
  "Orbit Fintech": { initials: "OF", gradient: "bg-gradient-to-br from-emerald-400 to-teal-600" },
  "Sunrise Retail Co.": { initials: "SR", gradient: "bg-gradient-to-br from-amber-400 to-orange-500" },
  "Helix Health Tech": { initials: "HH", gradient: "bg-gradient-to-br from-rose-400 to-pink-600" },
};

// Map a client name to its avatar initials and gradient classes.
function clientAvatar(clientName) {
  const known = CLIENT_AVATARS[clientName];
  if (known) return known;
  const initials = String(clientName)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
  return { initials, gradient: "bg-gradient-to-br from-slate-400 to-slate-600" };
}

function ClientAvatar({ name }) {
  const { initials, gradient } = clientAvatar(name);
  return (
    <span
      className={"inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md " + gradient}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

// Derive display status: paid, overdue (past due or flagged), or pending.
function getStatus(invoice, today) {
  if (invoice.status === "paid") return "paid";
  if (invoice.status === "overdue" || invoice.dueDate < today) return "overdue";
  return "pending";
}

function byDueDate(a, b) {
  if (a.dueDate < b.dueDate) return -1;
  if (a.dueDate > b.dueDate) return 1;
  return 0;
}

function StatusBadge({ invoice, today }) {
  const status = getStatus(invoice, today);
  if (status === "overdue") {
    const days = Math.max(0, daysBetween(invoice.dueDate, today));
    return <Badge tone="rose">Overdue {days}d</Badge>;
  }
  if (status === "paid") return <Badge tone={STATUS_TONE.paid}>Paid</Badge>;
  return <Badge tone={STATUS_TONE.pending}>Pending</Badge>;
}

function ReliabilityMeter({ score }) {
  const barColor =
    score > 80 ? "bg-emerald-500" : score > 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{score}%</span>
    </div>
  );
}

function RowActions({ invoice, onRemind, onMarkPaid }) {
  const paid = invoice.status === "paid";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onMarkPaid(invoice.id)}
        disabled={paid}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        Mark paid
      </button>
      <button
        type="button"
        onClick={() => onRemind(invoice)}
        disabled={paid}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Remind
      </button>
    </div>
  );
}

export default function ReceivablesInvoices() {
  const { invoices, today, agingMatrix, markInvoicePaid } = useAppStore();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [pdfInvoice, setPdfInvoice] = useState(null);
  const [dossierFor, setDossierFor] = useState(null);

  const sortedInvoices = useMemo(() => [...invoices].sort(byDueDate), [invoices]);

  const openReminder = (invoice) => setSelectedInvoice(invoice);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Receivables & Invoices
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Aging buckets, payment status and assisted WhatsApp follow-ups for every invoice.
        </p>
      </div>

      {/* Aging matrix */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {agingMatrix.map((bucket) => {
          const tone = BUCKET_TONE[bucket.key] ?? "slate";
          const isOverdueBucket = bucket.key !== "current";
          const list = [...bucket.invoices].sort(byDueDate);

          return (
            <Card key={bucket.key} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {bucket.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${BUCKET_TEXT[tone]}`}>
                    {formatINR(bucket.total)}
                  </p>
                </div>
                <Badge tone={tone}>
                  {bucket.invoices.length} {bucket.invoices.length === 1 ? "invoice" : "invoices"}
                </Badge>
              </div>

              <ul className="mt-4 space-y-2">
                {list.length === 0 ? (
                  <li className="text-xs text-slate-400 dark:text-slate-500">
                    No invoices in this bucket
                  </li>
                ) : (
                  list.map((inv) => (
                    <li key={inv.id}>
                      <button
                        type="button"
                        onClick={() => openReminder(inv)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <ClientAvatar name={inv.clientName} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                              {inv.clientName}
                            </span>
                            <span className="block font-mono text-xs text-slate-400 dark:text-slate-500">
                              {inv.id}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatINR(inv.amount)}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>

              {isOverdueBucket ? (
                <button
                  type="button"
                  disabled={list.length === 0}
                  onClick={() => openReminder(list[0])}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Send reminder
                </button>
              ) : null}
            </Card>
          );
        })}
      </div>

      {/* Mobile: stacked invoice cards */}
      <div className="space-y-3 md:hidden">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">All invoices</h2>
        {sortedInvoices.map((inv) => (
          <Card key={inv.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                  {inv.clientName}
                </p>
                <p className="font-mono text-xs text-slate-400 dark:text-slate-500">{inv.id}</p>
              </div>
              <StatusBadge invoice={inv} today={today} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="col-span-2">
                <dt className="text-xs text-slate-500 dark:text-slate-400">Project</dt>
                <dd className="text-slate-700 dark:text-slate-300">{inv.projectTitle}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">Due</dt>
                <dd className="text-slate-700 dark:text-slate-300">{formatDate(inv.dueDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">Amount</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatINR(inv.amount)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500 dark:text-slate-400">Reliability</dt>
                <dd>
                  <ReliabilityMeter score={inv.reliabilityScore} />
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <RowActions
                invoice={inv}
                onRemind={openReminder}
                onMarkPaid={markInvoicePaid}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop: full invoice table */}
      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reliability</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedInvoices.map((inv) => (
                <tr key={inv.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {inv.id}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    <span className="flex items-center gap-2">
                      <ClientAvatar name={inv.clientName} />
                      {inv.clientName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{inv.projectTitle}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                    {formatINR(inv.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge invoice={inv} today={today} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        aria-label={`Open client risk dossier for ${inv.clientName}`}
                        onClick={() => setDossierFor(dossierFor === inv.id ? null : inv.id)}
                        className="rounded-md text-left transition hover:opacity-80"
                      >
                        <ReliabilityMeter score={inv.reliabilityScore} />
                      </button>
                      {dossierFor === inv.id ? (
                        <div className="absolute z-40 top-full mt-2 left-0">
                          <RiskDossier
                            clientName={inv.clientName}
                            reliabilityScore={inv.reliabilityScore}
                            onClose={() => setDossierFor(null)}
                          />
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPdfInvoice(inv)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        📄 View PDF
                      </button>
                      <RowActions
                        invoice={inv}
                        onRemind={openReminder}
                        onMarkPaid={markInvoicePaid}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedInvoice ? (
        <WhatsAppModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      ) : null}

      <InvoiceModal invoice={pdfInvoice} onClose={() => setPdfInvoice(null)} />
    </div>
  );
}
