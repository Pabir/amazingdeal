import React, { useState, useEffect } from 'react';
import { StoreInfo, CartItem, CustomerProfile, CustomerAddress } from '../types';
import {
  X, Truck, Store, QrCode, Banknote, ShieldCheck, Sparkles, MapPin,
  Plus, Check, CreditCard, Clock, Calendar, Zap, AlertCircle
} from 'lucide-react';
import { StoreApi } from '../services/storeApi';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  store: StoreInfo | null;
  onPlaceOrder: (orderPayload: any) => Promise<void>;
  loading: boolean;
  customer?: CustomerProfile | null;
  addresses?: CustomerAddress[];
  onSaveAddress?: (address: CustomerAddress) => Promise<any>;
  onOpenAuth?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  store,
  onPlaceOrder,
  loading,
  customer,
  addresses = [],
  onSaveAddress,
  onOpenAuth,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState(customer?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '');
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(false);
  const [notes, setNotes] = useState('');

  // Delivery & Logistics Choices
  const [isExpress, setIsExpress] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [serviceability, setServiceability] = useState<{
    serviceable: boolean;
    edd?: string;
    charge?: number;
    courierName?: string;
    message?: string;
  } | null>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  // Payment Selection: DIRECT_UPI, RAZORPAY_BYOK, COD
  const defaultPayment = store?.razorpayByokEnabled ? 'RAZORPAY_BYOK' : (store?.upiVpa ? 'DIRECT_UPI' : 'COD');
  const [paymentOption, setPaymentOption] = useState<'DIRECT_UPI' | 'RAZORPAY_BYOK' | 'COD'>(defaultPayment);
  const [onlineProcessing, setOnlineProcessing] = useState(false);

  // Parse time slots from store settings
  const parsedSlots: string[] = React.useMemo(() => {
    if (!store?.deliveryTimeSlotsJson) {
      return ['Today Evening (5 PM - 8 PM)', 'Tomorrow Morning (9 AM - 12 PM)', 'Tomorrow Evening (5 PM - 8 PM)'];
    }
    try {
      return JSON.parse(store.deliveryTimeSlotsJson);
    } catch {
      return ['Standard Delivery Slot'];
    }
  }, [store?.deliveryTimeSlotsJson]);

  // Set default slot
  useEffect(() => {
    if (parsedSlots.length > 0 && !selectedSlot) {
      setSelectedSlot(parsedSlots[0]);
    }
  }, [parsedSlots]);

  // Sync customer details
  useEffect(() => {
    if (customer?.fullName && !customerName) setCustomerName(customer.fullName);
    if (customer?.phone && !customerPhone) setCustomerPhone(customer.phone);
    if (addresses.length > 0 && !deliveryAddress) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id || null);
        const fullAddr = `${defaultAddr.addressLine}${defaultAddr.landmark ? ', Landmark: ' + defaultAddr.landmark : ''}${defaultAddr.city ? ', ' + defaultAddr.city : ''}`;
        setDeliveryAddress(fullAddr);
        if (defaultAddr.pincode) {
          setPincode(defaultAddr.pincode);
          checkPincodeService(defaultAddr.pincode);
        }
      }
    }
  }, [customer, addresses]);

  const checkPincodeService = async (pin: string) => {
    if (pin.length !== 6 || !store?.subdomain) return;
    try {
      setCheckingPincode(true);
      const res = await StoreApi.checkServiceability(store.subdomain, pin);
      setServiceability({
        serviceable: res.serviceable,
        edd: res.estimatedDeliveryDate,
        charge: res.deliveryCharge,
        courierName: res.courierName,
        message: res.message,
      });
    } catch (err) {
      console.warn('Pincode check error:', err);
    } finally {
      setCheckingPincode(false);
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(val);
    if (val.length === 6) {
      checkPincodeService(val);
    } else {
      setServiceability(null);
    }
  };

  const handleSelectSavedAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id || null);
    const fullAddr = `${addr.addressLine}${addr.landmark ? ', Landmark: ' + addr.landmark : ''}${addr.city ? ', ' + addr.city : ''}`;
    setDeliveryAddress(fullAddr);
    if (addr.pincode) {
      setPincode(addr.pincode);
      checkPincodeService(addr.pincode);
    }
  };

  // Delivery Fee Calculation
  let deliveryFee = 0;
  if (deliveryType === 'PICKUP') {
    deliveryFee = 0;
  } else if (isExpress && store?.expressDeliveryEnabled) {
    deliveryFee = store.expressDeliveryFee || 49;
  } else if (store?.freeDeliveryAbove && subtotal >= store.freeDeliveryAbove) {
    deliveryFee = 0;
  } else if (serviceability?.charge !== undefined) {
    deliveryFee = serviceability.charge;
  } else {
    deliveryFee = store?.deliveryCharge || 30;
  }

  // COD extra fee calculation
  const codExtra = paymentOption === 'COD' && store?.codExtraCharge ? store.codExtraCharge : 0;
  const grandTotal = subtotal + deliveryFee + codExtra;

  // Check COD constraints
  const codAllowed = store?.codEnabled !== false;
  const codBelowMin = store?.codMinAmount && subtotal < store.codMinAmount;
  const codAboveMax = store?.codMaxAmount && subtotal > store.codMaxAmount;

  // Load Razorpay SDK on-demand
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please provide your name and 10-digit phone number');
      return;
    }
    if (deliveryType === 'DELIVERY') {
      if (!deliveryAddress.trim()) {
        alert('Please enter your delivery address');
        return;
      }
      if (serviceability && !serviceability.serviceable) {
        alert('Sorry, delivery is not available for this pincode: ' + pincode);
        return;
      }
    }

    if (paymentOption === 'COD') {
      if (!codAllowed) {
        alert('Cash on Delivery is currently disabled by store.');
        return;
      }
      if (codBelowMin) {
        alert(`Minimum order amount for COD is ₹${store?.codMinAmount}`);
        return;
      }
      if (codAboveMax) {
        alert(`Maximum order amount for COD is ₹${store?.codMaxAmount}`);
        return;
      }
    }

    // Auto-save address if requested
    if (customer && saveAddressToAccount && onSaveAddress && selectedAddressId === 'custom') {
      try {
        await onSaveAddress({
          label: 'Home',
          addressLine: deliveryAddress.trim(),
          pincode: pincode.trim(),
          recipientName: customerName.trim(),
          recipientPhone: customerPhone.trim(),
          isDefault: addresses.length === 0,
        });
      } catch (err) {
        console.warn('Could not auto-save address:', err);
      }
    }

    const basePayload = {
      customerId: customer?.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryType,
      deliveryAddress: deliveryType === 'PICKUP' ? 'Store Counter Pickup' : `${deliveryAddress.trim()}${pincode ? ' - ' + pincode : ''}`,
      pincode: pincode.trim(),
      expectedDeliveryDate: serviceability?.edd,
      deliveryTimeSlot: isExpress ? `Express (${store?.expressDeliveryMinutes || 60} mins)` : selectedSlot,
      fulfillmentPartner: deliveryType === 'PICKUP' ? 'STORE_PICKUP' : (store?.shiprocketEnabled ? 'SHIPROCKET' : 'OWN_RIDER'),
      paymentMethod: paymentOption,
      notes: notes.trim(),
      items: items.map((i) => ({
        productId: i.product.id,
        title: i.product.title,
        price: i.product.price,
        quantity: i.quantity,
      })),
    };

    // If Razorpay BYOK is chosen, initiate official Razorpay Checkout popup
    if (paymentOption === 'RAZORPAY_BYOK' && store?.subdomain) {
      try {
        setOnlineProcessing(true);
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Failed to load secure Razorpay checkout module.');
        }

        const rzpOrder = await StoreApi.createMerchantRazorpayOrder(
          store.subdomain,
          grandTotal,
          customerName,
          customerPhone
        );

        const options: any = {
          key: rzpOrder.keyId,
          amount: rzpOrder.amountInPaise,
          currency: 'INR',
          name: store.storeName,
          description: `Order at ${store.storeName}`,
          image: store.logoUrl || undefined,
          prefill: {
            name: customerName,
            contact: customerPhone,
          },
          theme: {
            color: '#059669', // Emerald 600
          },
          handler: async (response: any) => {
            // Payment success callback
            await onPlaceOrder({
              ...basePayload,
              gatewayProvider: 'RAZORPAY_BYOK',
              gatewayPaymentId: response.razorpay_payment_id,
              gatewayOrderId: response.razorpay_order_id,
              gatewaySignature: response.razorpay_signature,
            });
            setOnlineProcessing(false);
          },
          modal: {
            ondismiss: () => {
              setOnlineProcessing(false);
            },
          },
        };

        if (rzpOrder.orderId && !rzpOrder.orderId.startsWith('order_mock_')) {
          options.order_id = rzpOrder.orderId;
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      } catch (err: any) {
        setOnlineProcessing(false);
        alert('Razorpay Checkout failed: ' + err.message);
        return;
      }
    }

    // Direct UPI or COD
    await onPlaceOrder(basePayload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Checkout</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                1-Step
              </span>
            </h3>
            <p className="text-xs text-slate-500">Fast direct order from {store?.storeName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest prompt if not logged in */}
        {!customer && onOpenAuth && (
          <div className="mb-4 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-emerald-900 font-medium">Have an account? Sign in to use saved addresses</span>
            </div>
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
            >
              Sign In
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Customer Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Rohan Sharma"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (10 Digits) *
              </label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Fulfillment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Fulfillment Method
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDeliveryType('DELIVERY')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  deliveryType === 'DELIVERY'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Home Delivery</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('PICKUP')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  deliveryType === 'PICKUP'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Store Pickup (FREE)</span>
              </button>
            </div>
          </div>

          {/* Delivery Address & Pincode */}
          {deliveryType === 'DELIVERY' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Delivery Address *
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={handlePincodeChange}
                    placeholder="Pincode (6 digits)"
                    className="w-28 px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono focus:border-emerald-500"
                  />
                  {checkingPincode && <span className="text-[10px] text-slate-400 animate-pulse">Checking...</span>}
                </div>
              </div>

              {/* Serviceability badge */}
              {serviceability && (
                <div className={`p-2 rounded-xl text-xs flex items-center justify-between ${
                  serviceability.serviceable ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}>
                  <span className="font-semibold">{serviceability.message}</span>
                  {serviceability.edd && (
                    <span className="font-bold">EDD: {serviceability.edd}</span>
                  )}
                </div>
              )}

              {/* Saved Address Cards */}
              {addresses.length > 0 && (
                <div className="grid grid-cols-1 gap-1.5 mb-2">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`text-left p-2 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-xs">{addr.label}:</span>
                          <span className="text-xs truncate">{addr.addressLine}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressId('custom');
                      setDeliveryAddress('');
                    }}
                    className={`text-left p-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      selectedAddressId === 'custom'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'border-dashed border-slate-300 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enter a new address</span>
                  </button>
                </div>
              )}

              {(addresses.length === 0 || selectedAddressId === 'custom') && (
                <>
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House/Flat No, Landmark, Street Name, Colony"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {customer && (
                    <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={saveAddressToAccount}
                        onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Save to My Addresses</span>
                    </label>
                  )}
                </>
              )}

              {/* Express Delivery Option */}
              {store?.expressDeliveryEnabled && (
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="text-xs font-bold text-amber-900">
                        ⚡ Rush Express Delivery ({store.expressDeliveryMinutes || 60} mins)
                      </span>
                      <p className="text-[10px] text-amber-700">Priority packed and dispatched immediately</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExpress}
                      onChange={(e) => setIsExpress(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              )}

              {/* Delivery Time Slots */}
              {!isExpress && parsedSlots.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Preferred Delivery Slot</span>
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {parsedSlots.map((slot, idx) => (
                      <option key={idx} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              
              {/* Direct UPI */}
              {store?.upiVpa && (
                <button
                  type="button"
                  onClick={() => setPaymentOption('DIRECT_UPI')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    paymentOption === 'DIRECT_UPI'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Direct UPI</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">GPay/PhonePe/Paytm</span>
                </button>
              )}

              {/* Razorpay Gateway BYOK */}
              {store?.razorpayByokEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentOption('RAZORPAY_BYOK')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    paymentOption === 'RAZORPAY_BYOK'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Cards & Netbanking</span>
                  </div>
                  <span className="text-[10px] text-blue-700 block mt-0.5">Visa/MC/EMI/Netbanking</span>
                </button>
              )}

              {/* Cash on Delivery */}
              {codAllowed && (
                <button
                  type="button"
                  onClick={() => setPaymentOption('COD')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    paymentOption === 'COD'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs">
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <span>Cash on Delivery</span>
                  </div>
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    {store?.codExtraCharge && store.codExtraCharge > 0 ? `+₹${store.codExtraCharge} fee` : 'Pay at doorstep'}
                  </span>
                </button>
              )}
            </div>

            {/* COD Warnings if applicable */}
            {paymentOption === 'COD' && codBelowMin && (
              <p className="text-[11px] text-rose-600 mt-1 font-bold">
                ⚠️ Minimum order for Cash on Delivery is ₹{store?.codMinAmount}. Please add more items or pay online.
              </p>
            )}
            {paymentOption === 'COD' && codAboveMax && (
              <p className="text-[11px] text-rose-600 mt-1 font-bold">
                ⚠️ Maximum order for Cash on Delivery is ₹{store?.codMaxAmount}. Please pay online.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Order Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave with security, call before arrival"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Total:</span>
              <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charge:</span>
              <span className="font-semibold text-slate-900">
                {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            {codExtra > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>COD Handling Surcharge:</span>
                <span className="font-semibold text-slate-900">₹{codExtra.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="text-emerald-600">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Place Order CTA */}
          <button
            type="submit"
            disabled={loading || onlineProcessing}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>
              {onlineProcessing
                ? 'Opening Payment Gateway...'
                : loading
                ? 'Placing Order...'
                : `Place Order (₹${grandTotal.toFixed(2)})`}
            </span>
          </button>

        </form>
      </div>
    </div>
  );
};
