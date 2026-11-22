import { useRef, useState } from "react";
import { X, Send } from "lucide-react";

const QA_ITEMS = [
  {
    id: "what-is",
    question: "What is CashPulse AI?",
    answer:
      "CashPulse AI is an autonomous working-capital copilot for solo studios and freelancers. It shows your live cash, which invoices are overdue, and whether payroll-style bills will be covered in the next 30 to 90 days.",
  },
  {
    id: "what-if",
    question: "How does the What-If simulator work?",
    answer:
      "The What-If slider on the Cash Runway tab pushes every unpaid invoice's collection date back by the number of days you choose. Recurring bills stay on their schedule, so the balance curve shifts and you can see the day cash would go negative before it happens.",
  },
  {
    id: "whatsapp",
    question: "What is the WhatsApp Smart Parser?",
    answer:
      "In Smart Ingest, paste a raw WhatsApp chat. The parser finds money amounts tied to a payment promise, reads dates like 'Friday', 'tomorrow' or '5 Dec', and turns each promise into a pending invoice you can add to the ledger with one click.",
  },
  {
    id: "roles",
    question: "What are the User Roles?",
    answer:
      "Admins (founders) see bank balance, receivables totals, and the Cash Runway & Stress-Test tab. Associates (team members) see project tasks, receivables for their work, and Smart Ingest to submit invoices, but not the bank balance or runway.",
  },
];

const GREETING = "Hi, I'm your Copilot. Pick a question or type your own.";
const FALLBACK =
  "I can answer questions about CashPulse AI, the What-If simulator, the WhatsApp parser, and user roles. Try one of the quick questions above.";

function findAnswer(text) {
  const t = text.trim().toLowerCase();
  if (t.includes("what is cashpulse")) return QA_ITEMS[0].answer;
  if (t.includes("what-if") || t.includes("whatif") || t.includes("slider")) return QA_ITEMS[1].answer;
  if (t.includes("whatsapp") || t.includes("parser")) return QA_ITEMS[2].answer;
  if (t.includes("role")) return QA_ITEMS[3].answer;
  return FALLBACK;
}

export default function CopilotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ id: "greeting", role: "bot", text: GREETING }]);
  const bottomRef = useRef(null);

  function push(role, text) {
    setMessages((prev) => [...prev, { id: `${role}-${Date.now()}-${Math.random()}`, role, text }]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ block: "end" }), 0);
  }

  function askChip(item) {
    push("user", item.question);
    push("bot", item.answer);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    push("user", input.trim());
    push("bot", findAnswer(input));
    setInput("");
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-[min(22rem,calc(100vw-3rem))] flex-col luxury-card shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Copilot Tour Guide</span>
            <button
              type="button"
              aria-label="Close copilot"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) =>
              m.role === "bot" ? (
                <div
                  key={m.id}
                  className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                >
                  {m.text}
                </div>
              ) : (
                <div
                  key={m.id}
                  className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#ff6900] px-3 py-2 text-sm text-white"
                >
                  {m.text}
                </div>
              )
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 pt-3 dark:border-slate-800">
            {QA_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => askChip(item)}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {item.question}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff6900] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <button
              type="submit"
              aria-label="Send"
              className="rounded-lg bg-[#ff6900] p-2 text-white hover:bg-[#e05d00]"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        aria-label="Ask Copilot / Tour Guide"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6900] to-[#e05d00] text-2xl text-white shadow-lg hover:from-[#e05d00] hover:to-[#c24f00]"
      >
        💡
      </button>
    </>
  );
}
