import { Invoice, InvoiceItem, Tenant } from '../types';
import { getGstStateByCode } from '../data/gstStatesData';

// XML Character escaping for Excel SpreadsheetML
function escapeXml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Format Date as DD/MM/YYYY
function formatDate(dateStr?: string): string {
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

export interface HsnSummaryItem {
  hsnCode: string;
  description: string;
  unit: string;
  totalQuantity: number;
  totalTaxable: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalValue: number;
}

export interface GstSummaryData {
  totalInvoices: number;
  b2bCount: number;
  b2cCount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  hsnList: HsnSummaryItem[];
}

// Calculate consolidated GST Summary metrics & HSN table
export function calculateGstSummary(invoices: Invoice[]): GstSummaryData {
  let b2bCount = 0;
  let b2cCount = 0;
  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let roundOff = 0;
  let grandTotal = 0;
  let paidAmount = 0;
  let balanceDue = 0;

  const hsnMap: { [key: string]: HsnSummaryItem } = {};

  invoices.forEach((inv) => {
    const isB2B = Boolean(inv.partyGstin && inv.partyGstin.trim().length >= 15);
    if (isB2B) b2bCount++;
    else b2cCount++;

    taxableAmount += Number(inv.subtotal || 0);
    cgstAmount += Number(inv.cgstAmount || 0);
    sgstAmount += Number(inv.sgstAmount || 0);
    igstAmount += Number(inv.igstAmount || 0);
    roundOff += Number(inv.roundOff || 0);
    grandTotal += Number(inv.totalAmount || 0);
    paidAmount += Number(inv.paidAmount || 0);
    balanceDue += Number(inv.balanceDue || 0);

    // Aggregate line items for HSN Table
    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach((item: InvoiceItem) => {
        const hsn = (item.hsnSac || 'General').trim();
        const key = `${hsn}_${item.unit || 'pcs'}`;

        const itemQty = Number(item.quantity || 1);
        const itemTaxable = Number(item.unitPrice || 0) * itemQty - (Number(item.discountPct || 0) * Number(item.unitPrice || 0) * itemQty) / 100;
        const itemCgst = Number(item.cgstAmount || 0);
        const itemSgst = Number(item.sgstAmount || 0);
        const itemIgst = Number(item.igstAmount || 0);
        const itemTotal = Number(item.totalAmount || itemTaxable + itemCgst + itemSgst + itemIgst);

        if (!hsnMap[key]) {
          hsnMap[key] = {
            hsnCode: hsn,
            description: item.itemName || 'Product Item',
            unit: (item.unit || 'pcs').toUpperCase(),
            totalQuantity: 0,
            totalTaxable: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalTax: 0,
            totalValue: 0,
          };
        }

        hsnMap[key].totalQuantity += itemQty;
        hsnMap[key].totalTaxable += itemTaxable;
        hsnMap[key].cgstAmount += itemCgst;
        hsnMap[key].sgstAmount += itemSgst;
        hsnMap[key].igstAmount += itemIgst;
        hsnMap[key].totalTax += itemCgst + itemSgst + itemIgst;
        hsnMap[key].totalValue += itemTotal;
      });
    }
  });

  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const hsnList = Object.values(hsnMap).sort((a, b) => b.totalTaxable - a.totalTaxable);

  return {
    totalInvoices: invoices.length,
    b2bCount,
    b2cCount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    roundOff,
    grandTotal,
    paidAmount,
    balanceDue,
    hsnList,
  };
}

/**
 * Generates and downloads a multi-sheet Microsoft Excel XML Workbook (.xls)
 * Sheets:
 *  1. Sales_Register: Complete list of outward supplies
 *  2. GSTR1_B2B_Table4: Invoices with customer GSTIN (matches GST portal B2B table)
 *  3. GSTR1_B2C_Table7: Invoices for retail/unregistered buyers
 *  4. HSN_Summary_Table12: HSN-wise summary of outward supplies
 */
