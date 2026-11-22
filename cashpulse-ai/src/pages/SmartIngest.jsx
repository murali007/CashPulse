import { useEffect, useState } from "react";
import {
  CheckCircle2,
  MessageSquareText,
  Mic,
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
import { sanitizeInput, validateInvoiceInput } from "../utils/validation.js";

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#ff6900] focus:outline-none focus:ring-1 focus:ring-[#ff6900] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
const INPUT_ERROR_CLASS =
  "mt-1 w-full rounded-xl border border-red-500 bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#ff6900] focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-red-500 dark:bg-slate-950 dark:text-slate-100";
const LABEL_CLASS = "text-xs font-medium text-slate-700 dark:text-slate-300";
const EMPTY_TEXT_MESSAGE = "Please enter or paste text to analyze";
const NO_PROMISE_HINT =
  "No payment promises found. Include an amount and a date, for example: 'pay 25k by Friday'.";
const BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-xl bg-[#ff6900] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#e05d00] disabled:opacity-50 transition";
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

const MODE_TABS = [
  { id: "forms", label: "🧾 Invoices & Bills" },
  { id: "text", label: "💬 WhatsApp Text Parser" },
  { id: "voice", label: "🎙️ WhatsApp Voice Note (Audio Ingest)" },
];

const VOICE_WAVE_HEIGHTS = [8, 14, 10, 20, 16, 26, 12, 18, 24, 9, 15, 22, 28, 11, 17, 21, 7, 13, 25, 19, 10, 16, 23, 12, 18, 27, 14, 9];

const VOICE_PRESETS = [
  {
    id: "hinglish",
    label: "Preset 1 (Hinglish)",
    transcript:
      "Ravi bhai, 25k GPay transfer kar diya hai. Balance 45,000 next Friday Dec 5 staging review ke baad release kar dunga.",
    extracted: {
      clientName: "Apex Retail Co.",
      milestone: "Staging review",
      amount: 45000,
      dueDate: "2026-12-05",
    },
  },
  {
    id: "corporate",
    label: "Preset 2 (Corporate)",
    transcript:
      "Hi Ravi, finance team approved the 60,000 INR dashboard invoice. Wire transfer scheduled by 28th Nov.",
    extracted: {
      clientName: "Apex Retail Co.",
      milestone: "Dashboard invoice",
      amount: 60000,
      dueDate: "2026-11-28",
    },
  },
];

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

  const [mode, setMode] = useState("forms");
  const [voicePreset, setVoicePreset] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealCount, setRevealCount] = useState(0);
  const [voiceIngested, setVoiceIngested] = useState(false);
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [invoiceErrors, setInvoiceErrors] = useState(null);
  const [parseHint, setParseHint] = useState("");
  const [toast, setToast] = useState(null);

  // Reveals the transcript one character at a time while playing. The timer is
  // cleared on pause, on preset change and on unmount.
  useEffect(() => {
    if (!isPlaying || !voicePreset) return undefined;
    if (revealCount >= voicePreset.transcript.length) {
      setIsPlaying(false);
      return undefined;
    }
    const timer = setTimeout(() => setRevealCount((c) => c + 1), 25);
    return () => clearTimeout(timer);
  }, [isPlaying, revealCount, voicePreset]);

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

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const setInvoiceField = (key) => (e) =>
    setInvoiceForm((f) => ({ ...f, [key]: e.target.value }));
  const setBillField = (key) => (e) =>
    setBillForm((f) => ({ ...f, [key]: e.target.value }));

  const handleInvoiceSubmit = (e) => {
    e.preventDefault();
    const clientName = sanitizeInput(invoiceForm.clientName);
    const projectTitle = sanitizeInput(invoiceForm.projectTitle);
    const check = validateInvoiceInput({
      clientName,
      amount: invoiceForm.amount,
      dueDate: invoiceForm.dueDate,
    });
    if (!check.valid) {
      setInvoiceErrors(check.errors);
      return;
    }
    setInvoiceErrors(null);
    const amount = Number(invoiceForm.amount);
    if (!clientName || !(amount > 0) || !invoiceForm.dueDate) {
      setInvoiceError("Client name, an amount above 0 and a due date are required.");
      return;
    }
    const score = Number(invoiceForm.reliabilityScore);
    addInvoice({
      clientName,
      clientEmail: invoiceForm.clientEmail.trim(),
      clientPhone: invoiceForm.clientPhone.trim(),
      projectTitle,
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
    setParseHint("");
    setParsed(null);
    setAddedRows({});
  };

  const handleParse = () => {
    if (!rawText.trim()) {
      setToast({ text: EMPTY_TEXT_MESSAGE });
      return;
    }
    const result = parseWhatsAppChat(rawText, today);
    setParseHint(result.invoices.length === 0 ? NO_PROMISE_HINT : "");
    setParsed(result);
    setAddedRows({});
  };

  const handleAddParsed = (invoice, index) => {
    addInvoice(invoice);
    setAddedRows((prev) => ({ ...prev, [index]: true }));
  };

  const transcriptDone = Boolean(voicePreset) && revealCount >= voicePreset.transcript.length;

  const handleVoicePreset = (preset) => {
    setVoicePreset(preset);
    setRevealCount(0);
    setIsPlaying(false);
    setVoiceIngested(false);
    setVoiceError("");
  };

  const togglePlayback = () => {
    if (!voicePreset) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (transcriptDone) setRevealCount(0);
    setIsPlaying(true);
  };

  const handleConfirmVoice = async () => {
    if (!voicePreset || !transcriptDone || voiceIngested || voiceSaving) return;
    setVoiceSaving(true);
    setVoiceError("");
    try {
      await addInvoice({
        id: "VN-" + Date.now(),
        clientName: voicePreset.extracted.clientName,
        clientEmail: "accounts@apexretail.example",
        clientPhone: "+919800000000",
        projectTitle: voicePreset.extracted.milestone,
        amount: voicePreset.extracted.amount,
        issueDate: today,
        dueDate: voicePreset.extracted.dueDate,
        status: "pending",
        daysOverdue: 0,
        reliabilityScore: 62,
      });
      setVoiceIngested(true);
    } catch (error) {
      setVoiceError(error?.message ?? "Could not add the voice invoice.");
    } finally {
      setVoiceSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {toast ? (
        <div
          role="status"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-amber-500 text-white px-4 py-2 text-sm font-semibold shadow-lg pointer-events-none"
        >
          {toast.text}
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Smart Ingest
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Record receivables and recurring bills in seconds, or paste a WhatsApp chat and let the parser pull out payment promises.
        </p>
      </div>

      <div role="tablist" aria-label="Smart Ingest mode" className="flex flex-wrap gap-2">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => setMode(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              mode === tab.id
                ? "bg-[#ff6900] hover:bg-[#e05d00] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {mode === "forms" ? (
        <div className="space-y-6">
          {/* Quick invoice */}
          <Card className="luxury-card p-5 sm:p-6">
            <form noValidate onSubmit={handleInvoiceSubmit} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className={SECTION_TITLE_CLASS}>
                  <PlusCircle className="h-5 w-5 text-[#ff6900] dark:text-orange-400" />
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
                    aria-invalid={invoiceErrors?.clientName ? true : undefined}
                    value={invoiceForm.clientName}
                    onChange={setInvoiceField("clientName")}
                    placeholder="e.g., Acme Studios"
                    className={invoiceErrors?.clientName ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  />
                  {invoiceErrors?.clientName ? (
                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                      {invoiceErrors.clientName}
                    </p>
                  ) : null}
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
                    aria-invalid={invoiceErrors?.amount ? true : undefined}
                    value={invoiceForm.amount}
                    onChange={setInvoiceField("amount")}
                    placeholder="e.g., 45000"
                    className={invoiceErrors?.amount ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  />
                  {invoiceErrors?.amount ? (
                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                      {invoiceErrors.amount}
                    </p>
                  ) : null}
                </Field>
                <Field label="Due date *">
                  <input
                    type="date"
                    required
                    aria-invalid={invoiceErrors?.dueDate ? true : undefined}
                    value={invoiceForm.dueDate}
                    onChange={setInvoiceField("dueDate")}
                    className={invoiceErrors?.dueDate ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  />
                  {invoiceErrors?.dueDate ? (
                    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                      {invoiceErrors.dueDate}
                    </p>
                  ) : null}
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
          <Card className="luxury-card p-5 sm:p-6">
            <form noValidate onSubmit={handleBillSubmit} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className={SECTION_TITLE_CLASS}>
                  <Repeat className="h-5 w-5 text-[#ff6900] dark:text-orange-400" />
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
        ) : null}

        {/* Smart WhatsApp parser */}
        {mode === "text" ? (
        <Card className="luxury-card space-y-5 p-5 sm:p-6">
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
              onChange={(e) => {
                setRawText(e.target.value);
                setParseHint("");
              }}
              placeholder="[21/11/2026, 10:15] Priya (Sunrise Retail): The ₹35,000 will be cleared by Friday."
              className={`${INPUT_CLASS} mt-0 font-sans leading-relaxed`}
            />
            <button
              type="button"
              onClick={handleParse}
              className={BUTTON_CLASS}
            >
              <Sparkles className="h-4 w-4" />
              Parse chat
            </button>
            {parseHint ? <p className="text-xs text-amber-700">{parseHint}</p> : null}
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
        ) : null}
      </div>

      {mode === "voice" ? (
        <Card className="luxury-card space-y-5 p-5 sm:p-6">
          <div>
            <h2 className={SECTION_TITLE_CLASS}>
              <Mic className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              WhatsApp voice note ingestion
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Simulated voice note. Pick a demo preset, play it to stream the transcript, then review the extracted invoice.
            </p>
          </div>

          <div className="max-w-md mx-auto overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="bg-emerald-700 text-white px-4 py-2.5 rounded-t-xl flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white">
                <Mic className="h-4 w-4 text-emerald-600" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Ramesh - Apex Retail Co.</p>
                <p className="text-[11px] text-emerald-100">Voice Note • 0:14</p>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
              <div className="max-w-md rounded-lg rounded-tl-none bg-white dark:bg-slate-800 px-3 py-2.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
                    onClick={togglePlayback}
                    disabled={!voicePreset}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {isPlaying ? "❚❚" : "▶"}
                  </button>
                  <div className="flex h-8 flex-1 items-center gap-[3px]">
                    {VOICE_WAVE_HEIGHTS.map((height, index) => (
                      <span
                        key={index}
                        className={`w-1 rounded-full bg-emerald-500 dark:bg-emerald-400 ${isPlaying ? "animate-pulse" : ""}`}
                        style={{ height: `${height}px`, animationDelay: `${index * 70}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">0:14</span>
                  <span className="rounded-full border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-600 dark:border-slate-600 dark:text-slate-300">
                    1.5x
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className={LABEL_CLASS}>Demo presets</span>
            <div className="flex flex-wrap gap-2">
              {VOICE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleVoicePreset(preset)}
                  aria-pressed={voicePreset?.id === preset.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={togglePlayback}
            disabled={!voicePreset}
            className={BUTTON_CLASS}
          >
            {isPlaying ? "❚❚ Pause" : "▶ Play & Transcribe Audio"}
          </button>

          {voicePreset && revealCount > 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <p className="text-sm text-slate-800 dark:text-slate-100">
                <span className="font-semibold">🎙️ Transcribing Audio Stream: </span>
                {voicePreset.transcript.slice(0, revealCount)}
              </p>
            </div>
          ) : null}

          {transcriptDone ? (
            <div className="space-y-3">
              <div className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Extracted invoice</p>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-slate-500 dark:text-slate-400">Client</dt>
                  <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                    {voicePreset.extracted.clientName}
                  </dd>
                  <dt className="text-slate-500 dark:text-slate-400">Project milestone</dt>
                  <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                    {voicePreset.extracted.milestone}
                  </dd>
                  <dt className="text-slate-500 dark:text-slate-400">Amount</dt>
                  <dd className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatINR(voicePreset.extracted.amount)}
                  </dd>
                  <dt className="text-slate-500 dark:text-slate-400">Due date</dt>
                  <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(voicePreset.extracted.dueDate)}
                  </dd>
                </dl>
                <p className="text-[11px] italic text-amber-600 dark:text-amber-400">
                  Simulated parse — review before ingesting
                </p>
              </div>

              <button
                type="button"
                onClick={handleConfirmVoice}
                disabled={voiceIngested || voiceSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
              >
                Confirm & Ingest Voice Invoice
              </button>
              {voiceIngested ? (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Voice invoice added to the ledger.
                </p>
              ) : null}
              {voiceError ? (
                <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {voiceError}
                </p>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
