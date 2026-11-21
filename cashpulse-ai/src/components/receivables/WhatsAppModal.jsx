import { useEffect, useState } from "react";
import { MessageCircle, X, Copy, Check, ExternalLink } from "lucide-react";
import { useAppStore } from "../../store/AppStore.jsx";
import { formatINR, formatDate, daysBetween, addDays } from "../../utils/format.js";

const TONES = [
  { id: "friendly", label: "Friendly" },
  { id: "firm", label: "Firm" },
  { id: "final", label: "Final notice" },
];

// Build the WhatsApp message text for an invoice in the given tone.
function buildMessage(invoice, tone, today) {
  const amount = formatINR(invoice.amount);
  const due = formatDate(invoice.dueDate);
  const days = Math.max(0, daysBetween(invoice.dueDate, today));

  if (tone === "firm") {
    return `Hi ${invoice.clientName}, invoice ${invoice.id} for ${amount} (${invoice.projectTitle}) is now ${days} days overdue (due ${due}). Please arrange payment by ${formatDate(
      addDays(today, 2)
    )}. If anything is blocking it, let me know today. Thanks.`;
  }

  if (tone === "final") {
    return `Dear ${invoice.clientName},\n\nThis is a final notice regarding invoice ${invoice.id} for ${amount} (${invoice.projectTitle}), which is now ${days} days overdue (due ${due}).\n\nPlease settle the outstanding amount immediately. Until payment is received, work on new projects will be paused.\n\nRegards`;
  }

  return `Hi ${invoice.clientName}, a quick reminder that invoice ${invoice.id} for ${amount} (${invoice.projectTitle}) was due on ${due}. Could you share the payment timing? Thanks!`;
}

export default function WhatsAppModal({ invoice, onClose }) {
  const { today } = useAppStore();
  const [tone, setTone] = useState("friendly");
  const [message, setMessage] = useState(() =>
    invoice ? buildMessage(invoice, "friendly", today) : ""
  );
  const [copied, setCopied] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!invoice) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [invoice, onClose]);

  // Reset the "Copied" confirmation after 2 seconds.
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!invoice) return null;

  const daysOverdue = Math.max(0, daysBetween(invoice.dueDate, today));
  const digits = (invoice.clientPhone || "").replace(/\D/g, "");
  const waHref = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

  const selectTone = (nextTone) => {
    setTone(nextTone);
    setMessage(buildMessage(invoice, nextTone, today));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-modal-title"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2
            id="whatsapp-modal-title"
            className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Assisted WhatsApp follow-up
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Details */}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Client
            </dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{invoice.clientName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Phone
            </dt>
            <dd className="font-mono text-slate-900 dark:text-slate-100">{invoice.clientPhone}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Invoice
            </dt>
            <dd className="font-mono text-slate-900 dark:text-slate-100">{invoice.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Amount
            </dt>
            <dd className="font-semibold text-slate-900 dark:text-slate-100">
              {formatINR(invoice.amount)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Days overdue
            </dt>
            <dd className="font-medium text-rose-600 dark:text-rose-400">{daysOverdue} days</dd>
          </div>
        </dl>

        {/* Tone selector */}
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tone
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {TONES.map((t) => {
              const active = tone === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectTone(t.id)}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editable message */}
        <div className="mt-5">
          <label
            htmlFor="whatsapp-message"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            Message
          </label>
          <textarea
            id="whatsapp-message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          />
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy message"}
          </button>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          >
            <ExternalLink className="h-4 w-4" />
            Open WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
