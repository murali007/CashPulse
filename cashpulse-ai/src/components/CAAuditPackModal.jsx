import React from 'react';

// Hard-coded constant: GST collected on sales that is held back from spendable cash.
const QUARANTINED_GST_BUFFER = 16380;
const GST_RATE = 0.09; // CGST 9% + SGST 9% = 18% total
const MSME_OVERDUE_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const formatINR = (value) => inrFormatter.format(Number(value) || 0);

// NOTE: there is NO invoice number field on invoice objects. The "Invoice #" shown
// in the GSTR-1 table and MSME schedule is synthesised from the 1-based array index.
const invoiceNumber = (index) => `INV-${String(index + 1).padStart(3, '0')}`;

// Taxable value / CGST / SGST / Total derived for a single invoice.
const computeRow = (invoice) => {
  const taxable = Number(invoice.amount) || 0;
  const cgst = taxable * GST_RATE;
  const sgst = taxable * GST_RATE;
  const total = taxable + cgst + sgst;
  return { taxable, cgst, sgst, total };
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Overdue invoices whose due date is at least 30 days before today.
const getMsmeEligible = (invoices) => {
  const today = startOfToday();
  return invoices
    .map((invoice, index) => {
      const due = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((today - due) / MS_PER_DAY);
      return { invoice, index, daysOverdue };
    })
    .filter(
      ({ invoice, daysOverdue }) =>
        invoice.status === 'overdue' && !Number.isNaN(daysOverdue) && daysOverdue >= MSME_OVERDUE_DAYS
    );
};

const csvField = (value) => `"${String(value).replace(/"/g, '""')}"`;

const buildGstr1Csv = (invoices) => {
  const header = ['Client', 'Invoice #', 'Taxable Value', 'CGST (9%)', 'SGST (9%)', 'Total'];
  const rows = invoices.map((invoice, index) => {
    const { taxable, cgst, sgst, total } = computeRow(invoice);
    return [
      csvField(invoice.clientName ?? ''),
      csvField(invoiceNumber(index)),
      taxable.toFixed(2),
      cgst.toFixed(2),
      sgst.toFixed(2),
      total.toFixed(2),
    ].join(',');
  });
  return [header.map(csvField).join(','), ...rows].join('\r\n');
};

const CAAuditPackModal = ({ invoices = [], onClose }) => {
  const now = new Date();
  const monthTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const spendableCash = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  const totals = invoices.reduce(
    (acc, inv) => {
      const row = computeRow(inv);
      acc.taxable += row.taxable;
      acc.cgst += row.cgst;
      acc.sgst += row.sgst;
      acc.total += row.total;
      return acc;
    },
    { taxable: 0, cgst: 0, sgst: 0, total: 0 }
  );

  const msmeRows = getMsmeEligible(invoices);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const csv = buildGstr1Csv(invoices);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR-1-${monthTag}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 print:static print:block print:bg-white print:p-0">
      <div className="luxury-card relative my-8 w-full max-w-5xl border-orange-200 bg-white p-6 print:my-0 print:w-full print:max-w-none print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-amber-200 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-wide text-slate-900">
              MONTHLY CHARTERED ACCOUNTANT (CA) AUDIT &amp; GSTR-1 PACK
            </h2>
            <p className="mt-1 text-sm text-slate-500">Period: {monthLabel}</p>
          </div>
          <div
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-double border-orange-400 bg-orange-50 text-center"
            aria-label="Verified CA audit pack seal"
          >
            <span className="text-[9px] font-bold uppercase leading-tight tracking-wider text-orange-700">
              VERIFIED
            </span>
            <span className="text-[8px] font-semibold uppercase leading-tight text-orange-600">
              CA AUDIT PACK
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="mt-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Executive Summary</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-xs text-slate-500">Spendable Cash</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatINR(spendableCash)}</p>
              <p className="mt-1 text-[11px] text-slate-400">Sum of invoices with status “paid”.</p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
              <p className="text-xs text-slate-500">Quarantined 18% GST Buffer</p>
              <p className="mt-1 text-2xl font-bold text-orange-700">{formatINR(QUARANTINED_GST_BUFFER)}</p>
              <p className="mt-1 text-[11px] text-slate-400">Held aside for GST remittance.</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            Assumptions: amounts are treated as taxable values exclusive of GST; CGST and SGST are each 9% (18% total);
            the ₹16,380 GST buffer is a fixed reserve figure, not recalculated from invoices; no invoice number, GST or
            issue-date fields exist in source data, so invoice numbers are generated by sequence.
          </p>
        </section>

        {/* GSTR-1 Sales Table */}
        <section className="mt-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">GSTR-1 Sales Table</h3>
          <div className="max-w-full overflow-x-auto rounded-xl border border-amber-200">
            <table className="min-w-full text-sm">
              <thead className="bg-orange-50 text-left text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Invoice #</th>
                  <th className="px-3 py-2 text-right">Taxable Value</th>
                  <th className="px-3 py-2 text-right">CGST (9%)</th>
                  <th className="px-3 py-2 text-right">SGST (9%)</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-slate-400">
                      No invoices to report.
                    </td>
                  </tr>
                )}
                {invoices.map((invoice, index) => {
                  const { taxable, cgst, sgst, total } = computeRow(invoice);
                  return (
                    <tr key={invoice.id ?? index}>
                      <td className="px-3 py-2 text-slate-800">{invoice.clientName}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{invoiceNumber(index)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(taxable)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(cgst)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(sgst)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatINR(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              {invoices.length > 0 && (
                <tfoot className="bg-orange-50 font-semibold text-slate-900">
                  <tr>
                    <td className="px-3 py-2" colSpan={2}>
                      Totals
                    </td>
                    <td className="px-3 py-2 text-right">{formatINR(totals.taxable)}</td>
                    <td className="px-3 py-2 text-right">{formatINR(totals.cgst)}</td>
                    <td className="px-3 py-2 text-right">{formatINR(totals.sgst)}</td>
                    <td className="px-3 py-2 text-right">{formatINR(totals.total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        {/* MSME Debtors Schedule */}
        <section className="mt-6">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            MSME Debtors Schedule
          </h3>
          <p className="mb-3 text-[11px] text-slate-400">
            Overdue {MSME_OVERDUE_DAYS}+ days — eligible for MSME Samadhaan action.
          </p>
          {msmeRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amber-200 p-4 text-center text-sm text-slate-400">
              No MSME-eligible debtors: no overdue invoices are {MSME_OVERDUE_DAYS}+ days past due.
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto rounded-xl border border-amber-200">
              <table className="min-w-full text-sm">
                <thead className="bg-orange-50 text-left text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Invoice #</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">Days Overdue</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {msmeRows.map(({ invoice, index, daysOverdue }) => (
                    <tr key={invoice.id ?? index}>
                      <td className="px-3 py-2 text-slate-800">{invoice.clientName}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{invoiceNumber(index)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(invoice.amount)}</td>
                      <td className="px-3 py-2 text-right">{daysOverdue}</td>
                      <td className="px-3 py-2 text-xs font-medium text-orange-700">
                        Eligible for MSME Samadhaan action
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Actions (hidden when printing) */}
        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-amber-200 pt-4 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-orange-50"
          >
            🖨️ Print / Save CA PDF
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn-falcon rounded-lg px-4 py-2 text-sm font-medium"
          >
            📥 Export GSTR-1 CSV
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CAAuditPackModal;
