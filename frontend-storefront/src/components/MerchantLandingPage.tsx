import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Store,
  CreditCard,
  QrCode,
  Smartphone,
  Printer,
  MessageCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Clock,
  Layers,
  ChevronDown,
  Check,
  X,
  Menu,
  Loader2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { StoreApi } from '../services/storeApi';
import { SubscriptionPlan, SubscriptionPlanId, MerchantAuthResponse } from '../types';
import { MASTER_STORE_CATEGORIES } from '../data/categoriesData';

const PLANS: SubscriptionPlan[] = [
  {
    id: 'MONTHLY',
    name: 'Monthly Starter',
    billingText: 'Billed monthly',
    price: 599,
    monthlyEquivalent: 599,
    features: [
      'Unlimited Products & Categories',
      'Unlimited Customer Orders',
      'Direct-to-Bank Customer UPI QR Payments (0% fee)',
      'Merchant Admin Kanban Order Board',
      '58mm / 80mm Thermal Receipt Invoicing',
      'One-Click WhatsApp Order Sharing',
      'Standard Email & Chat Support',
    ],
  },
  {
    id: 'QUARTERLY',
    name: 'Quarterly Growth',
    badge: 'MOST POPULAR — SAVE 22%',
    billingText: 'Billed ₹1,399 every 3 months',
    price: 1399,
    originalPrice: 1797,
    monthlyEquivalent: 466,
    popular: true,
    features: [
      'Everything in Monthly Starter',
      'Save 22% compared to monthly',
      'Custom Store Logo & Hero Banner Upload',
      'Customer Saved Addresses & Fast Re-order',
      'Priority WhatsApp Support from Success Team',
      'Store Performance & Order Reports',
      'Zero setup or hidden gateway maintenance fees',
    ],
  },
  {
    id: 'YEARLY',
    name: 'Annual Scale',
    badge: 'BEST VALUE — 3 MONTHS FREE',
    billingText: 'Billed ₹4,999 annually',
    price: 4999,
    originalPrice: 7188,
    monthlyEquivalent: 416,
    features: [
      'Everything in Quarterly Growth',
      'Save 30% + 3 Full Months Free',
      'Custom Domain Support (.in / .com setup)',
      'VIP 1-on-1 Onboarding & Bulk Catalog Upload',
      'Featured Store Placement in Local Directory',
      'Dedicated Account Manager on Call',
      'Lifetime Free Upgrades & Feature Access',
    ],
  },
];

const FAQS = [
  {
    q: 'How do I receive payments from customers?',
    a: 'Customer payments go 100% directly into your own bank account via your UPI ID (GPay, PhonePe, Paytm, or BHIM). AmazingDeal never holds your funds and takes 0% commission on your sales.',
  },
  {
    q: 'What will my storefront URL look like?',
    a: 'Your store link will be immediately live at https://amazingdeal-storefront.drskpabirulislam1995.workers.dev/?store=yourstore. If you are on the Yearly Plan, we can also connect your own custom domain like yourstore.in!',
  },
  {
    q: 'Do I need a computer to manage my store?',
    a: 'Not at all! Both the customer storefront and your Merchant Admin Dashboard work seamlessly on any smartphone, tablet, or PC.',
  },
  {
    q: 'How does thermal billing work?',
    a: 'With one click from your Admin Order Board, you can print formatted 58mm or 80mm receipts directly to any Bluetooth or USB thermal POS printer.',
  },
];

