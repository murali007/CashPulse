import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  INITIAL_BANK_BALANCE,
  INITIAL_INVOICES,
  INITIAL_RECURRING_BILLS,
  SIMULATED_TODAY,
  VERTICALS,
} from "../data/mockData.js";
import {
  getAgingMatrix,
  outstandingReceivables,
  buildRunway,
} from "../utils/finance.js";
import { SEED_USERS, ROLES } from "../data/users.js";
import {
  addBill as dbAddBill,
  addInvoice as dbAddInvoice,
  loadAppData,
  saveSettings as dbSaveSettings,
  updateInvoice as dbUpdateInvoice,
} from "../services/database.js";

const AppStoreContext = createContext(null);

const AUTH_USERS_KEY = "cashpulse-auth-users";
const AUTH_SESSION_KEY = "cashpulse-auth-session";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = Object.values(ROLES);
const SEED_EMAILS = new Set(SEED_USERS.map((u) => normalizeEmail(u.email)));

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function safeGetItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode / quota): ignore */
  }
}

function safeRemoveItem(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable: ignore */
  }
}

// Saved users are only the sign-ups made through the app (seeds are never saved).
function readSavedUsers() {
  try {
    const raw = safeGetItem(AUTH_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Seeds always present first; saved users appended; no duplicate emails.
// Demo only: passwords are stored in plain text in localStorage (not secure).
function buildRegisteredUsers(saved) {
  const result = SEED_USERS.map((u) => ({
    name: u.name,
    email: normalizeEmail(u.email),
    role: u.role,
    password: u.password,
  }));
  const seen = new Set(result.map((u) => u.email));
  for (const raw of saved) {
    if (!raw || typeof raw !== "object") continue;
    const email = normalizeEmail(raw.email);
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!EMAIL_RE.test(email) || !name || seen.has(email)) continue;
    seen.add(email);
    result.push({
      name,
      email,
      role: VALID_ROLES.includes(raw.role) ? raw.role : ROLES.ASSOCIATE,
      password: typeof raw.password === "string" ? raw.password : "",
    });
  }
  return result;
}

function readSession() {
  try {
    const raw = safeGetItem(AUTH_SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (
      parsed &&
      typeof parsed.email === "string" &&
      typeof parsed.name === "string" &&
      VALID_ROLES.includes(parsed.role)
    ) {
      return { name: parsed.name, email: parsed.email, role: parsed.role };
    }
  } catch {
    /* corrupt session: treat as signed out */
  }
  return null;
}

const initialState = {
  bankBalance: INITIAL_BANK_BALANCE,
  invoices: INITIAL_INVOICES,
  recurringBills: INITIAL_RECURRING_BILLS,
  activeTab: "dashboard",
  delayDays: 0,
  today: SIMULATED_TODAY,
  currentUser: readSession(),
  users: buildRegisteredUsers(readSavedUsers()),
  authError: null,
  isReady: false,
  dbError: null,
  currentVertical: "studio",
  studioSnapshot: null,
  currency: "INR",
  privacyMode: false,
};

const VALID_CURRENCIES = ["INR", "USD", "EUR"];

// Remaining 15% reserve of a factored invoice (released on client payment).
function factoredReserve(inv) {
  return Math.round(inv.amount) - (inv.factoredPayout ?? Math.round(inv.amount * 0.85));
}

// Balance increase when an invoice is marked paid: reserve only if factored.
function paidIncrease(inv) {
  return inv.factored === true ? factoredReserve(inv) : inv.amount;
}

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
    case "HYDRATE": {
      const { invoices, recurringBills, bankBalance, dbError } = action.payload;
      return {
        ...state,
        invoices,
        recurringBills,
        bankBalance,
        dbError: dbError ?? null,
        isReady: true,
      };
    }

    case "ADD_INVOICE":
      // Record is built and persisted by the addInvoice action creator.
      return { ...state, invoices: [...state.invoices, action.payload] };

    case "MARK_INVOICE_PAID": {
      const target = state.invoices.find((inv) => inv.id === action.payload);
      if (!target) return state;
      const wasPaid = target.status === "paid";
      return {
        ...state,
        bankBalance: wasPaid ? state.bankBalance : state.bankBalance + paidIncrease(target),
        invoices: state.invoices.map((inv) =>
          inv.id === action.payload
            ? { ...inv, status: "paid", daysOverdue: 0 }
            : inv
        ),
      };
    }

    case "FACTOR_INVOICE": {
      const { id, payout } = action.payload;
      const target = state.invoices.find((inv) => inv.id === id);
      if (!target || target.factored === true || target.status === "paid") return state;
      return {
        ...state,
        bankBalance: state.bankBalance + payout,
        invoices: state.invoices.map((inv) =>
          inv.id === id ? { ...inv, factored: true, factoredPayout: payout } : inv
        ),
      };
    }

    case "ADD_RECURRING_BILL":
      // Record is built and persisted by the addRecurringBill action creator.
      return {
        ...state,
        recurringBills: [...state.recurringBills, action.payload],
      };

    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };

    case "SET_DELAY_DAYS": {
      const num = Number(action.payload);
      const safe = Number.isFinite(num) ? Math.round(num) : 0;
      return { ...state, delayDays: Math.min(60, Math.max(0, safe)) };
    }

    case "SET_CURRENCY":
      if (!VALID_CURRENCIES.includes(action.payload)) return state;
      return { ...state, currency: action.payload };

    case "TOGGLE_PRIVACY_MODE":
      return { ...state, privacyMode: !state.privacyMode };

    case "SIGN_IN": {
      const email = normalizeEmail(action.payload?.email);
      const password = String(action.payload?.password ?? "");
      const user = state.users.find((u) => u.email === email);
      // Unknown email and wrong password share one message (no account enumeration).
      if (!user || !user.password || user.password !== password) {
        return { ...state, authError: "Invalid email or password." };
      }
      return {
        ...state,
        currentUser: { name: user.name, email: user.email, role: user.role },
        authError: null,
      };
    }

    case "SIGN_UP": {
      const name = String(action.payload?.name ?? "").trim();
      const email = normalizeEmail(action.payload?.email);
      if (!name) {
        return { ...state, authError: "Please enter your name." };
      }
      if (!EMAIL_RE.test(email)) {
        return { ...state, authError: "Please enter a valid email address." };
      }
      const password = String(action.payload?.password ?? "");
      if (password.length < 6) {
        return {
          ...state,
          authError: "Password must be at least 6 characters.",
        };
      }
      if (state.users.some((u) => u.email === email)) {
        return {
          ...state,
          authError: "An account with that email already exists.",
        };
      }
      // Public sign-up can never create an admin.
      const user = { name, email, role: ROLES.ASSOCIATE, password };
      return {
        ...state,
        users: [...state.users, user],
        currentUser: { name, email, role: ROLES.ASSOCIATE },
        authError: null,
      };
    }

    case "SIGN_OUT":
      return { ...state, currentUser: null };

    case "CLEAR_AUTH_ERROR":
      return { ...state, authError: null };

    case "SWITCH_VERTICAL": {
      const id = action.payload;
      if (!Object.prototype.hasOwnProperty.call(VERTICALS, id) || id === state.currentVertical) {
        return state;
      }
      // Remember the studio ledger before leaving it.
      const studioSnapshot =
        state.currentVertical === "studio"
          ? {
              bankBalance: state.bankBalance,
              invoices: state.invoices,
              recurringBills: state.recurringBills,
            }
          : state.studioSnapshot;
      const source = id === "studio" && studioSnapshot ? studioSnapshot : VERTICALS[id];
      return {
        ...state,
        studioSnapshot,
        currentVertical: id,
        bankBalance: source.bankBalance,
        invoices: source.invoices,
        recurringBills: source.recurringBills,
      };
    }

    default:
      return state;
  }
}

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(appStoreReducer, initialState);

  // Latest state for action creators, so they never read a stale closure.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Apply an action to the ref immediately (same pure reducer) so that
  // back-to-back calls see each other's results before React re-renders.
  const commit = useCallback(
    (action) => {
      stateRef.current = appStoreReducer(stateRef.current, action);
      dispatch(action);
    },
    [dispatch]
  );

  // Hydrate from IndexedDB on mount; fall back to mock data on failure.
  useEffect(() => {
    let cancelled = false;
    loadAppData().then(
      (data) => {
        if (cancelled) return;
        dispatch({
          type: "HYDRATE",
          payload: {
            invoices: data.invoices,
            recurringBills: data.recurringBills,
            bankBalance: data.bankBalance,
          },
        });
      },
      (error) => {
        console.error("Failed to load app data from IndexedDB:", error);
        if (cancelled) return;
        dispatch({
          type: "HYDRATE",
          payload: {
            invoices: INITIAL_INVOICES,
            recurringBills: INITIAL_RECURRING_BILLS,
            bankBalance: INITIAL_BANK_BALANCE,
            dbError: error?.message ?? String(error),
          },
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist first, then update memory.
  const addInvoice = useCallback(
    async (invoice) => {
      const record = {
        reliabilityScore: 70,
        ...invoice,
        id: nextInvoiceId(stateRef.current.invoices),
        status: "pending",
        daysOverdue: 0,
      };
      // Database holds only the studio ledger; other verticals stay in memory.
      if (stateRef.current.currentVertical === "studio") await dbAddInvoice(record);
      commit({ type: "ADD_INVOICE", payload: record });
      return record;
    },
    [commit]
  );

  const markInvoicePaid = useCallback(
    async (id) => {
      const current = stateRef.current;
      const target = current.invoices.find((inv) => inv.id === id);
      if (!target || target.status === "paid") return;
      // Database holds only the studio ledger; other verticals stay in memory.
      if (current.currentVertical === "studio") {
        const updates = { status: "paid", daysOverdue: 0 };
        await dbUpdateInvoice(id, updates);
        await dbSaveSettings({ bankBalance: current.bankBalance + paidIncrease(target) });
      }
      commit({ type: "MARK_INVOICE_PAID", payload: id });
    },
    [commit]
  );

  const factorInvoice = useCallback(
    async (id) => {
      const current = stateRef.current;
      const target = current.invoices.find((inv) => inv.id === id);
      if (!target || target.factored === true || target.status === "paid") return;
      const payout = Math.round(target.amount * 0.85);
      // Database holds only the studio ledger; other verticals stay in memory.
      if (current.currentVertical === "studio") {
        await dbUpdateInvoice(id, { factored: true, factoredPayout: payout });
        await dbSaveSettings({ bankBalance: current.bankBalance + payout });
      }
      commit({ type: "FACTOR_INVOICE", payload: { id, payout } });
    },
    [commit]
  );

  const addRecurringBill = useCallback(
    async (bill) => {
      const record = {
        ...bill,
        id: "rb-" + (stateRef.current.recurringBills.length + 1),
      };
      // Database holds only the studio ledger; other verticals stay in memory.
      if (stateRef.current.currentVertical === "studio") await dbAddBill(record);
      commit({ type: "ADD_RECURRING_BILL", payload: record });
      return record;
    },
    [commit]
  );
  const setActiveTab = useCallback(
    (tab) => dispatch({ type: "SET_ACTIVE_TAB", payload: tab }),
    [dispatch]
  );
  const setDelayDays = useCallback(
    (days) => dispatch({ type: "SET_DELAY_DAYS", payload: days }),
    [dispatch]
  );
  const setCurrency = useCallback(
    (curr) => dispatch({ type: "SET_CURRENCY", payload: curr }),
    [dispatch]
  );
  const togglePrivacyMode = useCallback(
    () => dispatch({ type: "TOGGLE_PRIVACY_MODE" }),
    [dispatch]
  );
  const signIn = useCallback(
    (email, password) =>
      dispatch({ type: "SIGN_IN", payload: { email, password } }),
    [dispatch]
  );
  const signUp = useCallback(
    (fields) => dispatch({ type: "SIGN_UP", payload: fields }),
    [dispatch]
  );
  const signOut = useCallback(() => dispatch({ type: "SIGN_OUT" }), [dispatch]);
  const clearAuthError = useCallback(
    () => dispatch({ type: "CLEAR_AUTH_ERROR" }),
    [dispatch]
  );
  const switchVertical = useCallback(
    (id) => commit({ type: "SWITCH_VERTICAL", payload: id }),
    [commit]
  );

  const {
    bankBalance,
    invoices,
    recurringBills,
    today,
    delayDays,
    activeTab,
    currentUser,
    users,
    authError,
    isReady,
    dbError,
    currentVertical,
    currency,
    privacyMode,
  } = state;

  const isAdmin = currentUser?.role === ROLES.ADMIN;

  // Persist session: write on change, remove when signed out.
  useEffect(() => {
    if (currentUser) {
      safeSetItem(AUTH_SESSION_KEY, JSON.stringify(currentUser));
    } else {
      safeRemoveItem(AUTH_SESSION_KEY);
    }
  }, [currentUser]);

  // Persist registered list (sign-ups only; seeds are always re-merged on load).
  useEffect(() => {
    const saved = users.filter((u) => !SEED_EMAILS.has(u.email));
    safeSetItem(AUTH_USERS_KEY, JSON.stringify(saved));
  }, [users]);

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
      factorInvoice,
      addRecurringBill,
      setActiveTab,
      setDelayDays,
      currency,
      setCurrency,
      privacyMode,
      togglePrivacyMode,
      currentVertical,
      switchVertical,
      currentUser,
      users,
      authError,
      isAdmin,
      signIn,
      signUp,
      signOut,
      clearAuthError,
      isReady,
      dbError,
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
      factorInvoice,
      addRecurringBill,
      setActiveTab,
      setDelayDays,
      currency,
      setCurrency,
      privacyMode,
      togglePrivacyMode,
      currentVertical,
      switchVertical,
      currentUser,
      users,
      authError,
      isAdmin,
      signIn,
      signUp,
      signOut,
      clearAuthError,
      isReady,
      dbError,
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
