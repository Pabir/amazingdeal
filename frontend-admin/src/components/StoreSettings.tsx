import React, { useState } from 'react';
import { Tenant } from '../types';
import { QrCode, Truck, Clock, MapPin, Save, ShieldCheck } from 'lucide-react';

interface StoreSettingsProps {
  tenant: Tenant | null;
  onSave: (updated: Partial<Tenant>) => void;
}

export const StoreSettings: React.FC<StoreSettingsProps> = ({ tenant, onSave }) => {
  const [storeName, setStoreName] = useState(tenant?.storeName || '');
  const [storeAddress, setStoreAddress] = useState(tenant?.storeAddress || '');
  const [upiVpa, setUpiVpa] = useState(tenant?.upiVpa || '');
  const [deliveryCharge, setDeliveryCharge] = useState(tenant?.deliveryCharge?.toString() || '30');
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(tenant?.freeDeliveryAbove?.toString() || '499');
  const [minOrderAmount, setMinOrderAmount] = useState(tenant?.minOrderAmount?.toString() || '0');
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(tenant?.deliveryRadiusKm?.toString() || '5');
  const [storeTimings, setStoreTimings] = useState(tenant?.storeTimings || '8:00 AM - 10:00 PM');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      storeName,
      storeAddress,
      upiVpa,
      deliveryCharge: parseFloat(deliveryCharge) || 0,
      freeDeliveryAbove: parseFloat(freeDeliveryAbove) || 0,
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      deliveryRadiusKm: parseFloat(deliveryRadiusKm) || 5,
      storeTimings,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Store & Payment Settings</h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure your dynamic UPI payments, local delivery rules, and store timings.
            </p>
          </div>
          {savedSuccess && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 animate-bounce">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Settings Saved!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* UPI VPA for Zero-Commission Direct Bank Payments */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-800">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <h4 className="font-extrabold text-sm">Direct Bank UPI QR Code (0% Commission)</h4>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              When customers choose "Pay Online", our platform generates a live UPI QR code directly connected to your bank UPI ID. Customer payments go straight to your bank account with zero middleman fee!
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Merchant UPI VPA *
              </label>
              <input
                type="text"
                required
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                placeholder="e.g. yourstore@okaxis, shop@icici, mobile@paytm"
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Store Info */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Store Information
            </h4>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Store Name
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Store Address
              </label>
              <textarea
                rows={2}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Shop 12, Main Bazaar, Near Temple, City"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Store Operating Hours
              </label>
              <input
                type="text"
                value={storeTimings}
                onChange={(e) => setStoreTimings(e.target.value)}
                placeholder="e.g. 8:00 AM - 10:00 PM (All 7 Days)"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Local Delivery Rules */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Hyperlocal Delivery Rules</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Delivery Charge (₹)
                </label>
                <input
                  type="number"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  placeholder="30"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Free Delivery On Orders Above (₹)
                </label>
                <input
                  type="number"
                  value={freeDeliveryAbove}
                  onChange={(e) => setFreeDeliveryAbove(e.target.value)}
                  placeholder="499"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Delivery Radius (KM)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={deliveryRadiusKm}
                  onChange={(e) => setDeliveryRadiusKm(e.target.value)}
                  placeholder="5"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md shadow-slate-900/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
