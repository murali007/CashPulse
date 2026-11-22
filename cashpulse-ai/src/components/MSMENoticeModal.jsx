import { useEffect, useState } from "react";
import { X, Printer, Copy } from "lucide-react";
import { formatINR, formatDate, addDays } from "../utils/format.js";
import { useAppStore } from "../store/AppStore.jsx";

const MSME_PENAL_RATE_MONTHLY = 0.0162; // 3x RBI bank rate, approx 1.62% per month. VERIFY the current RBI bank rate before filing; this value is illustrative.
const SETTLEMENT_DAYS = 15;

const PAYMENT_LINE = "UPI: ravi@upi. Bank Transfer: HDFC Bank A/C 501002345678.";

// Print styles: only the A4 notice paper is printed; overlay and top bar are hidden.
const PRINT_CSS = `
@page { size: A4; margin: 12mm; }
@media print {
  body * { visibility: hidden !important; }
  .msme-paper, .msme-paper * { visibility: visible !important; }
  .msme-overlay {
    position: absolute !important;
    inset: auto !important;
    top: 0 !important;
    left: 0 !important;
    background: transparent !important;
    padding: 0 !important;
    display: block !important;
    overflow: visible !important;
  }
  .msme-paper {
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

export default function MSMENoticeModal({ invoice, onClose }) {
  const { today } = useAppStore();
  const [copied, setCopied] = useState(false);

  // Close on Escape while the modal is open.
  useEffect(() => {
    if (!invoice) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [invoice, onClose]);

  // Reset the "Copied" confirmation after 2 seconds.
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!invoice) return null;

  const monthsOverdue = Math.floor(invoice.daysOverdue / 30);
  const principal = invoice.amount;
  const interest = Math.round(principal * (Math.pow(1 + MSME_PENAL_RATE_MONTHLY, monthsOverdue) - 1));
  const totalDue = principal + interest;

  const deadlineLine = today
    ? "Settlement deadline: " + formatDate(addDays(today, SETTLEMENT_DAYS)) + "."
    : "Settlement deadline: " + SETTLEMENT_DAYS + " days from the date of this notice.";

  const noticeLines = [
    "To: " + invoice.clientName + ", " + invoice.clientEmail + ", " + invoice.clientPhone + ".",
    "From: CashPulse Studio (Ravi).",
    "Invoice: " +
      invoice.id +
      ", project '" +
      invoice.projectTitle +
      "', issued " +
      formatDate(invoice.issueDate) +
      ", due " +
      formatDate(invoice.dueDate) +
      ", overdue " +
      invoice.daysOverdue +
      " days.",
    "Principal outstanding: " + formatINR(principal) + ".",
    "Interest under Section 16 of the MSMED Act, 2006, at three times the RBI bank rate, compounded monthly: " +
      formatINR(interest) +
      " for " +
      monthsOverdue +
      " completed month(s).",
    "Total payable: " + formatINR(totalDue) + ".",
    "Demand: You are required to settle the total payable within " +
      SETTLEMENT_DAYS +
      " days of this notice. Failing payment, the Supplier may file a claim before the Micro and Small Enterprises Facilitation Council on the MSME Samadhaan portal (samadhaan.msme.gov.in) under Section 18 of the MSMED Act, 2006.",
    deadlineLine,
    "Payment details: " + PAYMENT_LINE,
    "This notice is issued in the ordinary course of business. Please treat it as a formal demand.",
    "CashPulse Studio, on behalf of Ravi.",
  ];
  const noticeText = noticeLines.join("\n\n");

  const handlePrint = () => window.print();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(noticeText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="msme-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-4">
      <style>{PRINT_CSS}</style>

      <div className="max-w-3xl w-[95%] max-h-[90vh] overflow-y-auto p-4 mx-auto rounded-2xl">
        {/* Top bar (not printed) */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff6900] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#e05d00]"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#ffdfca] bg-white px-3 py-2 text-xs font-semibold text-[#ff6900] shadow-sm transition hover:bg-[#ffdfca]"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy Legal Notice"}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm transition hover:bg-[#ffdfca] hover:text-[#ff6900]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notice card */}
        <div className="luxury-card border-2 border-[#ffdfca] p-0">
          {/* A4 paper (always light) */}
          <div
            className="msme-paper mx-auto w-full bg-white p-5 sm:p-10 text-slate-900"
            style={{ maxWidth: "210mm" }}
          >
            {/* Header with official seal */}
            <div className="flex items-start justify-between gap-4 border-b border-[#ffdfca] pb-6">
              <div className="min-w-0">
                <p className="text-lg font-bold tracking-tight text-slate-900">
                  ⚖️ STATUTORY DEMAND NOTICE (MSMED ACT 2006, SEC 15)
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Issued by CashPulse Studio on behalf of Ravi
                </p>
              </div>
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-[#ff6900] p-2 text-center text-[9px] font-bold uppercase leading-tight text-[#ff6900]"
                aria-label="MSME Compliance Seal"
              >
                MSME Compliance Seal
              </div>
            </div>

            {/* Body */}
            <div className="mt-6 space-y-3 text-sm leading-relaxed text-slate-900">
              {noticeLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>

            {/* Footer note */}
            <p className="mt-10 border-t border-[#ffdfca] pt-4 text-[10px] text-slate-500">
              Draft generated by CashPulse AI for review by a qualified advocate or chartered accountant
              before filing. Not legal advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
