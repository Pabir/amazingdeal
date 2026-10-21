import React, { useState, useEffect } from 'react';
import { Tenant, ChatGptStatus } from '../types';
import { QrCode, Truck, Clock, MapPin, Save, ShieldCheck, Sparkles, Key, CheckCircle2, Unlink, RefreshCw, ExternalLink } from 'lucide-react';
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

  // AI & Multi-Provider State
  const [aiStatus, setAiStatus] = useState<ChatGptStatus | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [savingGeminiKey, setSavingGeminiKey] = useState(false);
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

  const handleSimulateConnect = async () => {
    try {
      setAiLoading(true);
      const res = await ApiService.handleChatGptCallback({
        code: 'simulated_test_code_' + Date.now(),
      });
      setAiStatus(res);
      setAiMessage('✨ Connected simulated ChatGPT Plus account for testing!');
      setTimeout(() => setAiMessage(null), 4000);
    } catch (e: any) {
      setAiMessage('Simulated connect failed: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your OpenAI API key?')) return;
    try {
      setAiLoading(true);
      const res = await ApiService.disconnectChatGpt();
      setAiStatus(res);
      setAiMessage('OpenAI key disconnected.');
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

  const handleSaveGeminiKey = async () => {
    const key = geminiKey.trim();
    if (!key) {
      alert('Please enter your Google Gemini API key.');
      return;
    }
    if (key.startsWith('sk-')) {
      alert('This looks like an OpenAI key (starts with sk-). Please paste it into the OpenAI card instead.');
      return;
    }
    try {
      setSavingGeminiKey(true);
      const res = await ApiService.saveCustomGeminiApiKey(key);
      setAiStatus(res);
      setGeminiKey('');
      setAiMessage('✨ Google Gemini API key saved & activated!');
      setTimeout(() => setAiMessage(null), 3000);
    } catch (e: any) {
      alert('Failed to save Gemini key: ' + e.message);
    } finally {
      setSavingGeminiKey(false);
    }
  };

  const handleDisconnectGemini = async () => {
    if (!confirm('Are you sure you want to remove your Google Gemini API key?')) return;
    try {
      setAiLoading(true);
      const res = await ApiService.disconnectGemini();
      setAiStatus(res);
      setAiMessage('Google Gemini key disconnected.');
      setTimeout(() => setAiMessage(null), 3000);
    } catch (e: any) {
      setAiMessage('Failed to disconnect Gemini: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleProviderPreferenceChange = async (pref: 'AUTO' | 'GEMINI' | 'OPENAI') => {
    try {
      setAiLoading(true);
      const res = await ApiService.setAiProviderPreference(pref);
      setAiStatus(res);
      setAiMessage(`AI provider preference updated to ${pref}.`);
      setTimeout(() => setAiMessage(null), 3000);
    } catch (e: any) {
      setAiMessage('Failed to update preference: ' + e.message);
    } finally {
      setAiLoading(false);
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

          {/* AI Product Studio (Multi-Provider: Google Gemini & OpenAI) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 border border-emerald-500/30 text-white space-y-4 shadow-lg shadow-emerald-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-500/20 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-400/20 font-black">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>AI Product Studio (Gemini & OpenAI)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Multi-Provider Engine
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Auto-generate attractive catalog listings directly from product photos with 0% platform markup.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {aiStatus?.hasCustomGeminiKey && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                    <span>Gemini: {aiStatus.maskedGeminiKey}</span>
                  </span>
                )}
                {aiStatus?.hasCustomApiKey && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>OpenAI: {aiStatus.maskedApiKey}</span>
                  </span>
                )}
              </div>
            </div>

            {aiMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-200">
                {aiMessage}
              </div>
            )}

            {/* Provider Preference Selector */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-300 block">AI Routing Preference:</span>
                <span className="text-[11px] text-slate-300">Choose how photos should be processed by default</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleProviderPreferenceChange('AUTO')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    (aiStatus?.aiProviderPreference || 'AUTO') === 'AUTO'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ⚡ Auto (Gemini Free ➔ OpenAI)
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderPreferenceChange('GEMINI')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    aiStatus?.aiProviderPreference === 'GEMINI'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🔷 Gemini Only
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderPreferenceChange('OPENAI')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    aiStatus?.aiProviderPreference === 'OPENAI'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🟢 OpenAI Only
                </button>
              </div>
            </div>

            {/* Dual Provider Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CARD 1: Google Gemini Flash (Recommended / Free Tier) */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-blue-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-blue-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Google Gemini 1.5 Flash</span>
                    </span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
                      Free Tier / Jio 5G
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    100% Free tier available with no credit card required. Perfect for Jio 5G users and Indian small business owners.
                  </p>
                </div>

                {aiStatus?.hasCustomGeminiKey ? (
                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-blue-300 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span>{aiStatus.maskedGeminiKey}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newKey = prompt('Enter your new Google Gemini API key (AQ... or AIza...):');
                          if (newKey && newKey.trim() && !newKey.trim().startsWith('sk-')) {
                            setGeminiKey(newKey.trim());
                            handleSaveGeminiKey();
                          }
                        }}
                        className="text-[11px] text-blue-300 hover:text-blue-200 underline font-semibold"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectGemini}
                        className="text-[11px] text-red-300 hover:text-red-200 underline font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="Paste Gemini Key (AQ... or AIza...)"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                      />
                      <button
                        type="button"
                        disabled={savingGeminiKey || !geminiKey}
                        onClick={handleSaveGeminiKey}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-all shrink-0"
                      >
                        {savingGeminiKey ? 'Saving...' : 'Activate'}
                      </button>
                    </div>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-300 hover:text-blue-200 underline font-semibold flex items-center space-x-1"
                    >
                      <span>Get 100% Free Key (Google AI Studio)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* CARD 2: OpenAI GPT-4o Vision (BYOK) */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-emerald-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-emerald-300 flex items-center space-x-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-400" />
                      <span>OpenAI GPT-4o Vision</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      BYOK
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Uses your personal OpenAI API credits at wholesale rates (~₹0.10/scan). Charged directly on your OpenAI account.
                  </p>
                </div>

                {aiStatus?.hasCustomApiKey ? (
                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-emerald-300 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{aiStatus.maskedApiKey}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newKey = prompt('Enter your new OpenAI API key (sk-...):');
                          if (newKey && newKey.trim().startsWith('sk-')) {
                            setCustomKey(newKey.trim());
                            handleSaveKey();
                          }
                        }}
                        className="text-[11px] text-emerald-300 hover:text-emerald-200 underline font-semibold"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="text-[11px] text-red-300 hover:text-red-200 underline font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="Paste OpenAI Key (sk-...)"
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        type="button"
                        disabled={savingKey || !customKey}
                        onClick={handleSaveKey}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-all shrink-0"
                      >
                        {savingKey ? 'Saving...' : 'Activate'}
                      </button>
                    </div>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-teal-300 hover:text-teal-200 underline font-semibold flex items-center space-x-1"
                    >
                      <span>Get OpenAI API Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

            </div>

            {/* Instant Demo Sandbox Option */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Want to test catalog generation without providing any API key?
              </span>
              <button
                type="button"
                onClick={handleSimulateConnect}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                title="Simulate connection for instant catalog testing without an API key"
              >
                <span>⚡ Instant Demo Test</span>
              </button>
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
