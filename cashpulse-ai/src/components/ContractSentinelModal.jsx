import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SAMPLE_MSA =
  "MASTER SERVICES AGREEMENT. 1. Payment Terms: Client shall pay each invoice within ninety (90) days of receipt. 2. Revisions: Service Provider shall provide unlimited revisions to all deliverables until Client is fully satisfied, at no additional charge. 3. Scope: Any additional features requested by Client shall be deemed part of the original fee. 4. Governing Law: This agreement is governed by the laws of India.";

const COUNTER_CLAUSE =
  "PROTECTIVE COUNTER-CLAUSES (proposed for negotiation)\n\n1. Payment Terms: Each invoice is payable within fifteen (15) days of issue. Client may not extend this period beyond the forty-five (45) day maximum permitted under Section 15 of the Micro, Small and Medium Enterprises Development Act, 2006.\n\n2. Revisions: Service Provider includes two (2) rounds of revisions per deliverable. Further revisions are charged at the rate in the applicable rate card.\n\n3. Late Payment: Any amount not paid by its due date carries interest at three times the RBI bank rate, compounded monthly, as provided under Section 16 of the MSMED Act, 2006, from the due date until the date of payment.";

const FLAG_STYLES = {
  CRITICAL: {
    className: "text-red-700 font-semibold",
    text: "🚨 CRITICAL: Net-90 Term exceeds statutory MSME 45-day limit (Sec 15 MSMED Act)",
  },
  HIGH: {
    className: "text-amber-700 font-semibold",
    text: "⚠️ HIGH: Unlimited Revisions creates scope creep risk",
  },
  MISSING: {
    className: "text-amber-700 font-semibold",
    text: "⚠️ MISSING: No Late-Fee Statutory Clause",
  },
};

export default function ContractSentinelModal({ onClose }) {
  // Close on Escape while the modal is open.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const [contractText, setContractText] = useState("");
  const [scanned, setScanned] = useState(false);
  const [flags, setFlags] = useState([]);
  const [counterClause, setCounterClause] = useState(null);
  const [copied, setCopied] = useState(false);
  const [emptyWarning, setEmptyWarning] = useState(false);

  const handleLoadSample = () => {
    setContractText(SAMPLE_MSA);
    setEmptyWarning(false);
    setScanned(false);
    setFlags([]);
    setCounterClause(null);
  };

  const handleScan = () => {
    if (contractText.trim() === "") {
      setEmptyWarning(true);
      return;
    }
    const text = contractText;
    const found = [];
    if (/net\s*-?\s*90|ninety\s*\(?90\)?\s*days/i.test(text)) {
      found.push("CRITICAL");
    }
    if (/unlimited\s+revisions/i.test(text)) {
      found.push("HIGH");
    }
    if (
      !/late[\s-]*(fee|interest)|interest on late|statutory interest|MSMED|section 16/i.test(
        text
      )
    ) {
      found.push("MISSING");
    }
    setFlags(found);
    setScanned(true);
  };

  const handleGenerate = () => {
    setCounterClause(COUNTER_CLAUSE);
    setCopied(false);
  };

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(counterClause);
    } catch {
      // Clipboard unavailable; ignore.
    }
    setCopied(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-4">
      <div className="luxury-card max-w-lg w-[95%] max-h-[90vh] overflow-y-auto p-4 mx-auto rounded-2xl border-2 border-[#ffdfca]">
        {/* Header */}
        <div className="luxury-panel px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[#282828] font-semibold">🔍 Contract Sentinel</p>
            <p className="text-xs text-slate-500">
              Scan a client contract for payment and scope traps
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

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Contract text
            </label>
            <textarea
              rows={6}
              value={contractText}
              onChange={(event) => {
                setContractText(event.target.value);
                setEmptyWarning(false);
              }}
              aria-label="Contract text"
              className="w-full rounded-xl border border-[#ffdfca] bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ff6900]"
            />
            {emptyWarning ? (
              <p role="alert" className="mt-1 text-xs font-medium text-amber-700">
                Please enter or paste text to analyze
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="rounded-xl border border-[#ffdfca] bg-white px-3 py-2 text-sm font-semibold text-[#ff6900] hover:bg-[#ffdfca]"
            >
              📄 Load Sample MSA Contract
            </button>
            <button
              type="button"
              onClick={handleScan}
              className="rounded-xl bg-[#ff6900] hover:bg-[#e05d00] text-white font-semibold px-4 py-2 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              🔎 Scan Contract
            </button>
          </div>

          {scanned && (
            <div>
              {flags.length === 0 ? (
                <p className="text-sm text-slate-600">No risk flags found in this text.</p>
              ) : (
                flags.map((level) => (
                  <div key={level} className="border-b border-[#ffdfca] py-2.5">
                    <p className={FLAG_STYLES[level].className}>{FLAG_STYLES[level].text}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {scanned && (
            <button
              type="button"
              onClick={handleGenerate}
              className="w-full rounded-xl bg-[#ff6900] hover:bg-[#e05d00] text-white font-semibold py-3 shadow-sm"
            >
              ⚡ Generate Protective Counter-Clause
            </button>
          )}

          {counterClause && (
            <div className="luxury-panel p-4 space-y-3">
              <pre className="whitespace-pre-wrap rounded-xl border border-[#ffdfca] bg-white p-4 text-sm text-slate-800">
                {counterClause}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl border border-[#ffdfca] bg-white px-3 py-2 text-sm font-semibold text-[#ff6900] hover:bg-[#ffdfca]"
              >
                {copied ? "Copied" : "Copy to Clipboard"}
              </button>
              <p className="text-[11px] text-slate-500">
                Draft for negotiation. Have an advocate or chartered accountant review before
                sending.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
