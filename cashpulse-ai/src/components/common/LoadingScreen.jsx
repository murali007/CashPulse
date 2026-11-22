import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="luxury-card dark:border-slate-800 dark:bg-slate-900 p-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#ff6900]" />
        <h2 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">
          Opening your ledger…
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Loading invoices and cash data from this browser.
        </p>
      </div>
    </div>
  );
}
