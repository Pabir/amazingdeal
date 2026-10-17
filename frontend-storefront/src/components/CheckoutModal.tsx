import React, { useState, useEffect } from 'react';
import { StoreInfo, CartItem, CustomerProfile, CustomerAddress } from '../types';
import { X, Truck, Store, QrCode, Banknote, ShieldCheck, Sparkles, MapPin, Plus, Check } from 'lucide-react';

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
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI_ONLINE'>('UPI_ONLINE');
  const [notes, setNotes] = useState('');

  // Sync customer details when opened
  useEffect(() => {
    if (customer?.fullName && !customerName) {
      setCustomerName(customer.fullName);
    }
    if (customer?.phone && !customerPhone) {
      setCustomerPhone(customer.phone);
    }
    if (addresses.length > 0 && !deliveryAddress) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id || null);
        const fullAddr = `${defaultAddr.addressLine}${defaultAddr.landmark ? ', Landmark: ' + defaultAddr.landmark : ''}${defaultAddr.city ? ', ' + defaultAddr.city : ''}${defaultAddr.pincode ? ' - ' + defaultAddr.pincode : ''}`;
        setDeliveryAddress(fullAddr);
      }
    }
  }, [customer, addresses]);

  const deliveryFee =
    deliveryType === 'PICKUP' || subtotal >= (store?.freeDeliveryAbove || 499)
      ? 0
      : store?.deliveryCharge || 30;
  const grandTotal = subtotal + deliveryFee;

  const handleSelectSavedAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id || null);
    const fullAddr = `${addr.addressLine}${addr.landmark ? ', Landmark: ' + addr.landmark : ''}${addr.city ? ', ' + addr.city : ''}${addr.pincode ? ' - ' + addr.pincode : ''}`;
    setDeliveryAddress(fullAddr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please provide your name and 10-digit phone number');
      return;
    }
    if (deliveryType === 'DELIVERY' && !deliveryAddress.trim()) {
      alert('Please enter your delivery address');
      return;
    }

    // If customer asked to save this new address
    if (customer && saveAddressToAccount && onSaveAddress && selectedAddressId === 'custom') {
      try {
        await onSaveAddress({
          label: 'Home',
          addressLine: deliveryAddress.trim(),
          recipientName: customerName.trim(),
          recipientPhone: customerPhone.trim(),
          isDefault: addresses.length === 0,
        });
      } catch (err) {
        console.warn('Could not auto-save address:', err);
      }
    }

    await onPlaceOrder({
      customerId: customer?.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryType,
      deliveryAddress: deliveryType === 'PICKUP' ? 'Store Pickup' : deliveryAddress.trim(),
      paymentMethod,
      notes: notes.trim(),
      items: items.map((i) => ({
        productId: i.product.id,
        title: i.product.title,
        price: i.product.price,
        quantity: i.quantity,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">1-Step Fast Checkout</h3>
            <p className="text-xs text-slate-500">Order directly from {store?.storeName}</p>
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
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-emerald-900 font-medium">Have an account? Sign in for 1-click checkout</span>
            </div>
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
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
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (10 digits) *
              </label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Delivery vs Store Pickup Toggle */}
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
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
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
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Store Pickup (BOPIS)</span>
              </button>
            </div>
          </div>

          {/* Delivery Address (only if Home Delivery) */}
          {deliveryType === 'DELIVERY' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Delivery Address *
              </label>

              {/* Saved Address Cards */}
              {addresses.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mb-2">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900 shadow-xs font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="font-bold text-xs">{addr.label}:</span>
                          <span className="text-xs truncate">{addr.addressLine}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
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
                    <span>Deliver to a different address</span>
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
                    placeholder="Flat / House No, Street, Landmark, Colony"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {customer && (
                    <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={saveAddressToAccount}
                        onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Save this address to my account</span>
                    </label>
                  )}
                </>
              )}
            </div>
          )}

          {/* Payment Method Option */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Option
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI_ONLINE')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'UPI_ONLINE'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Instant UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === 'COD'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash on Delivery</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Order Notes / Instructions (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave at gate, call when arriving"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Order Summary Line */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Total:</span>
              <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery:</span>
              <span className="font-semibold text-slate-900">
                {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total Payable:</span>
              <span className="text-emerald-600">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Confirming Order...' : `Confirm & Place Order (₹${grandTotal.toFixed(2)})`}</span>
          </button>

        </form>
      </div>
    </div>
  );
};
