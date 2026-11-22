import { useEffect, useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import Card from "../common/Card.jsx";
import { INITIAL_INVOICES } from "../../data/mockData.js";
import { formatINR } from "../../utils/format.js";

const RENT_TARGET = 35000;

const SUNRISE = INITIAL_INVOICES.find((inv) => inv.id === "INV-1004");
const ORBIT = INITIAL_INVOICES.find((inv) => inv.id === "INV-1003");
const HELIX = INITIAL_INVOICES.find((inv) => inv.id === "INV-1005");

function waLink(phone, text) {
  const digits = String(phone || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const SUNRISE_TEXT = `Hi ${SUNRISE.clientName}, to settle invoice ${SUNRISE.id} for ₹35,000 today, we can offer a 4% settlement discount: you pay ₹33,600 within 24 hours. Please confirm and I will share the UPI details right away. Thank you, CashPulse Studio.`;

const ORBIT_TEXT = `Hi ${ORBIT.clientName}, the mobile UI kit milestone is complete. To keep the project on schedule, please release a 50% advance of ₹26,000 now, with the balance on the Dec 05 milestone. Thank you, CashPulse Studio.`;

export default function DefendRentModal({ open, onClose }) {
  const [settledSunrise, setSettledSunrise] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const defended = settledSunrise ? RENT_TARGET : 17000;
  const pct = Math.floor((defended / RENT_TARGET) * 100);
  const complete = pct === 100;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/70 p-3 sm:p-4">
      <div className="relative my-8 max-w-lg w-[95%] max-h-[90vh] overflow-y-auto p-4 mx-auto rounded-2xl border-2 border-red-500 bg-white shadow-2xl dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 hover:bg-[#ffdfca] hover:text-[#ff6900] dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="pr-10 text-lg font-bold text-red-600 dark:text-red-400">
          🚨 CRISIS WAR ROOM: DEFEND DECEMBER 1ST RENT
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#ffe9da] p-3 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">Target</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">₹35,000 Office Rent</p>
          </div>
          <div className="rounded-xl border border-[#ffe9da] p-3 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">Current Deficit</p>
            <p className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-400">-₹18,000</p>
          </div>
          <div className="rounded-xl border border-[#ffe9da] p-3 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">Deadline</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Dec 01 (10 Days Left)</p>
          </div>
        </div>

        <div className="mt-5">
          <p
            className={`text-sm font-medium ${
              complete ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {complete
              ? "100% Defended"
              : `Rent Defended: ${formatINR(defended)} / ₹35,000 (${pct}%)`}
          </p>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                complete ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <h3 className="mt-6 text-base font-semibold text-slate-900 dark:text-slate-100">
          AI Tactical 2-Step Strike Plan
        </h3>

        <div className="mt-3 space-y-4">
          <Card className="p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Strike Target 1: Sunrise Retail Co. (₹35,000 owed, 8d overdue, 62% reliability)
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Deploy 24-Hour Settlement Deal: 4% off to recover ₹33,600 net cash today.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => window.open(waLink(SUNRISE.clientPhone, SUNRISE_TEXT), "_blank", "noopener,noreferrer")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                📲 Deploy Sunrise WhatsApp Deal
              </button>
              <button
                type="button"
                onClick={() => setSettledSunrise(true)}
                disabled={settledSunrise}
                className="rounded-lg border border-[#ffe9da] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Mark Settled
              </button>
            </div>
            {settledSunrise && (
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                ✓ Settled — Rent 100% Defended
              </p>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Strike Target 2: Orbit Fintech (₹52,000 milestone due Dec 05)
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Request 50% early milestone advance (₹26,000) for completed mobile UI kit.
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => window.open(waLink(ORBIT.clientPhone, ORBIT_TEXT), "_blank", "noopener,noreferrer")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                📲 Deploy Advance Request
              </button>
            </div>
          </Card>

          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            {`⚠️ Deprioritized: Helix Health Tech (${formatINR(HELIX.amount)}, ${HELIX.reliabilityScore}% reliability) - Low probability of payment within 10 days. Do not waste collection energy here.`}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Close War Room
          </button>
        </div>
      </div>
    </div>
  );
}
