import React, { useState, useEffect } from 'react';
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
  Loader2,
  Lock,
} from 'lucide-react';
import { StoreApi } from '../services/storeApi';
import { SubscriptionPlan, SubscriptionPlanId, MerchantAuthResponse } from '../types';

const PLANS: SubscriptionPlan[] = [
  {
    id: 'MONTHLY',
    name: 'Monthly Starter',
    billingText: 'Billed monthly',
    price: 499,
    monthlyEquivalent: 499,
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
    badge: 'MOST POPULAR — SAVE 20%',
    billingText: 'Billed ₹1,199 every 3 months',
    price: 1199,
    originalPrice: 1497,
    monthlyEquivalent: 399,
    popular: true,
    features: [
      'Everything in Monthly Starter',
      'Save 20% compared to monthly',
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
    badge: 'BEST VALUE — 2 MONTHS FREE',
    billingText: 'Billed ₹3,999 annually',
    price: 3999,
    originalPrice: 5988,
    monthlyEquivalent: 333,
    features: [
      'Everything in Quarterly Growth',
      'Save 33% + 2 Full Months Free',
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

  // Step 2: Payment
  const [paymentMethod, setPaymentMethod] = useState<'PAYU' | 'UPI_QR'>('PAYU');
  const [payuLoading, setPayuLoading] = useState<boolean>(false);
  const [payuData, setPayuData] = useState<any>(null);
  const [paymentVerified, setPaymentVerified] = useState<boolean>(false);
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Step 3: Store Configuration
  const [storeCategory, setStoreCategory] = useState<string>('Daily Essentials & Groceries');
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

  // Check URL params for PayU callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payuStatus = params.get('payu_status');
    const txnid = params.get('txnid');
    const plan = params.get('plan') as SubscriptionPlanId | null;
    const sub = params.get('subdomain');

    if (payuStatus && txnid) {
      if (payuStatus === 'success') {
        setPaymentVerified(true);
        setPaymentRef(txnid);
        if (plan) {
          const found = PLANS.find((p) => p.id === plan);
          if (found) setSelectedPlan(found);
        }
        if (sub) {
          setSubdomain(sub);
        }
        setStep('STORE_SETUP');
        setIsModalOpen(true);
      } else {
        setErrorMsg('PayU transaction was not completed. Please try again.');
        setIsModalOpen(true);
        setStep('PAYMENT');
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

  const handleInitiatePayU = async () => {
    try {
      setPayuLoading(true);
      setErrorMsg('');

      const res = await StoreApi.initiatePayU({
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        firstname: merchantName,
        email: ownerEmail,
        phone: ownerPhone,
        subdomain,
        storeName,
      });

      setPayuData(res);
      setPaymentRef(res.txnid);

      // Auto-submit form to PayU gateway
      setTimeout(() => {
        const form = document.getElementById('payu-checkout-form') as HTMLFormElement;
        if (form) {
          form.submit();
        }
      }, 600);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to initialize PayU payment');
      setPayuLoading(false);
    }
  };

  // Simulated instant test payment confirmation (for immediate testing in dev/sandbox)
  const handleSimulatePaymentSuccess = () => {
    setPaymentVerified(true);
    setPaymentRef('PAYU_TEST_' + Date.now());
    setStep('STORE_SETUP');
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
        storeCategory,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-2xl tracking-tight">
              A
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                AmazingDeal
                <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Merchant Cloud
                </span>
              </span>
              <p className="text-xs text-slate-400 hidden sm:block">Zero-Commission Hyperlocal Commerce</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#plans" className="hover:text-emerald-400 transition-colors">
              Plans & Pricing
            </a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
              How It Works
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateToStore('guptakiranastore')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Explore Demo Store</span>
            </button>
            <button
              onClick={() => openPlanModal(PLANS[1])}
              className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-8 animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Launch Your Online Business in 2 Minutes</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1] text-white">
            Own Your Storefront.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              0% Commission.
            </span>{' '}
            Direct UPI to Your Bank.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Turn your local grocery, supermarket, pharmacy, or retail shop into an e-commerce powerhouse.
            Accept instant customer UPI payments directly, manage orders with a live Kanban board, and print thermal
            receipts on the spot.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openPlanModal(PLANS[1])}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
            >
              <span>Choose a Plan & Create Store</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigateToStore('guptakiranastore')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-base sm:text-lg border border-slate-700/80 transition-all flex items-center justify-center gap-2"
            >
              <Store className="w-5 h-5 text-emerald-400" />
              <span>Explore Live Demo Store</span>
            </button>
          </div>

          {/* Value Props Row */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">0% Platform Fee</h4>
              <p className="text-xs text-slate-400 mt-1">Keep 100% of your earnings. No hidden transaction cuts.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Direct Bank UPI</h4>
              <p className="text-xs text-slate-400 mt-1">Customers scan & pay directly to your merchant UPI ID.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <Printer className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Thermal Billing</h4>
              <p className="text-xs text-slate-400 mt-1">One-click 58mm/80mm receipt generation for deliveries.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Live Storefront URL</h4>
              <p className="text-xs text-slate-400 mt-1">Instant ready-to-share link: .../?store=yourstore</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Preview Card */}
      <section className="py-12 border-y border-slate-800/80 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden relative">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-lg">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  Ready-to-use Sample Store
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-4">
                  See how "Gupta Kirana Store" sells groceries online
                </h3>
                <p className="text-slate-300 mt-3 text-sm leading-relaxed">
                  Browse products, add items to cart, test OTP and email logins, place an order with dynamic UPI QR,
                  and inspect the live order tracking flow.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigateToStore('guptakiranastore')}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <span>Open Live Storefront</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openPlanModal(PLANS[1])}
                    className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700"
                  >
                    Create My Store Like This
                  </button>
                </div>
              </div>

              {/* Mock browser window */}
              <div className="w-full lg:w-1/2 rounded-2xl bg-slate-950 border border-slate-800 p-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <div className="bg-slate-900 px-3 py-1 rounded-lg text-[11px] font-mono text-emerald-400 border border-slate-800">
                    .../?store=guptakiranastore
                  </div>
                  <div className="w-6" />
                </div>
                <div className="pt-4 space-y-3">
                  <div className="h-16 rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                        GK
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">Gupta Kirana Store</div>
                        <div className="text-xs text-slate-400">Open • 8:00 AM - 10:00 PM • Free Delivery Above ₹499</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Fresh Milk (1L)</div>
                      <div className="font-bold text-emerald-400 mt-1">₹66.00</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Sharbati Atta (5kg)</div>
                      <div className="font-bold text-emerald-400 mt-1">₹245.00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section id="plans" className="py-20 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/30">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-4">
              Simple, Affordable Plans for Every Merchant
            </h2>
            <p className="text-slate-300 mt-4 text-base sm:text-lg">
              No sales commission, no hidden merchant gateway fees. Pay once, sell unlimited products, and keep 100% of
              your hard-earned profit.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {PLANS.map((plan) => {
              const isPopular = plan.popular;
              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
                    isPopular
                      ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 lg:-translate-y-2'
                      : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{plan.billingText}</p>

                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-white">₹{plan.price}</span>
                      {plan.originalPrice && (
                        <span className="text-lg text-slate-500 line-through">₹{plan.originalPrice}</span>
                      )}
                      <span className="text-xs text-slate-400">
                        {plan.id === 'MONTHLY' ? '/mo' : `(~₹${plan.monthlyEquivalent}/mo)`}
                      </span>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-800 space-y-3.5">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10">
                    <button
                      onClick={() => openPlanModal(plan)}
                      className={`w-full py-4 rounded-2xl font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
                        isPopular
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      <span>Choose {plan.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Instant Store Activation with PayU</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              3 Easy Steps
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4">
              How To Create Your Store in Minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <span className="text-5xl font-black text-slate-800 absolute top-6 right-6 select-none">01</span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pick Your Plan</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Select between Monthly, Quarterly, or Yearly subscription based on your business stage.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <span className="text-5xl font-black text-slate-800 absolute top-6 right-6 select-none">02</span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Secure PayU Checkout</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Complete signup payment safely using PayU (Credit/Debit Cards, NetBanking, UPI, Wallets) or direct QR.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <span className="text-5xl font-black text-slate-800 absolute top-6 right-6 select-none">03</span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Store is Live!</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your store URL (e.g. .../?store=yourstore) is ready instantly with default catalog products pre-seeded.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faq" className="py-20 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 mt-3 text-sm">Everything you need to know about starting your digital store.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item.q}</span>
                </h4>
                <p className="mt-2 text-sm text-slate-300 pl-6 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="font-semibold text-slate-400">AmazingDeal — Empowering 10,000+ Indian Neighborhood Merchants</p>
          <p>© 2026 AmazingDeal.co.in. All rights reserved. Built with pride for local businesses.</p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* ONBOARDING MODAL: DETAILS -> PAYU PAYMENT -> STORE SETUP -> SUCCESS */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative my-8">
            {/* Close Button */}
            {step !== 'SUCCESS' && (
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Step Indicators */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800 text-xs">
              <div className={`flex items-center gap-2 ${step === 'DETAILS' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs border-current">1</span>
                <span>Contact & Store</span>
              </div>
              <div className="w-6 h-[1px] bg-slate-800" />
              <div className={`flex items-center gap-2 ${step === 'PAYMENT' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs border-current">2</span>
                <span>PayU Checkout</span>
              </div>
              <div className="w-6 h-[1px] bg-slate-800" />
              <div className={`flex items-center gap-2 ${step === 'STORE_SETUP' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs border-current">3</span>
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

            {/* STEP 2: PAYU PAYMENT CHECKOUT */}
            {step === 'PAYMENT' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Complete Plan Payment</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Store creation for <span className="text-emerald-400 font-semibold">{storeName}</span> (
                    {subdomain})
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
                    <div className="text-[11px] text-slate-500">Inclusive of all taxes</div>
                  </div>
                </div>

                {/* Payment Option Selection */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">Choose Payment Method</label>

                  <div
                    onClick={() => setPaymentMethod('PAYU')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      paymentMethod === 'PAYU'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">Pay via PayU Secure Gateway</div>
                        <div className="text-xs text-slate-400">
                          Credit/Debit Cards, Net Banking, PayU UPI, Wallets
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'PAYU' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-700'
                      }`}
                    >
                      {paymentMethod === 'PAYU' && <Check className="w-3 h-3 text-slate-950" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('UPI_QR')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      paymentMethod === 'UPI_QR'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">Instant Direct UPI QR</div>
                        <div className="text-xs text-slate-400">Google Pay, PhonePe, Paytm, BHIM</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'UPI_QR' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-700'
                      }`}
                    >
                      {paymentMethod === 'UPI_QR' && <Check className="w-3 h-3 text-slate-950" />}
                    </div>
                  </div>
                </div>

                {/* PayU Hosted Checkout Action */}
                {paymentMethod === 'PAYU' && (
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleInitiatePayU}
                      disabled={payuLoading}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {payuLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting to PayU Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Pay ₹{selectedPlan.price} via PayU</span>
                        </>
                      )}
                    </button>

                    {/* Hidden Form for PayU Redirection */}
                    {payuData && (
                      <form
                        id="payu-checkout-form"
                        action={payuData.actionUrl}
                        method="POST"
                        className="hidden"
                      >
                        <input type="hidden" name="key" value={payuData.key} />
                        <input type="hidden" name="txnid" value={payuData.txnid} />
                        <input type="hidden" name="amount" value={payuData.amount} />
                        <input type="hidden" name="productinfo" value={payuData.productinfo} />
                        <input type="hidden" name="firstname" value={payuData.firstname} />
                        <input type="hidden" name="email" value={payuData.email} />
                        <input type="hidden" name="phone" value={payuData.phone} />
                        <input type="hidden" name="surl" value={payuData.surl} />
                        <input type="hidden" name="furl" value={payuData.furl} />
                        <input type="hidden" name="hash" value={payuData.hash} />
                        <input type="hidden" name="udf1" value={payuData.udf1} />
                        <input type="hidden" name="udf2" value={payuData.udf2} />
                        <input type="hidden" name="udf3" value={payuData.udf3} />
                      </form>
                    )}

                    {/* Developer Sandbox Testing Quick Bypass */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[11px] text-slate-400 mb-2">
                        Sandbox / Test Mode Key: <span className="text-emerald-400 font-mono">uiw0jf</span>
                      </div>
                      <button
                        onClick={handleSimulatePaymentSuccess}
                        className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold"
                      >
                        ⚡ Simulate Instant Test Payment Success
                      </button>
                    </div>
                  </div>
                )}

                {/* Instant UPI QR Code */}
                {paymentMethod === 'UPI_QR' && (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
                    <div className="text-xs text-slate-300">
                      Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
                    </div>

                    <div className="inline-block p-3 rounded-2xl bg-white shadow-xl">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          `upi://pay?pa=amazingdeal@okaxis&pn=AmazingDeal%20Merchant%20Plan&am=${selectedPlan.price.toFixed(
                            2
                          )}&cu=INR&tn=${encodeURIComponent(selectedPlan.name)}`
                        )}`}
                        alt="UPI QR Code"
                        className="w-40 h-40"
                      />
                    </div>

                    <div className="font-mono text-xs text-emerald-400 font-bold">
                      UPI ID: amazingdeal@okaxis • Amount: ₹{selectedPlan.price}
                    </div>

                    <button
                      onClick={handleSimulatePaymentSuccess}
                      className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all"
                    >
                      I Have Completed the Payment →
                    </button>
                  </div>
                )}

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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Store Category</label>
                    <select
                      value={storeCategory}
                      onChange={(e) => setStoreCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option>Daily Essentials & Groceries</option>
                      <option>Supermarket & Hypermarket</option>
                      <option>Fruits & Fresh Vegetables</option>
                      <option>Dairy, Milk & Bakery</option>
                      <option>Organic & Gourmet Foods</option>
                      <option>Pharmacy & Wellness</option>
                      <option>Electronics & Gadgets</option>
                      <option>Apparel & Fashion</option>
                      <option>General Retail Store</option>
                    </select>
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
                    href="https://amazingdeal-admin.drskpabirulislam1995.workers.dev"
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
