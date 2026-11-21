// Heuristic WhatsApp chat parser. Plain JavaScript, no React, no external calls.
import { addDays, daysBetween } from "./format.js";

const TIMESTAMP_RE = /^\s*\[?\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\]?\s*(?:[-–]\s*)?/;
const SENDER_RE = /^([^:\d]{1,60}):\s*(.*)$/;
// Currency-marked amounts (₹35,000 / Rs 35000 / INR 35,000 / ₹65k) or bare "35k".
const AMOUNT_RE = /(?:(?:₹|\brs\.?|\binr)\s*(\d[\d,]*(?:\.\d+)?)(k)?\b|\b(\d+(?:\.\d+)?)(k)\b)/i;
const PROMISE_CUE_RE =
  /\b(?:pay\w*|transfer\w*|send\w*|clear\w*|by|on|tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i;
const DAY_MONTH_RE = /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i;
const SLASH_DATE_RE = /\b(\d{1,2})\/(\d{1,2})\b/;
const WEEKDAY_RE = /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i;
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function parseAmount(text) {
  const m = AMOUNT_RE.exec(text);
  if (!m) return null;
  const number = parseFloat((m[1] ?? m[3]).replace(/,/g, ""));
  const isThousands = Boolean(m[2] ?? m[4]);
  const value = Math.round(isThousands ? number * 1000 : number);
  return value > 0 ? value : null;
}

// Returns an ISO date for a valid calendar date, otherwise null.
function isoFromParts(year, month, day) {
  if (month < 1 || month > 12) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCDate() !== day) return null;
  return dt.toISOString().slice(0, 10);
}

// "27 Nov" or "27/11" in the current year; rolls to next year if >300 days past.
function explicitDate(text, today) {
  const year = Number(today.slice(0, 4));
  const named = DAY_MONTH_RE.exec(text);
  const slash = named ? null : SLASH_DATE_RE.exec(text);
  let day;
  let month;
  if (named) {
    day = Number(named[1]);
    month = MONTHS[named[2].toLowerCase()];
  } else if (slash) {
    day = Number(slash[1]);
    month = Number(slash[2]);
  } else {
    return null;
  }
  const iso = isoFromParts(year, month, day);
  if (!iso) return null;
  return daysBetween(today, iso) < -300 ? isoFromParts(year + 1, month, day) : iso;
}

// Next occurrence of a weekday strictly after today.
function nextWeekday(name, today) {
  const target = WEEKDAYS.indexOf(name);
  const current = new Date(today + "T00:00:00Z").getUTCDay();
  const diff = (target - current + 7) % 7 || 7;
  return addDays(today, diff);
}

function resolveDate(text, today) {
  const explicit = explicitDate(text, today);
  if (explicit) return explicit;
  if (/\btomorrow\b/i.test(text)) return addDays(today, 1);
  if (/\btoday\b/i.test(text)) return today;
  if (/\bnext week\b/i.test(text)) return addDays(today, 7);
  const weekday = WEEKDAY_RE.exec(text);
  return weekday ? nextWeekday(weekday[1].toLowerCase(), today) : null;
}

// Parses a raw WhatsApp export (or plain text) into promise-to-pay invoices.
export function parseWhatsAppChat(rawText, today) {
  const invoices = [];
  const notes = [];

  String(rawText ?? "")
    .split(/\r?\n/)
    .forEach((rawLine, index) => {
      const lineNo = index + 1;
      const line = rawLine.trim();
      if (!line) return;

      const body = line.replace(TIMESTAMP_RE, "");
      const senderMatch = SENDER_RE.exec(body);
      const clientName = senderMatch ? senderMatch[1].trim() : "Unknown client";
      const message = senderMatch ? senderMatch[2] : body;

      const amount = parseAmount(message);
      if (amount === null) return;

      if (!PROMISE_CUE_RE.test(message)) {
        notes.push(`Ignored: amount found without a payment promise (line ${lineNo})`);
        return;
      }

      let dueDate = resolveDate(message, today);
      if (!dueDate) {
        dueDate = addDays(today, 7);
        notes.push(`No date found; assumed 7 days (line ${lineNo})`);
      }

      invoices.push({
        clientName: clientName || "Unknown client",
        clientEmail: "",
        clientPhone: "",
        projectTitle: "Parsed from WhatsApp",
        amount,
        issueDate: today,
        dueDate,
        status: "pending",
        daysOverdue: 0,
        reliabilityScore: 70,
        source: "whatsapp",
        rawMessage: line.slice(0, 160),
      });
    });

  return { invoices, notes };
}

export const WHATSAPP_PRESETS = [
  {
    id: "sunrise-on-time",
    label: "Sunrise Retail: pays on time soon",
    text: "[18/11/2026, 11:02] Priya (Sunrise Retail): Hi, the ₹35,000 for the landing pages will be cleared by Friday 27 Nov.",
  },
  {
    id: "helix-vague",
    label: "Helix Health: vague excuse",
    text: "[19/11/2026, 09:14] Arjun (Helix Health): Sorry, accounts is busy. Will look into the 65k soon, maybe next week.",
  },
  {
    id: "orbit-mixed",
    label: "Orbit: mixed chat",
    text: [
      "[20/11/2026, 16:40] Meera (Orbit): Got the revised figures, ₹52,000 looks right to me.",
      "[20/11/2026, 16:52] Meera (Orbit): I'll transfer ₹52,000 by 5 Dec.",
      "[21/11/2026, 09:05] Meera (Orbit): Thanks, that's all for now.",
    ].join("\n"),
  },
];
