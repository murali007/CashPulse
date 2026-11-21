// Mock data store for CashPulse AI. Plain JavaScript, no React.

export const SIMULATED_TODAY = "2026-11-21";
export const SIMULATED_DATE_LABEL = "Nov 21, 2026";
export const INITIAL_BANK_BALANCE = 74500;

export const INITIAL_INVOICES = [
  {
    id: "INV-1001",
    clientName: "Northwind Labs",
    clientEmail: "accounts@northwindlabs.in",
    clientPhone: "+91 98200 11234",
    projectTitle: "Brand identity refresh",
    amount: 40000,
    issueDate: "2026-09-20",
    dueDate: "2026-10-05",
    status: "paid",
    daysOverdue: 0,
    reliabilityScore: 96,
  },
  {
    id: "INV-1002",
    clientName: "Bluepeak Media",
    clientEmail: "finance@bluepeakmedia.co.in",
    clientPhone: "+91 98450 22817",
    projectTitle: "Social campaign assets",
    amount: 28000,
    issueDate: "2026-10-01",
    dueDate: "2026-10-15",
    status: "paid",
    daysOverdue: 0,
    reliabilityScore: 88,
  },
  {
    id: "INV-1003",
    clientName: "Orbit Fintech",
    clientEmail: "ap@orbitfintech.com",
    clientPhone: "+91 99001 45560",
    projectTitle: "Mobile app UI kit",
    amount: 52000,
    issueDate: "2026-11-10",
    dueDate: "2026-12-05",
    status: "pending",
    daysOverdue: 0,
    reliabilityScore: 91,
  },
  {
    id: "INV-1004",
    clientName: "Sunrise Retail Co.",
    clientEmail: "payables@sunriseretail.in",
    clientPhone: "+91 87654 30912",
    projectTitle: "E-commerce landing pages",
    amount: 35000,
    issueDate: "2026-10-14",
    dueDate: "2026-11-13",
    status: "overdue",
    daysOverdue: 8,
    reliabilityScore: 62,
  },
  {
    id: "INV-1005",
    clientName: "Helix Health Tech",
    clientEmail: "billing@helixhealth.io",
    clientPhone: "+91 91234 67708",
    projectTitle: "Analytics dashboard build",
    amount: 65000,
    issueDate: "2026-10-05",
    dueDate: "2026-10-30",
    status: "overdue",
    daysOverdue: 22,
    reliabilityScore: 34,
  },
];

export const INITIAL_RECURRING_BILLS = [
  { id: "rb-1", title: "Office Rent", category: "Rent", amount: 35000, dueDayOfMonth: 1 },
  { id: "rb-2", title: "Contractor Stipend", category: "Contractor", amount: 25000, dueDayOfMonth: 5 },
  { id: "rb-3", title: "SaaS tools", category: "Software", amount: 6000, dueDayOfMonth: 15 },
];

export const BILL_CATEGORIES = ["Rent", "Contractor", "Software", "Utilities"];
