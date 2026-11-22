import { describe, it, expect } from "vitest";
import {
  agingBucket,
  getAgingMatrix,
  outstandingReceivables,
  buildRunway,
} from "../src/utils/finance.js";
import { formatINR, formatDate, addDays, daysBetween } from "../src/utils/format.js";
import { validateInvoiceInput } from "../src/utils/validation.js";

describe("CashPulse Financial Engine - Unit Test Suite", () => {
  const TODAY = "2026-11-21";

  // Suite 1: Aging Matrix & Boundary Testing
  describe("1. Receivables Aging Matrix & Boundary Tests", () => {
    it("should classify paid invoices as 'paid'", () => {
      const inv = { status: "paid", dueDate: "2026-10-01", amount: 10000 };
      expect(agingBucket(inv, TODAY)).toBe("paid");
    });

    it("should classify future or on-time invoices as 'current'", () => {
      const invFuture = { status: "pending", dueDate: "2026-12-01", amount: 15000 };
      const invToday = { status: "pending", dueDate: TODAY, amount: 20000 };
      expect(agingBucket(invFuture, TODAY)).toBe("current");
      expect(agingBucket(invToday, TODAY)).toBe("current");
    });

    it("should classify 1-14 days overdue into '1-14' bucket", () => {
      const inv8Days = { status: "overdue", dueDate: "2026-11-13", amount: 35000 };
      const inv14Days = { status: "overdue", dueDate: "2026-11-07", amount: 25000 };
      expect(agingBucket(inv8Days, TODAY)).toBe("1-14");
      expect(agingBucket(inv14Days, TODAY)).toBe("1-14");
    });

    it("should classify 15-30 days overdue into '15-30' bucket", () => {
      const inv22Days = { status: "overdue", dueDate: "2026-10-30", amount: 65000 };
      const inv30Days = { status: "overdue", dueDate: "2026-10-22", amount: 10000 };
      expect(agingBucket(inv22Days, TODAY)).toBe("15-30");
      expect(agingBucket(inv30Days, TODAY)).toBe("15-30");
    });

    it("should classify >30 days overdue into '30+' critical bucket", () => {
      const inv45Days = { status: "overdue", dueDate: "2026-10-07", amount: 50000 };
      expect(agingBucket(inv45Days, TODAY)).toBe("30+");
    });

    it("should accurately sum outstanding unpaid receivables and exclude paid", () => {
      const testInvoices = [
        { id: "1", amount: 50000, status: "pending" },
        { id: "2", amount: 35000, status: "overdue" },
        { id: "3", amount: 20000, status: "paid" },
      ];
      expect(outstandingReceivables(testInvoices)).toBe(85000);
    });

    it("should group all invoices into 4 standard aging buckets", () => {
      const testInvoices = [
        { id: "1", amount: 25000, dueDate: "2026-12-01", status: "pending" }, // current
        { id: "2", amount: 35000, dueDate: "2026-11-13", status: "overdue" }, // 1-14
        { id: "3", amount: 65000, dueDate: "2026-10-30", status: "overdue" }, // 15-30
        { id: "4", amount: 10000, status: "paid" },                           // ignored
      ];
      const matrix = getAgingMatrix(testInvoices, TODAY);
      expect(matrix).toHaveLength(4);
      expect(matrix.find((b) => b.key === "current").total).toBe(25000);
      expect(matrix.find((b) => b.key === "1-14").total).toBe(35000);
      expect(matrix.find((b) => b.key === "15-30").total).toBe(65000);
      expect(matrix.find((b) => b.key === "30+").total).toBe(0);
    });
  });

  // Suite 2: 30-90 Day Runway Projection Math
  describe("2. Cash Runway Forecasting Engine", () => {
    const openingBalance = 74500;
    const recurringBills = [
      { id: "rb-1", title: "Rent", amount: 35000, dueDayOfMonth: 1 },
      { id: "rb-2", title: "Contractor", amount: 25000, dueDayOfMonth: 5 },
    ];
    const invoices = [
      { id: "inv-1", amount: 50000, dueDate: "2026-11-28", status: "pending" },
    ];

    it("should initialize Day 0 balance equal to starting balance", () => {
      const runway = buildRunway({
        balance: openingBalance,
        invoices,
        recurringBills,
        today: TODAY,
        horizonDays: 30,
        delayDays: 0,
      });

      expect(runway.series[0].balance).toBe(openingBalance);
      expect(runway.series[0].date).toBe(TODAY);
    });

    it("should apply inflows on expected collection date", () => {
      const runway = buildRunway({
        balance: openingBalance,
        invoices,
        recurringBills: [],
        today: TODAY,
        horizonDays: 30,
        delayDays: 0,
      });

      // Nov 28 is Day 7 from Nov 21
      const day7 = runway.series.find((p) => p.date === "2026-11-28");
      expect(day7.inflow).toBe(50000);
      expect(day7.balance).toBe(openingBalance + 50000);
    });

    it("should apply monthly recurring bills on dueDayOfMonth", () => {
      const runway = buildRunway({
        balance: openingBalance,
        invoices: [],
        recurringBills,
        today: TODAY,
        horizonDays: 30,
        delayDays: 0,
      });

      // Dec 01 Rent (₹35,000)
      const dec01 = runway.series.find((p) => p.date === "2026-12-01");
      expect(dec01.outflow).toBe(35000);

      // Dec 05 Contractor (₹25,000)
      const dec05 = runway.series.find((p) => p.date === "2026-12-05");
      expect(dec05.outflow).toBe(25000);
    });
  });

  // Suite 3: What-If Late Payment Stress-Tester
  describe("3. 'What-If' Late Payment Stress-Test & Liquidity Crunch Detector", () => {
    it("should shift invoice collection by delayDays", () => {
      const invoices = [
        { id: "inv-1", amount: 40000, dueDate: "2026-11-25", status: "pending" },
      ];
      // With 10 days delay, Nov 25 -> Dec 05
      const runway = buildRunway({
        balance: 50000,
        invoices,
        recurringBills: [],
        today: TODAY,
        horizonDays: 30,
        delayDays: 10,
      });

      const originalDay = runway.series.find((p) => p.date === "2026-11-25");
      expect(originalDay.inflow).toBe(0);

      const delayedDay = runway.series.find((p) => p.date === "2026-12-05");
      expect(delayedDay.inflow).toBe(40000);
    });

    it("should correctly detect negative balance date when payments are delayed past bill due dates", () => {
      // Starting with ₹20,000 balance
      // Rent of ₹35,000 due on Dec 01
      // Client owes ₹50,000 due Nov 28. If delayed by 15 days, it shifts to Dec 13.
      // On Dec 01: Balance = 20k - 35k = -15,000 deficit!
      const runway = buildRunway({
        balance: 20000,
        invoices: [{ id: "inv-1", amount: 50000, dueDate: "2026-11-28", status: "pending" }],
        recurringBills: [{ id: "rb-1", title: "Rent", amount: 35000, dueDayOfMonth: 1 }],
        today: TODAY,
        horizonDays: 30,
        delayDays: 15,
      });

      expect(runway.negativeOnDate).toBe("2026-12-01");
      expect(runway.minBalance).toBe(-15000);
    });
  });

  // Suite 4: Formatters & Date Utilities
  describe("4. Utilities & Formatters", () => {
    it("should format currency in standard Indian Rupees (INR)", () => {
      const formatted = formatINR(74500);
      expect(formatted).toContain("74,500");
    });

    it("should calculate exact days between two ISO dates", () => {
      expect(daysBetween("2026-11-21", "2026-11-28")).toBe(7);
      expect(daysBetween("2026-10-30", "2026-11-21")).toBe(22);
    });

    it("should add days to ISO date safely", () => {
      expect(addDays("2026-11-21", 10)).toBe("2026-12-01");
    });
  });
});

