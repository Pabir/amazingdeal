import React, { useState, useEffect } from 'react';
import { Tenant, ChatGptStatus } from '../types';
import {
  QrCode, Truck, Clock, MapPin, Save, ShieldCheck, Sparkles, Key, CheckCircle2,
  Unlink, RefreshCw, ExternalLink, Check, Tag, CreditCard, Lock, Package,
  Send, Smartphone, AlertCircle, Building, Receipt, Zap, Globe
} from 'lucide-react';
import { ApiService } from '../services/api';
import { MASTER_STORE_CATEGORIES } from '../data/categoriesData';

interface StoreSettingsProps {
  tenant: Tenant | null;
  onSave: (updated: Partial<Tenant>) => void;
}

type TabType = 'PROFILE' | 'PAYMENT' | 'DELIVERY' | 'GST_BANK' | 'AI_STUDIO';

export const StoreSettings: React.FC<StoreSettingsProps> = ({ tenant, onSave }) => {
  const [activeTab, setActiveTab] = useState<TabType>('PROFILE');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Store Profile State
  const [storeName, setStoreName] = useState(tenant?.storeName || '');
  const [storeAddress, setStoreAddress] = useState(tenant?.storeAddress || '');
  const [ownerPhone, setOwnerPhone] = useState(tenant?.ownerPhone || '');
  const [storeTimings, setStoreTimings] = useState(tenant?.storeTimings || '8:00 AM - 10:00 PM');
  const [bannerUrl, setBannerUrl] = useState(tenant?.bannerUrl || '');
  const [logoUrl, setLogoUrl] = useState(tenant?.logoUrl || '');

  // Business Category State
  const initialCats = tenant?.storeCategory
    ? tenant.storeCategory.split(',').map((c) => c.trim()).filter(Boolean)
    : ['Daily Essentials & Groceries'];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCats);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Payment Gateway BYOK & Direct UPI State
  const [upiVpa, setUpiVpa] = useState(tenant?.upiVpa || '');
  const [customUpiQrUrl, setCustomUpiQrUrl] = useState(tenant?.customUpiQrUrl || '');
  const [razorpayByokEnabled, setRazorpayByokEnabled] = useState(tenant?.razorpayByokEnabled || false);
  const [razorpayKeyId, setRazorpayKeyId] = useState(tenant?.razorpayKeyId || '');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState(tenant?.razorpayKeySecret || '');
  const [hasRazorpaySecret, setHasRazorpaySecret] = useState(tenant?.hasRazorpaySecret || false);
  const [testingRazorpay, setTestingRazorpay] = useState(false);
  const [razorpayTestStatus, setRazorpayTestStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // COD State
  const [codEnabled, setCodEnabled] = useState(tenant?.codEnabled ?? true);
  const [codExtraCharge, setCodExtraCharge] = useState(tenant?.codExtraCharge?.toString() || '0');
  const [codMinAmount, setCodMinAmount] = useState(tenant?.codMinAmount?.toString() || '0');
  const [codMaxAmount, setCodMaxAmount] = useState(tenant?.codMaxAmount?.toString() || '10000');
  const [codOtpRequired, setCodOtpRequired] = useState(tenant?.codOtpRequired || false);

  // Own Delivery Fleet State
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(tenant?.deliveryRadiusKm?.toString() || '5');
  const [deliveryCharge, setDeliveryCharge] = useState(tenant?.deliveryCharge?.toString() || '30');
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(tenant?.freeDeliveryAbove?.toString() || '499');
  const [minOrderAmount, setMinOrderAmount] = useState(tenant?.minOrderAmount?.toString() || '0');
  const [allowedPincodesText, setAllowedPincodesText] = useState(tenant?.allowedPincodesText || '');
  const [deliveryTimeSlotsJson, setDeliveryTimeSlotsJson] = useState(tenant?.deliveryTimeSlotsJson || '["Today Evening (5 PM - 8 PM)", "Tomorrow Morning (9 AM - 12 PM)", "Tomorrow Evening (5 PM - 8 PM)"]');
  const [expressDeliveryEnabled, setExpressDeliveryEnabled] = useState(tenant?.expressDeliveryEnabled || false);
  const [expressDeliveryMinutes, setExpressDeliveryMinutes] = useState(tenant?.expressDeliveryMinutes?.toString() || '60');
  const [expressDeliveryFee, setExpressDeliveryFee] = useState(tenant?.expressDeliveryFee?.toString() || '49');

  // Shiprocket BYOK State
  const [shiprocketEnabled, setShiprocketEnabled] = useState(tenant?.shiprocketEnabled || false);
  const [shiprocketEmail, setShiprocketEmail] = useState(tenant?.shiprocketEmail || '');
  const [shiprocketPassword, setShiprocketPassword] = useState(tenant?.shiprocketPassword || '');
  const [hasShiprocketPassword, setHasShiprocketPassword] = useState(tenant?.hasShiprocketPassword || false);
  const [shiprocketPickupLocation, setShiprocketPickupLocation] = useState(tenant?.shiprocketPickupLocation || 'Primary');
  const [shiprocketPricingRule, setShiprocketPricingRule] = useState(tenant?.shiprocketPricingRule || 'FLAT_FEE');
  const [shiprocketFlatFee, setShiprocketFlatFee] = useState(tenant?.shiprocketFlatFee?.toString() || '60');
  const [shiprocketFreeAbove, setShiprocketFreeAbove] = useState(tenant?.shiprocketFreeAbove?.toString() || '999');
  const [testingShiprocket, setTestingShiprocket] = useState(false);
  const [shiprocketTestStatus, setShiprocketTestStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // GST & Bank Details
  const [gstin, setGstin] = useState(tenant?.gstin || '');
  const [pan, setPan] = useState(tenant?.pan || '');
  const [stateCode, setStateCode] = useState(tenant?.stateCode || '07');
  const [invoicePrefix, setInvoicePrefix] = useState(tenant?.invoicePrefix || 'INV-');
  const [invoiceTerms, setInvoiceTerms] = useState(tenant?.invoiceTerms || 'Goods once sold cannot be returned after 7 days.');
  const [bankName, setBankName] = useState(tenant?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(tenant?.bankAccountNumber || '');
  const [bankIfsc, setBankIfsc] = useState(tenant?.bankIfsc || '');
  const [bankBranch, setBankBranch] = useState(tenant?.bankBranch || '');

  // AI & Multi-Provider State
  const [aiStatus, setAiStatus] = useState<ChatGptStatus | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [customKey, setCustomKey] = useState<string>(() => localStorage.getItem('ad_custom_openai_key') || '');
  const [geminiKey, setGeminiKey] = useState<string>(() => localStorage.getItem('ad_custom_gemini_key') || '');
  const [savingKey, setSavingKey] = useState(false);
  const [savingGeminiKey, setSavingGeminiKey] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  useEffect(() => {
    loadServerSettings();
    loadAiStatus();
  }, []);

  const loadServerSettings = async () => {
    try {
      setLoadingSettings(true);
      const data = await ApiService.getSettings();
      if (data) {
        if (data.storeName) setStoreName(data.storeName);
        if (data.storeAddress) setStoreAddress(data.storeAddress);
        if (data.ownerPhone) setOwnerPhone(data.ownerPhone);
        if (data.upiVpa) setUpiVpa(data.upiVpa);
        if (data.customUpiQrUrl) setCustomUpiQrUrl(data.customUpiQrUrl);
        if (data.deliveryCharge !== undefined) setDeliveryCharge(data.deliveryCharge.toString());
        if (data.freeDeliveryAbove !== undefined) setFreeDeliveryAbove(data.freeDeliveryAbove.toString());
        if (data.minOrderAmount !== undefined) setMinOrderAmount(data.minOrderAmount.toString());
        if (data.deliveryRadiusKm !== undefined) setDeliveryRadiusKm(data.deliveryRadiusKm.toString());
        if (data.storeTimings) setStoreTimings(data.storeTimings);
        if (data.bannerUrl) setBannerUrl(data.bannerUrl);
        if (data.logoUrl) setLogoUrl(data.logoUrl);

        // GST & Bank
        if (data.gstin) setGstin(data.gstin);
        if (data.pan) setPan(data.pan);
        if (data.stateCode) setStateCode(data.stateCode);
        if (data.invoicePrefix) setInvoicePrefix(data.invoicePrefix);
        if (data.invoiceTerms) setInvoiceTerms(data.invoiceTerms);
        if (data.bankName) setBankName(data.bankName);
        if (data.bankAccountNumber) setBankAccountNumber(data.bankAccountNumber);
        if (data.bankIfsc) setBankIfsc(data.bankIfsc);
        if (data.bankBranch) setBankBranch(data.bankBranch);

        // Payment BYOK
        if (data.razorpayByokEnabled !== undefined) setRazorpayByokEnabled(data.razorpayByokEnabled);
        if (data.razorpayKeyId) setRazorpayKeyId(data.razorpayKeyId);
        if (data.hasRazorpaySecret !== undefined) setHasRazorpaySecret(data.hasRazorpaySecret);
        if (data.codEnabled !== undefined) setCodEnabled(data.codEnabled);
        if (data.codExtraCharge !== undefined) setCodExtraCharge(data.codExtraCharge.toString());
        if (data.codMinAmount !== undefined) setCodMinAmount(data.codMinAmount.toString());
        if (data.codMaxAmount !== undefined) setCodMaxAmount(data.codMaxAmount.toString());
        if (data.codOtpRequired !== undefined) setCodOtpRequired(data.codOtpRequired);

        // Delivery & Shiprocket
        if (data.allowedPincodesText) setAllowedPincodesText(data.allowedPincodesText);
        if (data.deliveryTimeSlotsJson) setDeliveryTimeSlotsJson(data.deliveryTimeSlotsJson);
        if (data.expressDeliveryEnabled !== undefined) setExpressDeliveryEnabled(data.expressDeliveryEnabled);
        if (data.expressDeliveryMinutes !== undefined) setExpressDeliveryMinutes(data.expressDeliveryMinutes.toString());
        if (data.expressDeliveryFee !== undefined) setExpressDeliveryFee(data.expressDeliveryFee.toString());

        if (data.shiprocketEnabled !== undefined) setShiprocketEnabled(data.shiprocketEnabled);
        if (data.shiprocketEmail) setShiprocketEmail(data.shiprocketEmail);
        if (data.hasShiprocketPassword !== undefined) setHasShiprocketPassword(data.hasShiprocketPassword);
        if (data.shiprocketPickupLocation) setShiprocketPickupLocation(data.shiprocketPickupLocation);
        if (data.shiprocketPricingRule) setShiprocketPricingRule(data.shiprocketPricingRule);
        if (data.shiprocketFlatFee !== undefined) setShiprocketFlatFee(data.shiprocketFlatFee.toString());
        if (data.shiprocketFreeAbove !== undefined) setShiprocketFreeAbove(data.shiprocketFreeAbove.toString());
      }
    } catch (e: any) {
      console.warn('Could not fetch server settings:', e);
    } finally {
      setLoadingSettings(false);
    }
  };

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

  const handleTestRazorpay = async () => {
    if (!razorpayKeyId) {
      alert('Please enter your Razorpay Key ID');
      return;
    }
    setTestingRazorpay(true);
    setRazorpayTestStatus(null);
    try {
      const res = await ApiService.testRazorpay(razorpayKeyId, razorpayKeySecret);
      setRazorpayTestStatus({ success: res.success, msg: res.message });
      if (res.success) {
        setHasRazorpaySecret(true);
      }
    } catch (err: any) {
      setRazorpayTestStatus({ success: false, msg: err.message || 'Razorpay connection test failed' });
    } finally {
      setTestingRazorpay(false);
    }
  };

  const handleTestShiprocket = async () => {
    if (!shiprocketEmail) {
      alert('Please enter your Shiprocket email');
      return;
    }
    setTestingShiprocket(true);
    setShiprocketTestStatus(null);
    try {
      const res = await ApiService.testShiprocket(shiprocketEmail, shiprocketPassword);
      setShiprocketTestStatus({ success: res.success, msg: res.message });
      if (res.success) {
        setHasShiprocketPassword(true);
      }
    } catch (err: any) {
      setShiprocketTestStatus({ success: false, msg: err.message || 'Shiprocket authentication failed' });
    } finally {
      setTestingShiprocket(false);
    }
  };

  const handleSaveGeminiKey = async () => {
    if (!geminiKey.trim()) return;
    try {
      setSavingGeminiKey(true);
      const res = await ApiService.saveCustomGeminiApiKey(geminiKey.trim());
      setAiStatus(res);
      setAiMessage('Google Gemini API Key activated!');
      setTimeout(() => setAiMessage(null), 3000);
    } catch (e: any) {
      alert('Failed to save Gemini key: ' + e.message);
    } finally {
      setSavingGeminiKey(false);
    }
  };

  const handleSaveOpenAiKey = async () => {
    if (!customKey.trim()) return;
    try {
      setSavingKey(true);
      const res = await ApiService.saveCustomApiKey(customKey.trim());
      setAiStatus(res);
      setAiMessage('OpenAI API Key activated!');
      setTimeout(() => setAiMessage(null), 3000);
    } catch (e: any) {
      alert('Failed to save OpenAI key: ' + e.message);
    } finally {
      setSavingKey(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Tenant> = {
      storeName,
      storeAddress,
      ownerPhone,
      storeCategory: selectedCategories.join(', '),
      storeTimings,
      bannerUrl,
      logoUrl,
      // Payment BYOK
      upiVpa,
      customUpiQrUrl,
      razorpayByokEnabled,
      razorpayKeyId,
      razorpayKeySecret: razorpayKeySecret && razorpayKeySecret !== '●●●●●●●●' ? razorpayKeySecret : undefined,
      codEnabled,
      codExtraCharge: parseFloat(codExtraCharge) || 0,
      codMinAmount: parseFloat(codMinAmount) || 0,
      codMaxAmount: parseFloat(codMaxAmount) || 10000,
      codOtpRequired,
      // Delivery & Fleet
      deliveryRadiusKm: parseFloat(deliveryRadiusKm) || 5,
      deliveryCharge: parseFloat(deliveryCharge) || 0,
      freeDeliveryAbove: parseFloat(freeDeliveryAbove) || 0,
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      allowedPincodesText,
      deliveryTimeSlotsJson,
      expressDeliveryEnabled,
      expressDeliveryMinutes: parseInt(expressDeliveryMinutes, 10) || 60,
      expressDeliveryFee: parseFloat(expressDeliveryFee) || 49,
      // Shiprocket
      shiprocketEnabled,
      shiprocketEmail,
      shiprocketPassword: shiprocketPassword && shiprocketPassword !== '●●●●●●●●' ? shiprocketPassword : undefined,
      shiprocketPickupLocation,
      shiprocketPricingRule,
      shiprocketFlatFee: parseFloat(shiprocketFlatFee) || 60,
      shiprocketFreeAbove: parseFloat(shiprocketFreeAbove) || 999,
      // GST & Bank
      gstin,
      pan,
      stateCode,
      invoicePrefix,
      invoiceTerms,
      bankName,
      bankAccountNumber,
      bankIfsc,
      bankBranch,
    };

    onSave(payload);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header & Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Merchant Business & Logistics Studio</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                BYOK Ready
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure your store branding, zero-fee direct UPI, Razorpay gateway BYOK, own delivery fleet, and Shiprocket domestic logistics.
            </p>
          </div>
          {savedSuccess && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 animate-bounce">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Settings Saved & Synced!</span>
            </span>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PROFILE'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Store Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PAYMENT')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PAYMENT'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payments & Gateway (BYOK)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DELIVERY')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DELIVERY'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Delivery & Shiprocket</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GST_BANK')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'GST_BANK'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>GST & Bank Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AI_STUDIO')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'AI_STUDIO'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Catalog Studio</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ========================================================
            TAB 1: STORE PROFILE
        ======================================================== */}
        {activeTab === 'PROFILE' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h4 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-700" />
              <span>Store Profile & Business Categorization</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Store Public Name *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Owner WhatsApp / Phone *
                </label>
                <input
                  type="text"
                  required
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Business Categories */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Store Verticals & Categories ({selectedCategories.length} Selected)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Choose all business categories you operate. Influences AI catalog generation prompts.
                  </p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search categories (e.g. Groceries, Dairy, Apparel, Tech)..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {MASTER_STORE_CATEGORIES.filter((c) =>
                  categorySearchQuery
                    ? c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                      c.tagline.toLowerCase().includes(categorySearchQuery.toLowerCase())
                    : true
                ).map((cat) => {
                  const isSelected = selectedCategories.includes(cat.name);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategories((prev) => {
                          if (isSelected) {
                            if (prev.length === 1) return prev;
                            return prev.filter((c) => c !== cat.name);
                          } else {
                            return [...prev, cat.name];
                          }
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 text-slate-900 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                        isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-slate-50'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold leading-tight block truncate text-slate-900">{cat.name}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{cat.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Store Physical Address
              </label>
              <textarea
                rows={2}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Shop 12, Main Market, Indiranagar, Bengaluru 560038"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Store Operating Timings
              </label>
              <input
                type="text"
                value={storeTimings}
                onChange={(e) => setStoreTimings(e.target.value)}
                placeholder="8:00 AM - 10:00 PM (Monday - Sunday)"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: PAYMENT & GATEWAY STUDIO (BYOK)
        ======================================================== */}
        {activeTab === 'PAYMENT' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h4 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Payment Receiving & Gateway BYOK Setup</span>
            </h4>

            {/* Direct UPI Section */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-900 font-extrabold text-sm">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span>1. Direct Merchant UPI VPA (0% MDR / Free)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900">
                  Instant Settlement
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                When shoppers pay with UPI, our platform renders dynamic QR codes and deep links. Money lands directly in your bank account with zero platform commission.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Merchant UPI VPA *
                  </label>
                  <input
                    type="text"
                    required
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="e.g. yourstore@okaxis, shop@icici"
                    className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Custom Printed UPI QR Sticker Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={customUpiQrUrl}
                    onChange={(e) => setCustomUpiQrUrl(e.target.value)}
                    placeholder="https://yourdomain.com/my-shop-qr.png"
                    className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Razorpay BYOK Section */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-blue-900 font-extrabold text-sm">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span>2. Razorpay Payment Gateway (BYOK)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={razorpayByokEnabled}
                    onChange={(e) => setRazorpayByokEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-800">
                    {razorpayByokEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <p className="text-xs text-blue-800 leading-relaxed">
                Accept Credit Cards, Debit Cards, Netbanking, EMIs, and Wallets directly through your own merchant Razorpay account. Your API keys are encrypted at rest with AES-256-GCM.
              </p>

              <div className="p-3 bg-blue-100/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <span className="text-sm">🔑</span>
                  <span>How to Get Your Razorpay API Keys</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Log into your <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Razorpay Dashboard</a> ➔ <strong>Settings</strong> ➔ <strong>API Keys</strong> ➔ Click <strong>"Generate Key"</strong>. Use <code>rzp_test_...</code> for Sandbox testing or <code>rzp_live_...</code> to accept real payments from customers.
                </p>
              </div>

              {razorpayByokEnabled && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Razorpay Key ID
                      </label>
                      <input
                        type="text"
                        value={razorpayKeyId}
                        onChange={(e) => setRazorpayKeyId(e.target.value)}
                        placeholder="rzp_live_..."
                        className="w-full px-3.5 py-2 bg-white border border-blue-300 rounded-xl text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Razorpay Key Secret {hasRazorpaySecret && <span className="text-emerald-600">(Stored Securely)</span>}
                      </label>
                      <input
                        type="password"
                        value={razorpayKeySecret}
                        onChange={(e) => setRazorpayKeySecret(e.target.value)}
                        placeholder={hasRazorpaySecret ? '●●●●●●●● (Enter to update)' : 'Paste your Key Secret'}
                        className="w-full px-3.5 py-2 bg-white border border-blue-300 rounded-xl text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        disabled={testingRazorpay || !razorpayKeyId}
                        onClick={handleTestRazorpay}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{testingRazorpay ? 'Verifying Gateway...' : 'Test Razorpay Connection'}</span>
                      </button>

                      {razorpayTestStatus && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          razorpayTestStatus.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {razorpayTestStatus.success ? 'Gateway Verified' : 'Verification Failed'}
                        </span>
                      )}
                    </div>

                    {razorpayTestStatus && (
                      <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
                        razorpayTestStatus.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <p className="font-medium">{razorpayTestStatus.msg}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cash on Delivery (COD) Rules */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm">
                  <Smartphone className="w-5 h-5 text-slate-700" />
                  <span>3. Cash on Delivery (COD) Rules & Anti-Fraud</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={codEnabled}
                    onChange={(e) => setCodEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-800">
                    {codEnabled ? 'COD Active' : 'COD Disabled'}
                  </span>
                </label>
              </div>

              {codEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Extra COD Handling Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={codExtraCharge}
                      onChange={(e) => setCodExtraCharge(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                    <span className="text-[10px] text-slate-500">e.g. ₹25 surcharge for cash handling</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Min Order for COD (₹)
                    </label>
                    <input
                      type="number"
                      value={codMinAmount}
                      onChange={(e) => setCodMinAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Max Order for COD (₹)
                    </label>
                    <input
                      type="number"
                      value={codMaxAmount}
                      onChange={(e) => setCodMaxAmount(e.target.value)}
                      placeholder="10000"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 3: DELIVERY & SHIPROCKET BYOK
        ======================================================== */}
        {activeTab === 'DELIVERY' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h4 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Fulfillment, Own Fleet & Shiprocket BYOK</span>
            </h4>

            {/* Own Delivery Fleet */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h5 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Local Store Fleet & Delivery Rules</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Standard Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Free Delivery Above (₹)
                  </label>
                  <input
                    type="number"
                    value={freeDeliveryAbove}
                    onChange={(e) => setFreeDeliveryAbove(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Service Radius (KM)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={deliveryRadiusKm}
                    onChange={(e) => setDeliveryRadiusKm(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Minimum Order (₹)
                  </label>
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Whitelisted Serviceable Pincodes (Comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={allowedPincodesText}
                  onChange={(e) => setAllowedPincodesText(e.target.value)}
                  placeholder="560038, 560001, 560008 (Leave empty to allow all local orders)"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              {/* Express Quick Delivery */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-xs font-bold text-slate-800">Express 60-Minute Quick Delivery</span>
                    <p className="text-[11px] text-slate-500">Allow customers to choose rush express delivery at checkout.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {expressDeliveryEnabled && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={expressDeliveryFee}
                        onChange={(e) => setExpressDeliveryFee(e.target.value)}
                        placeholder="₹49"
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <span className="text-xs text-slate-500 font-bold">Extra Fee (₹)</span>
                    </div>
                  )}

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expressDeliveryEnabled}
                      onChange={(e) => setExpressDeliveryEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Shiprocket BYOK Logistics */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-purple-900 font-extrabold text-sm">
                  <Package className="w-5 h-5 text-purple-600" />
                  <span>Shiprocket Domestic Courier Logistics (BYOK)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shiprocketEnabled}
                    onChange={(e) => setShiprocketEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-800">
                    {shiprocketEnabled ? 'Active' : 'Disabled'}
                  </span>
                </label>
              </div>

              <p className="text-xs text-purple-800 leading-relaxed">
                Connect your Shiprocket account to ship pan-India across 29,000+ pincodes via BlueDart, Delhivery, DTDC, and Shadowfax. Generate 1-click AWB shipping labels directly from your Order Board.
              </p>

              <div className="p-3 bg-purple-100/70 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <span className="text-sm">🔑</span>
                  <span>Requires Dedicated Shiprocket API User</span>
                </div>
                <p className="text-[11px] leading-relaxed text-purple-800">
                  Shiprocket requires dedicated <strong>API User</strong> credentials. Do not use your personal web login password.
                  Generate credentials in your Shiprocket dashboard: <strong>Settings ➔ API ➔ Configure ➔ Create an API User</strong>.
                </p>
              </div>

              {shiprocketEnabled && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Shiprocket API User Email
                      </label>
                      <input
                        type="email"
                        value={shiprocketEmail}
                        onChange={(e) => setShiprocketEmail(e.target.value)}
                        placeholder="api-user@yourstore.com"
                        className="w-full px-3.5 py-2 bg-white border border-purple-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Shiprocket API User Password {hasShiprocketPassword && <span className="text-emerald-600">(Stored Securely)</span>}
                      </label>
                      <input
                        type="password"
                        value={shiprocketPassword}
                        onChange={(e) => setShiprocketPassword(e.target.value)}
                        placeholder={hasShiprocketPassword ? '●●●●●●●● (Enter to update)' : 'Enter API user password'}
                        className="w-full px-3.5 py-2 bg-white border border-purple-300 rounded-xl text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Pickup Location Name
                      </label>
                      <input
                        type="text"
                        value={shiprocketPickupLocation}
                        onChange={(e) => setShiprocketPickupLocation(e.target.value)}
                        placeholder="Primary"
                        className="w-full px-3.5 py-2 bg-white border border-purple-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Freight Pricing Rule
                      </label>
                      <select
                        value={shiprocketPricingRule}
                        onChange={(e) => setShiprocketPricingRule(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-purple-300 rounded-xl text-sm font-bold"
                      >
                        <option value="FLAT_FEE">Standard Flat Fee</option>
                        <option value="FREE_ABOVE">Free Above Threshold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Courier Flat Charge (₹)
                      </label>
                      <input
                        type="number"
                        value={shiprocketFlatFee}
                        onChange={(e) => setShiprocketFlatFee(e.target.value)}
                        placeholder="60"
                        className="w-full px-3.5 py-2 bg-white border border-purple-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        disabled={testingShiprocket || !shiprocketEmail}
                        onClick={handleTestShiprocket}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{testingShiprocket ? 'Authenticating API...' : 'Test Shiprocket Connection'}</span>
                      </button>

                      {shiprocketTestStatus && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          shiprocketTestStatus.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {shiprocketTestStatus.success ? 'Connection Verified' : 'Authentication Failed'}
                        </span>
                      )}
                    </div>

                    {shiprocketTestStatus && (
                      <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
                        shiprocketTestStatus.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <p className="font-medium">{shiprocketTestStatus.msg}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 4: GST & BANK DETAILS (VYAPAR BILLING)
        ======================================================== */}
        {activeTab === 'GST_BANK' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h4 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-600" />
              <span>GST Compliance & Bank Account Details (Printed on Invoices)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Merchant GSTIN
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="29AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  PAN Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  State Code (2-digit GST)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  placeholder="29"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-4">
              <h5 className="font-bold text-purple-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-purple-600" />
                <span>Bank Details for B2B Payments & Quotations</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="HDFC Bank / State Bank of India"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="50200012345678"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="Indiranagar Branch"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV- / GST-"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Invoice Terms & Notes
                </label>
                <input
                  type="text"
                  value={invoiceTerms}
                  onChange={(e) => setInvoiceTerms(e.target.value)}
                  placeholder="Goods once sold cannot be returned after 7 days."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: AI PRODUCT STUDIO
        ======================================================== */}
        {activeTab === 'AI_STUDIO' && (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 border border-emerald-500/30 text-white space-y-5 shadow-xl shadow-emerald-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-400/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>AI Product Vision & Catalog Studio</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Zero Cost BYOK
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    Take a photo of any grocery, apparel, or electronics item. Gemini or OpenAI turns it into title, description, and pricing in seconds.
                  </p>
                </div>
              </div>

              {aiMessage && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full animate-pulse">
                  {aiMessage}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Gemini Card */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-blue-300 flex items-center gap-2">
                    <span>Google Gemini Vision (Free Tier Available)</span>
                  </span>
                  {aiStatus?.hasCustomGeminiKey && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Paste Gemini API Key (AIzaSy...)"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                  />
                  <button
                    type="button"
                    disabled={savingGeminiKey || !geminiKey}
                    onClick={handleSaveGeminiKey}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-all"
                  >
                    {savingGeminiKey ? 'Saving...' : 'Activate'}
                  </button>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                >
                  <span>Get Free Google Gemini Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* OpenAI Card */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-emerald-300 flex items-center gap-2">
                    <span>OpenAI Vision (GPT-4o mini)</span>
                  </span>
                  {aiStatus?.hasCustomApiKey && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Paste OpenAI Key (sk-...)"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    disabled={savingKey || !customKey}
                    onClick={handleSaveOpenAiKey}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-all"
                  >
                    {savingKey ? 'Saving...' : 'Activate'}
                  </button>
                </div>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                >
                  <span>Get OpenAI API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Changes will apply immediately to your live customer storefront.
          </p>
          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-black shadow-lg shadow-slate-900/25 transition-all transform hover:-translate-y-0.5"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save All Settings</span>
          </button>
        </div>

      </form>
    </div>
  );
};
