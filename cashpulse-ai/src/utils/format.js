// Formatting and UTC-safe date helpers. Plain JavaScript, no React.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amount) {
  return inrFormatter.format(amount);
}

export function formatDate(isoDate) {
  return new Date(isoDate + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function isoToUtcMs(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

// Add n days to an ISO YYYY-MM-DD string; returns ISO YYYY-MM-DD.
export function addDays(isoDate, n) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d + n);
  return new Date(ms).toISOString().slice(0, 10);
}

// Integer number of days from fromIso to toIso (to minus from).
export function daysBetween(fromIso, toIso) {
  return Math.round((isoToUtcMs(toIso) - isoToUtcMs(fromIso)) / MS_PER_DAY);
}
