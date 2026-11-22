/**
 * Validates invoice input fields.
 * Rules:
 * 1. clientName: must be a string that is not blank after trimming.
 * 2. amount: must be a finite number >= 1; numeric strings are accepted.
 * 3. dueDate: must be present (not null, undefined, or blank) and parseable as a date.
 *
 * @param {{clientName?: unknown, amount?: unknown, dueDate?: unknown}} [input]
 * @returns {{valid: boolean, errors: {clientName: string|null, amount: string|null, dueDate: string|null}}}
 */
export function validateInvoiceInput({ clientName, amount, dueDate } = {}) {
  const errors = { clientName: null, amount: null, dueDate: null };

  if (typeof clientName !== "string" || clientName.trim() === "") {
    errors.clientName = "Client name is required";
  }

  const isBlankString = typeof amount === "string" && amount.trim() === "";
  const n = typeof amount === "string" && amount.trim() !== "" ? Number(amount) : amount;
  if (
    amount === undefined ||
    amount === null ||
    isBlankString ||
    typeof n !== "number" ||
    !Number.isFinite(n) ||
    n < 1
  ) {
    errors.amount = "Amount must be a positive number (minimum ₹1)";
  }

  if (
    dueDate === undefined ||
    dueDate === null ||
    (typeof dueDate === "string" && dueDate.trim() === "")
  ) {
    errors.dueDate = "Due date is required";
  } else if (Number.isNaN(new Date(dueDate).getTime())) {
    errors.dueDate = "Due date must be a valid date";
  }

  const valid = errors.clientName === null && errors.amount === null && errors.dueDate === null;
  return { valid, errors };
}
