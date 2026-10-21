import React, { useState, useEffect } from 'react';
import { Sparkles, Upload, Image as ImageIcon, CheckCircle2, ArrowRight, Loader2, X, AlertCircle, RefreshCw, Key, ShieldCheck, Tag } from 'lucide-react';
import { ApiService } from '../services/api';
import { ChatGptStatus, GeneratedProduct } from '../types';

interface AiProductScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
  categories: string[];
}

export const AiProductScannerModal: React.FC<AiProductScannerModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
  categories,
}) => {
  const [chatGptStatus, setChatGptStatus] = useState<ChatGptStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Scan state
  const [imageUrl, setImageUrl] = useState('');
  const [base64Image, setBase64Image] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredCategory, setPreferredCategory] = useState('');

  // AI Pipeline State
  const [analyzing, setAnalyzing] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<GeneratedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Manual API Key / Config Modal
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setError(null);
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await ApiService.getChatGptStatus();
      setChatGptStatus(res);
    } catch (e: any) {
      console.warn('Could not load ChatGPT status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSignInWithChatGpt = async () => {
    try {
      setError(null);
      const auth = await ApiService.getChatGptAuthUrl();
      // Store codeVerifier for PKCE exchange on callback
      if (auth.codeVerifier) {
        localStorage.setItem('chatgpt_code_verifier', auth.codeVerifier);
        localStorage.setItem('chatgpt_auth_state', auth.state);
      }
      // Redirect to OpenAI OAuth consent screen
      window.location.href = auth.authorizationUrl;
    } catch (e: any) {
      setError('Failed to initiate ChatGPT OAuth: ' + (e.message || 'Check server configuration'));
    }
  };

  const handleSimulateConnect = async () => {
    try {
      setLoadingStatus(true);
      setError(null);
      const res = await ApiService.handleChatGptCallback({
        code: 'simulated_test_code_' + Date.now(),
      });
      setChatGptStatus(res);
    } catch (e: any) {
      setError('Simulated connection failed: ' + e.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSaveCustomKey = async () => {
    if (!customKey.trim().startsWith('sk-')) {
      setError('Please enter a valid OpenAI API key starting with "sk-"');
      return;
    }
    try {
      setSavingKey(true);
      setError(null);
      const updated = await ApiService.saveCustomApiKey(customKey.trim());
      setChatGptStatus(updated);
      setShowKeyInput(false);
      setCustomKey('');
    } catch (e: any) {
      setError('Failed to save API key: ' + e.message);
    } finally {
      setSavingKey(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setBase64Image(result);
      setImagePreview(result);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  const handleSetSamplePhoto = () => {
    const sample = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80';
    setImageUrl(sample);
    setImagePreview(sample);
    setBase64Image('');
  };

  const handleAnalyzePhoto = async (forceSimulate = false) => {
    if (!imagePreview && !imageUrl && !base64Image) {
      setError('Please select or upload a product photo first.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);

      const res = await ApiService.generateProductFromImage({
        imageUrl: imageUrl || undefined,
        base64Image: base64Image || undefined,
        preferredCategory: preferredCategory || undefined,
        additionalMerchantNotes: notes || undefined,
        simulateDemo: forceSimulate || (!chatGptStatus?.connected && !chatGptStatus?.hasCustomApiKey),
      });

      setGeneratedDraft(res);
    } catch (e: any) {
      setError(e.message || 'Failed to analyze product photo. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePublishToCatalog = async () => {
    if (!generatedDraft) return;
    try {
      setSubmitting(true);
      setError(null);

      await ApiService.createProduct({
        title: generatedDraft.title,
        description: generatedDraft.description,
        price: generatedDraft.suggestedPrice,
        comparePrice: generatedDraft.comparePrice,
        category: generatedDraft.category || 'Groceries',
        imageUrl: generatedDraft.imageUrl || imagePreview || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
        inventoryQuantity: generatedDraft.inventoryQuantity || 50,
        tracksInventory: true,
        status: 'ACTIVE',
      });

      onProductCreated();
      handleReset();
      onClose();
    } catch (e: any) {
      setError('Failed to publish product: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setImageUrl('');
    setBase64Image('');
    setImagePreview('');
    setNotes('');
    setGeneratedDraft(null);
    setError(null);
  };

  if (!isOpen) return null;

  const isConnected = chatGptStatus?.connected || chatGptStatus?.hasCustomApiKey;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-6 py-4 text-white flex items-center justify-between border-b border-emerald-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">AI Magic Product Studio</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ChatGPT Vision
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Snap or upload raw photos to auto-create beautiful catalog listings in seconds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ChatGPT Plan Status Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          {chatGptStatus?.connected ? (
            <div className="flex items-center space-x-2 text-emerald-800 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Connected to <strong className="text-emerald-950">{chatGptStatus.planTier || 'ChatGPT Plus'}</strong> ({chatGptStatus.accountEmail})
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Zero Platform Cost
              </span>
            </div>
          ) : chatGptStatus?.hasCustomApiKey ? (
            <div className="flex items-center space-x-2 text-slate-700 font-semibold">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Using Custom OpenAI Key ({chatGptStatus.maskedApiKey})</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>No ChatGPT account linked yet. You can sign in or test with instant demo mode.</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {!chatGptStatus?.connected && (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleSignInWithChatGpt}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Sign in with ChatGPT</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateConnect}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg font-bold text-[11px] transition-all"
                  title="Simulate ChatGPT Plus connection for testing"
                >
                  ⚡ Instant Demo Connect
                </button>
              </div>
            )}
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold underline"
            >
              {showKeyInput ? 'Close Key Settings' : 'Custom Key'}
            </button>
          </div>
        </div>

        {/* API Key Drawer */}
        {showKeyInput && (
          <div className="bg-amber-50/70 border-b border-amber-200 px-6 py-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-amber-900">Custom OpenAI API Key (BYOK):</span>
            <input
              type="password"
              placeholder="sk-..."
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono"
            />
            <button
              disabled={savingKey}
              onClick={handleSaveCustomKey}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs"
            >
              {savingKey ? 'Saving...' : 'Save Key'}
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {!generatedDraft ? (
            /* STEP 1: Upload & Scan Image */
            <div className="space-y-5">
              
              {/* Photo Input Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select or Snap Product Photograph *
                </label>

                {imagePreview ? (
                  <div className="relative rounded-2xl border-2 border-emerald-500/50 bg-slate-50 p-2 overflow-hidden flex items-center justify-center max-h-72">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="max-h-64 object-contain rounded-xl shadow-sm"
                    />
                    <button
                      onClick={() => {
                        setImagePreview('');
                        setBase64Image('');
                        setImageUrl('');
                      }}
                      className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full shadow-lg backdrop-blur-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {analyzing && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3 p-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center animate-bounce shadow-xl shadow-emerald-500/50">
                          <Sparkles className="w-6 h-6 text-slate-950" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-emerald-300">ChatGPT Vision is analyzing your item...</p>
                          <p className="text-xs text-slate-300 mt-1">Extracting product title, pack size, specs, and pricing</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 sm:p-8 text-center transition-colors bg-slate-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Drag and drop your product photo here, or browse
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Works with photos taken on mobile phones, camera roll, or packaged goods
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <label className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all">
                        <span>Browse Device Files</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleSetSamplePhoto}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
                      >
                        Use Sample Grocery Photo
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 max-w-sm mx-auto">
                      <span className="text-[11px] text-slate-400">Or paste public image URL:</span>
                      <div className="mt-1 flex items-center space-x-1.5">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={imageUrl}
                          onChange={(e) => {
                            setImageUrl(e.target.value);
                            setImagePreview(e.target.value);
                            setBase64Image('');
                          }}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Guidance Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Store Category (Optional)
                  </label>
                  <select
                    value={preferredCategory}
                    onChange={(e) => setPreferredCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                  >
                    <option value="">Auto-Detect from Photo</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Merchant Notes / Pack Details (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. 500g pouch, newly arrived brand"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isConnected
                      ? 'Powered by your personal ChatGPT subscription allowance'
                      : 'You can test using Demo Scan or sign in with ChatGPT'}
                  </span>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  {!isConnected && (
                    <button
                      type="button"
                      disabled={analyzing}
                      onClick={() => handleAnalyzePhoto(true)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
                    >
                      Instant Demo Scan
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={analyzing || !imagePreview}
                    onClick={() => handleAnalyzePhoto(false)}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing with ChatGPT...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>Generate with ChatGPT Vision</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* STEP 2: Review & Adjust Generated Product Draft */
            <div className="space-y-5 animate-fadeIn">
              
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Product extracted successfully! Review and customize details below:</span>
                </div>
                <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  {generatedDraft.poweredBy || 'ChatGPT Vision'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Photo Preview & Key Highlights */}
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 overflow-hidden flex items-center justify-center">
                    <img
                      src={generatedDraft.imageUrl || imagePreview}
                      alt={generatedDraft.title}
                      className="max-h-48 object-contain rounded-xl shadow-sm"
                    />
                  </div>

                  {generatedDraft.keyHighlights && generatedDraft.keyHighlights.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                        Key Features
                      </span>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {generatedDraft.keyHighlights.map((h, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="md:col-span-2 space-y-3">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={generatedDraft.title}
                      onChange={(e) => setGeneratedDraft({ ...generatedDraft, title: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Marketing Description *
                    </label>
                    <textarea
                      rows={3}
                      value={generatedDraft.description}
                      onChange={(e) => setGeneratedDraft({ ...generatedDraft, description: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.5"
                        value={generatedDraft.suggestedPrice}
                        onChange={(e) => setGeneratedDraft({ ...generatedDraft, suggestedPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        MRP / Compare (₹)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={generatedDraft.comparePrice || ''}
                        onChange={(e) => setGeneratedDraft({ ...generatedDraft, comparePrice: parseFloat(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-500 line-through"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={generatedDraft.category}
                        onChange={(e) => setGeneratedDraft({ ...generatedDraft, category: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Initial Stock
                      </label>
                      <input
                        type="number"
                        value={generatedDraft.inventoryQuantity || 50}
                        onChange={(e) => setGeneratedDraft({ ...generatedDraft, inventoryQuantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Search Tags */}
                  {generatedDraft.tags && generatedDraft.tags.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Search Keywords & Tags:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {generatedDraft.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-semibold"
                >
                  Scan Another Photo
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handlePublishToCatalog}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Catalog...</span>
                    </>
                  ) : (
                    <>
                      <span>Add to Store Catalog</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
