// IndexedDB persistence layer for CashPulse AI. Plain JavaScript, no external packages.

import {
  INITIAL_BANK_BALANCE,
  INITIAL_INVOICES,
  INITIAL_RECURRING_BILLS,
} from "../data/mockData.js";

const DB_NAME = "cashpulse-ai-db";
const DB_VERSION = 1;
const STORES = {
  invoices: { name: "invoices", keyPath: "id" },
  recurringBills: { name: "recurring_bills", keyPath: "id" },
  settings: { name: "settings", keyPath: "id" },
};
const SETTINGS_KEY = "app";

let dbPromise = null;

function openDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this browser"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        for (const { name, keyPath } of Object.values(STORES)) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath });
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(new Error(`Failed to open database "${DB_NAME}": ${request.error?.message ?? "unknown error"}`));
      };
      request.onblocked = () => {
        dbPromise = null;
        reject(new Error(`Opening database "${DB_NAME}" is blocked by another open connection`));
      };
    });
  }
  return dbPromise;
}

async function runRequest(storeName, mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = operation(tx.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(`Request failed on store "${storeName}"`));
  });
}

async function getAllSorted(storeName) {
  const records = await runRequest(storeName, "readonly", (store) => store.getAll());
  return records.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function assertId(record, message) {
  if (!record || typeof record.id !== "string" || record.id.trim() === "") {
    throw new Error(message);
  }
}

export async function getInvoices() {
  return getAllSorted(STORES.invoices.name);
}

export async function addInvoice(invoice) {
  assertId(invoice, "Invoice id is required");
  await runRequest(STORES.invoices.name, "readwrite", (store) => store.put(invoice));
  return invoice;
}

export async function updateInvoice(id, updates) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.invoices.name, "readwrite");
    const store = tx.objectStore(STORES.invoices.name);
    let merged = null;

    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (!existing) {
        reject(new Error("Invoice not found: " + id));
        tx.abort();
        return;
      }
      merged = { ...existing, ...updates, id };
      store.put(merged);
    };
    getRequest.onerror = () => reject(getRequest.error);

    tx.oncomplete = () => resolve(merged);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Invoice update was aborted"));
  });
}

export async function getBills() {
  return getAllSorted(STORES.recurringBills.name);
}

export async function addBill(bill) {
  assertId(bill, "Bill id is required");
  await runRequest(STORES.recurringBills.name, "readwrite", (store) => store.put(bill));
  return bill;
}

export async function getSettings() {
  const record = await runRequest(STORES.settings.name, "readonly", (store) => store.get(SETTINGS_KEY));
  return record ?? null;
}

export async function saveSettings(settings) {
  const record = { ...settings, id: SETTINGS_KEY };
  await runRequest(STORES.settings.name, "readwrite", (store) => store.put(record));
  return record;
}

export async function seedIfEmpty() {
  const db = await openDatabase();
  const storeNames = [STORES.invoices.name, STORES.recurringBills.name, STORES.settings.name];

  const counts = await new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, "readonly");
    const results = {};
    for (const name of storeNames) {
      const countRequest = tx.objectStore(name).count();
      countRequest.onsuccess = () => {
        results[name] = countRequest.result;
      };
    }
    tx.oncomplete = () => resolve(results);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Seed check was aborted"));
  });

  if (storeNames.some((name) => counts[name] !== 0)) {
    return { seeded: false };
  }

  await new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, "readwrite");
    const invoiceStore = tx.objectStore(STORES.invoices.name);
    const billStore = tx.objectStore(STORES.recurringBills.name);
    const settingsStore = tx.objectStore(STORES.settings.name);

    for (const invoice of INITIAL_INVOICES) invoiceStore.put(invoice);
    for (const bill of INITIAL_RECURRING_BILLS) billStore.put(bill);
    settingsStore.put({ id: SETTINGS_KEY, bankBalance: INITIAL_BANK_BALANCE });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Seeding was aborted"));
  });

  return { seeded: true };
}

export async function loadAppData() {
  await seedIfEmpty();
  const [invoices, recurringBills, settings] = await Promise.all([
    getInvoices(),
    getBills(),
    getSettings(),
  ]);
  return {
    invoices,
    recurringBills,
    bankBalance: settings ? settings.bankBalance : INITIAL_BANK_BALANCE,
  };
}