export function exportGstExcelReport(
  invoices: Invoice[],
  tenant: Tenant | null,
  startDate?: string,
  endDate?: string
) {
  const storeName = tenant?.storeName || 'Merchant Store';
  const merchantGstin = tenant?.gstin || 'Unregistered';
  const merchantState = tenant?.stateCode ? getGstStateByCode(tenant.stateCode)?.label || tenant.stateCode : '07-Delhi';
  const periodText = startDate && endDate ? `${formatDate(startDate)} to ${formatDate(endDate)}` : 'All Available Records';
  const reportDate = formatDate(new Date().toISOString());

  const summary = calculateGstSummary(invoices);

  // Split into B2B & B2C
  const b2bInvoices = invoices.filter((i) => i.partyGstin && i.partyGstin.trim().length >= 15);
  const b2cInvoices = invoices.filter((i) => !i.partyGstin || i.partyGstin.trim().length < 15);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>${escapeXml(storeName)}</Author>
  <Created>${new Date().toISOString()}</Created>
  <Company>AmazingDeal Platform</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="StoreTitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="15" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Bold="1" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="MetaVal">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="HeaderIndigo">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4338CA" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderEmerald">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#047857" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderAmber">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#B45309" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="CellNum">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="TotalLabel">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TotalNum">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
 </Styles>`;

  // -------------------------------------------------------------
  // SHEET 1: Master Sales Register
  // -------------------------------------------------------------
  xml += `
 <Worksheet ss:Name="Sales_Register">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="35"/>
   <Column ss:Width="110"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="140"/>
   <Column ss:Width="120"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="75"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   
   <Row ss:Height="24">
    <Cell ss:MergeAcross="7" ss:StyleID="StoreTitle"><Data ss:Type="String">${escapeXml(storeName)} - GST Sales Register</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">GSTIN:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(merchantGstin)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">State / POS:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(merchantState)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Report Period:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(periodText)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Generated:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(reportDate)}</Data></Cell>
   </Row>
   <Row ss:Height="8"/>
   <Row ss:Height="26">
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Sl No</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Bill / Invoice No</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Doc Type</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Customer / Party Name</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Party GSTIN</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Mobile</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Place of Supply</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Taxable (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">CGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">SGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">IGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Total Tax (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Round Off</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Total Amount (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Pay Mode</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Status</Data></Cell>
   </Row>`;

  invoices.forEach((inv, index) => {
    const posState = getGstStateByCode(inv.placeOfSupply)?.label || inv.placeOfSupply || merchantState;
    const invTax = Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0) + Number(inv.igstAmount || 0);

    xml += `
   <Row ss:Height="19">
    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${index + 1}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(inv.invoiceNumber)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(formatDate(inv.invoiceDate))}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(inv.documentType.replace('_', ' '))}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(inv.partyName)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(inv.partyGstin || '-')}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(inv.partyPhone || '-')}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(posState)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.subtotal || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.cgstAmount || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.sgstAmount || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.igstAmount || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${invTax.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.roundOff || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.totalAmount || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(inv.paymentMode || '-')}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(inv.paymentStatus || '-')}</Data></Cell>
   </Row>`;
  });

  // Totals Row
  xml += `
   <Row ss:Height="22">
    <Cell ss:MergeAcross="7" ss:StyleID="TotalLabel"><Data ss:Type="String">TOTALS (All ${invoices.length} Invoices):</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${summary.taxableAmount.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${summary.cgstAmount.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${summary.sgstAmount.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${summary.igstAmount.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${summary.totalTax.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${summary.roundOff.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${summary.grandTotal.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalLabel"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="TotalLabel"><Data ss:Type="String">-</Data></Cell>
   </Row>
  </Table>
 </Worksheet>`;

  // -------------------------------------------------------------
  // SHEET 2: GSTR-1 Table 4 (B2B Registered Invoices)
  // -------------------------------------------------------------
  xml += `
 <Worksheet ss:Name="GSTR1_B2B_Table4">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="125"/>
   <Column ss:Width="140"/>
   <Column ss:Width="110"/>
   <Column ss:Width="80"/>
   <Column ss:Width="95"/>
   <Column ss:Width="110"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="85"/>
   <Column ss:Width="65"/>
   <Column ss:Width="85"/>
   <Column ss:Width="75"/>
   <Column ss:Width="75"/>
   <Column ss:Width="75"/>
   <Column ss:Width="65"/>
   
   <Row ss:Height="24">
    <Cell ss:MergeAcross="8" ss:StyleID="StoreTitle"><Data ss:Type="String">GSTR-1 Table 4: Taxable Outward Supplies to Registered Persons (B2B)</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Supplier GSTIN:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(merchantGstin)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Period:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(periodText)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Total B2B Bills:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${b2bInvoices.length}</Data></Cell>
   </Row>
   <Row ss:Height="8"/>
   <Row ss:Height="26">
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">GSTIN/UIN of Recipient</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">Receiver Name</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">Invoice Number</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">Invoice Date</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">Invoice Value (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">Place Of Supply</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">Reverse Charge</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">Applicable % Rate</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">Invoice Type</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">Rate (%)</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">Taxable Value (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">IGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">CGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">SGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderEmerald"><Data ss:Type="String">Cess (₹)</Data></Cell>
   </Row>`;

  let b2bTotalVal = 0;
  let b2bTotalTaxable = 0;
  let b2bTotalIgst = 0;
  let b2bTotalCgst = 0;
  let b2bTotalSgst = 0;

  b2bInvoices.forEach((inv) => {
    const posState = getGstStateByCode(inv.placeOfSupply)?.label || inv.placeOfSupply || merchantState;
    b2bTotalVal += Number(inv.totalAmount || 0);
    b2bTotalTaxable += Number(inv.subtotal || 0);
    b2bTotalIgst += Number(inv.igstAmount || 0);
    b2bTotalCgst += Number(inv.cgstAmount || 0);
    b2bTotalSgst += Number(inv.sgstAmount || 0);

    // Approximate average rate if multiple rates
    const avgRate = Number(inv.subtotal) > 0 
      ? Math.round(((Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0) + Number(inv.igstAmount || 0)) / Number(inv.subtotal)) * 100) 
      : 0;

    xml += `
   <Row ss:Height="19">
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(inv.partyGstin)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(inv.partyName)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(inv.invoiceNumber)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(formatDate(inv.invoiceDate))}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.totalAmount || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(posState)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">N</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">100</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">Regular</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${avgRate}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.subtotal || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.igstAmount || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.cgstAmount || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.sgstAmount || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">0.00</Data></Cell>
   </Row>`;
  });

  xml += `
   <Row ss:Height="22">
    <Cell ss:MergeAcross="3" ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAL B2B (Table 4):</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${b2bTotalVal.toFixed(2)}</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="TotalLabel"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${b2bTotalTaxable.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${b2bTotalIgst.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${b2bTotalCgst.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${b2bTotalSgst.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">0.00</Data></Cell>
   </Row>
  </Table>
 </Worksheet>`;

  // -------------------------------------------------------------
  // SHEET 3: GSTR-1 Table 7 (B2C Retail / Unregistered Supplies)
  // -------------------------------------------------------------
  xml += `
 <Worksheet ss:Name="GSTR1_B2C_Table7">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="60"/>
   <Column ss:Width="110"/>
   <Column ss:Width="80"/>
   <Column ss:Width="130"/>
   <Column ss:Width="120"/>
   <Column ss:Width="65"/>
   <Column ss:Width="85"/>
   <Column ss:Width="75"/>
   <Column ss:Width="75"/>
   <Column ss:Width="75"/>
   <Column ss:Width="95"/>
   
   <Row ss:Height="24">
    <Cell ss:MergeAcross="6" ss:StyleID="StoreTitle"><Data ss:Type="String">GSTR-1 Table 7: Outward Supplies to Unregistered Persons (B2C Others)</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Supplier GSTIN:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(merchantGstin)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Period:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(periodText)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Total B2C Bills:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${b2cInvoices.length}</Data></Cell>
   </Row>
   <Row ss:Height="8"/>
   <Row ss:Height="26">
    <Cell ss:StyleID="HeaderAmber"><Data ss:Type="String">Type</Data></Cell>
    <Cell ss:StyleID="HeaderAmber"><Data ss:Type="String">Bill Number</Data></Cell>
    <Cell ss:StyleID="HeaderAmber"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="HeaderAmber"><Data ss:Type="String">Customer Name</Data></Cell>
    <Cell ss:StyleID="HeaderAmber"><Data ss:Type="String">Place Of Supply</Data></Cell>
    <Cell ss:StyleID="HeaderAmber"><Data ss:Type="String">Rate (%)</Data></Cell>
    <Cell ss:StyleID="HeaderAmber"><Data ss:Type="String">Taxable Value (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderAmber"><Data ss:Type="String">CGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderAmber"><Data ss:Type="String">SGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderAmber"><Data ss:Type="String">IGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderAmber"><Data ss:Type="String">Total Amount (₹)</Data></Cell>
   </Row>`;

  let b2cTotalVal = 0;
  let b2cTotalTaxable = 0;
  let b2cTotalCgst = 0;
  let b2cTotalSgst = 0;
  let b2cTotalIgst = 0;

  b2cInvoices.forEach((inv) => {
    const posState = getGstStateByCode(inv.placeOfSupply)?.label || inv.placeOfSupply || merchantState;
    b2cTotalVal += Number(inv.totalAmount || 0);
    b2cTotalTaxable += Number(inv.subtotal || 0);
    b2cTotalCgst += Number(inv.cgstAmount || 0);
    b2cTotalSgst += Number(inv.sgstAmount || 0);
    b2cTotalIgst += Number(inv.igstAmount || 0);

    const avgRate = Number(inv.subtotal) > 0 
      ? Math.round(((Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0) + Number(inv.igstAmount || 0)) / Number(inv.subtotal)) * 100) 
      : 0;

    xml += `
   <Row ss:Height="19">
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">OE</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(inv.invoiceNumber)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(formatDate(inv.invoiceDate))}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(inv.partyName)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(posState)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${avgRate}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.subtotal || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.cgstAmount || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.sgstAmount || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.igstAmount || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${Number(inv.totalAmount || 0).toFixed(2)}</Data></Cell>
   </Row>`;
  });

  xml += `
   <Row ss:Height="22">
    <Cell ss:MergeAcross="5" ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAL B2C (Table 7):</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${b2cTotalTaxable.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${b2cTotalCgst.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${b2cTotalSgst.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${b2cTotalIgst.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${b2cTotalVal.toFixed(2)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>`;

  // -------------------------------------------------------------
  // SHEET 4: GSTR-1 Table 12 (HSN Summary of Outward Supplies)
  // -------------------------------------------------------------
  xml += `
 <Worksheet ss:Name="HSN_Summary_Table12">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="40"/>
   <Column ss:Width="95"/>
   <Column ss:Width="160"/>
   <Column ss:Width="70"/>
   <Column ss:Width="80"/>
   <Column ss:Width="95"/>
   <Column ss:Width="90"/>
   <Column ss:Width="75"/>
   <Column ss:Width="75"/>
   <Column ss:Width="75"/>
   <Column ss:Width="85"/>
   
   <Row ss:Height="24">
    <Cell ss:MergeAcross="6" ss:StyleID="StoreTitle"><Data ss:Type="String">GSTR-1 Table 12: HSN-wise Summary of Outward Supplies</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Supplier GSTIN:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(merchantGstin)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Period:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${escapeXml(periodText)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Distinct HSN Codes:</Data></Cell>
    <Cell ss:StyleID="MetaVal"><Data ss:Type="String">${summary.hsnList.length}</Data></Cell>
   </Row>
   <Row ss:Height="8"/>
   <Row ss:Height="26">
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Sl No</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">HSN / SAC Code</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Description</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">UQC (Unit)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Total Qty</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Total Value (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Taxable Value (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">IGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">CGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">SGST (₹)</Data></Cell>
    <Cell ss:StyleID="HeaderIndigo"><Data ss:Type="String">Total Tax (₹)</Data></Cell>
   </Row>`;

  let hsnTotalQty = 0;
  let hsnTotalVal = 0;
  let hsnTotalTaxable = 0;
  let hsnTotalIgst = 0;
  let hsnTotalCgst = 0;
  let hsnTotalSgst = 0;
  let hsnTotalTax = 0;

  summary.hsnList.forEach((hsn, index) => {
    hsnTotalQty += hsn.totalQuantity;
    hsnTotalVal += hsn.totalValue;
    hsnTotalTaxable += hsn.totalTaxable;
    hsnTotalIgst += hsn.igstAmount;
    hsnTotalCgst += hsn.cgstAmount;
    hsnTotalSgst += hsn.sgstAmount;
    hsnTotalTax += hsn.totalTax;

    xml += `
   <Row ss:Height="19">
    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${index + 1}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(hsn.hsnCode)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(hsn.description)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(hsn.unit)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${hsn.totalQuantity.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${hsn.totalValue.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${hsn.totalTaxable.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${hsn.igstAmount.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${hsn.cgstAmount.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${hsn.sgstAmount.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="CellNum"><Data ss:Type="Number">${hsn.totalTax.toFixed(2)}</Data></Cell>
   </Row>`;
  });

  xml += `
   <Row ss:Height="22">
    <Cell ss:MergeAcross="3" ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAL (HSN Summary Table 12):</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${hsnTotalQty.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${hsnTotalVal.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${hsnTotalTaxable.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${hsnTotalIgst.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${hsnTotalCgst.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${hsnTotalSgst.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${hsnTotalTax.toFixed(2)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  // Create downloadable Blob
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const filename = `GST_Report_${storeName.replace(/\s+/g, '_')}_${startDate || 'Start'}_to_${endDate || 'Current'}.xls`;
  downloadBlob(blob, filename);
}

/**
 * Generates and downloads a universal CSV sales register with UTF-8 BOM
 */
export function exportGstCsvReport(
  invoices: Invoice[],
  tenant: Tenant | null,
  startDate?: string,
  endDate?: string
) {
  const storeName = tenant?.storeName || 'Merchant Store';
  const merchantGstin = tenant?.gstin || 'Unregistered';
  const periodText = startDate && endDate ? `${formatDate(startDate)} to ${formatDate(endDate)}` : 'All Dates';

  const rows: string[][] = [
    [`GST Sales Register - ${storeName}`],
    [`Merchant GSTIN: ${merchantGstin}`, `Period: ${periodText}`, `Generated: ${formatDate(new Date().toISOString())}`],
    [],
    [
      'Sl No',
      'Invoice Number',
      'Invoice Date',
      'Document Type',
      'Customer Name',
      'Customer GSTIN',
      'Customer Phone',
      'Place of Supply',
      'Taxable Value (INR)',
      'CGST (INR)',
      'SGST (INR)',
      'IGST (INR)',
      'Total Tax (INR)',
      'Round Off',
      'Total Amount (INR)',
      'Payment Mode',
      'Payment Status',
    ],
  ];

  let sumTaxable = 0;
  let sumCgst = 0;
  let sumSgst = 0;
  let sumIgst = 0;
  let sumTotal = 0;

  invoices.forEach((inv, index) => {
    const posState = getGstStateByCode(inv.placeOfSupply)?.label || inv.placeOfSupply || '07-Delhi';
    const invTax = Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0) + Number(inv.igstAmount || 0);

    sumTaxable += Number(inv.subtotal || 0);
    sumCgst += Number(inv.cgstAmount || 0);
    sumSgst += Number(inv.sgstAmount || 0);
    sumIgst += Number(inv.igstAmount || 0);
    sumTotal += Number(inv.totalAmount || 0);

    rows.push([
      String(index + 1),
      inv.invoiceNumber,
      formatDate(inv.invoiceDate),
      inv.documentType.replace('_', ' '),
      inv.partyName,
      inv.partyGstin || '-',
      inv.partyPhone || '-',
      posState,
      Number(inv.subtotal || 0).toFixed(2),
      Number(inv.cgstAmount || 0).toFixed(2),
      Number(inv.sgstAmount || 0).toFixed(2),
      Number(inv.igstAmount || 0).toFixed(2),
      invTax.toFixed(2),
      Number(inv.roundOff || 0).toFixed(2),
      Number(inv.totalAmount || 0).toFixed(2),
      inv.paymentMode || '-',
      inv.paymentStatus || '-',
    ]);
  });

  // Totals Row
  rows.push([
    'TOTALS',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    sumTaxable.toFixed(2),
    sumCgst.toFixed(2),
    sumSgst.toFixed(2),
    sumIgst.toFixed(2),
    (sumCgst + sumSgst + sumIgst).toFixed(2),
    '',
    sumTotal.toFixed(2),
    '',
    '',
  ]);

  // Convert array to CSV string
  const csvContent = rows
    .map((r) =>
      r
        .map((cell) => {
          const str = String(cell || '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');

  // Add UTF-8 BOM (\uFEFF) so Excel opens UTF-8 symbols properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `GST_Sales_Register_${storeName.replace(/\s+/g, '_')}_${startDate || 'Start'}_to_${endDate || 'Current'}.csv`;
  downloadBlob(blob, filename);
}

// Download helper
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

