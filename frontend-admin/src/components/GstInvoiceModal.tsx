import React, { useRef } from 'react';
import { X, Printer, Share2, Download, CheckCircle2, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { Invoice, Tenant } from '../types';
import { printInvoices } from '../utils/printInvoices';

interface GstInvoiceModalProps {
  invoice: Invoice;
  tenant: Tenant | null;
  onClose: () => void;
}

// Convert numbers into Indian Currency words (e.g. "One Thousand Four Hundred Only")
function numberToIndianWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(num);
  if (n === 0) return 'Zero Rupees Only';

  function inWords(val: number): string {
    let str = '';
    if (val > 19) {
      str += b[Math.floor(val / 10)] + ' ' + a[val % 10];
    } else {
      str += a[val];
    }
    return str;
  }

  let crore = Math.floor(n / 10000000);
  let lakh = Math.floor((n % 10000000) / 100000);
  let thousand = Math.floor((n % 100000) / 1000);
  let hundred = Math.floor((n % 1000) / 100);
  let rest = Math.floor(n % 100);

  let res = '';
  if (crore > 0) res += inWords(crore) + 'Crore ';
  if (lakh > 0) res += inWords(lakh) + 'Lakh ';
  if (thousand > 0) res += inWords(thousand) + 'Thousand ';
  if (hundred > 0) res += inWords(hundred) + 'Hundred ';
  if (rest > 0) res += inWords(rest);

  return 'INR ' + res.trim() + ' Only';
}

