import React, { useState, useMemo } from 'react';
import { 
  FileText, Search, Printer, Share2, ArrowRightLeft, 
  Calendar, CheckCircle2, Clock, AlertTriangle, ChevronRight, Eye,
  Download, FileSpreadsheet, Filter, IndianRupee, Layers
} from 'lucide-react';
import { Invoice, Tenant } from '../types';
import { ApiService } from '../services/api';
import { getGstStateByCode } from '../data/gstStatesData';
import { exportGstExcelReport, exportGstCsvReport, calculateGstSummary } from '../utils/gstExport';
import { BatchInvoicesModal } from './BatchInvoicesModal';

interface InvoiceListProps {
  tenant: Tenant | null;
  invoices: Invoice[];
  onRefresh: () => void;
  onOpenA4Invoice: (invoice: Invoice) => void;
  onOpenThermalReceipt: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  tenant,
  invoices,
  onRefresh,
  onOpenA4Invoice,
  onOpenThermalReceipt,
}) => {
  const [activeDocType, setActiveDocType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isConverting, setIsConverting] = useState<string | null>(null);

  // Date Range Filter States
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(currentMonthStart);
  const [endDate, setEndDate] = useState<string>(currentMonthEnd);
  const [selectedPreset, setSelectedPreset] = useState<string>('THIS_MONTH');

  // Modal for Batch Invoices PDF / Print View
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const applyPreset = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'ALL' | 'TODAY') => {
    setSelectedPreset(preset);
    const currentDate = new Date();
    if (preset === 'TODAY') {
      const today = currentDate.toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'THIS_MONTH') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'LAST_MONTH') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'THIS_QUARTER') {
      const qMonth = Math.floor(currentDate.getMonth() / 3) * 3;
      const start = new Date(currentDate.getFullYear(), qMonth, 1).toISOString().split('T')[0];
      const end = new Date(currentDate.getFullYear(), qMonth + 3, 0).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter invoices by DocType, Date Range, and Search Query
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesType = activeDocType === 'ALL' || inv.documentType === activeDocType;
      
      const invDate = inv.invoiceDate ? inv.invoiceDate.split('T')[0] : '';
      const matchesStartDate = !startDate || invDate >= startDate;
      const matchesEndDate = !endDate || invDate <= endDate;

      const q = search.toLowerCase();
      const matchesSearch = 
        !search ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.partyName.toLowerCase().includes(q) ||
        (inv.partyPhone && inv.partyPhone.includes(q)) ||
        (inv.partyGstin && inv.partyGstin.toLowerCase().includes(q));

      return matchesType && matchesStartDate && matchesEndDate && matchesSearch;
    });
  }, [invoices, activeDocType, startDate, endDate, search]);

  // Consolidated GST metrics for the filtered period
  const gstMetrics = useMemo(() => calculateGstSummary(filteredInvoices), [filteredInvoices]);

  const handleConvert = async (invoice: Invoice, targetType: string) => {
    if (!confirm(`Convert ${invoice.invoiceNumber} (${invoice.documentType}) into ${targetType.replace('_', ' ')}?`)) return;

    setIsConverting(invoice.id);
    try {
      const converted = await ApiService.convertInvoice(invoice.id, targetType);
      onRefresh();
      onOpenA4Invoice(converted);
    } catch (err: any) {
      alert('Conversion failed: ' + err.message);
    } finally {
      setIsConverting(null);
    }
  };

  const handleWhatsAppShare = (inv: Invoice) => {
    const phone = inv.partyPhone?.replace(/\D/g, '') || '';
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;

    const summaryText = `*Tax Invoice from ${tenant?.storeName || 'Store'}*
Invoice No: *${inv.invoiceNumber}*
Date: ${inv.invoiceDate}
Customer: ${inv.partyName}
Total: *₹${inv.totalAmount.toFixed(2)}*
Payment Status: ${inv.paymentStatus}
${tenant?.upiVpa ? `\nPay via UPI: upi://pay?pa=${tenant.upiVpa}&pn=${encodeURIComponent(tenant.storeName || '')}&am=${inv.totalAmount}&tn=${inv.invoiceNumber}` : ''}
\nThank you for shopping with us!`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(summaryText)}`
      : `https://wa.me/?text=${encodeURIComponent(summaryText)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Date Range & GST Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left: Quick Date Presets */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center space-x-1">
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
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedPreset === p.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Right: Date Inputs & Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Custom Date Inputs */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedPreset('CUSTOM');
                }}
                className="bg-transparent text-slate-800 text-xs focus:outline-none"
              />
              <span className="text-slate-300">|</span>
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedPreset('CUSTOM');
                }}
                className="bg-transparent text-slate-800 text-xs focus:outline-none"
              />
            </div>

            {/* Export GST Excel Report Button */}
            <button
              onClick={() => exportGstExcelReport(filteredInvoices, tenant, startDate, endDate)}
              disabled={filteredInvoices.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
              title="Download GSTR-1 Compliant Excel Workbook (.xls) with Sales Register, B2B Table 4, B2C Table 7, and HSN Table 12"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download GST Excel</span>
            </button>

            {/* Download CSV Report */}
            <button
              onClick={() => exportGstCsvReport(filteredInvoices, tenant, startDate, endDate)}
              disabled={filteredInvoices.length === 0}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-xl transition-all border border-slate-200"
              title="Download CSV format sales register"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {/* Batch Print / Save Invoices (PDF) */}
            <button
              onClick={() => setIsBatchModalOpen(true)}
              disabled={filteredInvoices.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 rounded-xl transition-all border border-indigo-200"
              title="Batch Print or Save All Invoices as A4 PDF document for GST filing & CA audit"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Print / Save Invoices (PDF)</span>
            </button>

          </div>
        </div>

        {/* 2. GST Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          
          {/* Total Invoices Count */}
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filtered Invoices</div>
            <div className="text-base font-black text-slate-900 mt-0.5">{gstMetrics.totalInvoices}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-1">
              <span className="font-semibold text-emerald-700">{gstMetrics.b2bCount} B2B</span>
              <span>•</span>
              <span className="font-semibold text-slate-600">{gstMetrics.b2cCount} B2C</span>
            </div>
          </div>

          {/* Taxable Turnover */}
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Taxable Turnover</div>
            <div className="text-base font-black text-slate-900 mt-0.5">₹{gstMetrics.taxableAmount.toFixed(2)}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Net Before Taxes</div>
          </div>

          {/* GST Tax Collected */}
          <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
            <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Total GST Collected</div>
            <div className="text-base font-black text-indigo-700 mt-0.5">₹{gstMetrics.totalTax.toFixed(2)}</div>
            <div className="text-[10px] text-indigo-600/90 mt-0.5 space-x-1 truncate font-mono">
              <span>C: ₹{gstMetrics.cgstAmount.toFixed(0)}</span>
              <span>S: ₹{gstMetrics.sgstAmount.toFixed(0)}</span>
              <span>I: ₹{gstMetrics.igstAmount.toFixed(0)}</span>
            </div>
          </div>

          {/* Gross Invoiced Sales */}
          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Gross Invoiced Value</div>
            <div className="text-base font-black text-emerald-700 mt-0.5">₹{gstMetrics.grandTotal.toFixed(2)}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Paid: ₹{gstMetrics.paidAmount.toFixed(2)}</div>
          </div>

          {/* Outstanding Due */}
          <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pending Due (Udhaar)</div>
            <div className="text-base font-black text-amber-700 mt-0.5">₹{gstMetrics.balanceDue.toFixed(2)}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">{gstMetrics.balanceDue > 0 ? 'To be collected' : 'All Settled'}</div>
          </div>

        </div>

      </div>

      {/* 3. Document Filter & Search Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Document Type Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Bills' },
            { id: 'TAX_INVOICE', label: 'GST Invoices' },
            { id: 'ESTIMATE', label: 'Estimates' },
            { id: 'DELIVERY_CHALLAN', label: 'Challans' },
            { id: 'BILL_OF_SUPPLY', label: 'Non-GST' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveDocType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeDocType === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search bill #, customer name, GSTIN, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

      </div>

      {/* 4. Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 stroke-[1.2] mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No invoices found for selected filters</p>
            <p className="text-xs text-slate-400 mt-1">
              Try selecting &quot;All Time&quot; or clearing your date range filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Bill No & Date</th>
                  <th className="p-3.5">Customer / Party</th>
                  <th className="p-3.5">Type & POS</th>
                  <th className="p-3.5 text-right">Taxable</th>
                  <th className="p-3.5 text-right">Tax (GST)</th>
                  <th className="p-3.5 text-right">Total Amount</th>
                  <th className="p-3.5 text-center">Payment</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => {
                  const totalTax = (inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0);
                  const isB2B = Boolean(inv.partyGstin && inv.partyGstin.trim().length >= 15);
                  const posState = getGstStateByCode(inv.placeOfSupply)?.label || inv.placeOfSupply || '07-Delhi';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Bill No & Date */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 font-mono text-sm">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{inv.invoiceDate}</span>
                        </div>
                      </td>

                      {/* Customer / Party */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                          <span>{inv.partyName}</span>
                          {isB2B && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase">
                              B2B
                            </span>
                          )}
                        </div>
                        {inv.partyPhone && (
                          <div className="text-[10px] text-slate-500">{inv.partyPhone}</div>
                        )}
                        {inv.partyGstin && (
                          <div className="text-[10px] font-mono text-indigo-700 font-semibold">
                            GSTIN: {inv.partyGstin}
                          </div>
                        )}
                      </td>

                      {/* Type & Place of Supply */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {inv.documentType.replace('_', ' ')}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          POS: {posState}
                        </div>
                      </td>

                      {/* Taxable Value */}
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        ₹{Number(inv.subtotal || 0).toFixed(2)}
                      </td>

                      {/* Total Tax with Breakdown tooltip */}
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        <div className="font-semibold">₹{totalTax.toFixed(2)}</div>
                        <div className="text-[9px] text-slate-400">
                          {(inv.cgstAmount || 0) > 0 ? `C: ${inv.cgstAmount?.toFixed(0)} S: ${inv.sgstAmount?.toFixed(0)}` : `I: ${inv.igstAmount?.toFixed(0)}`}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{Number(inv.totalAmount || 0).toFixed(2)}
                      </td>

                      {/* Payment Status */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                          inv.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {inv.paymentStatus} ({inv.paymentMode})
                        </span>
                        {inv.balanceDue > 0 && (
                          <div className="text-[10px] font-mono text-amber-700 font-semibold mt-0.5">
                            Due: ₹{Number(inv.balanceDue).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          
                          {/* If estimate, offer 1-click Convert to Tax Invoice */}
                          {inv.documentType === 'ESTIMATE' && (
                            <button
                              onClick={() => handleConvert(inv, 'TAX_INVOICE')}
                              disabled={isConverting === inv.id}
                              title="Convert to Tax Invoice"
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-200 flex items-center space-x-1"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold hidden sm:inline">To Invoice</span>
                            </button>
                          )}

                          {/* Print A4 GST Invoice */}
                          <button
                            onClick={() => onOpenA4Invoice(inv)}
                            title="Print A4 Tax Invoice"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Thermal Slip */}
                          <button
                            onClick={() => onOpenThermalReceipt(inv)}
                            title="Print 58mm/80mm Thermal Receipt"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Share */}
                          <button
                            onClick={() => handleWhatsAppShare(inv)}
                            title="Share on WhatsApp"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Batch Invoices Modal (Print / Save All Invoices as PDF) */}
      {isBatchModalOpen && (
        <BatchInvoicesModal
          invoices={filteredInvoices}
          tenant={tenant}
          startDate={startDate}
          endDate={endDate}
          onClose={() => setIsBatchModalOpen(false)}
        />
      )}

    </div>
  );
};
