// Pure receivables and runway functions. Plain JavaScript, no React.

import { addDays, daysBetween } from "./format.js";

export const AGING_BUCKETS = [
  { key: "current", label: "Current" },
  { key: "1-14", label: "1–14d overdue" },
  { key: "15-30", label: "15–30d overdue" },
  { key: "30+", label: "30d+ overdue" },
];

// Classify an invoice by aging. Overdue days are computed from dueDate vs today;
// the stored daysOverdue field is ignored.
export function agingBucket(invoice, today) {
  if (invoice.status === "paid") return "paid";
  if (invoice.dueDate >= today) return "current";
  const overdueDays = daysBetween(invoice.dueDate, today);
  if (overdueDays <= 14) return "1-14";
  if (overdueDays <= 30) return "15-30";
  return "30+";
}

// Group unpaid invoices into aging buckets, in AGING_BUCKETS order.
export function getAgingMatrix(invoices, today) {
  return AGING_BUCKETS.map(({ key, label }) => {
    const bucketInvoices = invoices.filter(
      (inv) => agingBucket(inv, today) === key
    );
    const total = bucketInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    return { key, label, invoices: bucketInvoices, total };
  });
}

// Sum of amounts for invoices still pending or overdue.
export function outstandingReceivables(invoices) {
  return invoices
    .filter((inv) => inv.status === "pending" || inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);
}

// Days-of-month clamp helper: returns ISO date for year/month(0-based)/day,
// with day clamped to the month's last day.
function clampedMonthDate(year, monthIndex, dayOfMonth) {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, lastDay);
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// Build a day-by-day cash runway over horizonDays.
export function buildRunway({
  balance,
  invoices,
  recurringBills,
  today,
  horizonDays,
  delayDays,
}) {
  const inflowByDay = new Array(horizonDays + 1).fill(0);
  const outflowByDay = new Array(horizonDays + 1).fill(0);

  // Inflows: unpaid invoices collect on dueDate + delayDays; if that is already
  // past, collect on today + delayDays.
  for (const inv of invoices) {
    if (inv.status === "paid") continue;
    let collectDate = addDays(inv.dueDate, delayDays);
    if (collectDate < today) collectDate = addDays(today, delayDays);
    const offset = daysBetween(today, collectDate);
    if (offset >= 1 && offset <= horizonDays) {
      inflowByDay[offset] += inv.amount;
    }
  }

  // Outflows: recurring bills on dueDayOfMonth of each calendar month in window.
  const endIso = addDays(today, horizonDays);
  let year = Number(today.slice(0, 4));
  let monthIndex = Number(today.slice(5, 7)) - 1;

  while (true) {
    const monthStartIso = clampedMonthDate(year, monthIndex, 1);
    if (monthStartIso > endIso) break;

    for (const bill of recurringBills) {
      const occurrence = clampedMonthDate(year, monthIndex, bill.dueDayOfMonth);
      if (occurrence > today && occurrence <= endIso) {
        const offset = daysBetween(today, occurrence);
        if (offset >= 1 && offset <= horizonDays) {
          outflowByDay[offset] += bill.amount;
        }
      }
    }

    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
  }

  // Assemble series with running balance; day 0 is the opening point.
  const series = [{ date: today, balance, inflow: 0, outflow: 0 }];
  let running = balance;
  for (let d = 1; d <= horizonDays; d++) {
    const inflow = inflowByDay[d];
    const outflow = outflowByDay[d];
    running = running + inflow - outflow;
    series.push({ date: addDays(today, d), balance: running, inflow, outflow });
  }

  let minBalance = series[0].balance;
  let minBalanceDate = series[0].date;
  let negativeOnDate = null;
  for (const point of series) {
    if (point.balance < minBalance) {
      minBalance = point.balance;
      minBalanceDate = point.date;
    }
    if (negativeOnDate === null && point.balance < 0) {
      negativeOnDate = point.date;
    }
  }

  return {
    series,
    minBalance,
    minBalanceDate,
    negativeOnDate,
    endingBalance: series[series.length - 1].balance,
  };
}

// Convenience: runways for 30, 60 and 90 day horizons.
export function buildRunwayScenarios({
  balance,
  invoices,
  recurringBills,
  today,
  delayDays,
}) {
  const make = (horizonDays) =>
    buildRunway({
      balance,
      invoices,
      recurringBills,
      today,
      horizonDays,
      delayDays,
    });
  return {
    30: make(30),
    60: make(60),
    90: make(90),
  };
}

/**
 * Statutory 1.5% monthly late interest, applied only when more than 7 days overdue.
 * @param {number} amount - Invoice principal.
 * @param {number} daysOverdue - Days past due date.
 * @returns {{ lateFee: number, totalWithInterest: number }}
 */
export function computeLateFee(amount, daysOverdue) {
  if (!(daysOverdue > 7)) return { lateFee: 0, totalWithInterest: amount };
  const lateFee = Math.round(amount * 0.015 * (daysOverdue / 30));
  return { lateFee, totalWithInterest: amount + lateFee };
}