export function MerchantLandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(PLANS[1]); // default Quarterly
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [step, setStep] = useState<'DETAILS' | 'PAYMENT' | 'STORE_SETUP' | 'SUCCESS'>('DETAILS');

  // Step 1: Merchant Contact & Desired Subdomain
  const [merchantName, setMerchantName] = useState<string>('');
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [ownerPhone, setOwnerPhone] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('');
  const [subdomain, setSubdomain] = useState<string>('');
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Step 2: Razorpay PG Checkout
  const [razorpayLoading, setRazorpayLoading] = useState<boolean>(false);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const [paymentVerified, setPaymentVerified] = useState<boolean>(false);
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Step 3: Store Configuration (Supports Multi-Category Businesses)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Daily Essentials & Groceries']);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [storeAddress, setStoreAddress] = useState<string>('');
  const [upiVpa, setUpiVpa] = useState<string>('');
  const [creatingStore, setCreatingStore] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Step 4: Success
  const [createdStore, setCreatedStore] = useState<MerchantAuthResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Auto-generate subdomain from store name
  const handleStoreNameChange = (name: string) => {
    setStoreName(name);
    if (!subdomain || subdomain === autoSlug(storeName)) {
      setSubdomain(autoSlug(name));
    }
  };

  const autoSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 30);
  };

  // Real-time subdomain check with debounce
  useEffect(() => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus({ checking: false, available: undefined, message: 'Must be at least 3 characters' });
      return;
    }

    const timer = setTimeout(async () => {
      setSubdomainStatus({ checking: true });
      try {
        const res = await StoreApi.checkSubdomain(subdomain);
        setSubdomainStatus({
          checking: false,
          available: res.available,
          message: res.message,
        });
      } catch (e) {
        setSubdomainStatus({ checking: false, available: true, message: 'Subdomain format is valid' });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [subdomain]);

  // Check URL params for Razorpay callback redirect (if redirected)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rzpPaymentId = params.get('razorpay_payment_id') || params.get('payment_id');
    const rzpOrderId = params.get('razorpay_order_id') || params.get('order_id');
    const plan = params.get('plan') as SubscriptionPlanId | null;
    const sub = params.get('subdomain');
    const store = params.get('storeName');

    if (rzpPaymentId) {
      // Restore merchant draft inputs from sessionStorage if available
      try {
        const draftStr = sessionStorage.getItem('amazingdeal_merchant_draft');
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          if (draft.merchantName) setMerchantName(draft.merchantName);
          if (draft.ownerEmail) setOwnerEmail(draft.ownerEmail);
          if (draft.ownerPhone) setOwnerPhone(draft.ownerPhone);
          if (draft.storeName) setStoreName(draft.storeName);
          if (draft.subdomain) setSubdomain(draft.subdomain);
          if (draft.selectedPlanId) {
            const foundPlan = PLANS.find((p) => p.id === draft.selectedPlanId);
            if (foundPlan) setSelectedPlan(foundPlan);
          }
        }
      } catch (err) {
        console.warn('Failed restoring onboarding draft:', err);
      }

      setPaymentVerified(true);
      setPaymentRef(rzpPaymentId);
      if (plan) {
        const found = PLANS.find((p) => p.id === plan);
        if (found) setSelectedPlan(found);
      }
      if (sub) {
        setSubdomain(sub);
      }
      if (store) {
        setStoreName(store);
      }
      setStep('STORE_SETUP');
      setIsModalOpen(true);

      // Clean URL params cleanly without reloading page
      try {
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const openPlanModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setStep('DETAILS');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!merchantName || !ownerEmail || !ownerPhone || !storeName || !subdomain) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (!subdomainStatus.available) {
      setErrorMsg('Please select an available store subdomain.');
      return;
    }

    setStep('PAYMENT');
  };

  // Create & prefill Razorpay order upon reaching PAYMENT step
  useEffect(() => {
    if (step === 'PAYMENT' && isModalOpen && !razorpayOrder && !razorpayLoading && !paymentVerified) {
      StoreApi.createRazorpayOrder({
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        firstname: merchantName,
        email: ownerEmail,
        phone: ownerPhone,
        subdomain,
        storeName,
        currency: 'INR',
      })
        .then((order) => {
          setRazorpayOrder(order);
        })
        .catch((e) => {
          console.warn('Preload Razorpay order error:', e);
        });
    }
  }, [step, isModalOpen]);

  // Open standard Razorpay Checkout modal
  const handleOpenRazorpay = async () => {
    try {
      setRazorpayLoading(true);
      setErrorMsg('');

      let order = razorpayOrder;
      if (!order) {
        order = await StoreApi.createRazorpayOrder({
          planId: selectedPlan.id,
          amount: selectedPlan.price,
          firstname: merchantName,
          email: ownerEmail,
          phone: ownerPhone,
          subdomain,
          storeName,
          currency: 'INR',
        });
        setRazorpayOrder(order);
      }

      // Check if Razorpay script is loaded in window
      if (typeof (window as any).Razorpay === 'undefined') {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
          document.body.appendChild(script);
        });
      }

      const options = {
        key: order.keyId || 'rzp_test_TM5arepb23gG9I',
        amount: order.amountInPaise,
        currency: order.currency || 'INR',
        name: order.companyName || 'AmazingDeal',
        description: `Store Subscription - ${selectedPlan.name} Plan`,
        image: 'https://amazingdeal.co.in/favicon.ico',
        order_id:
          order.orderId &&
          !order.orderId.startsWith('order_mock_') &&
          !order.orderId.startsWith('order_rzp_')
            ? order.orderId
            : undefined,
        prefill: {
          name: merchantName,
          email: ownerEmail,
          contact: ownerPhone,
        },
        theme: {
          color: '#10b981', // emerald-500
        },
        handler: async function (response: any) {
          try {
            setRazorpayLoading(true);
            const verifyRes = await StoreApi.verifyRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id || order.orderId,
              razorpayPaymentId: response.razorpay_payment_id || 'pay_' + Date.now(),
              razorpaySignature: response.razorpay_signature || 'SIGNATURE_VERIFIED',
              planId: selectedPlan.id,
              subdomain,
            });

            if (verifyRes.verified) {
              setPaymentVerified(true);
              setPaymentRef(verifyRes.paymentId || response.razorpay_payment_id);
              setTimeout(() => {
                setStep('STORE_SETUP');
              }, 600);
            } else {
              setErrorMsg(verifyRes.message || 'Payment signature verification failed.');
            }
          } catch (err: any) {
            setErrorMsg(err.message || 'Payment verification failed.');
          } finally {
            setRazorpayLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setRazorpayLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setErrorMsg(response.error?.description || 'Payment failed. Please retry or choose another payment method.');
        setRazorpayLoading(false);
      });
      rzp.open();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to initialize Razorpay checkout');
    } finally {
      setRazorpayLoading(false);
    }
  };

  // Instant test payment simulation bypass for dev & testing environments
  const handleSimulatePaymentSuccess = async () => {
    try {
      setRazorpayLoading(true);
      const simulatedPaymentId = 'pay_simulated_' + Date.now();
      const mockOrderId = razorpayOrder?.orderId || 'order_mock_' + Date.now();
      const verifyRes = await StoreApi.verifyRazorpayPayment({
        razorpayOrderId: mockOrderId,
        razorpayPaymentId: simulatedPaymentId,
        razorpaySignature: 'TEST_MOCK_SIGNATURE',
        planId: selectedPlan.id,
        subdomain,
      });

      if (verifyRes.verified) {
        setPaymentVerified(true);
        setPaymentRef(verifyRes.paymentId || simulatedPaymentId);
        setStep('STORE_SETUP');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Simulation failed');
    } finally {
      setRazorpayLoading(false);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      setCreatingStore(true);
      const cleanVpa = upiVpa && upiVpa.trim() ? upiVpa.trim() : `${subdomain}@okaxis`;

      const res = await StoreApi.registerStore({
        storeName: storeName.trim(),
        subdomain: subdomain.trim().toLowerCase(),
        ownerPhone: ownerPhone.trim(),
        ownerEmail: ownerEmail.trim().toLowerCase(),
        password,
        storeCategory: selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Daily Essentials & Groceries',
        storeAddress: storeAddress.trim(),
        upiVpa: cleanVpa,
        subscriptionPlan: selectedPlan.id,
        subscriptionPaymentRef: paymentRef,
      });

      setCreatedStore(res);
      setStep('SUCCESS');
    } catch (e: any) {
      setErrorMsg(e.message || 'Store registration failed. Please check inputs.');
    } finally {
      setCreatingStore(false);
    }
  };

  const copyStoreLink = () => {
    if (!createdStore) return;
    const url = `${window.location.origin}/?store=${createdStore.subdomain}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const navigateToStore = (slug: string) => {
    window.location.href = `${window.location.origin}/?store=${encodeURIComponent(slug)}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden w-full">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-lg sm:text-xl lg:text-2xl tracking-tight shrink-0">
              A
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
                <span>AmazingDeal</span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 hidden min-[380px]:inline-flex">
                  Merchant Cloud
                </span>
              </span>
              <p className="text-[11px] text-slate-400 hidden xl:block leading-tight">
                Zero-Commission Hyperlocal Commerce
              </p>
            </div>
          </div>

          {/* Desktop Nav Links (Visible on lg+ with elegant spacing, preventing collision with buttons) */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-7 text-xs xl:text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors whitespace-nowrap">
              Features
            </a>
            <a href="#plans" className="hover:text-emerald-400 transition-colors whitespace-nowrap">
              Plans & Pricing
            </a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors whitespace-nowrap">
              How It Works
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors whitespace-nowrap">
              FAQ
            </a>
          </nav>

          {/* Right Actions & Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Demo Store Link: Hidden on small mobile to prevent overflow, visible on sm+ */}
            <button
              onClick={() => navigateToStore('guptakiranastore')}
              className="hidden sm:inline-flex px-3 sm:px-3.5 lg:px-4 py-2 text-xs lg:text-sm font-semibold rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Store className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" />
              <span className="hidden md:inline">Explore Demo Store</span>
              <span className="md:hidden">Demo</span>
            </button>

            {/* Merchant Login Button */}
            <a
              href="https://admin.amazingdeal.co.in"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 transition-all items-center gap-1.5 flex shrink-0 whitespace-nowrap shadow-sm"
              title="Merchant Admin Sign In"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Merchant Login</span>
            </a>

            {/* Start Free Trial CTA */}
            <button
              onClick={() => openPlanModal(PLANS[1])}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md sm:shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 shrink-0 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Start Free Trial</span>
              <span className="sm:hidden">Start Free</span>
            </button>

            {/* Mobile / Tablet Menu Toggle (Visible below lg) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Collapsible Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950/95 border-b border-slate-800 px-4 py-5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
            <nav className="flex flex-col space-y-2.5 text-sm font-medium text-slate-200">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-emerald-400 transition-colors flex items-center justify-between"
              >
                <span>Features</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>
              <a
                href="#plans"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-emerald-400 transition-colors flex items-center justify-between"
              >
                <span>Plans & Pricing</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-emerald-400 transition-colors flex items-center justify-between"
              >
                <span>How It Works</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-emerald-400 transition-colors flex items-center justify-between"
              >
                <span>FAQ</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <a
                href="https://admin.amazingdeal.co.in"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Merchant Admin Login</span>
              </a>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateToStore('guptakiranastore');
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Explore Live Demo Store</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openPlanModal(PLANS[1]);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Choose a Plan & Create Store</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[700px] h-[350px] sm:h-[400px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] sm:w-[450px] h-[280px] sm:h-[350px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-6 sm:mb-8 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span>Launch Your Online Business in 2 Minutes</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-[1.15] text-white">
            Own Your Storefront.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              0% Commission.
            </span>{' '}
            Direct UPI to Your Bank.
          </h1>

          <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Turn your local grocery, supermarket, pharmacy, or retail shop into an e-commerce powerhouse.
            Accept instant customer UPI payments directly, manage orders with a live Kanban board, and print thermal
            receipts on the spot.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={() => openPlanModal(PLANS[1])}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm sm:text-base lg:text-lg shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
            >
              <span>Choose a Plan & Create Store</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigateToStore('guptakiranastore')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-sm sm:text-base lg:text-lg border border-slate-700/80 transition-all flex items-center justify-center gap-2"
            >
              <Store className="w-5 h-5 text-emerald-400" />
              <span>Explore Live Demo Store</span>
            </button>
          </div>

          {/* Value Props Row */}
          <div className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto text-left">
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h4 className="font-bold text-white text-xs sm:text-sm">0% Platform Fee</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-snug">
                Keep 100% of your earnings. No hidden transaction cuts.
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Direct Bank UPI</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-snug">
                Customers scan & pay directly to your merchant UPI ID.
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Thermal Billing</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-snug">
                One-click 58mm/80mm receipt generation for deliveries.
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Live Storefront URL</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-snug">
                Instant ready-to-share link: .../?store=yourstore
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Preview Card */}
      <section id="features" className="py-12 border-y border-slate-800/80 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-8 lg:p-10 shadow-2xl overflow-hidden relative">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-lg w-full">
                <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  Ready-to-use Sample Store
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mt-3 sm:mt-4">
                  See how "Gupta Kirana Store" sells groceries online
                </h3>
                <p className="text-slate-300 mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed">
                  Browse products, add items to cart, test OTP and email logins, place an order with dynamic UPI QR,
                  and inspect the live order tracking flow.
                </p>
                <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigateToStore('guptakiranastore')}
                    className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <span>Open Live Storefront</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openPlanModal(PLANS[1])}
                    className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 flex items-center justify-center"
                  >
                    Create My Store Like This
                  </button>
                </div>
              </div>

              {/* Mock browser window */}
              <div className="w-full lg:w-1/2 rounded-2xl bg-slate-950 border border-slate-800 p-3 sm:p-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <div className="bg-slate-900 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-[11px] font-mono text-emerald-400 border border-slate-800 truncate max-w-[190px] sm:max-w-none">
                    .../?store=guptakiranastore
                  </div>
                  <div className="w-6 shrink-0" />
                </div>
                <div className="pt-3 sm:pt-4 space-y-3">
                  <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs sm:text-sm">
                        GK
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-white truncate">Gupta Kirana Store</div>
                        <div className="text-[10px] sm:text-xs text-slate-400 truncate">Open • 8:00 AM - 10:00 PM • Free Delivery Above ₹499</div>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg shrink-0">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[11px] sm:text-xs truncate">Fresh Milk (1L)</div>
                      <div className="font-bold text-emerald-400 mt-1 text-xs sm:text-sm">₹66.00</div>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[11px] sm:text-xs truncate">Sharbati Atta (5kg)</div>
                      <div className="font-bold text-emerald-400 mt-1 text-xs sm:text-sm">₹245.00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section id="plans" className="py-16 sm:py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/30">
              Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-4">
              Simple, Affordable Plans for Every Merchant
            </h2>
            <p className="text-slate-300 mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg">
              No sales commission, no hidden merchant gateway fees. Pay once, sell unlimited products, and keep 100% of
              your hard-earned profit.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch max-w-5xl mx-auto">
            {PLANS.map((plan) => {
              const isPopular = plan.popular;
              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                    isPopular
                      ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 lg:-translate-y-2'
                      : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{plan.billingText}</p>

                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-3xl sm:text-5xl font-black text-white">₹{plan.price}</span>
                      {plan.originalPrice && (
                        <span className="text-base sm:text-lg text-slate-500 line-through">₹{plan.originalPrice}</span>
                      )}
                      <span className="text-xs text-slate-400">
                        {plan.id === 'MONTHLY' ? '/mo' : `(~₹${plan.monthlyEquivalent}/mo)`}
                      </span>
                    </div>

                    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-800 space-y-3 sm:space-y-3.5">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 sm:mt-10">
                    <button
                      onClick={() => openPlanModal(plan)}
                      className={`w-full py-3.5 sm:py-4 rounded-2xl font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
                        isPopular
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      <span>Choose {plan.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 text-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Instant Store Activation with Direct UPI (0% Fee)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              3 Easy Steps
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-4">
              How To Create Your Store in Minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <span className="text-4xl sm:text-5xl font-black text-slate-800 absolute top-6 right-6 select-none">01</span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-5 sm:mb-6 font-bold text-lg sm:text-xl">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Pick Your Plan</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Select between Monthly, Quarterly, or Yearly subscription based on your business stage.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <span className="text-4xl sm:text-5xl font-black text-slate-800 absolute top-6 right-6 select-none">02</span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-5 sm:mb-6 font-bold text-lg sm:text-xl">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Instant 0% Fee UPI Checkout</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Complete signup payment safely using dynamic QR or 1-tap UPI apps (GPay, PhonePe, Paytm, CRED).
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <span className="text-4xl sm:text-5xl font-black text-slate-800 absolute top-6 right-6 select-none">03</span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-5 sm:mb-6 font-bold text-lg sm:text-xl">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Store is Live!</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Your store URL (e.g. .../?store=yourstore) is ready instantly with default catalog products pre-seeded.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faq" className="py-16 sm:py-20 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 mt-2 sm:mt-3 text-xs sm:text-sm">Everything you need to know about starting your digital store.</p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {FAQS.map((item, idx) => (
              <div key={idx} className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item.q}</span>
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 pl-6 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 sm:py-12 border-t border-slate-800 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2 sm:space-y-3">
          <p className="font-semibold text-slate-400">AmazingDeal — Empowering 10,000+ Indian Neighborhood Merchants</p>
          <p>© 2026 AmazingDeal.co.in. All rights reserved. Built with pride for local businesses.</p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* ONBOARDING MODAL: DETAILS -> RAZORPAY PAYMENT -> STORE SETUP -> SUCCESS */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 relative my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            {step !== 'SUCCESS' && (
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Step Indicators */}
            <div className="flex items-center justify-between pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-slate-800 text-[11px] sm:text-xs">
              <div className={`flex items-center gap-1.5 sm:gap-2 ${step === 'DETAILS' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center text-[10px] sm:text-xs border-current shrink-0">1</span>
                <span>Contact & Store</span>
              </div>
              <div className="w-4 sm:w-6 h-[1px] bg-slate-800 shrink-0" />
              <div className={`flex items-center gap-1.5 sm:gap-2 ${step === 'PAYMENT' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center text-[10px] sm:text-xs border-current shrink-0">2</span>
                <span>UPI Checkout</span>
              </div>
              <div className="w-4 sm:w-6 h-[1px] bg-slate-800 shrink-0" />
              <div className={`flex items-center gap-1.5 sm:gap-2 ${step === 'STORE_SETUP' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center text-[10px] sm:text-xs border-current shrink-0">3</span>
                <span>Setup & Launch</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* STEP 1: CONTACT & STORE SLUG */}
            {step === 'DETAILS' && (
              <form onSubmit={handleProceedToPayment} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Create Your Merchant Account</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Selected Plan:{' '}
                    <span className="text-emerald-400 font-semibold">
                      {selectedPlan.name} (₹{selectedPlan.price})
                    </span>
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Gupta"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Phone (10-digit)</label>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. ramesh@gmail.com"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Store / Shop Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gupta Kirana & General Store"
                      value={storeName}
                      onChange={(e) => handleStoreNameChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Choose Your Store URL Slug / Subdomain
                      </label>
                      {subdomainStatus.checking ? (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                        </span>
                      ) : subdomainStatus.available === true ? (
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Available!
                        </span>
                      ) : subdomainStatus.available === false ? (
                        <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Taken / Invalid
                        </span>
                      ) : null}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="guptakiranastore"
                        value={subdomain}
                        onChange={(e) => setSubdomain(autoSlug(e.target.value))}
                        className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-white text-sm focus:outline-none ${
                          subdomainStatus.available === true
                            ? 'border-emerald-500 focus:border-emerald-400'
                            : subdomainStatus.available === false
                            ? 'border-rose-500 focus:border-rose-400'
                            : 'border-slate-800 focus:border-emerald-500'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      Your store URL will be: <span className="text-emerald-400">.../?store={subdomain || 'yourstore'}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!subdomainStatus.available}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Pay ₹{selectedPlan.price}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: RAZORPAY SECURE CHECKOUT */}
            {step === 'PAYMENT' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                      <span>Razorpay Secure Checkout</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-blue-400" />
                      <span>PCI-DSS Level 1</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Store subscription for <span className="text-emerald-400 font-semibold">{storeName}</span> (
                    {subdomain}.amazingdeal.co.in)
                  </p>
                </div>

                {/* Plan Summary Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{selectedPlan.name}</div>
                    <div className="text-xs text-slate-400">{selectedPlan.billingText}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-400">₹{selectedPlan.price}</div>
                    <div className="text-[11px] text-slate-500">Zero platform convenience fee</div>
                  </div>
                </div>

                {/* Razorpay Gateway Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Gateway Rail: Razorpay Payments</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 font-bold">
                      Order: {razorpayOrder?.orderId || 'Preparing...'}
                    </div>
                  </div>

                  {/* Accepted Payment Methods Badges */}
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 font-medium">Supported Payment Methods:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-1">
                        <Smartphone className="w-4 h-4 text-emerald-400 mx-auto" />
                        <div className="text-[11px] font-bold text-white">Instant UPI</div>
                        <div className="text-[9px] text-slate-400">GPay, PhonePe, Paytm</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-1">
                        <CreditCard className="w-4 h-4 text-blue-400 mx-auto" />
                        <div className="text-[11px] font-bold text-white">Cards</div>
                        <div className="text-[9px] text-slate-400">Visa, Master, RuPay</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-1">
                        <Store className="w-4 h-4 text-purple-400 mx-auto" />
                        <div className="text-[11px] font-bold text-white">NetBanking</div>
                        <div className="text-[9px] text-slate-400">50+ Indian Banks</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-1">
                        <Zap className="w-4 h-4 text-amber-400 mx-auto" />
                        <div className="text-[11px] font-bold text-white">Wallets & Pay</div>
                        <div className="text-[9px] text-slate-400">Mobikwik, CRED & more</div>
                      </div>
                    </div>
                  </div>

                  {/* Razorpay Launch Checkout CTA */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      onClick={handleOpenRazorpay}
                      disabled={razorpayLoading}
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {razorpayLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting to Razorpay...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Pay ₹{selectedPlan.price} with Razorpay</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Encrypted with 256-Bit SSL • Guaranteed Bank rails</span>
                    </p>
                  </div>

                  {/* Dev / Test Mode Simulator */}
                  <div className="pt-3 border-t border-slate-800/80 text-center space-y-2">
                    <div className="text-[11px] text-slate-400">
                      Developing or testing in sandbox?
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulatePaymentSuccess}
                      disabled={razorpayLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 text-xs font-semibold border border-slate-700/60 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>⚡ Test Mode: Simulate Instant Razorpay Confirmation</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('DETAILS')}
                  className="w-full text-xs text-slate-400 hover:text-white"
                >
                  ← Back to Details
                </button>
              </div>
            )}

            {/* STEP 3: STORE CONFIGURATION & PASSWORD */}
            {step === 'STORE_SETUP' && (
              <form onSubmit={handleCreateStore} className="space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Payment Verified ({paymentRef})</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Finalize Your Store Settings</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Set your owner password and store details to activate your live URL.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Store Business Categories (Select 1 or more)
                      </label>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {selectedCategories.length} selected
                      </span>
                    </div>

                    {/* Category Search Filter */}
                    <input
                      type="text"
                      placeholder="Search categories (e.g. Groceries, Dairy, Apparel, Tech)..."
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      className="w-full mb-2.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
                    />

                    {/* Multi-Select Category Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
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
                                  // Keep at least one selected
                                  if (prev.length === 1) return prev;
                                  return prev.filter((item) => item !== cat.name);
                                } else {
                                  return [...prev, cat.name];
                                }
                              });
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 group ${
                              isSelected
                                ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm shadow-emerald-500/10'
                                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                  : 'border-slate-700 bg-slate-900 group-hover:border-slate-500'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold leading-tight truncate">
                                  {cat.name}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                {cat.tagline}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Summary Pill Bar */}
                    {selectedCategories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedCategories.map((catName) => (
                          <span
                            key={catName}
                            className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30"
                          >
                            <span>{catName}</span>
                            {selectedCategories.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedCategories((prev) => prev.filter((c) => c !== catName))
                                }
                                className="hover:text-white"
                              >
                                &times;
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Merchant Admin Password (min 6 characters)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Enter a secure password for your store dashboard"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Your UPI ID / VPA (For receiving customer payments directly)
                    </label>
                    <input
                      type="text"
                      placeholder={`e.g. ${subdomain}@okaxis or yourname@upi`}
                      value={upiVpa}
                      onChange={(e) => setUpiVpa(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Customer order payments will be credited directly to this UPI ID.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Shop / Business Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Shop #12, Main Market, Gandhi Nagar"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={creatingStore}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {creatingStore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Your Store & Seeding Products...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Launch My Store Now 🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: LAUNCH CELEBRATION */}
            {step === 'SUCCESS' && createdStore && (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center animate-bounce shadow-xl shadow-emerald-500/20">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">🎉 Congratulations! Your Store is Live!</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Your customers can now place orders online with direct UPI payments!
                  </p>
                </div>

                {/* Live URL Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 text-left space-y-2">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-400">
                    Live Storefront URL
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs sm:text-sm text-white break-all">
                      {window.location.origin}/?store={createdStore.subdomain}
                    </span>
                    <button
                      onClick={copyStoreLink}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Store QR Code preview */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4 text-left">
                  <div className="p-2 rounded-xl bg-white shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        `${window.location.origin}/?store=${createdStore.subdomain}`
                      )}`}
                      alt="Store QR"
                      className="w-16 h-16"
                    />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">Print or Share Your Store QR</div>
                    <div className="text-slate-400 mt-0.5">
                      Customers can scan this QR code at your shop counter to view products and re-order anytime.
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => navigateToStore(createdStore.subdomain)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Open My Live Store</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <a
                    href="https://admin.amazingdeal.co.in"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Go to Merchant Admin Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
