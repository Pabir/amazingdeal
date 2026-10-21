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
  const [activeEngine, setActiveEngine] = useState<'GEMINI' | 'OPENAI' | 'DEMO' | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState<GeneratedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Separate API Key Inputs for Gemini and OpenAI
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [openaiKeyInput, setOpenaiKeyInput] = useState('');
  const [savingGemini, setSavingGemini] = useState(false);
  const [savingOpenAi, setSavingOpenAi] = useState(false);

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
      console.warn('Could not load AI status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSignInWithChatGpt = async () => {
    try {
      setError(null);
      const auth = await ApiService.getChatGptAuthUrl();
      if (auth.codeVerifier) {
        localStorage.setItem('chatgpt_code_verifier', auth.codeVerifier);
        localStorage.setItem('chatgpt_auth_state', auth.state);
      }
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

  const handleSaveGeminiKey = async () => {
    const key = geminiKeyInput.trim();
    if (!key) {
      setError('Please enter your Google Gemini API key (starts with AQ. or AIza...).');
      return;
    }
    if (key.startsWith('sk-')) {
      setError('That appears to be an OpenAI API key (sk-...). Please enter it into the OpenAI field instead.');
      return;
    }

    try {
      setSavingGemini(true);
      setError(null);
      const updated = await ApiService.saveCustomGeminiApiKey(key);
      setChatGptStatus(updated);
      setGeminiKeyInput('');
    } catch (e: any) {
      setError('Failed to save Google Gemini key: ' + e.message);
    } finally {
      setSavingGemini(false);
    }
  };

  const handleSaveOpenAiKey = async () => {
    const key = openaiKeyInput.trim();
    if (!key) {
      setError('Please enter your OpenAI API key (starts with sk-...).');
      return;
    }
    if (key.startsWith('AQ.') || key.startsWith('AIza')) {
      setError('That appears to be a Google Gemini key. Please enter it into the Gemini field above.');
      return;
    }

    try {
      setSavingOpenAi(true);
      setError(null);
      const updated = await ApiService.saveCustomOpenAiApiKey(key);
      setChatGptStatus(updated);
      setOpenaiKeyInput('');
    } catch (e: any) {
      setError('Failed to save OpenAI key: ' + e.message);
    } finally {
      setSavingOpenAi(false);
    }
  };

  const handleDisconnectGemini = async () => {
    try {
      setLoadingStatus(true);
      setError(null);
      const updated = await ApiService.disconnectGemini();
      setChatGptStatus(updated);
    } catch (e: any) {
      setError('Failed to disconnect Gemini: ' + e.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleDisconnectOpenAi = async () => {
    try {
      setLoadingStatus(true);
      setError(null);
      const updated = await ApiService.disconnectOpenAi();
      setChatGptStatus(updated);
    } catch (e: any) {
      setError('Failed to disconnect OpenAI: ' + e.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const rawBase64 = reader.result as string;
      // Auto-compress large phone photos to max 1200px to ensure instant, reliable upload with no network timeouts
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setBase64Image(compressed);
          setImagePreview(compressed);
          setImageUrl('');
          return;
        }
        setBase64Image(rawBase64);
        setImagePreview(rawBase64);
        setImageUrl('');
      };
      img.onerror = () => {
        setBase64Image(rawBase64);
        setImagePreview(rawBase64);
        setImageUrl('');
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleSetSamplePhoto = () => {
    const sample = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80';
    setImageUrl(sample);
    setImagePreview(sample);
    setBase64Image('');
  };

  const handleAnalyzePhoto = async (engine: 'GEMINI' | 'OPENAI' | 'DEMO') => {
    if (!imagePreview && !imageUrl && !base64Image) {
      setError('Please select or upload a product photo first.');
      return;
    }

    if (engine === 'GEMINI' && !chatGptStatus?.hasCustomGeminiKey) {
      setShowKeyInput(true);
      setError('Please enter your free Google Gemini API key below to generate with Gemini.');
      return;
    }

    if (engine === 'OPENAI' && !chatGptStatus?.hasCustomApiKey && !chatGptStatus?.connected) {
      setShowKeyInput(true);
      setError('Please enter your OpenAI API key below to generate with OpenAI.');
      return;
    }

    try {
      setAnalyzing(true);
      setActiveEngine(engine);
      setError(null);

      const res = await ApiService.generateProductFromImage({
        imageUrl: imageUrl || undefined,
        base64Image: base64Image || undefined,
        preferredCategory: preferredCategory || undefined,
        additionalMerchantNotes: notes || undefined,
        simulateDemo: engine === 'DEMO',
        provider: engine === 'DEMO' ? undefined : engine,
      });

      setGeneratedDraft(res);
    } catch (e: any) {
      setError(e.message || 'Failed to analyze product photo. Please try again.');
    } finally {
      setAnalyzing(false);
      setActiveEngine(null);
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
        imageUrl: imagePreview || generatedDraft.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
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

  const isConnected = chatGptStatus?.connected || chatGptStatus?.hasCustomApiKey || chatGptStatus?.hasCustomGeminiKey;

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
                  {chatGptStatus?.hasCustomGeminiKey ? 'Gemini 1.5 Flash' : chatGptStatus?.hasCustomApiKey ? 'GPT-4o Vision' : 'AI Vision'}
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

        {/* AI Key / Provider Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Google Gemini Badge */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              chatGptStatus?.hasCustomGeminiKey 
                ? 'bg-blue-50/80 border-blue-200 text-blue-900' 
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              <Sparkles className={`w-3.5 h-3.5 ${chatGptStatus?.hasCustomGeminiKey ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Gemini:</span>
              {chatGptStatus?.hasCustomGeminiKey ? (
                <>
                  <strong className="font-mono text-blue-950 font-bold">{chatGptStatus.maskedGeminiKey}</strong>
                  <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1.5 py-0.2 rounded font-bold">Free</span>
                </>
              ) : (
                <span className="text-slate-400">Not set</span>
              )}
            </div>

            {/* OpenAI Badge */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              chatGptStatus?.hasCustomApiKey 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${chatGptStatus?.hasCustomApiKey ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>OpenAI:</span>
              {chatGptStatus?.hasCustomApiKey ? (
                <>
                  <strong className="font-mono text-emerald-950 font-bold">{chatGptStatus.maskedApiKey}</strong>
                  <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Active</span>
                </>
              ) : (
                <span className="text-slate-400">Not set</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-[11px] transition-all flex items-center space-x-1"
            >
              <Key className="w-3 h-3" />
              <span>{showKeyInput ? 'Hide Keys' : 'Manage AI Keys'}</span>
            </button>
          </div>
        </div>

        {/* Dual API Key Drawer */}
        {showKeyInput && (
          <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-4 space-y-3 text-xs animate-fadeIn">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Save & Manage Your AI API Keys</span>
              <span className="text-[11px] text-slate-500">Both keys are safely stored with AES-256 GCM encryption.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Google Gemini Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-blue-950">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Google Gemini (Free Tier / Jio 5G)</span>
                  </div>
                  {chatGptStatus?.hasCustomGeminiKey && (
                    <button
                      type="button"
                      onClick={handleDisconnectGemini}
                      className="text-red-600 hover:text-red-800 text-[11px] font-semibold underline"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Current Status:</span>
                  {chatGptStatus?.hasCustomGeminiKey ? (
                    <span className="inline-flex items-center space-x-1 font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      <span>{chatGptStatus.maskedGeminiKey}</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">Not Configured</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Enter Gemini key (AQ... or AIza...)"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    disabled={savingGemini || !geminiKeyInput}
                    onClick={handleSaveGeminiKey}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs disabled:opacity-40 transition-all shrink-0"
                  >
                    {savingGemini ? 'Saving...' : 'Save Gemini'}
                  </button>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:text-blue-900 font-bold underline flex items-center space-x-1"
                  >
                    <span>✨ Get Free Gemini Key (Google AI Studio) ↗</span>
                  </a>
                  <span className="text-[10px] text-slate-400">100% Free / No Card</span>
                </div>
              </div>

              {/* OpenAI Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-950">
                    <Key className="w-4 h-4 text-emerald-600" />
                    <span>OpenAI (GPT-4o Vision)</span>
                  </div>
                  {(chatGptStatus?.hasCustomApiKey || chatGptStatus?.connected) && (
                    <button
                      type="button"
                      onClick={handleDisconnectOpenAi}
                      className="text-red-600 hover:text-red-800 text-[11px] font-semibold underline"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Current Status:</span>
                  {chatGptStatus?.hasCustomApiKey ? (
                    <span className="inline-flex items-center space-x-1 font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{chatGptStatus.maskedApiKey}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded font-semibold">Not Configured</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Enter OpenAI key (sk-...)"
                    value={openaiKeyInput}
                    onChange={(e) => setOpenaiKeyInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    disabled={savingOpenAi || !openaiKeyInput}
                    onClick={handleSaveOpenAiKey}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs disabled:opacity-40 transition-all shrink-0"
                  >
                    {savingOpenAi ? 'Saving...' : 'Save OpenAI'}
                  </button>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center space-x-1"
                  >
                    <span>OpenAI Platform Keys ↗</span>
                  </a>
                  <span className="text-[10px] text-slate-400">Requires OpenAI Credits</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Error Alert with Smart Quick Retries */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center space-x-2 flex-1">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {chatGptStatus?.hasCustomGeminiKey && error.toLowerCase().includes('openai') && (
                <button
                  type="button"
                  onClick={() => handleAnalyzePhoto('GEMINI')}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Try with Gemini (Free)</span>
                </button>
              )}
              {chatGptStatus?.hasCustomApiKey && (error.toLowerCase().includes('gemini') || error.toLowerCase().includes('503')) && (
                <button
                  type="button"
                  onClick={() => handleAnalyzePhoto('OPENAI')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors"
                >
                  🟢 Try with OpenAI
                </button>
              )}
              <button
                type="button"
                onClick={() => handleAnalyzePhoto('DEMO')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors"
              >
                ⚡ Run with Demo Mode
              </button>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
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
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center animate-bounce shadow-xl ${
                          activeEngine === 'GEMINI' 
                            ? 'bg-blue-500 shadow-blue-500/50' 
                            : activeEngine === 'OPENAI' 
                            ? 'bg-emerald-500 shadow-emerald-500/50' 
                            : 'bg-amber-500 shadow-amber-500/50'
                        }`}>
                          <Sparkles className="w-6 h-6 text-slate-950" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-white">
                            {activeEngine === 'GEMINI'
                              ? 'Google Gemini is analyzing your product...'
                              : activeEngine === 'OPENAI'
                              ? 'OpenAI GPT-4o Vision is analyzing your product...'
                              : 'Instant Demo Scan is generating your listing...'}
                          </p>
                          <p className="text-xs text-slate-300 mt-1">Extracting product title, packaging specs, and realistic pricing</p>
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

              {/* Action Buttons: Explicit Options for Gemini, OpenAI, and Instant Demo */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Choose your AI engine to scan:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Button 1: Google Gemini (Free Tier) */}
                  <button
                    type="button"
                    disabled={analyzing || !imagePreview}
                    onClick={() => handleAnalyzePhoto('GEMINI')}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    title={chatGptStatus?.hasCustomGeminiKey ? 'Generate with Google Gemini (Free Tier)' : 'Click to add free Gemini key'}
                  >
                    {analyzing && activeEngine === 'GEMINI' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Gemini scanning...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-blue-200" />
                        <span>Generate with Gemini (Free)</span>
                      </>
                    )}
                  </button>

                  {/* Button 2: OpenAI (GPT-4o Vision) */}
                  <button
                    type="button"
                    disabled={analyzing || !imagePreview}
                    onClick={() => handleAnalyzePhoto('OPENAI')}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    title={chatGptStatus?.hasCustomApiKey ? 'Generate with OpenAI GPT-4o' : 'Click to add OpenAI key'}
                  >
                    {analyzing && activeEngine === 'OPENAI' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>OpenAI scanning...</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-300" />
                        <span>Generate with OpenAI</span>
                      </>
                    )}
                  </button>

                  {/* Button 3: Instant Demo Mode */}
                  <button
                    type="button"
                    disabled={analyzing || !imagePreview}
                    onClick={() => handleAnalyzePhoto('DEMO')}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1"
                    title="Simulate scan instantly without consuming API credits"
                  >
                    {analyzing && activeEngine === 'DEMO' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Demo...</span>
                      </>
                    ) : (
                      <span>⚡ Instant Demo</span>
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
                      src={imagePreview || generatedDraft.imageUrl}
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
