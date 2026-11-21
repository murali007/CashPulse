// Demo payment-history data. Values are illustrative, not computed from real invoices.
// Plain JavaScript, no React.

export const RISK_PROFILES = {
  "Northwind Labs": {
    velocityDays: [2, 3, 2],
    defaultProbability: 12,
    recommendation: "Consistently prompt payer. Keep standard net-15 terms and send a courtesy reminder only.",
  },
  "Bluepeak Media": {
    velocityDays: [4, 6, 5],
    defaultProbability: 22,
    recommendation: "Reliable payer with minor delays. Send a friendly reminder on the due date.",
  },
  "Orbit Fintech": {
    velocityDays: [7, 9, 12],
    defaultProbability: 38,
    recommendation: "Confirm the PO and approval cycle before kickoff. Invoice at each milestone.",
  },
  "Sunrise Retail Co.": {
    velocityDays: [10, 15, 19],
    defaultProbability: 55,
    recommendation: "Payments are slipping. Move to net-15 terms and request a partial upfront payment.",
  },
  "Helix Health Tech": {
    velocityDays: [3, 11, 22],
    defaultProbability: 74,
    recommendation: "Require 50% advance milestone before accepting new work.",
  },
};

export function getRiskProfile(clientName) {
  return (
    RISK_PROFILES[clientName] || {
      velocityDays: [],
      defaultProbability: null,
      recommendation: "No payment history yet.",
    }
  );
}

export function velocityTrend(days) {
  if (!days || days.length === 0) return "No history";
  const first = days[0];
  const last = days[days.length - 1];
  if (last > first) return "Deteriorating";
  if (last < first) return "Improving";
  return "Stable";
}
