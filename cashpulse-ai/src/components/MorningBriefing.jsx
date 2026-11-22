import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const BRIEFING_TEXT =
  "Good morning Ravi. Bank balance is ₹74,500. Dec 12 rent is due in 20 days. Apex Media is 22 days overdue; Alex Bad-Cop WhatsApp notice is ready. Runway is safe for 42 days.";

const BAR_HEIGHTS = [30, 55, 40, 80, 60, 95, 45, 70, 35, 90, 50, 65, 85, 40, 75, 55, 30, 88, 60, 45, 70, 35, 80, 50];

export default function MorningBriefing() {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  function toggle() {
    if (!supported) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(BRIEFING_TEXT);
    u.lang = "en-IN";
    u.rate = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  const Icon = speaking ? Pause : Play;

  return (
    <div className="luxury-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
      <button
        type="button"
        onClick={toggle}
        disabled={!supported}
        title={supported ? undefined : "Speech is not supported in this browser"}
        aria-label={speaking ? "Pause morning briefing" : "Play morning briefing"}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ff6900] hover:bg-[#e05d00] text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[#282828] dark:text-slate-100">
          🎧 30s Morning Financial Pulse
        </h3>
        <div className="mt-1">
          {speaking ? (
            <span className="badge-peach px-2 py-0.5 text-[11px] font-semibold">
              Speaking
            </span>
          ) : (
            <p className="text-xs text-slate-500">Tap play for today's briefing</p>
          )}
        </div>
      </div>

      <div className="flex h-8 w-full min-w-0 flex-1 items-end gap-[3px]" aria-hidden="true">
        {BAR_HEIGHTS.map((height, index) => (
          <span
            key={index}
            className={
              speaking
                ? "w-[3px] rounded-full bg-[#ff6900] animate-pulse"
                : "w-[3px] rounded-full bg-[#ff6900]"
            }
            style={{
              height: `${height}%`,
              ...(speaking ? { animationDelay: `${index * 60}ms` } : {}),
            }}
          />
        ))}
      </div>
    </div>
  );
}