export const GstInvoiceModal: React.FC<GstInvoiceModalProps> = ({ invoice, tenant, onClose }) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    printInvoices([invoice], tenant);
  };

  const handleWhatsAppShare = () => {
    const phone = invoice.partyPhone?.replace(/\D/g, '') || '';
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;

    const summaryText = `*Tax Invoice from ${tenant?.storeName || 'Store'}*
Invoice No: *${invoice.invoiceNumber}*
Date: ${invoice.invoiceDate}
Customer: ${invoice.partyName}
Amount Due: *₹${invoice.balanceDue > 0 ? invoice.balanceDue.toFixed(2) : invoice.totalAmount.toFixed(2)}*
Payment Status: ${invoice.paymentStatus}
${tenant?.upiVpa ? `\nPay via UPI: upi://pay?pa=${tenant.upiVpa}&pn=${encodeURIComponent(tenant.storeName || '')}&am=${invoice.totalAmount}&tn=${invoice.invoiceNumber}` : ''}
\nThank you for doing business with us!`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(summaryText)}`
      : `https://wa.me/?text=${encodeURIComponent(summaryText)}`;

    window.open(url, '_blank');
  };

  const isIntrastate = (invoice.cgstAmount || 0) > 0 || (invoice.sgstAmount || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Modal Action Header (Excluded from print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {invoice.documentType.replace('_', ' ')}
            </span>
            <span className="font-mono text-sm text-slate-500 font-bold">{invoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsAppShare}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Share on WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={printAreaRef} className="p-6 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible text-slate-800 text-xs sm:text-sm font-sans bg-white">
          
          {/* Header Banner: Store Branding & Tax Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-slate-800 gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {tenant?.storeName || 'AmazingDeal Merchant'}
              </h1>
              {tenant?.storeAddress && (
                <p className="text-slate-600 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{tenant.storeAddress}</span>
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-700">
                {tenant?.gstin && (
                  <span className="font-semibold">GSTIN: <span className="font-mono text-slate-900">{tenant.gstin}</span></span>
                )}
                {tenant?.ownerPhone && (
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{tenant.ownerPhone}</span>
                  </span>
                )}
                {tenant?.ownerEmail && (
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{tenant.ownerEmail}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-right sm:self-start bg-slate-50 p-3 rounded-lg border border-slate-200 w-full sm:w-auto">
              <div className="text-xs uppercase tracking-wider font-extrabold text-indigo-700">
                {invoice.documentType.replace('_', ' ')}
              </div>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Date: <span className="font-semibold text-slate-700">{invoice.invoiceDate}</span>
              </div>
              <div className="text-xs text-slate-500">
                Place of Supply: <span className="font-semibold text-slate-700">{invoice.placeOfSupply}</span>
              </div>
            </div>
          </div>

          {/* Customer / Party Billing Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 bg-slate-50/50 p-4 rounded-xl mt-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">Billed To (Customer):</div>
              <div className="font-bold text-slate-900 text-sm">{invoice.partyName}</div>
              {invoice.partyGstin && (
                <div className="text-xs font-semibold text-slate-700 font-mono">
                  GSTIN: {invoice.partyGstin}
                </div>
              )}
              {invoice.partyPhone && (
                <div className="text-xs text-slate-600">Phone: {invoice.partyPhone}</div>
              )}
              {invoice.partyAddress && (
                <div className="text-xs text-slate-500 mt-0.5">{invoice.partyAddress}</div>
              )}
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">Invoice Details:</div>
              <div className="text-xs">
                <span className="text-slate-500">Payment Mode: </span>
                <span className="font-bold text-slate-800 uppercase">{invoice.paymentMode}</span>
              </div>
              <div className="text-xs">
                <span className="text-slate-500">Status: </span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  invoice.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                  invoice.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {invoice.paymentStatus}
                </span>
              </div>
              {invoice.dueDate && (
                <div className="text-xs text-slate-500">
                  Due Date: <span className="font-semibold text-slate-700">{invoice.dueDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-2.5 text-center w-10 border-r border-slate-200">#</th>
                  <th className="p-2.5 border-r border-slate-200">Item Description</th>
                  <th className="p-2.5 text-center w-20 border-r border-slate-200">HSN/SAC</th>
                  <th className="p-2.5 text-right w-16 border-r border-slate-200">Qty</th>
                  <th className="p-2.5 text-right w-20 border-r border-slate-200">Rate</th>
                  <th className="p-2.5 text-right w-16 border-r border-slate-200">Disc %</th>
                  <th className="p-2.5 text-center w-16 border-r border-slate-200">GST %</th>
                  {isIntrastate ? (
                    <>
                      <th className="p-2.5 text-right w-20 border-r border-slate-200">CGST</th>
                      <th className="p-2.5 text-right w-20 border-r border-slate-200">SGST</th>
                    </>
                  ) : (
                    <th className="p-2.5 text-right w-20 border-r border-slate-200">IGST</th>
                  )}
                  <th className="p-2.5 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {invoice.items && invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2.5 text-center text-slate-400 font-mono border-r border-slate-200">{idx + 1}</td>
                    <td className="p-2.5 font-medium text-slate-900 border-r border-slate-200">
                      {item.itemName}
                    </td>
                    <td className="p-2.5 text-center text-slate-600 font-mono border-r border-slate-200">{item.hsnSac || '-'}</td>
                    <td className="p-2.5 text-right font-semibold text-slate-800 border-r border-slate-200">
                      {item.quantity} <span className="text-[10px] text-slate-400 font-normal">{item.unit || 'pcs'}</span>
                    </td>
                    <td className="p-2.5 text-right font-mono text-slate-700 border-r border-slate-200">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="p-2.5 text-right font-mono text-slate-500 border-r border-slate-200">{item.discountPct ? `${item.discountPct}%` : '0%'}</td>
                    <td className="p-2.5 text-center font-mono font-semibold text-slate-700 border-r border-slate-200">{item.gstRate || 0}%</td>
                    {isIntrastate ? (
                      <>
                        <td className="p-2.5 text-right font-mono text-slate-600 border-r border-slate-200">₹{(item.cgstAmount || 0).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono text-slate-600 border-r border-slate-200">₹{(item.sgstAmount || 0).toFixed(2)}</td>
                      </>
                    ) : (
                      <td className="p-2.5 text-right font-mono text-slate-600 border-r border-slate-200">₹{(item.igstAmount || 0).toFixed(2)}</td>
                    )}
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">₹{item.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Totals & Bank / Legal Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-4 border-t-2 border-slate-800">
            {/* Left: Amount in Words & Bank Details */}
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total in Words:</span>
                <div className="font-semibold text-slate-900 text-xs mt-0.5 italic">
                  {numberToIndianWords(invoice.totalAmount)}
                </div>
              </div>

              {(tenant?.bankName || tenant?.upiVpa) && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Bank & UPI Payment Details</span>
                  </div>
                  {tenant?.bankName && (
                    <div className="text-slate-600">
                      Bank: <span className="font-semibold text-slate-800">{tenant.bankName}</span>
                      {tenant.bankBranch && <span> ({tenant.bankBranch})</span>}
                    </div>
                  )}
                  {tenant?.bankAccountNumber && (
                    <div className="text-slate-600 font-mono">
                      A/C No: <span className="font-bold text-slate-900">{tenant.bankAccountNumber}</span>
                    </div>
                  )}
                  {tenant?.bankIfsc && (
                    <div className="text-slate-600 font-mono">
                      IFSC: <span className="font-bold text-slate-900">{tenant.bankIfsc}</span>
                    </div>
                  )}
                  {tenant?.upiVpa && (
                    <div className="text-emerald-700 font-semibold font-mono pt-1">
                      UPI ID: {tenant.upiVpa}
                    </div>
                  )}
                </div>
              )}

              {invoice.termsConditions && (
                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Terms & Conditions: </span>
                  {invoice.termsConditions}
                </div>
              )}
            </div>

            {/* Right: Tax Breakdown & Final Totals */}
            <div className="space-y-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900">₹{invoice.subtotal.toFixed(2)}</span>
                </div>

                {invoice.discountAmount && invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold">-₹{invoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {invoice.cgstAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono text-slate-800">₹{invoice.cgstAmount.toFixed(2)}</span>
                  </div>
                )}

                {invoice.sgstAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>State GST (SGST):</span>
                    <span className="font-mono text-slate-800">₹{invoice.sgstAmount.toFixed(2)}</span>
                  </div>
                )}

                {invoice.igstAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Integrated GST (IGST):</span>
                    <span className="font-mono text-slate-800">₹{invoice.igstAmount.toFixed(2)}</span>
                  </div>
                )}

                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Round Off:</span>
                    <span className="font-mono">{invoice.roundOff > 0 ? `+₹${invoice.roundOff.toFixed(2)}` : `-₹${Math.abs(invoice.roundOff).toFixed(2)}`}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-black text-slate-900">
                  <span className="text-base uppercase tracking-tight">Grand Total:</span>
                  <span className="text-lg font-mono text-indigo-700">₹{invoice.totalAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600 pt-1 text-xs">
                  <span>Amount Paid ({invoice.paymentMode}):</span>
                  <span className="font-mono font-semibold text-emerald-700">₹{invoice.paidAmount.toFixed(2)}</span>
                </div>

                {invoice.balanceDue > 0 && (
                  <div className="flex justify-between font-bold text-amber-700 bg-amber-50 p-1.5 rounded">
                    <span>Balance Due (Udhaar):</span>
                    <span className="font-mono">₹{invoice.balanceDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Authorized Signatory Box */}
              <div className="pt-6 text-right">
                <div className="h-12 flex items-end justify-end">
                  <span className="text-[10px] text-slate-400 font-mono">Digitally Signed via AmazingDeal</span>
                </div>
                <div className="text-xs font-bold text-slate-800 uppercase">
                  For {tenant?.storeName || 'AmazingDeal Merchant'}
                </div>
                <div className="text-[10px] text-slate-400">Authorized Signatory</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
