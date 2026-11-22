import { useEffect, useState } from "react";
import {
  CheckCircle2,
  MessageSquareText,
  PlusCircle,
  Repeat,
  Sparkles,
} from "lucide-react";
import Card from "../components/common/Card.jsx";
import Badge from "../components/common/Badge.jsx";
import { useAppStore } from "../store/AppStore.jsx";
import { addDays, formatDate, formatINR } from "../utils/format.js";
import { BILL_CATEGORIES } from "../data/mockData.js";
import { parseWhatsAppChat, WHATSAPP_PRESETS } from "../utils/whatsappParser.js";

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
const LABEL_CLASS = "text-xs font-medium text-slate-700 dark:text-slate-300";
const BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition";
const SECTION_TITLE_CLASS =
  "flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={LABEL_CLASS}>{label}</span>
      {children}
    </label>
  );
}

function makeInvoiceForm(today) {
  return {
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    projectTitle: "",
    amount: "",
    dueDate: addDays(today, 14),
    reliabilityScore: "70",
  };
}

function makeBillForm() {
  return { title: "", category: BILL_CATEGORIES[0], amount: "", dueDayOfMonth: "1" };
}

export default function SmartIngest() {
  const { addInvoice, addRecurringBill, today } = useAppStore();

  const [invoiceForm, setInvoiceForm] = useState(() => makeInvoiceForm(today));
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceFlash, setInvoiceFlash] = useState(null);

  const [billForm, setBillForm] = useState(makeBillForm);
  const [billError, setBillError] = useState("");
  const [billFlash, setBillFlash] = useState(null);

  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [addedRows, setAddedRows] = useState({});

  useEffect(() => {
    if (!invoiceFlash) return undefined;
    const timer = setTimeout(() => setInvoiceFlash(null), 3000);
    return () => clearTimeout(timer);
  }, [invoiceFlash]);

  useEffect(() => {
    if (!billFlash) return undefined;
    const timer = setTimeout(() => setBillFlash(null), 3000);
    return () => clearTimeout(timer);
  }, [billFlash]);

  const setInvoiceField = (key) => (e) =>
    setInvoiceForm((f) => ({ ...f, [key]: e.target.value }));
  const setBillField = (key) => (e) =>
    setBillForm((f) => ({ ...f, [key]: e.target.value }));

  const handleInvoiceSubmit = (e) => {
    e.preventDefault();
    const amount = Number(invoiceForm.amount);
    if (!invoiceForm.clientName.trim() || !(amount > 0) || !invoiceForm.dueDate) {
      setInvoiceError("Client name, an amount above 0 and a due date are required.");
      return;
    }
    const score = Number(invoiceForm.reliabilityScore);
    addInvoice({
      clientName: invoiceForm.clientName.trim(),
      clientEmail: invoiceForm.clientEmail.trim(),
      clientPhone: invoiceForm.clientPhone.trim(),
      projectTitle: invoiceForm.projectTitle.trim(),
      dueDate: invoiceForm.dueDate,
      issueDate: today,
      status: "pending",
      daysOverdue: 0,
      amount,
      reliabilityScore: Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 70,
    });
    setInvoiceForm(makeInvoiceForm(today));
    setInvoiceError("");
    setInvoiceFlash({ text: "Invoice created" });
  };

  const handleBillSubmit = (e) => {
    e.preventDefault();
    const amount = Number(billForm.amount);
    const day = Number(billForm.dueDayOfMonth);
    if (!billForm.title.trim() || !(amount > 0) || !Number.isInteger(day) || day < 1 || day > 28) {
      setBillError("Title, an amount above 0 and a due day from 1 to 28 are required.");
      return;
    }
    addRecurringBill({
      title: billForm.title.trim(),
      category: billForm.category,
      amount,
      dueDayOfMonth: day,
    });
    setBillForm(makeBillForm());
    setBillError("");
    setBillFlash({ text: "Recurring bill added" });
  };

  const handlePreset = (preset) => {
    setRawText(preset.text);
    setParsed(null);
    setAddedRows({});
  };

  const handleParse = () => {
    setParsed(parseWhatsAppChat(rawText, today));
    setAddedRows({});
  };

  const handleAddParsed = (invoice, index) => {
    addInvoice(invoice);
    setAddedRows((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Smart Ingest
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Record receivables and recurring bills in seconds, or paste a WhatsApp chat and let the parser pull out payment promises.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Quick invoice */}
          <Card className="p-5 sm:p-6">
            <form noValidate onSubmit={handleInvoiceSubmit} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className={SECTION_TITLE_CLASS}>
                  <PlusCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Quick invoice
                </h2>
                {invoiceFlash ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {invoiceFlash.text}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Client name *">
                  <input
                    type="text"
                    required
                    value={invoiceForm.clientName}
                    onChange={setInvoiceField("clientName")}
                    placeholder="e.g., Acme Studios"
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Client email">
                  <input
                    type="email"
                    value={invoiceForm.clientEmail}
                    onChange={setInvoiceField("clientEmail")}
                    placeholder="accounts@client.in"
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Client phone">
                  <input
                    type="tel"
                    value={invoiceForm.clientPhone}
                    onChange={setInvoiceField("clientPhone")}
                    placeholder="+91 98xxx xxxxx"
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Project title">
                  <input
                    type="text"
                    value={invoiceForm.projectTitle}
                    onChange={setInvoiceField("projectTitle")}
                    placeholder="e.g., Mobile app UI sprint"
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Amount (INR) *">
                  <input
                    type="number"
                    required
                    min="1"
                    value={invoiceForm.amount}
                    onChange={setInvoiceField("amount")}
                    placeholder="e.g., 45000"
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Due date *">
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={setInvoiceField("dueDate")}
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Reliability score (0–100)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={invoiceForm.reliabilityScore}
                    onChange={setInvoiceField("reliabilityScore")}
                    className={INPUT_CLASS}
                  />
                </Field>
              </div>

              {invoiceError ? (
                <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {invoiceError}
                </p>
              ) : null}

              <button type="submit" className={BUTTON_CLASS}>
                Create invoice
              </button>
            </form>
          </Card>

          {/* Recurring bill */}
          <Card className="p-5 sm:p-6">
            <form noValidate onSubmit={handleBillSubmit} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className={SECTION_TITLE_CLASS}>
                  <Repeat className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Recurring bill
                </h2>
                {billFlash ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {billFlash.text}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Title *">
                  <input
                    type="text"
                    required
                    value={billForm.title}
                    onChange={setBillField("title")}
                    placeholder="e.g., Office rent"
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={billForm.category}
                    onChange={setBillField("category")}
                    className={INPUT_CLASS}
                  >
                    {BILL_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Amount (INR) *">
                  <input
                    type="number"
                    required
                    min="1"
                    value={billForm.amount}
                    onChange={setBillField("amount")}
                    placeholder="e.g., 6000"
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Due day of month (1–28) *">
                  <input
                    type="number"
                    required
                    min="1"
                    max="28"
                    value={billForm.dueDayOfMonth}
                    onChange={setBillField("dueDayOfMonth")}
                    className={INPUT_CLASS}
                  />
                </Field>
              </div>

              {billError ? (
                <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {billError}
                </p>
              ) : null}

              <button type="submit" className={BUTTON_CLASS}>
                Add recurring bill
              </button>
            </form>
          </Card>
        </div>

        {/* Smart WhatsApp parser */}
        <Card className="space-y-5 p-5 sm:p-6">
          <div>
            <h2 className={SECTION_TITLE_CLASS}>
              <MessageSquareText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Smart WhatsApp parser
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Paste a raw chat. The parser finds amounts paired with payment promises and dates.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className={LABEL_CLASS}>Demo presets</span>
            <div className="flex flex-wrap gap-2">
              {WHATSAPP_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-md mx-auto overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="bg-emerald-700 text-white px-4 py-2.5 rounded-t-xl flex items-center justify-between">
              <span className="text-sm font-semibold">WhatsApp • Client Agreement Chat</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                <span className="text-xs">online</span>
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 min-h-[12rem]">
              {rawText.trim() ? (
                <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white dark:bg-slate-800 px-3 py-2 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-100">{rawText}</p>
                  <p className="mt-1 text-right text-[10px] text-slate-400">✓✓ 11:42 AM</p>
                </div>
              ) : (
                <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white dark:bg-slate-800 px-3 py-2 shadow-sm">
                  <p className="text-sm italic text-slate-400 dark:text-slate-500">Paste a WhatsApp chat above to parse promises.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="[21/11/2026, 10:15] Priya (Sunrise Retail): The ₹35,000 will be cleared by Friday."
              className={`${INPUT_CLASS} mt-0 font-sans leading-relaxed`}
            />
            <button
              type="button"
              onClick={handleParse}
              disabled={!rawText.trim()}
              className={BUTTON_CLASS}
            >
              <Sparkles className="h-4 w-4" />
              Parse chat
            </button>
          </div>

          {parsed ? (
            <div className="space-y-3">
              {parsed.invoices.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No payment promises detected. Make sure the message names an amount (for example ₹35,000 or 35k) together with a payment cue such as a date or "by Friday".
                </p>
              ) : (
                parsed.invoices.map((invoice, index) => (
                  <div
                    key={`${index}-${invoice.rawMessage}`}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {invoice.clientName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Promised {formatDate(invoice.dueDate)}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-slate-400 dark:text-slate-500">
                        {invoice.rawMessage}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(invoice.amount)}
                      </span>
                      {addedRows[index] ? (
                        <Badge tone="emerald">Added</Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddParsed(invoice, index)}
                          className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                        >
                          Add to ledger
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {parsed.notes.length > 0 ? (
                <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {parsed.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
