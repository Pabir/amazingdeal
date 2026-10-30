import React, { useState, useMemo, useEffect } from 'react';
import { X, Printer, CheckSquare, Square, Download, FileText, Building2, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { Invoice, Tenant } from '../types';
import { getGstStateByCode } from '../data/gstStatesData';
import { printInvoices, numberToIndianWords, formatDate } from '../utils/printInvoices';

interface BatchInvoicesModalProps {
  invoices: Invoice[];
  tenant: Tenant | null;
  initialStartDate?: string;
  initialEndDate?: string;
  initialPreset?: string;
  onDateRangeChange?: (startDate: string, endDate: string, preset?: string) => void;
  onClose: () => void;
}

export const BatchInvoicesModal: React.FC<BatchInvoicesModalProps> = ({
  invoices,
  tenant,
  initialStartDate,
  initialEndDate,
  initialPreset = 'THIS_MONTH',
  onDateRangeChange,
  onClose,
}) => {
  // Manual Date Range Selection inside Modal
  const [startDate, setStartDate] = useState<string>(initialStartDate || '');
  const [endDate, setEndDate] = useState<string>(initialEndDate || '');
  const [selectedPreset, setSelectedPreset] = useState<string>(initialPreset);

  const [filterMode, setFilterMode] = useState<'ALL' | 'B2B' | 'B2C'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Apply Quick Date Range Preset
  const applyPreset = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'ALL' | 'TODAY') => {
    setSelectedPreset(preset);
    const currentDate = new Date();
    let newStart = '';
    let newEnd = '';

    if (preset === 'TODAY') {
      const today = currentDate.toISOString().split('T')[0];
      newStart = today;
      newEnd = today;
    } else if (preset === 'THIS_MONTH') {
      newStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      newEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (preset === 'LAST_MONTH') {
      newStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().split('T')[0];
      newEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).toISOString().split('T')[0];
    } else if (preset === 'THIS_QUARTER') {
      const qMonth = Math.floor(currentDate.getMonth() / 3) * 3;
      newStart = new Date(currentDate.getFullYear(), qMonth, 1).toISOString().split('T')[0];
      newEnd = new Date(currentDate.getFullYear(), qMonth + 3, 0).toISOString().split('T')[0];
    } else if (preset === 'ALL') {
      newStart = '';
      newEnd = '';
    }

    setStartDate(newStart);
    setEndDate(newEnd);
    onDateRangeChange?.(newStart, newEnd, preset);
  };

  // 1. Filter invoices by selected date range
  const dateFilteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invDate = inv.invoiceDate ? inv.invoiceDate.split('T')[0] : '';
      const matchesStart = !startDate || invDate >= startDate;
      const matchesEnd = !endDate || invDate <= endDate;
      return matchesStart && matchesEnd;
    });
  }, [invoices, startDate, endDate]);

  // 2. Filter by document classification (ALL, B2B, B2C)
  const displayInvoices = useMemo(() => {
    return dateFilteredInvoices.filter((inv) => {
      const isB2B = Boolean(inv.partyGstin && inv.partyGstin.trim().length >= 15);
      if (filterMode === 'B2B') return isB2B;
      if (filterMode === 'B2C') return !isB2B;
      return true;
    });
  }, [dateFilteredInvoices, filterMode]);

  // Default: Select all invoices when filtered list updates
  useEffect(() => {
    setSelectedIds(new Set(displayInvoices.map((i) => i.id)));
  }, [displayInvoices]);

  const selectedInvoicesToPrint = useMemo(() => {
    return displayInvoices.filter((inv) => selectedIds.has(inv.id));
  }, [displayInvoices, selectedIds]);

  const toggleSelectAll = () => {
    if (selectedIds.size === displayInvoices.length && displayInvoices.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayInvoices.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handlePrint = () => {
    printInvoices(selectedInvoicesToPrint, tenant);
  };

  const periodLabel = startDate && endDate
    ? `${formatDate(startDate)} to ${formatDate(endDate)}`
    : startDate
    ? `From ${formatDate(startDate)}`
    : endDate
    ? `Up to ${formatDate(endDate)}`
    : 'All Available Dates';

  const b2bCount = dateFilteredInvoices.filter((i) => i.partyGstin && i.partyGstin.length >= 15).length;
  const b2cCount = dateFilteredInvoices.filter((i) => !i.partyGstin || i.partyGstin.length < 15).length;
  const totalSelectedValue = selectedInvoicesToPrint.reduce((acc, i) => acc + Number(i.totalAmount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        
        {/* Top Control Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden flex flex-col gap-3">
          
          {/* Top Row: Title, Filter Mode Toggle, Print Button, Close Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900">Batch Invoices & Tax Bills Print View</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                    {selectedInvoicesToPrint.length} of {displayInvoices.length} Selected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ready for Save as PDF / CA GST Audit
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {/* Filter Mode Toggle */}
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filterMode === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-bold' : ''}`}
                >
                  All ({dateFilteredInvoices.length})
                </button>
                <button
                  onClick={() => setFilterMode('B2B')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filterMode === 'B2B' ? 'bg-white text-emerald-800 shadow-sm font-bold' : ''}`}
                >
                  B2B ({b2bCount})
                </button>
                <button
                  onClick={() => setFilterMode('B2C')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filterMode === 'B2C' ? 'bg-white text-amber-800 shadow-sm font-bold' : ''}`}
                >
                  B2C ({b2cCount})
                </button>
              </div>

              {/* Print / Save PDF Button */}
              <button
                onClick={handlePrint}
                disabled={selectedInvoicesToPrint.length === 0}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
                title="Print all selected invoices or choose Destination: Save as PDF in print dialog"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Manual Period Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Quick Period Presets */}
              <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-xl text-xs overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold text-slate-500 px-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Period:</span>
                </span>
                {[
                  { id: 'THIS_MONTH', label: 'This Month' },
                  { id: 'LAST_MONTH', label: 'Last Month' },
                  { id: 'THIS_QUARTER', label: 'This Quarter' },
                  { id: 'TODAY', label: 'Today' },
                  { id: 'ALL', label: 'All Time' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedPreset === p.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Manual Date Range Inputs (From & To) */}
              <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs shadow-sm">
                <span className="text-slate-500 font-bold">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    setSelectedPreset('CUSTOM');
                    onDateRangeChange?.(val, endDate, 'CUSTOM');
                  }}
                  className="bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer"
                />
                <span className="text-slate-300 font-bold">→</span>
                <span className="text-slate-500 font-bold">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEndDate(val);
                    setSelectedPreset('CUSTOM');
                    onDateRangeChange?.(startDate, val, 'CUSTOM');
                  }}
                  className="bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer"
                />
              </div>

            </div>

            {/* Live Period Summary Badge */}
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-200 shadow-2xs">
                Period: {periodLabel}
              </span>
            </div>

          </div>

        </div>

        {/* Selection Bar (Hidden during Print) */}
        <div className="px-6 py-2.5 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-semibold print:hidden">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center space-x-1.5 hover:text-indigo-700 transition-colors"
            >
              {selectedIds.size === displayInvoices.length && displayInvoices.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>{selectedIds.size === displayInvoices.length && displayInvoices.length > 0 ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span className="text-indigo-300">|</span>
            <span>Total Value: ₹{totalSelectedValue.toFixed(2)}</span>
          </div>

          <p className="text-[11px] text-indigo-600 font-normal hidden sm:block">
            Tip: In the print dialog, select Destination &quot;Save as PDF&quot; to export a single consolidated PDF document.
          </p>
        </div>

        {/* Scrollable Document Area (On Screen Preview) */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-8 print:space-y-0 print:p-0 print:overflow-visible">
          {displayInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 stroke-[1.2] mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No invoices match selected period</p>
              <p className="text-xs text-slate-400 mt-1">
                Try selecting &quot;All Time&quot; or expanding the From and To date pickers above.
              </p>
            </div>
          ) : (
            displayInvoices.map((invoice, invIndex) => {
              const isSelected = selectedIds.has(invoice.id);
              const isIntrastate = (invoice.cgstAmount || 0) > 0 || (invoice.sgstAmount || 0) > 0;
              const merchantState = tenant?.stateCode ? getGstStateByCode(tenant.stateCode)?.label || tenant.stateCode : '07-Delhi';
              const placeOfSupply = getGstStateByCode(invoice.placeOfSupply)?.label || invoice.placeOfSupply || merchantState;

              return (
                <div
                  key={invoice.id}
                  className={`bg-white border rounded-xl p-6 sm:p-8 shadow-sm transition-all ${
                    isSelected
                      ? 'border-indigo-200 ring-1 ring-indigo-100'
                      : 'border-slate-200 opacity-60 hover:opacity-100 bg-slate-50/40'
                  }`}
                >
                  {/* Screen checkbox to toggle this invoice */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 text-xs">
                    <button
                      onClick={() => toggleSelect(invoice.id)}
                      className={`flex items-center space-x-2 font-semibold transition-colors ${
                        isSelected ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>
                        Invoice #{invoice.invoiceNumber} {isSelected ? '(Included in Batch Print)' : '(Excluded - Click to Include)'}
                      </span>
                    </button>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSelected ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isSelected ? 'Ready to Print' : 'Skipped'}
                      </span>
                      <span className="text-slate-400 font-mono">Invoice {invIndex + 1} of {displayInvoices.length}</span>
                    </div>
                  </div>

                  {/* 1. Invoice Header */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                          {tenant?.storeName || 'AMAZINGDEAL STORE'}
                        </h1>
                        <p className="text-xs text-slate-600 mt-0.5 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400 inline" />
                          <span>{tenant?.storeAddress || 'Main Market, City'}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                          {tenant?.ownerPhone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-400 inline" />
                              <span>{tenant.ownerPhone}</span>
                            </span>
                          )}
                          {tenant?.ownerEmail && (
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-slate-400 inline" />
                              <span>{tenant.ownerEmail}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded">
                          {invoice.documentType.replace('_', ' ')}
                        </span>
                        <div className="text-xs text-slate-600 mt-2 space-y-0.5 font-mono">
                          {tenant?.gstin && (
                            <div><span className="font-bold text-slate-800">GSTIN:</span> {tenant.gstin}</div>
                          )}
                          <div><span className="font-bold text-slate-800">State:</span> {merchantState}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Metadata & Customer Billing */}
                  <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-slate-200 text-xs">
                    <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To (Customer):</span>
                      <div className="font-bold text-slate-900 text-sm">{invoice.partyName}</div>
                      {invoice.partyGstin && (
                        <div className="font-mono text-indigo-700 font-semibold">GSTIN: {invoice.partyGstin}</div>
                      )}
                      {invoice.partyPhone && <div className="text-slate-600">Phone: {invoice.partyPhone}</div>}
                      {invoice.partyAddress && <div className="text-slate-600 text-[11px]">{invoice.partyAddress}</div>}
                    </div>

                    <div className="space-y-1 text-right bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div><span className="text-slate-500">Invoice No:</span> <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span></div>
                      <div><span className="text-slate-500">Invoice Date:</span> <span className="font-semibold text-slate-800">{formatDate(invoice.invoiceDate)}</span></div>
                      <div><span className="text-slate-500">Place of Supply:</span> <span className="font-semibold text-slate-800">{placeOfSupply}</span></div>
                      <div><span className="text-slate-500">Reverse Charge:</span> <span className="font-semibold text-slate-800">{invoice.isReverseCharge ? 'Yes' : 'No'}</span></div>
                    </div>
                  </div>

                  {/* 3. Items Table */}
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2 px-2 text-center w-8">#</th>
                          <th className="py-2 px-2">Item Description</th>
                          <th className="py-2 px-2 text-center">HSN/SAC</th>
                          <th className="py-2 px-2 text-right">Qty</th>
                          <th className="py-2 px-2 text-right">Rate (₹)</th>
                          <th className="py-2 px-2 text-right">Taxable (₹)</th>
                          <th className="py-2 px-2 text-center">GST %</th>
                          <th className="py-2 px-2 text-right">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {invoice.items && invoice.items.length > 0 ? (
                          invoice.items.map((item, idx) => {
                            const qty = item.quantity || 1;
                            const rate = item.unitPrice || 0;
                            const taxable = rate * qty - ((item.discountPct || 0) * rate * qty) / 100;
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-2 px-2 text-center text-slate-400">{idx + 1}</td>
                                <td className="py-2 px-2 font-medium text-slate-900">{item.itemName}</td>
                                <td className="py-2 px-2 text-center font-mono text-slate-600">{item.hsnSac || '-'}</td>
                                <td className="py-2 px-2 text-right font-mono">{item.quantity} {item.unit || 'pcs'}</td>
                                <td className="py-2 px-2 text-right font-mono">₹{rate.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right font-mono">₹{taxable.toFixed(2)}</td>
                                <td className="py-2 px-2 text-center font-mono">{item.gstRate || 0}%</td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">₹{Number(item.totalAmount || taxable).toFixed(2)}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-3 text-center text-slate-400">Order Items Details</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 4. Tax Breakdown & Totals */}
                  <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-slate-200 text-xs">
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-700">
                        <span className="font-bold">Amount in Words:</span>
                        <div className="italic text-slate-600 mt-0.5">{numberToIndianWords(invoice.totalAmount)}</div>
                      </div>

                      {tenant?.bankAccountNumber && (
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] space-y-0.5 font-mono">
                          <div className="font-bold text-slate-700 uppercase">Bank Payment Details:</div>
                          <div>Bank: {tenant.bankName || 'State Bank of India'} | A/C: {tenant.bankAccountNumber}</div>
                          <div>IFSC: {tenant.bankIfsc || '-'} | Branch: {tenant.bankBranch || '-'}</div>
                          {tenant.upiVpa && <div>UPI ID: {tenant.upiVpa}</div>}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 text-right font-mono">
                      <div className="flex justify-between text-slate-600">
                        <span>Taxable Subtotal:</span>
                        <span>₹{Number(invoice.subtotal || 0).toFixed(2)}</span>
                      </div>

                      {isIntrastate ? (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>CGST:</span>
                            <span>₹{Number(invoice.cgstAmount || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>SGST:</span>
                            <span>₹{Number(invoice.sgstAmount || 0).toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-slate-600">
                          <span>IGST:</span>
                          <span>₹{Number(invoice.igstAmount || 0).toFixed(2)}</span>
                        </div>
                      )}

                      {invoice.roundOff !== 0 && (
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Round Off:</span>
                          <span>₹{Number(invoice.roundOff || 0).toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-1.5">
                        <span>Grand Total:</span>
                        <span>₹{Number(invoice.totalAmount || 0).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-[11px] text-emerald-700 font-semibold">
                        <span>Paid ({invoice.paymentMode}):</span>
                        <span>₹{Number(invoice.paidAmount || 0).toFixed(2)}</span>
                      </div>

                      {invoice.balanceDue > 0 && (
                        <div className="flex justify-between text-[11px] text-amber-700 font-bold">
                          <span>Balance Due:</span>
                          <span>₹{Number(invoice.balanceDue).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. Footer Terms & Signature */}
                  <div className="flex justify-between items-end text-[10px] text-slate-500 pt-2">
                    <div>
                      <p className="font-bold text-slate-700">Terms & Conditions:</p>
                      <p>{invoice.termsConditions || 'Goods once sold will not be taken back or exchanged. Subject to local jurisdiction.'}</p>
                    </div>

                    <div className="text-center font-mono">
                      <div className="h-10 border-b border-slate-400 w-40 mb-1"></div>
                      <span className="font-bold text-slate-700 block">Authorized Signatory</span>
                      <span className="text-[9px] text-slate-400">{tenant?.storeName}</span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
