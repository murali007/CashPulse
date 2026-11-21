import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import {
  INITIAL_BANK_BALANCE,
  INITIAL_INVOICES,
  INITIAL_RECURRING_BILLS,
  SIMULATED_TODAY,
} from "../data/mockData.js";
import {
  getAgingMatrix,
  outstandingReceivables,
  buildRunway,
} from "../utils/finance.js";

const AppStoreContext = createContext(null);

const initialState = {
  bankBalance: INITIAL_BANK_BALANCE,
  invoices: INITIAL_INVOICES,
  recurringBills: INITIAL_RECURRING_BILLS,
  activeTab: "dashboard",
  delayDays: 0,
  today: SIMULATED_TODAY,
};

function nextInvoiceId(invoices) {
  const max = invoices.reduce((acc, inv) => {
    const match = /(\d+)$/.exec(String(inv.id ?? ""));
    const n = match ? parseInt(match[1], 10) : 0;
    return n > acc ? n : acc;
  }, 0);
  return "INV-" + (max + 1);
}

function appStoreReducer(state, action) {
  switch (action.type) {
    case "ADD_INVOICE": {
      const fields = action.payload;
      const invoice = {
        reliabilityScore: 70,
        ...fields,
        id: nextInvoiceId(state.invoices),
        status: "pending",
        daysOverdue: 0,
      };
      return { ...state, invoices: [...state.invoices, invoice] };
    }

    case "MARK_INVOICE_PAID": {
      const target = state.invoices.find((inv) => inv.id === action.payload);
      if (!target) return state;
      const wasPaid = target.status === "paid";
      return {
        ...state,
        bankBalance: wasPaid ? state.bankBalance : state.bankBalance + target.amount,
        invoices: state.invoices.map((inv) =>
          inv.id === action.payload
            ? { ...inv, status: "paid", daysOverdue: 0 }
            : inv
        ),
      };
    }

    case "ADD_RECURRING_BILL": {
      const bill = {
        ...action.payload,
        id: "rb-" + (state.recurringBills.length + 1),
      };
      return { ...state, recurringBills: [...state.recurringBills, bill] };
    }

    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };

    case "SET_DELAY_DAYS": {
      const num = Number(action.payload);
      const safe = Number.isFinite(num) ? Math.round(num) : 0;
      return { ...state, delayDays: Math.min(60, Math.max(0, safe)) };
    }

    default:
      return state;
  }
}

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(appStoreReducer, initialState);

  const addInvoice = useCallback(
    (invoice) => dispatch({ type: "ADD_INVOICE", payload: invoice }),
    [dispatch]
  );
  const markInvoicePaid = useCallback(
    (id) => dispatch({ type: "MARK_INVOICE_PAID", payload: id }),
    [dispatch]
  );
  const addRecurringBill = useCallback(
    (bill) => dispatch({ type: "ADD_RECURRING_BILL", payload: bill }),
    [dispatch]
  );
  const setActiveTab = useCallback(
    (tab) => dispatch({ type: "SET_ACTIVE_TAB", payload: tab }),
    [dispatch]
  );
  const setDelayDays = useCallback(
    (days) => dispatch({ type: "SET_DELAY_DAYS", payload: days }),
    [dispatch]
  );

  const { bankBalance, invoices, recurringBills, today, delayDays, activeTab } =
    state;

  const outstanding = useMemo(
    () => outstandingReceivables(invoices),
    [invoices]
  );

  const agingMatrix = useMemo(
    () => getAgingMatrix(invoices, today),
    [invoices, today]
  );

  const getRunway = useCallback(
    (horizonDays) =>
      buildRunway({
        balance: bankBalance,
        invoices,
        recurringBills,
        today,
        horizonDays,
        delayDays,
      }),
    [bankBalance, invoices, recurringBills, today, delayDays]
  );

  const value = useMemo(
    () => ({
      bankBalance,
      invoices,
      recurringBills,
      activeTab,
      delayDays,
      today,
      outstanding,
      agingMatrix,
      getRunway,
      addInvoice,
      markInvoicePaid,
      addRecurringBill,
      setActiveTab,
      setDelayDays,
    }),
    [
      bankBalance,
      invoices,
      recurringBills,
      activeTab,
      delayDays,
      today,
      outstanding,
      agingMatrix,
      getRunway,
      addInvoice,
      markInvoicePaid,
      addRecurringBill,
      setActiveTab,
      setDelayDays,
    ]
  );

  return (
    <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error("useAppStore must be used inside AppStoreProvider");
  }
  return ctx;
}
