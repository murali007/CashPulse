import { useEffect, useRef, useState } from "react";

const EVENTS = [
  {
    icon: "⚡",
    time: "10m ago",
    text: "Auto-reconciled NEFT (+₹45,000) for Vertex Labs.",
  },
  {
    icon: "🤖",
    time: "1h ago",
    text: "Alex Bad-Cop drafted WhatsApp notice for Apex Media.",
  },
  {
    icon: "🛡️",
    time: "4h ago",
    text: "Defend My Rent radar averted Dec 12 rent shortfall.",
  },
  {
    icon: "🔒",
    time: "Yesterday",
    text: "Tax Vault quarantined ₹16,380 (18% GST) into statutory reserve.",
  },
];

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(3);
  const wrapperRef = useRef(null);

  // Close on outside mousedown or Escape; listeners exist only while open.
  useEffect(() => {
    if (!open) return undefined;

    const handleMouseDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={open}
        title="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-base transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 bg-[#ff6900] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="luxury-card absolute right-0 top-full mt-2 z-50 w-80 max-w-[90vw] border-2 border-[#ffdfca] p-0 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#ffdfca] px-4 py-3">
            <span className="rounded-full bg-[#ff6900] px-2.5 py-0.5 text-xs font-bold text-white">
              CashPulse Pro ⚡
            </span>
            <button
              type="button"
              onClick={() => setUnread(0)}
              className="text-xs font-semibold text-[#ff6900] hover:underline"
            >
              Mark all read
            </button>
          </div>
          <ul>
            {EVENTS.map((event) => (
              <li
                key={event.time}
                className="flex gap-3 border-b border-[#ffdfca]/60 px-4 py-3 last:border-b-0"
              >
                <span className="w-24 shrink-0 text-xs text-slate-500">
                  {event.icon} {event.time}
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {event.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
