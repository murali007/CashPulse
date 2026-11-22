const CLIENTS = [
  { name: "CloudAngles", days: 2, label: "Fast", icon: "⚡", tone: "good" },
  { name: "Codebenders", days: 3, label: "Fast", icon: "⚡", tone: "good" },
  { name: "Apex Media", days: 24, label: "Chronic Defaulter", icon: "⚠️", tone: "warn" },
  { name: "TechNova", days: 38, label: "Critical", icon: "🚨", tone: "bad" },
];

const TONE_CLASSES = {
  good: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30",
  warn: "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30",
  bad: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30",
};

export default function ClientLeaderboard() {
  return (
    <section className="luxury-card p-5">
      <h3 className="text-base font-semibold text-[#282828] dark:text-slate-100">
        🏆 Payment Velocity: Hall of Fame vs Wall of Shame
      </h3>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <span className="badge-peach justify-self-start">Hall of Fame</span>
        <span className="justify-self-end text-xs font-semibold text-red-700">Wall of Shame</span>
      </div>

      <ol className="mt-3 space-y-2">
        {CLIENTS.map((client) => (
          <li
            key={client.name}
            className={`rounded-lg px-3 py-2 flex items-center justify-between ${TONE_CLASSES[client.tone]}`}
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true">{client.icon}</span>
              <span className="font-medium">{client.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">
                {client.days}d - {client.label}
              </span>
              <span className="ml-2 text-xs text-slate-500">avg {client.days} days</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
