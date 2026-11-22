import { useEffect } from "react";
import { X, Printer, MessageCircle, Shield, ShieldCheck, Lock } from "lucide-react";
import { formatINR, formatDate } from "../../utils/format.js";

const PAYMENT_LINE =
  "UPI ID: ravi@upi | Bank Transfer: HDFC Bank A/C 501002345678";

// Print styles: only the A4 paper is printed; overlay and top bar are hidden.
const PRINT_CSS = `
@page { size: A4; margin: 12mm; }
@media print {
  body * { visibility: hidden !important; }
  .invoice-paper, .invoice-paper * { visibility: visible !important; }
  .invoice-overlay {
    position: absolute !important;
    inset: auto !important;
    top: 0 !important;
    left: 0 !important;
    background: transparent !important;
    padding: 0 !important;
    display: block !important;
    overflow: visible !important;
  }
  .invoice-paper {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 210mm !important;
    max-width: none !important;
    min-height: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }
  .no-print { display: none !important; }
}
`;

function buildWhatsAppText(invoice) {
  return (
    "Dear " +
    invoice.clientName +
    ", please find the invoice " +
    invoice.id +
    " for " +
    formatINR(invoice.amount) +
    " for the project '" +
    invoice.projectTitle +
    "'. Payment is due on " +
    formatDate(invoice.dueDate) +
    ". " +
    PAYMENT_LINE +
    ". " +
    "⚡ Pay instantly via UPI: ravi@upi or scan the QR code on your invoice. Amount: " +
    formatINR(invoice.amount) +
    ". " +
    "Thank you, CashPulse Studio."
  );
}

export default function InvoiceModal({ invoice, onClose }) {
  // Close on Escape while the modal is open.
  useEffect(() => {
    if (!invoice) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [invoice, onClose]);

  if (!invoice) return null;

  const upiParams = `pa=ravi@upi&pn=CashPulse%20Studio&am=${invoice.amount}&cu=INR&tn=Invoice%20${invoice.id}`;
  const upiLink = `upi://pay?${upiParams}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiLink)}`;
  const locked = invoice.status !== "paid";


  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    const digits = String(invoice.clientPhone ?? "").replace(/\D/g, "");
    const text = buildWhatsAppText(invoice);
    window.open(
      "https://wa.me/" + digits + "?text=" + encodeURIComponent(text),
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="invoice-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4">
      <style>{PRINT_CSS}</style>

      <div className="w-full" style={{ maxWidth: "210mm" }}>
        {/* Top bar (not printed) */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              <Printer className="h-3.5 w-3.5" />
              📥 Save / Print PDF
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              📲 Send via WhatsApp
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* A4 paper (always light, even in dark mode) */}
        <div
          className="invoice-paper mx-auto w-full bg-white p-10 text-slate-900 shadow-xl"
          style={{ maxWidth: "210mm", minHeight: "297mm" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">CashPulse Studio</p>
              <p className="mt-1 text-xs text-slate-500">Working-capital copilot for solo studios</p>
            </div>
            <p className="text-right text-xl font-bold uppercase tracking-widest text-slate-700">
              INVOICE
            </p>
          </div>

          {/* Invoice meta */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Invoice ID
              </p>
              <p className="mt-1 font-mono font-semibold text-slate-900">{invoice.id}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Issue date
              </p>
              <p className="mt-1 text-slate-900">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Due date
              </p>
              <p className="mt-1 text-slate-900">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* Bill to */}
          <div className="mt-8">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Bill to
            </p>
            <p className="mt-1 font-semibold text-slate-900">{invoice.clientName}</p>
            <p className="text-sm text-slate-600">{invoice.clientEmail}</p>
            <p className="text-sm text-slate-600">{invoice.clientPhone}</p>
          </div>

          {/* Project title row + line items */}
          <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-[1fr_auto] gap-4 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 text-sm">
              <span className="text-slate-900">{invoice.projectTitle}</span>
              <span className="text-slate-900">{formatINR(invoice.amount)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-slate-900">Total (INR)</span>
              <span className="font-bold text-slate-900">{formatINR(invoice.amount)}</span>
            </div>
          </div>

          {/* Payment instructions */}
          <div className="mt-8 rounded-lg border border-slate-200 p-4 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Payment instructions
            </p>
            <p className="mt-1 text-slate-900">{PAYMENT_LINE}</p>
          </div>

          {/* Instant UPI payment (QR stays printed; app-pay button is hidden on print) */}
          <div className="mt-6 rounded-lg border border-slate-200 p-4 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              ⚡ Instant UPI Payment
            </p>
            <div className="mt-3 flex flex-wrap items-start gap-4">
              <div className="flex flex-col items-start gap-2">
                <img
                  src={qrSrc}
                  width={160}
                  height={160}
                  alt={"UPI QR code to pay invoice " + invoice.id}
                  loading="lazy"
                  className="h-40 w-40 rounded border border-slate-200 bg-white"
                />
                <p className="max-w-[160px] text-[11px] text-slate-500">
                  QR needs internet access. Use the UPI ID ravi@upi if it does not load.
                </p>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    GPay
                  </span>
                  <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    PhonePe
                  </span>
                  <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    Paytm
                  </span>
                </div>
                <p className="text-slate-900">UPI ID: ravi@upi</p>
                <a
                  href={upiLink}
                  className="no-print inline-flex w-fit items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  📲 Pay via UPI App (GPay / PhonePe)
                </a>
              </div>
            </div>
          </div>

          {/* Escrow Deliverables Vault (stays visible when printed) */}
          {locked ? (
            <div className="mt-6 rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900 flex items-center gap-4">
              <div
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-4 ring-amber-300/60 shadow-[0_0_24px_rgba(245,158,11,0.55)] animate-pulse"
                aria-hidden="true"
              >
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider">
                  Escrow Deliverables Vault
                </p>
                <p className="mt-1">
                  🔒 Production Deliverables Locked in Escrow. Pay via UPI to auto-release.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center gap-4">
              <div
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-emerald-300/60 shadow-[0_0_24px_rgba(16,185,129,0.55)]"
                aria-hidden="true"
              >
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider">
                  Escrow Deliverables Vault
                </p>
                <p className="mt-1">🔓 Production Assets Unlocked &amp; Verified for Download</p>
              </div>
            </div>
          )}


          {/* Footer */}
          <p className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">
            Thank you for your business.
          </p>
        </div>
      </div>
    </div>
  );
}
