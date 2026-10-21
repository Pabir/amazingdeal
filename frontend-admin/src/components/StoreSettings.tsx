import React, { useState, useEffect } from 'react';
import { Tenant, ChatGptStatus } from '../types';
import { QrCode, Truck, Clock, MapPin, Save, ShieldCheck, Sparkles, Key, CheckCircle2, Unlink, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api';

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

  // AI & ChatGPT Plan State
  const [aiStatus, setAiStatus] = useState<ChatGptStatus | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAiStatus();
  }, []);

  const loadAiStatus = async () => {
    try {
      setAiLoading(true);
      const res = await ApiService.getChatGptStatus();
      setAiStatus(res);
    } catch (e: any) {
      console.warn('Could not fetch AI status:', e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleConnectChatGpt = async () => {
    try {
      setAiMessage(null);
      const auth = await ApiService.getChatGptAuthUrl();
      if (auth.codeVerifier) {
        localStorage.setItem('chatgpt_code_verifier', auth.codeVerifier);
        localStorage.setItem('chatgpt_auth_state', auth.state);
      }
      window.location.href = auth.authorizationUrl;
    } catch (e: any) {
      setAiMessage('Failed to initiate ChatGPT OAuth: ' + e.message);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your ChatGPT subscription / API key?')) return;
    try {
      setAiLoading(true);
      const res = await ApiService.disconnectChatGpt();
      setAiStatus(res);
      setAiMessage('Disconnected successfully.');
      setTimeout(() => setAiMessage(null), 3000);
    } catch (e: any) {
      setAiMessage('Failed to disconnect: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveKey = async () => {
    if (!customKey.trim().startsWith('sk-')) {
      alert('Please enter a valid OpenAI key starting with "sk-"');
      return;
    }
    try {
      setSavingKey(true);
      const res = await ApiService.saveCustomApiKey(customKey.trim());
      setAiStatus(res);
      setCustomKey('');
      setAiMessage('OpenAI API key saved successfully!');
      setTimeout(() => setAiMessage(null), 3000);
    } catch (e: any) {
      alert('Failed to save API key: ' + e.message);
    } finally {
      setSavingKey(false);
    }
  };

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

          {/* ChatGPT Plan & AI Studio Integration */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 border border-emerald-500/30 text-white space-y-4 shadow-lg shadow-emerald-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-500/20 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-400/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>ChatGPT Subscription AI Integration</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Zero API Fees
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Power product catalog photo scans directly through your personal ChatGPT plan allowances.
                  </p>
                </div>
              </div>

              {aiStatus?.connected ? (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{aiStatus.planTier || 'ChatGPT Plus'} Active</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-slate-400 transition-colors"
                    title="Disconnect ChatGPT"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              ) : aiStatus?.hasCustomApiKey ? (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Key className="w-3.5 h-3.5" />
                    <span>Custom Key ({aiStatus.maskedApiKey})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-slate-400 transition-colors"
                    title="Remove API Key"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              ) : null}
            </div>

            {aiMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-200">
                {aiMessage}
              </div>
            )}

            {!aiStatus?.connected && !aiStatus?.hasCustomApiKey ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  OpenAI allows subscribers (ChatGPT Plus, Pro, or Team) to sign in and apply their personal plan allowances to power AI features in AmazingDeal. Our platform never bills you for AI requests!
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleConnectChatGpt}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sign in with ChatGPT Plan</span>
                  </button>

                  <span className="text-xs text-slate-500">or enter OpenAI Key:</span>
                  <div className="flex items-center space-x-1.5 flex-1 min-w-[220px]">
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono"
                    />
                    <button
                      type="button"
                      disabled={savingKey || !customKey}
                      onClick={handleSaveKey}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold disabled:opacity-40"
                    >
                      {savingKey ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-300 flex items-center justify-between">
                <span>
                  Account: <strong className="text-white">{aiStatus?.accountEmail || 'Connected'}</strong>
                </span>
                <span className="text-emerald-400 font-semibold">
                  ✓ Ready for 1-Click Product Image Scanning
                </span>
              </div>
            )}
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
