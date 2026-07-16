import React, { useState } from 'react';
import { useCanteenStore } from '../store/canteenStore';
import { 
  Download, Printer, Calendar, Coins
} from 'lucide-react';

type ReportType = 'sales' | 'expenses' | 'inventory' | 'profit' | 'closing';

export const ReportView: React.FC = () => {
  const { bills, expenses, inventory, settings, transactions, openingBalance } = useCanteenStore();
  const cSymbol = settings.currency;

  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'all'>('month');
  
  // Closing report custom date
  const [closingReportDate, setClosingReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filter dates
  const todayStr = new Date().toISOString().split('T')[0];
  
  const getFilterStartDate = () => {
    if (dateFilter === 'today') return todayStr;
    if (dateFilter === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0];
    }
    if (dateFilter === 'month') {
      return todayStr.substring(0, 7) + '-01';
    }
    return '2020-01-01'; // all
  };

  const startDate = getFilterStartDate();

  // Data pools based on date filter
  const filteredBills = bills.filter(b => b.date >= startDate);
  const filteredExpenses = expenses.filter(e => e.date >= startDate);

  // Closing report calculations for the selected date
  const closingBills = bills.filter(b => b.date === closingReportDate);
  const closingExpenses = expenses.filter(e => e.date === closingReportDate);
  const closingTransactions = transactions.filter(t => t.date === closingReportDate);

  // Cash components today
  const cashSalesToday = closingBills.filter(b => b.paymentMethod === 'Cash').reduce((sum, b) => sum + b.total, 0);
  const upiSalesToday = closingBills.filter(b => b.paymentMethod === 'UPI').reduce((sum, b) => sum + b.total, 0);
  const cardSalesToday = closingBills.filter(b => b.paymentMethod === 'Card').reduce((sum, b) => sum + b.total, 0);
  const totalSalesToday = closingBills.reduce((sum, b) => sum + b.total, 0);

  // Cash outflows today
  const cashExpensesToday = closingExpenses.filter(e => {
    // Check corresponding transaction paymentMethod
    const tx = closingTransactions.find(t => t.description.includes(e.notes));
    return tx ? tx.paymentMethod === 'Cash' : true;
  }).reduce((sum, e) => sum + e.amount, 0);

  const nonCashExpensesToday = closingExpenses.reduce((sum, e) => sum + e.amount, 0) - cashExpensesToday;

  // Discrepancy audits logged today
  const reconciliationDiscrepancy = closingTransactions
    .filter(t => t.category === 'Adjustment' && t.paymentMethod === 'Cash')
    .reduce((sum, t) => sum + (t.type === 'cash_in' ? t.amount : -t.amount), 0);

  // Expected Closing drawer cash: Opening Balance + Cash sales today - Cash expenses today + reconciliation adjustment today
  const expectedClosingDrawerCash = openingBalance + cashSalesToday - cashExpensesToday + reconciliationDiscrepancy;

  // Export triggers
  const exportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let fileName = `Report_${activeReport}_${dateFilter}`;

    if (activeReport === 'sales') {
      headers = ["Invoice Number", "Date", "Time", "Customer Name", "Payment Method", "Items Purchased", "Discount Given", "GST Amount", "Net Total"];
      rows = filteredBills.map(b => [
        b.billNumber,
        b.date,
        b.time,
        b.customerName || "Guest",
        b.paymentMethod,
        b.items.map(i => `${i.name}(x${i.quantity})`).join("; "),
        b.discount,
        b.tax,
        b.total
      ]);
    } else if (activeReport === 'expenses') {
      headers = ["Expense ID", "Date", "Category", "Description", "Receipt Attached", "Amount"];
      rows = filteredExpenses.map(e => [
        e.id,
        e.date,
        e.category,
        e.notes,
        e.receiptName || "None",
        e.amount
      ]);
    } else if (activeReport === 'inventory') {
      headers = ["Ingredient ID", "Name", "Stock Portions", "Unit Type", "Purchase Cost", "Reorder Alert Level"];
      rows = inventory.map(i => [
        i.id,
        i.name,
        i.quantity,
        i.unit,
        i.purchasePrice,
        i.reorderLevel
      ]);
      fileName = `Report_Inventory`;
    } else if (activeReport === 'profit') {
      const totalRev = filteredBills.reduce((sum, b) => sum + b.total, 0);
      const totalExp = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      headers = ["Financial Statement", "Revenue Inflow", "Expense Outflow", "Net Margin Profit"];
      rows = [
        ["Aggregate Cash Flow", totalRev, totalExp, totalRev - totalExp],
        ["Sales Income", totalRev, "-", "-"],
        ["Operating Costs", "-", totalExp, "-"]
      ];
    } else if (activeReport === 'closing') {
      headers = ["Daily Closing Report Indicator", "Value"];
      rows = [
        ["Report Date", closingReportDate],
        ["Opening Register Cash Drawer", openingBalance],
        ["Cash Sales Intake", cashSalesToday],
        ["UPI Sales Intake", upiSalesToday],
        ["Card POS Intake", cardSalesToday],
        ["Cash Operational Disbursements", cashExpensesToday],
        ["Bank/Non-Cash Disbursements", nonCashExpensesToday],
        ["Register Discrepancy Adjustments", reconciliationDiscrepancy],
        ["Expected Closing Cash Drawer", expectedClosingDrawerCash],
        ["Total Net Profit Contribution Today", totalSalesToday - cashExpensesToday - nonCashExpensesToday]
      ];
      fileName = `Daily_Closing_Report_${closingReportDate}`;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reports Generator</h1>
          <p className="text-slate-600 dark:text-slate-400">Generate, review and export audit histories for sales, expenses, and inventory audits.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold shadow-xs cursor-pointer"
          >
            <Printer size={15} />
            Print Preview / PDF
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 bg-brand-emerald text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/10 hover:bg-emerald-650 transition-all cursor-pointer"
          >
            <Download size={15} />
            Download CSV Sheet
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        {/* Report Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Report Category</label>
          <div className="grid grid-cols-5 gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
            {(['sales', 'expenses', 'inventory', 'profit', 'closing'] as const).map(type => (
              <button
                key={type}
                onClick={() => setActiveReport(type)}
                className={`py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${ activeReport === type ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-505 hover:text-slate-700' }`}
              >
                {type === 'closing' ? 'Daily Closing' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Date Ranges / Closing date selector */}
        {activeReport !== 'inventory' && activeReport !== 'closing' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Audit Time Filter</label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
              {(['today', '7days', 'month', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateFilter(range)}
                  className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${ dateFilter === range ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-505 hover:text-slate-700' }`}
                >
                  {range === '7days' ? 'Last 7 Days' : range}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeReport === 'closing' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Date for Closing Report</label>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
              <input
                type="date"
                value={closingReportDate}
                onChange={(e) => setClosingReportDate(e.target.value)}
                className="w-full px-3 py-1 text-xs border rounded-lg dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        )}

        {activeReport === 'inventory' && (
          <div className="space-y-1.5 flex flex-col justify-end">
            <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">Inventory report represents current live storage stock status.</p>
          </div>
        )}
      </div>

      {/* Preview Sheet Area */}
      <div className="print-area bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6">
        
        {/* Report Cover Header (Visible on print & preview) */}
        <div className="text-center md:text-left border-b border-slate-100 dark:border-slate-800 pb-5 mb-5 flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-black uppercase text-slate-905 dark:text-white">{settings.canteenName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">System Audit Report Summary</p>
          </div>
          <div className="text-right text-xs text-slate-600 dark:text-slate-400">
            <p><span className="font-semibold text-slate-700 dark:text-slate-300">Category:</span> {activeReport.toUpperCase()} Audit</p>
            {activeReport !== 'closing' ? (
              <p><span className="font-semibold text-slate-700 dark:text-slate-300">Date Span:</span> {dateFilter.toUpperCase()} (Starting: {startDate})</p>
            ) : (
              <p><span className="font-semibold text-slate-700 dark:text-slate-300">Target Date:</span> {closingReportDate}</p>
            )}
            <p><span className="font-semibold text-slate-700 dark:text-slate-300">Printed:</span> {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* VIEW 1: SALES REPORT */}
        {activeReport === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 table-auto">
              <thead>
                <tr className="border-b border-slate-200 pb-2 font-bold uppercase text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-1">Inv #</th>
                  <th className="py-2 px-1">Date</th>
                  <th className="py-2 px-1">Customer</th>
                  <th className="py-2 px-1">Items</th>
                  <th className="py-2 px-1">Payment</th>
                  <th className="py-2 px-1 text-right">Tax</th>
                  <th className="py-2 px-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-808">
                {filteredBills.map(b => (
                  <tr key={b.billNumber}>
                    <td className="py-2 px-1 font-bold text-slate-900 dark:text-white">{b.billNumber}</td>
                    <td className="py-2 px-1 text-slate-500 dark:text-slate-400">{b.date} {b.time}</td>
                    <td className="py-2 px-1 font-medium">{b.customerName || "Walk-in"}</td>
                    <td className="py-2 px-1 text-slate-600 dark:text-slate-400 line-clamp-1 truncate max-w-[200px]" title={b.items.map(i => `${i.name} x${i.quantity}`).join(', ')}>
                      {b.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-2 px-1">{b.paymentMethod}</td>
                    <td className="py-2 px-1 text-right">{cSymbol}{b.tax}</td>
                    <td className="py-2 px-1 text-right font-black text-slate-900 dark:text-white">{cSymbol}{b.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: EXPENSES REPORT */}
        {activeReport === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 pb-2 font-bold uppercase text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-1">Date</th>
                  <th className="py-2 px-1">Category</th>
                  <th className="py-2 px-1">Notes</th>
                  <th className="py-2 px-1">Receipt</th>
                  <th className="py-2 px-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-808">
                {filteredExpenses.map(e => (
                  <tr key={e.id}>
                    <td className="py-2.5 px-1">{e.date}</td>
                    <td className="py-2.5 px-1 font-semibold">{e.category}</td>
                    <td className="py-2.5 px-1 text-slate-800 dark:text-slate-200">{e.notes}</td>
                    <td className="py-2.5 px-1 text-slate-500 dark:text-slate-400 italic">{e.receiptName || "None"}</td>
                    <td className="py-2.5 px-1 text-right font-bold text-red-500">-{cSymbol}{e.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 3: INVENTORY STORAGE STATUS */}
        {activeReport === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 pb-2 font-bold uppercase text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-1">Material Name</th>
                  <th className="py-2 px-1">Storage Qty</th>
                  <th className="py-2 px-1">Unit Type</th>
                  <th className="py-2 px-1 text-right">Unit Purchase Price</th>
                  <th className="py-2 px-1">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-808">
                {inventory.map(i => {
                  const isLow = i.quantity <= i.reorderLevel;
                  return (
                    <tr key={i.id}>
                      <td className="py-2.5 px-1 font-bold text-slate-900 dark:text-white">{i.name}</td>
                      <td className="py-2.5 px-1 font-bold">{i.quantity}</td>
                      <td className="py-2.5 px-1 text-slate-500 dark:text-slate-400">{i.unit}</td>
                      <td className="py-2.5 px-1 text-right">{cSymbol}{i.purchasePrice}</td>
                      <td className="py-2.5 px-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ isLow ? 'bg-red-100 text-red-650' : 'bg-emerald-100 text-emerald-650' }`}>
                          {isLow ? 'LOW STOCK' : 'HEALTHY'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 4: PROFIT REPORT */}
        {activeReport === 'profit' && (
          <div className="max-w-md mx-auto py-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Gross Sales Income:</span>
                <span className="font-extrabold text-brand-emerald text-sm">+{cSymbol}{filteredBills.reduce((sum, b) => sum + b.total, 0)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Total Operating Expenses:</span>
                <span className="font-extrabold text-red-500 text-sm">-{cSymbol}{filteredExpenses.reduce((sum, e) => sum + e.amount, 0)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-dashed">
                <span className="font-black text-slate-800 dark:text-white text-base">Net Operating Margin:</span>
                <span className={`font-black text-base ${ (filteredBills.reduce((sum, b) => sum + b.total, 0) - filteredExpenses.reduce((sum, e) => sum + e.amount, 0)) >= 0 ? 'text-brand-emerald' : 'text-red-500' }`}>
                  {cSymbol}{filteredBills.reduce((sum, b) => sum + b.total, 0) - filteredExpenses.reduce((sum, e) => sum + e.amount, 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: DAILY CLOSING REPORT */}
        {activeReport === 'closing' && (
          <div className="space-y-6 max-w-xl mx-auto py-4">
            
            {/* Cash Drawer Reconciliation status */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Opening Register</span>
                <p className="text-sm font-black text-slate-900 dark:text-white">{cSymbol}{openingBalance}</p>
              </div>
              <div className="space-y-0.5 border-l">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Cash Inflows</span>
                <p className="text-sm font-black text-brand-emerald">+{cSymbol}{cashSalesToday}</p>
              </div>
              <div className="space-y-0.5 border-l">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Cash Outflows</span>
                <p className="text-sm font-black text-red-500">-{cSymbol}{cashExpensesToday}</p>
              </div>
              <div className="space-y-0.5 border-l">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Discrepancy adjustment</span>
                <p className={`text-sm font-black ${reconciliationDiscrepancy >= 0 ? 'text-brand-emerald' : 'text-red-500'}`}>
                  {reconciliationDiscrepancy >= 0 ? '+' : ''}{cSymbol}{reconciliationDiscrepancy}
                </p>
              </div>
            </div>

            {/* Calculations and Closing Register Cash */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border space-y-3">
              <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">Register Cash Drawer Audit</h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Expected Cash in Drawer:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{cSymbol}{openingBalance + cashSalesToday - cashExpensesToday}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-600 dark:text-slate-400">Log Cash Reconciliation Adjustments:</span>
                  <span className={`font-semibold ${reconciliationDiscrepancy >= 0 ? 'text-brand-emerald' : 'text-red-500'}`}>
                    {cSymbol}{reconciliationDiscrepancy}
                  </span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1">
                  <span>Actual Closing Cash Drawer:</span>
                  <span className="text-brand-emerald">{cSymbol}{expectedClosingDrawerCash}</span>
                </div>
              </div>
            </div>

            {/* Overall Daily summary */}
            <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-5 rounded-2xl space-y-4">
              <h5 className="font-black text-sm flex items-center gap-1.5 uppercase tracking-wide">
                <Coins size={16} className="text-brand-emerald" />
                Shift Closing Financial Voucher
              </h5>
              
              <div className="space-y-2 text-xs border-b border-slate-700 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">Total Counter Cash Sales Intake:</span>
                  <span className="font-bold">{cSymbol}{cashSalesToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">UPI/E-wallet Sales Settlements:</span>
                  <span className="font-bold">{cSymbol}{upiSalesToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">Card POS Settlements:</span>
                  <span className="font-bold">{cSymbol}{cardSalesToday}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1.5 border-t border-slate-800 dark:border-slate-100">
                  <span>Gross POS Shift Revenue:</span>
                  <span className="text-brand-emerald">{cSymbol}{totalSalesToday}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">Total Operating Expenses today:</span>
                  <span className="font-bold text-red-400 dark:text-red-500">-{cSymbol}{cashExpensesToday + nonCashExpensesToday}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-800 dark:border-slate-100">
                  <span>Net Shift Earnings Today:</span>
                  <span className={(totalSalesToday - cashExpensesToday - nonCashExpensesToday) >= 0 ? 'text-brand-emerald' : 'text-red-500'}>
                    {cSymbol}{totalSalesToday - cashExpensesToday - nonCashExpensesToday}
                  </span>
                </div>
              </div>
            </div>

            {/* List of checkout receipts from today */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">Shift checkout log transactions ({closingBills.length} orders)</h5>
              <div className="border rounded-2xl divide-y dark:divide-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                {closingBills.map(b => (
                  <div key={b.billNumber} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{b.billNumber}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Time: {b.time} | Mode: {b.paymentMethod}</p>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">{cSymbol}{b.total}</span>
                  </div>
                ))}
                {closingBills.length === 0 && (
                  <p className="p-4 text-center text-slate-500 dark:text-slate-400 italic text-xs">No customer orders checked out today.</p>
                )}
              </div>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
};
