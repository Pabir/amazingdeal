import React, { useState } from 'react';
import { 
  FileText, Search, Printer, Share2, ArrowRightLeft, 
  Calendar, CheckCircle2, Clock, AlertTriangle, ChevronRight, Eye
} from 'lucide-react';
import { Invoice, Tenant } from '../types';
import { ApiService } from '../services/api';

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

  const filteredInvoices = invoices.filter(inv => {
    const matchesType = activeDocType === 'ALL' || inv.documentType === activeDocType;
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.partyName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.partyPhone && inv.partyPhone.includes(search));
    return matchesType && matchesSearch;
  });

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
      
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
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

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search bill #, customer name, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 stroke-[1.2] mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No invoices or bills found</p>
            <p className="text-xs text-slate-400 mt-1">Generate your first bill via the Counter POS</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Bill No & Date</th>
                  <th className="p-3.5">Customer / Party</th>
                  <th className="p-3.5">Document Type</th>
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
                        <div className="font-semibold text-slate-800">{inv.partyName}</div>
                        {inv.partyPhone && (
                          <div className="text-[10px] text-slate-500">{inv.partyPhone}</div>
                        )}
                        {inv.partyGstin && (
                          <div className="text-[10px] font-mono text-indigo-700">GSTIN: {inv.partyGstin}</div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {inv.documentType.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Taxable */}
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        ₹{inv.subtotal.toFixed(2)}
                      </td>

                      {/* Total Tax */}
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        ₹{totalTax.toFixed(2)}
                      </td>

                      {/* Total Amount */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{inv.totalAmount.toFixed(2)}
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
                            Due: ₹{inv.balanceDue.toFixed(2)}
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

    </div>
  );
};
