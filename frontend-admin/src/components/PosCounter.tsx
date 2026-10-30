import React, { useState, useEffect, useRef } from 'react';
import { 
  Barcode, Search, Plus, Trash2, Printer, Check, User, Phone, 
  CreditCard, Smartphone, Banknote, ShieldAlert, FileText, ArrowRight, 
  RotateCcw, Sparkles, QrCode, X, Layers
} from 'lucide-react';
import { Product, Party, Invoice, InvoiceItem, Tenant } from '../types';
import { ApiService } from '../services/api';
import { GST_INDIAN_STATES } from '../data/gstStatesData';

interface PosCounterProps {
  tenant: Tenant | null;
  products: Product[];
  parties: Party[];
  onOpenA4Invoice: (invoice: Invoice) => void;
  onOpenThermalReceipt: (invoice: Invoice) => void;
  onRefreshParties?: () => void;
}

export const PosCounter: React.FC<PosCounterProps> = ({
  tenant,
  products,
  parties,
  onOpenA4Invoice,
  onOpenThermalReceipt,
  onRefreshParties,
}) => {
  // Document header state
  const [docType, setDocType] = useState<'TAX_INVOICE' | 'BILL_OF_SUPPLY' | 'ESTIMATE' | 'DELIVERY_CHALLAN'>('TAX_INVOICE');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [placeOfSupply, setPlaceOfSupply] = useState(tenant?.stateCode || '07');

  // Quick Customer Create Modal state
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyGstin, setNewPartyGstin] = useState('');

  // Cart / Line items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Bill level discount
  const [billDiscount, setBillDiscount] = useState<number>(0);

  // Payment State
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<number | string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Barcode / Scanner input ref
  const barcodeRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (F2: New Bill, F4: Quick Cash Pay, F8: Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleClearBill();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleQuickPayAndSave();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleClearBill();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedParty, paymentMode, cashTendered]);

  // Fast Barcode scanning
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim().toLowerCase();
    if (!query) return;

    const matched = products.find(
      p => (p.barcode && p.barcode.toLowerCase() === query) || p.title.toLowerCase() === query
    );

    if (matched) {
      addItemFromProduct(matched);
      setBarcodeInput('');
    } else {
      // If not in products, add as quick custom item
      addItemDirectly(query, 100, 1);
      setBarcodeInput('');
    }
  };

  const addItemFromProduct = (product: Product) => {
    const existingIndex = items.findIndex(i => i.productId === product.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      calculateItemTotals(updated[existingIndex]);
      setItems(updated);
    } else {
      const rate = product.price;
      const gst = product.gstRate || 0;
      const newItem: InvoiceItem = {
        productId: product.id,
        itemName: product.title,
        hsnSac: product.hsnSac || '',
        quantity: 1,
        unit: product.unit || 'pcs',
        unitPrice: rate,
        discountPct: 0,
        gstRate: gst,
        totalAmount: rate,
      };
      calculateItemTotals(newItem);
      setItems([...items, newItem]);
    }
  };

  const addItemDirectly = (name: string, price: number, qty: number = 1) => {
    const newItem: InvoiceItem = {
      itemName: name,
      hsnSac: '',
      quantity: qty,
      unit: 'pcs',
      unitPrice: price,
      discountPct: 0,
      gstRate: 0,
      totalAmount: price * qty,
    };
    calculateItemTotals(newItem);
    setItems([...items, newItem]);
  };

  const calculateItemTotals = (item: InvoiceItem) => {
    const qty = item.quantity || 1;
    const rate = item.unitPrice || 0;
    const discPct = item.discountPct || 0;
    const gstRate = item.gstRate || 0;

    const baseAmount = qty * rate;
    const discAmount = (baseAmount * discPct) / 100;
    const taxable = baseAmount - discAmount;

    const isIntra = (tenant?.stateCode || '07') === placeOfSupply;

    if (gstRate > 0) {
      if (isIntra) {
        item.cgstRate = gstRate / 2;
        item.sgstRate = gstRate / 2;
        item.cgstAmount = (taxable * item.cgstRate) / 100;
        item.sgstAmount = (taxable * item.sgstRate) / 100;
        item.igstRate = 0;
        item.igstAmount = 0;
      } else {
        item.cgstRate = 0;
        item.cgstAmount = 0;
        item.sgstRate = 0;
        item.sgstAmount = 0;
        item.igstRate = gstRate;
        item.igstAmount = (taxable * item.igstRate) / 100;
      }
    } else {
      item.cgstRate = 0;
      item.cgstAmount = 0;
      item.sgstRate = 0;
      item.sgstAmount = 0;
      item.igstRate = 0;
      item.igstAmount = 0;
    }

    item.totalAmount = taxable + (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    calculateItemTotals(updated[index]);
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Recalculate totals across all items
  const subtotal = items.reduce((sum, item) => {
    const base = (item.quantity || 1) * (item.unitPrice || 0);
    const disc = (base * (item.discountPct || 0)) / 100;
    return sum + (base - disc);
  }, 0);

  const totalCgst = items.reduce((sum, item) => sum + (item.cgstAmount || 0), 0);
  const totalSgst = items.reduce((sum, item) => sum + (item.sgstAmount || 0), 0);
  const totalIgst = items.reduce((sum, item) => sum + (item.igstAmount || 0), 0);

  const preRound = subtotal + totalCgst + totalSgst + totalIgst - billDiscount;
  const grandTotal = Math.round(preRound);
  const roundOff = Number((grandTotal - preRound).toFixed(2));

  // Change Due calculation for Cash
  const numCashTendered = typeof cashTendered === 'number' ? cashTendered : parseFloat(cashTendered) || 0;
  const changeDue = paymentMode === 'CASH' && numCashTendered > grandTotal ? numCashTendered - grandTotal : 0;

  const handleClearBill = () => {
    setItems([]);
    setSelectedParty(null);
    setBillDiscount(0);
    setCashTendered('');
    setPaymentMode('CASH');
  };

  const handleQuickPayAndSave = async (printMode: 'NONE' | 'A4' | 'THERMAL' = 'A4') => {
    if (items.length === 0) {
      alert('Please add at least one item to bill!');
      return;
    }

    setIsSaving(true);
    try {
      const isUdhaar = paymentMode === 'CREDIT';
      const paid = isUdhaar ? 0 : grandTotal;

      const payload = {
        partyId: selectedParty?.id,
        partyName: selectedParty?.partyName || 'Walk-in Cash Customer',
        partyPhone: selectedParty?.phone,
        partyGstin: selectedParty?.gstin,
        partyAddress: selectedParty?.billingAddress,
        documentType: docType,
        placeOfSupply,
        discountAmount: billDiscount,
        paidAmount: paid,
        paymentMode,
        channel: 'POS_COUNTER',
        items: items.map(i => ({
          productId: i.productId,
          itemName: i.itemName,
          hsnSac: i.hsnSac,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
          discountPct: i.discountPct,
          gstRate: i.gstRate,
        })),
      };

      const created = await ApiService.createInvoice(payload);

      // Trigger Print Action
      if (printMode === 'A4') {
        onOpenA4Invoice(created);
      } else if (printMode === 'THERMAL') {
        onOpenThermalReceipt(created);
      }

      // Reset bill for next customer
      handleClearBill();
      if (barcodeRef.current) barcodeRef.current.focus();
    } catch (err: any) {
      alert('Failed to save bill: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewParty = async () => {
    if (!newPartyName.trim() || !newPartyPhone.trim()) {
      alert('Party Name and Phone are required!');
      return;
    }
    try {
      const created = await ApiService.createParty({
        partyName: newPartyName,
        phone: newPartyPhone,
        gstin: newPartyGstin,
        partyType: 'CUSTOMER',
      });
      setSelectedParty(created);
      setShowAddPartyModal(false);
      setNewPartyName('');
      setNewPartyPhone('');
      setNewPartyGstin('');
      if (onRefreshParties) onRefreshParties();
    } catch (err: any) {
      alert('Could not create party: ' + err.message);
    }
  };

  const filteredParties = parties.filter(
    p => p.partyName.toLowerCase().includes(partySearch.toLowerCase()) || p.phone.includes(partySearch)
  );

  const filteredProducts = products.filter(
    p => p.title.toLowerCase().includes(productSearch.toLowerCase()) || (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-5rem)]">
      
      {/* LEFT COLUMN: Fast Item Entry, Scanner & Items Table */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Top Control Bar: Document Type & Party Selector */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type:</span>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="TAX_INVOICE">GST Tax Invoice</option>
              <option value="BILL_OF_SUPPLY">Bill of Supply (Non-GST)</option>
              <option value="ESTIMATE">Quotation / Estimate</option>
              <option value="DELIVERY_CHALLAN">Delivery Challan</option>
            </select>
          </div>

          {/* Customer / Party Picker */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            {selectedParty ? (
              <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg">
                <div className="flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-900">{selectedParty.partyName}</span>
                  <span className="text-[11px] text-emerald-700">({selectedParty.phone})</span>
                </div>
                <button
                  onClick={() => setSelectedParty(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <div className="relative flex-1">
                  <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Walk-in Cash (Search Party / Phone)..."
                    value={partySearch}
                    onChange={(e) => {
                      setPartySearch(e.target.value);
                      setShowPartyDropdown(true);
                    }}
                    onFocus={() => setShowPartyDropdown(true)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  {showPartyDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
                      <div
                        onClick={() => {
                          setSelectedParty(null);
                          setShowPartyDropdown(false);
                          setPartySearch('');
                        }}
                        className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer flex justify-between"
                      >
                        <span>Walk-in Customer (Cash)</span>
                        <span className="text-slate-400 text-[10px]">Instant</span>
                      </div>
                      {filteredParties.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedParty(p);
                            if (p.billingStateCode) setPlaceOfSupply(p.billingStateCode);
                            setShowPartyDropdown(false);
                            setPartySearch('');
                          }}
                          className="px-3 py-2 text-xs hover:bg-emerald-50 cursor-pointer border-t border-slate-100 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{p.partyName}</div>
                            <div className="text-[10px] text-slate-500">{p.phone} {p.gstin && `• ${p.gstin}`}</div>
                          </div>
                          {p.currentBalance !== 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              p.currentBalance > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              ₹{Math.abs(p.currentBalance)} {p.currentBalance > 0 ? 'Due' : 'Advance'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(true)}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  title="Add New Party"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Place of Supply (GST State) */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">POS:</span>
            <select
              value={placeOfSupply}
              onChange={(e) => setPlaceOfSupply(e.target.value)}
              className="text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-700"
            >
              {GST_INDIAN_STATES.map(s => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Barcode Scanner & Search Bar */}
        <div className="p-3 bg-white border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Barcode Laser Input */}
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={barcodeRef}
              type="text"
              placeholder="Scan Barcode / Enter SKU + Press Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </form>

          {/* Title Autocomplete Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={productSearchRef}
              type="text"
              placeholder="Search product name or category..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {showProductDropdown && productSearch.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto">
                {filteredProducts.slice(0, 10).map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      addItemFromProduct(p);
                      setProductSearch('');
                      setShowProductDropdown(false);
                    }}
                    className="px-3 py-2 text-xs hover:bg-emerald-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{p.title}</div>
                      <div className="text-[10px] text-slate-500">{p.category} {p.hsnSac && `• HSN: ${p.hsnSac}`}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">₹{p.price}</div>
                      <div className="text-[10px] text-emerald-600">Stock: {p.inventoryQuantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Quick-Pick Popular Item Chips */}
        {products.length > 0 && (
          <div className="px-3 py-1.5 bg-slate-50/50 border-b border-slate-100 flex items-center space-x-1.5 overflow-x-auto text-xs no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Quick Add:</span>
            {products.slice(0, 8).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => addItemFromProduct(p)}
                className="shrink-0 px-2 py-0.5 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-md text-[11px] font-medium text-slate-700 transition-all"
              >
                {p.title.length > 18 ? p.title.substring(0, 18) + '...' : p.title} (₹{p.price})
              </button>
            ))}
          </div>
        )}

        {/* Active Bill Table */}
        <div className="flex-1 overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <Barcode className="w-12 h-12 stroke-[1.2] mb-2 text-slate-300 animate-pulse" />
              <p className="text-sm font-semibold text-slate-600">Counter Register Ready</p>
              <p className="text-xs text-slate-400 mt-1">Scan a barcode or search products above to start billing</p>
              <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                <span>Hotkeys:</span>
                <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border">F2: New</span>
                <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border">F4: Quick Pay</span>
                <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border">F8: Clear</span>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-2 w-8 text-center">#</th>
                  <th className="p-2">Item Name</th>
                  <th className="p-2 w-20">HSN</th>
                  <th className="p-2 w-24 text-center">Qty</th>
                  <th className="p-2 w-20 text-right">Price</th>
                  <th className="p-2 w-16 text-right">Disc%</th>
                  <th className="p-2 w-20 text-center">GST</th>
                  <th className="p-2 w-24 text-right">Total</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 group">
                    <td className="p-2 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                    
                    {/* Item Name */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                        className="w-full font-bold text-slate-900 bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1"
                      />
                    </td>

                    {/* HSN */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.hsnSac || ''}
                        placeholder="HSN"
                        onChange={(e) => updateItem(idx, 'hsnSac', e.target.value)}
                        className="w-full font-mono text-slate-600 bg-transparent border border-transparent focus:border-slate-300 focus:bg-white rounded px-1 py-0.5 text-center"
                      />
                    </td>

                    {/* Quantity with + / - */}
                    <td className="p-2">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) updateItem(idx, 'quantity', item.quantity - 1);
                            else removeItem(idx);
                          }}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold text-slate-700"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-12 text-center font-bold font-mono bg-slate-100 rounded border-0 py-0.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => updateItem(idx, 'quantity', item.quantity + 1)}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold text-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Unit Price */}
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-16 text-right font-mono font-bold text-slate-800 bg-transparent border border-transparent focus:border-slate-300 focus:bg-white rounded px-1 py-0.5"
                      />
                    </td>

                    {/* Discount % */}
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discountPct || 0}
                        onChange={(e) => updateItem(idx, 'discountPct', parseFloat(e.target.value) || 0)}
                        className="w-12 text-right font-mono text-slate-600 bg-transparent border border-transparent focus:border-slate-300 focus:bg-white rounded px-1 py-0.5"
                      />
                    </td>

                    {/* GST Rate Select */}
                    <td className="p-2 text-center">
                      <select
                        value={item.gstRate || 0}
                        onChange={(e) => updateItem(idx, 'gstRate', parseFloat(e.target.value))}
                        className="text-[11px] font-mono px-1 py-0.5 bg-slate-100 border-0 rounded text-slate-700"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>

                    {/* Line Total */}
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      ₹{item.totalAmount.toFixed(2)}
                    </td>

                    {/* Delete Action */}
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-slate-300 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Bill Summary, Cash Calculator & Checkout Actions */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header Summary */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Total Payable</div>
            <div className="text-2xl font-black font-mono tracking-tight text-emerald-400">
              ₹{grandTotal.toFixed(2)}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Items: <span className="font-bold text-white">{items.length}</span></div>
            <div>Qty: <span className="font-bold text-white">{items.reduce((s, i) => s + (i.quantity || 0), 0)}</span></div>
          </div>
        </div>

        {/* Calculation Details */}
        <div className="p-4 space-y-2 text-xs border-b border-slate-200 bg-slate-50/50">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal (Taxable):</span>
            <span className="font-mono font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
          </div>

          {(totalCgst > 0 || totalSgst > 0) && (
            <>
              <div className="flex justify-between text-slate-600">
                <span>Central GST (CGST):</span>
                <span className="font-mono text-slate-800">₹{totalCgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>State GST (SGST):</span>
                <span className="font-mono text-slate-800">₹{totalSgst.toFixed(2)}</span>
              </div>
            </>
          )}

          {totalIgst > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Integrated GST (IGST):</span>
              <span className="font-mono text-slate-800">₹{totalIgst.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-slate-600">
            <span>Bill Discount:</span>
            <div className="flex items-center space-x-1">
              <span>-₹</span>
              <input
                type="number"
                min="0"
                value={billDiscount || ''}
                placeholder="0"
                onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                className="w-16 text-right font-mono text-xs bg-white border border-slate-300 rounded px-1.5 py-0.5"
              />
            </div>
          </div>

          {roundOff !== 0 && (
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Round Off:</span>
              <span className="font-mono">{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
            </div>
          )}
        </div>

        {/* Payment Mode Selection */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Mode</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'CASH', label: 'Cash', icon: Banknote },
              { id: 'UPI', label: 'UPI QR', icon: QrCode },
              { id: 'CARD', label: 'Card', icon: CreditCard },
              { id: 'CREDIT', label: 'Udhaar', icon: FileText },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMode(m.id as any)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMode === m.id
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <m.icon className={`w-4 h-4 mb-1 ${paymentMode === m.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Cash Change Calculator */}
          {paymentMode === 'CASH' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Cash Received:</span>
                <input
                  type="number"
                  placeholder="₹ Amount"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-24 text-right font-mono font-bold text-xs bg-white border border-slate-300 rounded-lg px-2 py-1"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex space-x-1.5 justify-end">
                {[100, 200, 500, 2000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(amt)}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:border-emerald-500 text-[10px] font-mono rounded"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {changeDue > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                  <span className="font-bold text-indigo-700">Change to Return:</span>
                  <span className="font-mono text-sm font-black text-indigo-700">₹{changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* UPI QR Display */}
          {paymentMode === 'UPI' && (
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center space-y-1 mt-2">
              <div className="text-xs font-bold text-emerald-900">Scan & Pay via any UPI App</div>
              <div className="text-[11px] text-emerald-700 font-mono">{tenant?.upiVpa || 'merchant@upi'}</div>
              <p className="text-[10px] text-slate-500">GPay • PhonePe • Paytm • BHIM</p>
            </div>
          )}

          {/* Udhaar Warning */}
          {paymentMode === 'CREDIT' && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
              <div className="font-bold text-amber-800 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Udhaar (Credit Sale)</span>
              </div>
              <p className="text-amber-700 text-[11px]">
                {selectedParty 
                  ? `₹${grandTotal.toFixed(2)} will be added to ${selectedParty.partyName}'s Khata ledger.`
                  : '⚠️ Warning: Please select a registered Party above to record Udhaar!'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
          
          {/* Main 1-Click Pay & Print A4 */}
          <button
            type="button"
            disabled={isSaving || items.length === 0}
            onClick={() => handleQuickPayAndSave('A4')}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>F4: Quick Pay & A4 Invoice</span>
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isSaving || items.length === 0}
              onClick={() => handleQuickPayAndSave('THERMAL')}
              className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Thermal Receipt</span>
            </button>

            <button
              type="button"
              onClick={handleClearBill}
              className="py-2 px-3 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 text-slate-600 hover:text-red-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>F8: Clear</span>
            </button>
          </div>

        </div>

      </div>

      {/* Quick Add Party Modal */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Add New Customer</h3>
              <button onClick={() => setShowAddPartyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Mobile Phone *</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={newPartyPhone}
                  onChange={(e) => setNewPartyPhone(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="15-digit GSTIN"
                  value={newPartyGstin}
                  onChange={(e) => setNewPartyGstin(e.target.value.toUpperCase())}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddPartyModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewParty}
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
