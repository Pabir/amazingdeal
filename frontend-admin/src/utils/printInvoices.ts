import { Invoice, InvoiceItem, Tenant } from '../types';
import { getGstStateByCode } from '../data/gstStatesData';

// Convert numbers into Indian Currency words (e.g. "INR One Thousand Four Hundred Only")
export function numberToIndianWords(num: number): string {
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

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = Math.floor(n % 100);

  let res = '';
  if (crore > 0) res += inWords(crore) + 'Crore ';
  if (lakh > 0) res += inWords(lakh) + 'Lakh ';
  if (thousand > 0) res += inWords(thousand) + 'Thousand ';
  if (hundred > 0) res += inWords(hundred) + 'Hundred ';
  if (rest > 0) res += inWords(rest);

  return 'INR ' + res.trim() + ' Only';
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates standalone, self-contained HTML for printing invoices.
 * Designed specifically for A4 paged media with zero blank page issues.
 */
export function generatePrintableInvoicesHtml(invoices: Invoice[], tenant: Tenant | null): string {
  const storeName = tenant?.storeName || 'AmazingDeal Store';
  const merchantState = tenant?.stateCode ? getGstStateByCode(tenant.stateCode)?.label || tenant.stateCode : '07-Delhi';
  const merchantGstin = tenant?.gstin || '';
  const merchantPan = tenant?.pan || (merchantGstin.length >= 12 ? merchantGstin.substring(2, 12) : '');

  const invoicesHtml = invoices.map((invoice, index) => {
    const isIntrastate = (invoice.cgstAmount || 0) > 0 || (invoice.sgstAmount || 0) > 0;
    const posState = getGstStateByCode(invoice.placeOfSupply)?.label || invoice.placeOfSupply || merchantState;
    const isB2B = Boolean(invoice.partyGstin && invoice.partyGstin.trim().length >= 15);

    const itemsRows = (invoice.items && invoice.items.length > 0)
      ? invoice.items.map((item, idx) => {
          const qty = Number(item.quantity || 1);
          const rate = Number(item.unitPrice || 0);
          const discountPct = Number(item.discountPct || 0);
          const taxable = rate * qty - (discountPct * rate * qty) / 100;
          const total = Number(item.totalAmount || taxable);
          const gstRate = Number(item.gstRate || 0);

          return `
            <tr>
              <td class="text-center text-muted">${idx + 1}</td>
              <td class="font-medium text-dark">${escapeHtml(item.itemName)}</td>
              <td class="text-center font-mono">${escapeHtml(item.hsnSac || '-')}</td>
              <td class="text-right font-mono">${qty} ${escapeHtml(item.unit || 'pcs')}</td>
              <td class="text-right font-mono">&#8377;${rate.toFixed(2)}</td>
              <td class="text-right font-mono">&#8377;${taxable.toFixed(2)}</td>
              <td class="text-center font-mono">${gstRate}%</td>
              <td class="text-right font-mono font-bold text-dark">&#8377;${total.toFixed(2)}</td>
            </tr>
          `;
        }).join('')
      : `
        <tr>
          <td colspan="8" class="text-center text-muted" style="padding: 16px 0;">Order Items Details</td>
        </tr>
      `;

    return `
      <div class="invoice-page ${index > 0 ? 'page-break' : ''}">
        
        <!-- 1. Header: Store Info & Document Title -->
        <div class="header">
          <div>
            <div class="store-name">${escapeHtml(storeName)}</div>
            <div class="store-address">${escapeHtml(tenant?.storeAddress || 'Main Market, City')}</div>
            <div class="store-contact">
              ${tenant?.ownerPhone ? `<span>Phone: ${escapeHtml(tenant.ownerPhone)}</span>` : ''}
              ${tenant?.ownerEmail ? `<span>Email: ${escapeHtml(tenant.ownerEmail)}</span>` : ''}
            </div>
          </div>
          <div class="doc-badge-container">
            <div class="doc-badge">${escapeHtml(invoice.documentType.replace(/_/g, ' '))}</div>
            <div class="store-tax-info">
              ${merchantGstin ? `<div><strong>GSTIN:</strong> ${escapeHtml(merchantGstin)}</div>` : ''}
              ${merchantPan ? `<div><strong>PAN:</strong> ${escapeHtml(merchantPan)}</div>` : ''}
              <div><strong>State:</strong> ${escapeHtml(merchantState)}</div>
            </div>
          </div>
        </div>

        <!-- 2. Metadata & Customer Billing -->
        <div class="meta-section">
          <div class="customer-card">
            <div class="section-label">Billed To (Customer):</div>
            <div class="customer-name">${escapeHtml(invoice.partyName)}</div>
            ${invoice.partyGstin ? `<div class="customer-gstin">GSTIN: ${escapeHtml(invoice.partyGstin)}</div>` : ''}
            ${invoice.partyPhone ? `<div class="customer-phone">Phone: ${escapeHtml(invoice.partyPhone)}</div>` : ''}
            ${invoice.partyAddress ? `<div class="customer-address">${escapeHtml(invoice.partyAddress)}</div>` : ''}
          </div>
          <div class="invoice-meta-card">
            <div><span class="text-muted">Invoice No:</span> <strong class="font-mono text-dark">${escapeHtml(invoice.invoiceNumber)}</strong></div>
            <div><span class="text-muted">Invoice Date:</span> <strong>${escapeHtml(formatDate(invoice.invoiceDate))}</strong></div>
            <div><span class="text-muted">Place of Supply:</span> <strong>${escapeHtml(posState)}</strong></div>
            <div><span class="text-muted">Reverse Charge:</span> <strong>${invoice.isReverseCharge ? 'Yes' : 'No'}</strong></div>
          </div>
        </div>

        <!-- 3. Line Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 30px;" class="text-center">#</th>
              <th>Item Description</th>
              <th class="text-center" style="width: 70px;">HSN/SAC</th>
              <th class="text-right" style="width: 65px;">Qty</th>
              <th class="text-right" style="width: 75px;">Rate (&#8377;)</th>
              <th class="text-right" style="width: 80px;">Taxable (&#8377;)</th>
              <th class="text-center" style="width: 55px;">GST %</th>
              <th class="text-right" style="width: 85px;">Total (&#8377;)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- 4. Tax Breakdown, Words & Bank Details -->
        <div class="totals-section">
          <div class="words-and-bank">
            <div class="amount-in-words">
              <strong>Amount in Words:</strong>
              <div class="words-text">${escapeHtml(numberToIndianWords(invoice.totalAmount))}</div>
            </div>

            ${tenant?.bankAccountNumber ? `
              <div class="bank-details-box">
                <div class="bank-box-title">Bank Payment Details:</div>
                <div>Bank: ${escapeHtml(tenant.bankName || 'State Bank of India')} | A/C: ${escapeHtml(tenant.bankAccountNumber)}</div>
                <div>IFSC: ${escapeHtml(tenant.bankIfsc || '-')} | Branch: ${escapeHtml(tenant.bankBranch || '-')}</div>
                ${tenant.upiVpa ? `<div>UPI ID: ${escapeHtml(tenant.upiVpa)}</div>` : ''}
              </div>
            ` : ''}
          </div>

          <div class="totals-table">
            <div class="total-row">
              <span>Taxable Subtotal:</span>
              <span class="font-mono">&#8377;${Number(invoice.subtotal || 0).toFixed(2)}</span>
            </div>

            ${isIntrastate ? `
              <div class="total-row">
                <span>CGST:</span>
                <span class="font-mono">&#8377;${Number(invoice.cgstAmount || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>SGST:</span>
                <span class="font-mono">&#8377;${Number(invoice.sgstAmount || 0).toFixed(2)}</span>
              </div>
            ` : `
              <div class="total-row">
                <span>IGST:</span>
                <span class="font-mono">&#8377;${Number(invoice.igstAmount || 0).toFixed(2)}</span>
              </div>
            `}

            ${Number(invoice.roundOff || 0) !== 0 ? `
              <div class="total-row">
                <span>Round Off:</span>
                <span class="font-mono">&#8377;${Number(invoice.roundOff || 0).toFixed(2)}</span>
              </div>
            ` : ''}

            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span class="font-mono">&#8377;${Number(invoice.totalAmount || 0).toFixed(2)}</span>
            </div>

            <div class="total-row paid-row">
              <span>Paid (${escapeHtml(invoice.paymentMode || 'CASH')}):</span>
              <span class="font-mono">&#8377;${Number(invoice.paidAmount || 0).toFixed(2)}</span>
            </div>

            ${Number(invoice.balanceDue || 0) > 0 ? `
              <div class="total-row balance-row">
                <span>Balance Due:</span>
                <span class="font-mono">&#8377;${Number(invoice.balanceDue).toFixed(2)}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 5. Footer Terms & Signature -->
        <div class="footer-section">
          <div class="terms-block">
            <div class="terms-title">Terms & Conditions:</div>
            <div class="terms-text">${escapeHtml(invoice.termsConditions || 'Goods once sold will not be taken back or exchanged. Subject to local jurisdiction.')}</div>
          </div>
          <div class="signatory-block">
            <div class="sign-line"></div>
            <div class="sign-title">Authorized Signatory</div>
            <div class="sign-store">${escapeHtml(storeName)}</div>
          </div>
        </div>

      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GST Invoices - ${escapeHtml(storeName)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 12mm 10mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      width: 100%;
      height: auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invoice-page {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
      padding: 0 0 8mm 0;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .page-break {
      page-break-before: always !important;
      break-before: page !important;
    }

    /* 1. Header */
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .store-name {
      font-size: 19px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: #0f172a;
    }

    .store-address {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }

    .store-contact {
      display: flex;
      gap: 16px;
      font-size: 10.5px;
      color: #475569;
      margin-top: 3px;
    }

    .doc-badge-container {
      text-align: right;
    }

    .doc-badge {
      display: inline-block;
      padding: 3px 9px;
      background: #0f172a;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 4px;
    }

    .store-tax-info {
      font-family: monospace;
      font-size: 10.5px;
      color: #334155;
      margin-top: 5px;
      line-height: 1.35;
    }

    /* 2. Metadata Grid */
    .meta-section {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 12px;
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .customer-card, .invoice-meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
    }

    .section-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 3px;
    }

    .customer-name {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }

    .customer-gstin {
      font-family: monospace;
      font-weight: 700;
      color: #4338ca;
      font-size: 11px;
      margin-top: 2px;
    }

    .customer-phone, .customer-address {
      font-size: 10.5px;
      color: #475569;
      margin-top: 1px;
    }

    .invoice-meta-card {
      text-align: right;
      line-height: 1.5;
    }

    /* 3. Items Table */
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }

    table.items-table th {
      background: #f1f5f9;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      padding: 6px 6px;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #334155;
      letter-spacing: 0.4px;
    }

    table.items-table td {
      padding: 6px 6px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 10.5px;
      vertical-align: middle;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-muted { color: #64748b; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .font-medium { font-weight: 600; }
    .text-dark { color: #0f172a; }

    /* 4. Totals & Words */
    .totals-section {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 14px;
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .amount-in-words {
      font-size: 10.5px;
      color: #334155;
    }

    .words-text {
      font-style: italic;
      color: #475569;
      margin-top: 2px;
    }

    .bank-details-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      font-family: monospace;
      font-size: 9.5px;
      color: #334155;
      margin-top: 8px;
      line-height: 1.4;
    }

    .bank-box-title {
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 2px;
    }

    .totals-table {
      text-align: right;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #475569;
      margin-bottom: 3px;
    }

    .total-row.grand-total {
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
      margin-top: 4px;
      font-size: 13.5px;
      font-weight: 900;
      color: #0f172a;
    }

    .total-row.paid-row {
      font-size: 10.5px;
      color: #047857;
      font-weight: 700;
    }

    .total-row.balance-row {
      font-size: 10.5px;
      color: #b45309;
      font-weight: 800;
    }

    /* 5. Footer Terms & Signature */
    .footer-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 9.5px;
      color: #64748b;
      padding-top: 4px;
    }

    .terms-block {
      max-width: 60%;
    }

    .terms-title {
      font-weight: 800;
      color: #334155;
      margin-bottom: 2px;
    }

    .terms-text {
      line-height: 1.35;
    }

    .signatory-block {
      text-align: center;
      font-family: monospace;
    }

    .sign-line {
      width: 140px;
      border-bottom: 1px solid #64748b;
      height: 35px;
      margin-bottom: 3px;
    }

    .sign-title {
      font-weight: 800;
      color: #0f172a;
    }

    .sign-store {
      font-size: 9px;
      color: #64748b;
    }
  </style>
</head>
<body>
  ${invoicesHtml}
</body>
</html>`;
}

/**
 * Triggers the browser print dialog using an isolated hidden iframe.
 * Avoids any modal clipping, viewport limits, or blank page artifacts.
 */
export function printInvoices(invoices: Invoice[], tenant: Tenant | null): void {
  if (!invoices || invoices.length === 0) {
    alert('No invoices selected to print.');
    return;
  }

  // 1. Get or create hidden print iframe
  let iframe = document.getElementById('ad-print-frame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'ad-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  // 2. Generate clean HTML
  const html = generatePrintableInvoicesHtml(invoices, tenant);

  // 3. Write document to iframe
  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) {
    alert('Print initialization failed. Please try again.');
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // 4. Trigger print once rendered
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e: any) {
      console.error('Print invocation failed:', e);
      // Fallback
      window.print();
    }
  }, 300);
}

