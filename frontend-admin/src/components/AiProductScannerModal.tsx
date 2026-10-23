import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Upload, Image as ImageIcon, CheckCircle2, ArrowRight, Loader2, 
  X, AlertCircle, RefreshCw, Key, ShieldCheck, Tag, RotateCw, Play, Pause, 
  Wand2, Sliders, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { ApiService } from '../services/api';
import { ChatGptStatus, GeneratedProduct, AiPhotoAngle } from '../types';

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
  const [chatGptStatus, setChatGptStatus] = useState<ChatGptStatus | null>(() => {
    try {
      const cached = localStorage.getItem('ad_ai_status_cache');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
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

  // 360 Studio & Multi-Angle Commands State
  const [studioAngles, setStudioAngles] = useState<AiPhotoAngle[]>([]);
  const [activeAngleIndex, setActiveAngleIndex] = useState<number>(0);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [enhancingPhoto, setEnhancingPhoto] = useState<boolean>(false);
  const [commandInput, setCommandInput] = useState<string>('/360');
  const [activeCommandBadge, setActiveCommandBadge] = useState<string>('/360');
  const [studioStyleName, setStudioStyleName] = useState<string>('360° Multi-Angle Turnaround Studio');

  // Separate API Key Inputs for Gemini and OpenAI (persisted in localStorage)
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>(() => {
    return localStorage.getItem('ad_custom_gemini_key') || '';
  });
  const [openaiKeyInput, setOpenaiKeyInput] = useState<string>(() => {
    return localStorage.getItem('ad_custom_openai_key') || '';
  });
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
      try {
        localStorage.setItem('ad_ai_status_cache', JSON.stringify(res));
      } catch {}

      // Auto-sync stored Gemini key to server if server doesn't have it yet
      const storedGemini = localStorage.getItem('ad_custom_gemini_key');
      if (!res.hasCustomGeminiKey && storedGemini && storedGemini.trim().length > 10) {
        try {
          const synced = await ApiService.saveCustomGeminiApiKey(storedGemini.trim());
          setChatGptStatus(synced);
          localStorage.setItem('ad_ai_status_cache', JSON.stringify(synced));
        } catch (syncErr) {
          console.warn('Auto-syncing Gemini key to server:', syncErr);
        }
      }

      // Auto-sync stored OpenAI key to server if server doesn't have it yet
      const storedOpenAi = localStorage.getItem('ad_custom_openai_key');
      if (!res.hasCustomApiKey && !res.connected && storedOpenAi && storedOpenAi.trim().length > 10) {
        try {
          const synced = await ApiService.saveCustomOpenAiApiKey(storedOpenAi.trim());
          setChatGptStatus(synced);
          localStorage.setItem('ad_ai_status_cache', JSON.stringify(synced));
        } catch (syncErr) {
          console.warn('Auto-syncing OpenAI key to server:', syncErr);
        }
      }
    } catch (e: any) {
      console.warn('Could not load AI status from server:', e);
      // Resilient fallback: Synthesize status from localStorage so merchant is never blocked
      const storedGemini = localStorage.getItem('ad_custom_gemini_key');
      const storedOpenAi = localStorage.getItem('ad_custom_openai_key');
      if (storedGemini || storedOpenAi) {
        setChatGptStatus((prev) => prev || {
          connected: false,
          hasCustomApiKey: !!storedOpenAi,
          maskedApiKey: storedOpenAi ? 'sk-...' + storedOpenAi.slice(-4) : undefined,
          hasCustomGeminiKey: !!storedGemini,
          maskedGeminiKey: storedGemini ? (storedGemini.slice(0, 6) + '...' + storedGemini.slice(-4)) : undefined,
          aiProviderPreference: storedGemini ? 'GEMINI' : 'OPENAI',
          activeProvider: storedGemini ? 'GEMINI' : 'OPENAI',
          connectionType: storedGemini ? 'GEMINI_API_KEY' : 'CUSTOM_API_KEY',
        });
      }
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
      localStorage.setItem('ad_ai_status_cache', JSON.stringify(res));
    } catch (e: any) {
      setError('Simulated connection failed: ' + e.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSaveGeminiKey = async () => {
    let key = geminiKeyInput.trim().replace(/['"]/g, '');
    if (!key) {
      setError('Please enter your Google Gemini API key (starts with AQ. or AIza...).');
      return;
    }

    // Auto-fix accidental double-paste (key + key)
    if (key.length % 2 === 0) {
      const half = key.length / 2;
      if (key.slice(0, half) === key.slice(half)) {
        key = key.slice(0, half);
      }
    }
    const secondAq = key.indexOf('AQ.', 3);
    if (secondAq > 0) {
      key = key.slice(0, secondAq);
    }
    const secondAiza = key.indexOf('AIza', 4);
    if (secondAiza > 0) {
      key = key.slice(0, secondAiza);
    }

    if (key.startsWith('sk-')) {
      setError('That appears to be an OpenAI API key (sk-...). Please enter it into the OpenAI field instead.');
      return;
    }

    try {
      setSavingGemini(true);
      setError(null);
      // 1. Immediately store in localStorage so it is never lost on refresh or modal close
      localStorage.setItem('ad_custom_gemini_key', key);
      
      const updated = await ApiService.saveCustomGeminiApiKey(key);
      setChatGptStatus(updated);
      localStorage.setItem('ad_ai_status_cache', JSON.stringify(updated));
      setShowKeyInput(false);
    } catch (e: any) {
      setError('Failed to save Google Gemini key: ' + e.message);
    } finally {
      setSavingGemini(false);
    }
  };

  const handleSaveOpenAiKey = async () => {
    let key = openaiKeyInput.trim().replace(/['"]/g, '');
    if (!key) {
      setError('Please enter your OpenAI API key (starts with sk-...).');
      return;
    }

    // Auto-fix accidental double-paste (key + key)
    if (key.length % 2 === 0) {
      const half = key.length / 2;
      if (key.slice(0, half) === key.slice(half)) {
        key = key.slice(0, half);
      }
    }
    const secondSk = key.indexOf('sk-', 3);
    if (secondSk > 0) {
      key = key.slice(0, secondSk);
    }

    if (key.startsWith('AQ.') || key.startsWith('AIza')) {
      setError('That appears to be a Google Gemini key. Please enter it into the Gemini field above.');
      return;
    }

    try {
      setSavingOpenAi(true);
      setError(null);
      // 1. Immediately store in localStorage so it is never lost
      localStorage.setItem('ad_custom_openai_key', key);

      const updated = await ApiService.saveCustomOpenAiApiKey(key);
      setChatGptStatus(updated);
      localStorage.setItem('ad_ai_status_cache', JSON.stringify(updated));
      setShowKeyInput(false);
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
      localStorage.removeItem('ad_custom_gemini_key');
      const updated = await ApiService.disconnectGemini();
      setChatGptStatus(updated);
      localStorage.setItem('ad_ai_status_cache', JSON.stringify(updated));
      setGeminiKeyInput('');
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
      localStorage.removeItem('ad_custom_openai_key');
      const updated = await ApiService.disconnectOpenAi();
      setChatGptStatus(updated);
      localStorage.setItem('ad_ai_status_cache', JSON.stringify(updated));
      setOpenaiKeyInput('');
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

  // Auto-spin 360 turntable
  useEffect(() => {
    let timer: any;
    if (isRotating && studioAngles.length > 1) {
      timer = setInterval(() => {
        setActiveAngleIndex((prev) => (prev + 1) % studioAngles.length);
      }, 950);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRotating, studioAngles.length]);

  const handleRunCommand = async (cmdToRun?: string) => {
    const rawCmd = (cmdToRun || commandInput).trim();
    const targetCmd = rawCmd.startsWith('/') ? rawCmd : `/${rawCmd}`;
    if (!targetCmd) return;
    try {
      setEnhancingPhoto(true);
      setError(null);
      setActiveCommandBadge(targetCmd);
      const activeSource = imagePreview || base64Image || generatedDraft?.imageUrl || imageUrl || '';
      const isBase64 = activeSource.startsWith('data:image');
      const res = await ApiService.enhanceProductPhoto({
        command: targetCmd,
        productTitle: generatedDraft?.title || '',
        category: generatedDraft?.category || '',
        base64Image: isBase64 ? activeSource : (base64Image || undefined),
        currentImageUrl: !isBase64 && activeSource ? activeSource : (imageUrl || undefined),
      });

      if (res.angles && res.angles.length > 0) {
        setStudioAngles(res.angles);
        const primaryIdx = res.angles.findIndex(a => a.imageUrl === res.primaryImageUrl);
        setActiveAngleIndex(primaryIdx >= 0 ? primaryIdx : 0);
      }
      setStudioStyleName(res.styleName || targetCmd);
      if (res.primaryImageUrl && generatedDraft) {
        setGeneratedDraft({
          ...generatedDraft,
          imageUrl: res.primaryImageUrl,
          imagesJson: JSON.stringify(res.angles.map(a => a.imageUrl)),
        });
      }
    } catch (err: any) {
      setError('Failed to enhance photo: ' + err.message);
    } finally {
      setEnhancingPhoto(false);
    }
  };

  const getAngleTransformStyle = (): React.CSSProperties => {
    const angle = studioAngles[activeAngleIndex]?.angle || '0°';
    switch (angle) {
      case '45°':
        return { transform: 'perspective(800px) rotateY(-20deg) scale(0.98)', filter: 'drop-shadow(6px 10px 14px rgba(0,0,0,0.22))' };
      case '90°':
        return { transform: 'perspective(800px) rotateY(-40deg) scale(0.94)', filter: 'drop-shadow(10px 12px 18px rgba(0,0,0,0.26))' };
      case '180°':
        return { transform: 'perspective(800px) scale(0.96) scaleX(-1)', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.20)) brightness(0.97)' };
      case 'Podium':
        return { transform: 'translateY(-10px) scale(0.95)', filter: 'drop-shadow(0 14px 20px rgba(0,0,0,0.30))' };
      case 'Macro':
        return { transform: 'scale(1.32)', filter: 'contrast(1.08) drop-shadow(0 8px 16px rgba(0,0,0,0.25))' };
      default:
        return { transform: 'perspective(800px) rotateY(0deg) scale(1)', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.18))' };
    }
  };

  const handleAnalyzePhoto = async (engine: 'GEMINI' | 'OPENAI' | 'DEMO') => {
    if (!imagePreview && !imageUrl && !base64Image) {
      setError('Please select or upload a product photo first.');
      return;
    }

    // 1. If status is still loading from server, wait up to 1.5s for loadStatus to finish
    if (loadingStatus && !chatGptStatus) {
      try {
        const fresh = await ApiService.getChatGptStatus();
        setChatGptStatus(fresh);
        localStorage.setItem('ad_ai_status_cache', JSON.stringify(fresh));
      } catch {}
    }

    let currentStatus = chatGptStatus;

    // 2. AUTO-SAVE & ACTIVATION: If user entered or has a Gemini key in input or localStorage, ensure it is saved & active!
    const effectiveGeminiKey = (geminiKeyInput.trim() || localStorage.getItem('ad_custom_gemini_key') || '').replace(/['"]/g, '');
    if (engine === 'GEMINI' && !currentStatus?.hasCustomGeminiKey && effectiveGeminiKey) {
      try {
        setSavingGemini(true);
        const updated = await ApiService.saveCustomGeminiApiKey(effectiveGeminiKey);
        currentStatus = updated;
        setChatGptStatus(updated);
        localStorage.setItem('ad_custom_gemini_key', effectiveGeminiKey);
        localStorage.setItem('ad_ai_status_cache', JSON.stringify(updated));
        setShowKeyInput(false);
      } catch (saveErr: any) {
        console.warn('Auto-save of Gemini key failed:', saveErr);
      } finally {
        setSavingGemini(false);
      }
    }

    // 3. AUTO-SAVE & ACTIVATION: If user entered or has an OpenAI key in input or localStorage, ensure it is saved & active!
    const effectiveOpenAiKey = (openaiKeyInput.trim() || localStorage.getItem('ad_custom_openai_key') || '').replace(/['"]/g, '');
    if (engine === 'OPENAI' && !currentStatus?.hasCustomApiKey && !currentStatus?.connected && effectiveOpenAiKey) {
      try {
        setSavingOpenAi(true);
        const updated = await ApiService.saveCustomOpenAiApiKey(effectiveOpenAiKey);
        currentStatus = updated;
        setChatGptStatus(updated);
        localStorage.setItem('ad_custom_openai_key', effectiveOpenAiKey);
        localStorage.setItem('ad_ai_status_cache', JSON.stringify(updated));
        setShowKeyInput(false);
      } catch (saveErr: any) {
        console.warn('Auto-save of OpenAI key failed:', saveErr);
      } finally {
        setSavingOpenAi(false);
      }
    }

    if (engine === 'GEMINI' && !currentStatus?.hasCustomGeminiKey && !effectiveGeminiKey) {
      setShowKeyInput(true);
      setError('Please enter your free Google Gemini API key below to generate with Gemini.');
      return;
    }

    if (engine === 'OPENAI' && !currentStatus?.hasCustomApiKey && !currentStatus?.connected && !effectiveOpenAiKey) {
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
        apiKey: engine === 'GEMINI' ? effectiveGeminiKey : (engine === 'OPENAI' ? effectiveOpenAiKey : undefined),
      });

      setGeneratedDraft(res);
      if (res.angles && res.angles.length > 0) {
        setStudioAngles(res.angles);
        setActiveAngleIndex(0);
        setActiveCommandBadge('/360');
        setStudioStyleName('360° Multi-Angle Turnaround Studio');
      }
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

      const currentCover = (studioAngles.length > 0 && studioAngles[activeAngleIndex])
        ? studioAngles[activeAngleIndex].imageUrl
        : (generatedDraft.imageUrl || imagePreview || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80');

      const allAnglesJson = studioAngles.length > 0
        ? JSON.stringify(studioAngles.map(a => a.imageUrl))
        : (generatedDraft.imagesJson || undefined);

      await ApiService.createProduct({
        title: generatedDraft.title,
        description: generatedDraft.description,
        price: generatedDraft.suggestedPrice,
        comparePrice: generatedDraft.comparePrice,
        category: generatedDraft.category || 'Apparel & Clothing',
        imageUrl: currentCover,
        imagesJson: allAnglesJson,
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
    setStudioAngles([]);
    setActiveAngleIndex(0);
    setIsRotating(false);
    setCommandInput('/360');
    setActiveCommandBadge('/360');
    setStudioStyleName('360° Multi-Angle Turnaround Studio');
    setError(null);
  };

  if (!isOpen) return null;

  const isConnected = chatGptStatus?.connected || chatGptStatus?.hasCustomApiKey || chatGptStatus?.hasCustomGeminiKey;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
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
                  {chatGptStatus?.hasCustomGeminiKey ? 'Google Gemini' : chatGptStatus?.hasCustomApiKey ? 'GPT-4o Vision' : 'AI Vision'}
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
              {(error.toLowerCase().includes('gemini') || error.toLowerCase().includes('401') || error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('api key')) && (
                <button
                  type="button"
                  onClick={() => setShowKeyInput(true)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors flex items-center space-x-1"
                >
                  <Key className="w-3 h-3" />
                  <span>Update Gemini Key</span>
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

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Column: AI Studio 360° Enhancer & Turntable (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  
                  {/* AI Studio Command & Preset Bar */}
                  <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-md border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
                          AI Studio Enhancer
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {activeCommandBadge}
                      </span>
                    </div>

                    {/* Quick Command Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {[
                        { cmd: '/360', label: '🔄 /360 Spin', desc: 'Interactive 360° Turnaround' },
                        { cmd: '/studio', label: '⚪ /studio', desc: 'Pure White Catalog' },
                        { cmd: '/podium', label: '🏛️ /podium', desc: 'Luxury Showroom Podium' },
                        { cmd: '/macro', label: '🔍 /macro', desc: '8K Fabric Detail Zoom' },
                        { cmd: '/lifestyle', label: '🌿 /lifestyle', desc: 'Editorial Living Staging' },
                      ].map((preset) => (
                        <button
                          key={preset.cmd}
                          type="button"
                          disabled={enhancingPhoto}
                          onClick={() => {
                            setCommandInput(preset.cmd);
                            handleRunCommand(preset.cmd);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 ${
                            activeCommandBadge.toLowerCase() === preset.cmd.toLowerCase()
                              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title={preset.desc}
                        >
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Slash Command Input Box */}
                    <div className="flex items-center space-x-1.5">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs font-bold">
                          /
                        </span>
                        <input
                          type="text"
                          value={commandInput.startsWith('/') ? commandInput.slice(1) : commandInput}
                          onChange={(e) => setCommandInput('/' + e.target.value.replace(/^\/+/, ''))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleRunCommand();
                            }
                          }}
                          placeholder="360, podium, studio, macro..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-6 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={enhancingPhoto}
                        onClick={() => handleRunCommand()}
                        className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center space-x-1 disabled:opacity-50"
                      >
                        {enhancingPhoto ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5" />
                        )}
                        <span>Enhance</span>
                      </button>
                    </div>
                  </div>

                  {/* 360 Turntable Stage */}
                  <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200/80 p-2 overflow-hidden flex flex-col items-center justify-center shadow-inner group">
                    {/* Floating badges */}
                    <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900/85 backdrop-blur text-white text-[10px] font-bold flex items-center space-x-1 shadow">
                        <RotateCw className={`w-3 h-3 text-emerald-400 ${isRotating ? 'animate-spin' : ''}`} />
                        <span>360° Studio</span>
                      </span>
                      {enhancingPhoto && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/90 text-slate-950 text-[10px] font-bold flex items-center space-x-1 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Rendering...</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-slate-700 text-[10px] font-bold border border-slate-200 shadow-sm">
                        {studioAngles[activeAngleIndex]?.label || '0° Front View'}
                      </span>
                    </div>

                    {/* Turntable Image Display */}
                    <div className="w-full h-56 relative flex items-center justify-center p-2 overflow-hidden">
                      {/* Showroom Podium Pedestal base for Podium angle */}
                      {studioAngles[activeAngleIndex]?.angle === 'Podium' && (
                        <div className="absolute bottom-3 w-48 h-8 rounded-[50%] bg-gradient-to-r from-slate-300 via-white to-slate-300 border-2 border-slate-300/80 shadow-[0_12px_24px_rgba(0,0,0,0.28)] z-0 pointer-events-none opacity-90">
                          <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-transparent to-slate-400/25" />
                        </div>
                      )}

                      <img
                        src={
                          studioAngles[activeAngleIndex]?.imageUrl ||
                          generatedDraft.imageUrl ||
                          imagePreview ||
                          base64Image ||
                          imageUrl ||
                          ''
                        }
                        alt={generatedDraft.title}
                        style={getAngleTransformStyle()}
                        className="max-h-48 w-auto object-contain rounded-xl relative z-10 transition-all duration-300 ease-out"
                      />
                    </div>

                    {/* Interactive 360 Scrubber / Rotation Slider */}
                    {studioAngles.length > 1 && (
                      <div className="w-full px-2 pt-1 pb-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setIsRotating(!isRotating)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                              isRotating
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                            }`}
                            title={isRotating ? 'Pause rotation' : 'Auto-spin 360°'}
                          >
                            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>

                          <input
                            type="range"
                            min={0}
                            max={studioAngles.length - 1}
                            value={activeAngleIndex}
                            onChange={(e) => {
                              setIsRotating(false);
                              setActiveAngleIndex(Number(e.target.value));
                            }}
                            className="w-full accent-emerald-600 h-1.5 bg-slate-300 rounded-lg cursor-pointer"
                          />

                          <span className="text-[10px] font-mono font-bold text-slate-600 w-8 text-right">
                            {studioAngles[activeAngleIndex]?.angle || '0°'}
                          </span>
                        </div>

                        {/* Angle Pills */}
                        <div className="grid grid-cols-3 gap-1">
                          {studioAngles.map((angleItem, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setIsRotating(false);
                                setActiveAngleIndex(idx);
                              }}
                              className={`px-1.5 py-1 rounded-md text-[9px] font-bold truncate transition-all text-center border ${
                                activeAngleIndex === idx
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              {angleItem.angle} {angleItem.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Set as Primary Cover Button */}
                    <div className="w-full pt-1 flex items-center justify-between text-[11px] text-slate-500 px-1 border-t border-slate-200/60 mt-1">
                      <span className="truncate max-w-[140px] text-[10px]" title={studioStyleName}>
                        {studioStyleName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (studioAngles[activeAngleIndex]) {
                            setGeneratedDraft({
                              ...generatedDraft,
                              imageUrl: studioAngles[activeAngleIndex].imageUrl,
                            });
                          }
                        }}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center space-x-1"
                      >
                        <span>Set as Main Cover</span>
                      </button>
                    </div>
                  </div>

                  {/* Key Highlights */}
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

                {/* Right Column: Form Fields (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  
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
