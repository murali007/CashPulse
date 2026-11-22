import { useEffect } from "react";
import { X } from "lucide-react";
import { formatINR } from "../utils/format.js";

export default function InvoiceFactoringModal({ invoice, onClose, onDisburse }) {
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

  const face = Math.round(invoice.amount);
  const payout = Math.round(invoice.amount * 0.85);
  const fee = Math.round(invoice.amount * 0.018);
  const reserve = face - payout;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-4">
      <div className="luxury-card max-w-lg w-[95%] max-h-[90vh] overflow-y-auto p-4 mx-auto rounded-2xl border-2 border-[#ffdfca]">
        {/* Header */}
        <div className="luxury-panel px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[#282828] font-semibold">⚡ Instant Invoice Factoring — Term Sheet</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {invoice.id} · {invoice.clientName}
            </p>
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

        {/* Term sheet rows */}
        <div className="px-5 py-2 text-sm">
          <div className="flex items-center justify-between border-b border-[#ffdfca] py-2.5">
            <p className="text-slate-800">Invoice Face Value</p>
            <p className="font-semibold text-slate-900">{formatINR(face)}</p>
          </div>

          <div className="flex items-center justify-between border-b border-[#ffdfca] py-2.5">
            <div>
              <p className="text-slate-800">85% Immediate Payout</p>
              <p className="text-xs text-slate-500">to HDFC Current A/c **4092</p>
            </div>
            <p className="font-semibold text-emerald-700">{formatINR(payout)}</p>
          </div>

          <div className="flex items-center justify-between border-b border-[#ffdfca] py-2.5">
            <p className="text-slate-800">Factoring Fee (1.8%)</p>
            <p className="font-semibold text-slate-900">{formatINR(fee)}</p>
          </div>

          <div className="flex items-center justify-between border-b border-[#ffdfca] py-2.5">
            <div>
              <p className="text-slate-800">Remaining Reserve (15%)</p>
              <p className="text-xs text-slate-500">released upon client payment</p>
            </div>
            <p className="font-semibold text-slate-900">{formatINR(reserve)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3">
          <button
            type="button"
            onClick={() => onDisburse(invoice)}
            className="w-full rounded-xl bg-[#ff6900] hover:bg-[#e05d00] text-white font-semibold py-3 shadow-sm"
          >
            ⚡ Disburse Advance Now
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Simulated disbursement. The payout is credited to the live balance.
          </p>
        </div>
      </div>
    </div>
  );
}
