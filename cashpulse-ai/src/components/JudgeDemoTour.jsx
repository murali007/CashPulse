import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { celebratePayment } from "./../utils/celebrate.js";

const STEPS = [
  {
    title: "Step 1 · Cashflow Radar",
    points: [
      "Live Bank Balance in the header shows the real-time cash position.",
      "GST 18% Tax Shield on the Executive Dashboard locks the tax reserve automatically.",
      "Currency Toggle ($ / € / ₹) in the header converts the balance for cross-border clients.",
    ],
  },
  {
    title: "Step 2 · Autonomous Collections",
    points: [
      "WhatsApp Copilot drafts reminders in four tones, including Alex (AI Accounts Agent) for a formal, impersonal notice.",
      "Voice Note ingest turns a client's WhatsApp voice note into a parsed invoice for review.",
      "A scannable UPI QR code on every invoice lets the client pay in one scan.",
    ],
  },
  {
    title: "Step 3 · Legal MSME Defense",
    points: [
      "MSME Samadhaan Statutory Demand Notice drafts a penal-interest demand under MSMED Act 2006, Section 15, with a 15-day settlement window.",
      "Contract Sentinel scans a client contract and flags the Net-90 trap against the 45-day MSME limit.",
    ],
  },
  {
    title: "Step 4 · Runway & Factoring",
    points: [
      "The 90-Day Runway shows deficit risk and how to defend it before rent is due.",
      "1-Click Factoring gives an advance of 85% of an invoice's face value, with the rest released on payment.",
    ],
  },
];

export default function JudgeDemoTour({ open, onClose }) {
  const [step, setStep] = useState(0);

  // Reset to the first step every time the tour opens.
  useEffect(() => {
    if (open) {
      setStep(0);
    }
  }, [open]);

  // Escape closes the tour while it is open.
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4">
      <div className="luxury-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 rounded-2xl border-2 border-[#ffdfca] shadow-[0_0_30px_rgba(255,105,0,0.25)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-peach px-2 py-0.5 text-[11px] font-semibold">Judge Tour</span>
            <h2 className="text-lg font-semibold text-[#282828] dark:text-slate-100">{current.title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {current.points.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-[#ff6900]" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        {step === 3 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => celebratePayment()}
              className="rounded-xl bg-[#ff6900] hover:bg-[#e05d00] text-white font-semibold px-4 py-2 shadow-sm"
            >
              Simulate Settlement
            </button>
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-2">
          {STEPS.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to step ${index + 1}`}
              aria-current={index === step ? "step" : undefined}
              onClick={() => setStep(index)}
              className={`h-2 w-2 rounded-full ${index === step ? "bg-[#ff6900]" : "bg-[#ffdfca]"}`}
            />
          ))}
        </div>

        <div className="mt-5 flex justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-xl border border-[#ffdfca] bg-white px-4 py-2 text-sm font-semibold text-[#ff6900] hover:bg-[#ffdfca] disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#ffdfca] bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          {isLastStep ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#ff6900] hover:bg-[#e05d00] text-white font-semibold px-4 py-2 shadow-sm"
            >
              Finish
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="rounded-xl bg-[#ff6900] hover:bg-[#e05d00] text-white font-semibold px-4 py-2 shadow-sm"
            >
              Next Step
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