describe("invoice validation", () => {
  const AMOUNT_MSG = "Amount must be a positive number (minimum ₹1)";

  it("accepts a complete, valid invoice", () => {
    const result = validateInvoiceInput({
      clientName: "Northwind Labs",
      amount: 40000,
      dueDate: "2026-12-05",
    });
    expect(result.valid).toBe(true);
    expect(result.errors.clientName).toBeNull();
    expect(result.errors.amount).toBeNull();
    expect(result.errors.dueDate).toBeNull();
  });

  it("rejects an empty client name", () => {
    const result = validateInvoiceInput({ clientName: "", amount: 1000, dueDate: "2026-12-05" });
    expect(result.valid).toBe(false);
    expect(result.errors.clientName).toBe("Client name is required");
  });

  it("rejects a whitespace-only client name", () => {
    const result = validateInvoiceInput({ clientName: "   ", amount: 1000, dueDate: "2026-12-05" });
    expect(result.errors.clientName).toBe("Client name is required");
  });

  it("rejects an amount of zero", () => {
    const result = validateInvoiceInput({ clientName: "Acme", amount: 0, dueDate: "2026-12-05" });
    expect(result.errors.amount).toBe(AMOUNT_MSG);
  });

  it("rejects a negative amount", () => {
    const result = validateInvoiceInput({ clientName: "Acme", amount: -5, dueDate: "2026-12-05" });
    expect(result.errors.amount).toBe(AMOUNT_MSG);
  });

  it("rejects a missing amount", () => {
    const result = validateInvoiceInput({ clientName: "Acme", dueDate: "2026-12-05" });
    expect(result.errors.amount).toBe(AMOUNT_MSG);
  });

  it("rejects a NaN amount", () => {
    const result = validateInvoiceInput({ clientName: "Acme", amount: NaN, dueDate: "2026-12-05" });
    expect(result.errors.amount).toBe(AMOUNT_MSG);
  });

  it("rejects an amount below the ₹1 minimum", () => {
    const result = validateInvoiceInput({ clientName: "Acme", amount: 0.5, dueDate: "2026-12-05" });
    expect(result.errors.amount).toBe(AMOUNT_MSG);
  });

  it("rejects a missing due date", () => {
    const result = validateInvoiceInput({ clientName: "Acme", amount: 1000 });
    expect(result.errors.dueDate).toBe("Due date is required");
  });

  it("rejects an empty due date", () => {
    const result = validateInvoiceInput({ clientName: "Acme", amount: 1000, dueDate: "" });
    expect(result.errors.dueDate).toBe("Due date is required");
  });

  it("reports every invalid field at once", () => {
    const result = validateInvoiceInput({ clientName: "", amount: 0, dueDate: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.clientName).not.toBeNull();
    expect(result.errors.amount).not.toBeNull();
    expect(result.errors.dueDate).not.toBeNull();
  });
});
