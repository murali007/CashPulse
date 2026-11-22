import { useEffect } from "react";
import { X } from "lucide-react";
import { getRiskProfile, velocityTrend } from "../../utils/clientRisk";

export default function RiskDossier({ clientName, reliabilityScore, onClose }) {
  const profile = getRiskProfile(clientName);
  const days = profile.velocityDays;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const velocityText =
    days.length === 0
      ? "No history"
      : `${days.map((d, i) => `Inv ${i + 1}: ${d}d`).join(" -> ")} (${velocityTrend(days)})`;

  const probabilityText =
    profile.defaultProbability === null ? "n/a" : `${profile.defaultProbability}%`;

  return (
    <div
      role="dialog"
      aria-label="Client Risk Dossier"
      className="luxury-card w-72 p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Client Risk Dossier
          </p>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{clientName}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1 text-slate-500 hover:bg-[#ffdfca] hover:text-[#ff6900] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Historical velocity</p>
          <p className="text-slate-800 dark:text-slate-200">{velocityText}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Predicted default probability</p>
          <p className="text-slate-800 dark:text-slate-200">{probabilityText}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Reliability score</p>
          <p className="text-slate-800 dark:text-slate-200">{`${reliabilityScore}%`}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">AI Recommendation</p>
          <p className="text-slate-800 dark:text-slate-200">{profile.recommendation}</p>
        </div>
      </div>
    </div>
  );
}
