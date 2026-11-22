export default function Card({ className = "", children }) {
  return (
    <div
      className={[
        "luxury-card dark:border-slate-800 dark:bg-slate-900",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
