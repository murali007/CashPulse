import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatINR } from "../utils/format.js";
import { useAppStore } from "../store/AppStore.jsx";

// Simulated bank credits. Visual only: no statement file is read.
// clientMatch is matched against invoice.clientName (lowercased, substring).
const MOCK_CREDITS = [
  {
    text: "NEFT Cr: VERTEX LABS PVT LTD (+₹45,000)",
    clientMatch: "vertex labs",
    amount: 45000,
  },
  {
    text: "IMPS Cr: CLOUDANGLES (+₹30,000)",
    clientMatch: "cloudangles",
    amount: 30000,
  },
  {
    text: "UPI Cr: UNKNOWN CLIENT (+₹8,500)",
    clientMatch: null,
    amount: 8500,
  },
];

// Find the open invoice for a statement row (client name + exact amount, not paid).
function findOpenMatch(invoices, row) {
  if (!row.clientMatch) return null;
  return (
    invoices.find(
      (inv) =>
        String(inv.clientName ?? "").toLowerCase().includes(row.clientMatch) &&
        inv.amount === row.amount &&
        inv.status !== "paid"
    ) ?? null
  );
}

// Find an already-paid invoice for a statement row, used for display only.
function findPaidMatch(invoices, row) {
  if (!row.clientMatch) return null;
  return (
    invoices.find(
      (inv) =>
        String(inv.clientName ?? "").toLowerCase().includes(row.clientMatch) &&
        inv.amount === row.amount &&
        inv.status === "paid"
    ) ?? null
  );
}

export default function BankReconcilerModal({ onClose, onDone }) {
  const { invoices, markInvoicePaid } = useAppStore();
  const [imported, setImported] = useState(false);

  // Close on Escape while the modal is open.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Each row's display state, computed from the live ledger.
  const rows = MOCK_CREDITS.map((row) => {
    const open = findOpenMatch(invoices, row);
    if (open) {
      return { ...row, matched: true, status: "Exact Match: " + open.id + " ✅" };
    }
    const paid = findPaidMatch(invoices, row);
    if (paid) {
      return { ...row, matched: true, status: "Matched & Paid: " + paid.id + " ✅" };
    }
    return { ...row, matched: false, status: "Unmatched / Suspense A/c ⚠️" };
  });

  const handleSettle = async () => {
    let settledCount = 0;
    let settledAmount = 0;

    // Only rows with an exact open match are settled; the unmatched row never is.
    for (const row of MOCK_CREDITS) {
      const invoice = findOpenMatch(invoices, row);
      if (!invoice) continue;
      await markInvoicePaid(invoice.id);
      settledCount += 1;
      settledAmount += invoice.amount;
    }

    if (settledCount > 0) {
      onDone(
        "Reconciled " +
          settledCount +
          " invoice(s): " +
          formatINR(settledAmount) +
          " credited to bank balance."
      );
    } else {
      onDone("No open matching invoices; nothing settled.");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-4">
      <div className="luxury-card max-w-lg w-[95%] max-h-[90vh] overflow-y-auto p-4 mx-auto rounded-2xl border-2 border-[#ffdfca]">
        <div className="luxury-panel px-5 py-4 flex items-center justify-between">
          <h2 className="text-[#282828] font-semibold">🧾 Bank Reconciliation</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm transition hover:bg-[#ffdfca] hover:text-[#ff6900]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border-2 border-dashed border-[#ffdfca] bg-white p-6 text-center text-sm text-slate-600">
            <p>Drop your HDFC or ICICI statement (CSV or PDF) here</p>
            <p className="mt-1 text-xs text-slate-500">Simulated import: no file is read.</p>
          </div>

          <button
            type="button"
            onClick={() => setImported(true)}
            className="rounded-xl bg-[#ff6900] hover:bg-[#e05d00] text-white font-semibold px-4 py-2 shadow-sm"
          >
            ⚡ Simulate HDFC/ICICI Statement Import
          </button>

          {imported && (
            <>
              <div>
                {rows.map((row) => (
                  <div
                    key={row.text}
                    className="flex justify-between border-b border-[#ffdfca] py-2.5 text-sm"
                  >
                    <span className="text-slate-800">{row.text}</span>
                    <span
                      className={
                        row.matched
                          ? "font-medium text-emerald-700"
                          : "font-medium text-amber-700"
                      }
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSettle}
                className="w-full rounded-xl bg-[#ff6900] hover:bg-[#e05d00] text-white font-semibold py-3 shadow-sm"
              >
                ⚡ Auto-Reconcile &amp; Settle Matched Invoices
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
