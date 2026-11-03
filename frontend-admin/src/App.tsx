import React, { useState, useEffect, useRef } from 'react';
import { Navbar, AdminTab } from './components/Navbar';
import { PosCounter } from './components/PosCounter';
import { InvoiceList } from './components/InvoiceList';
import { PartiesKhata } from './components/PartiesKhata';
import { GstInvoiceModal } from './components/GstInvoiceModal';
import { OrderBoard } from './components/OrderBoard';
import { ProductCatalog } from './components/ProductCatalog';
import { StoreSettings } from './components/StoreSettings';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { AuthModal } from './components/AuthModal';
import { SuperadminDashboard } from './components/superadmin/SuperadminDashboard';
import { SuperadminLoginModal } from './components/superadmin/SuperadminLoginModal';
import { ApiService } from './services/api';
import { Order, OrderStats, Product, Tenant, AuthResponse, Party, Invoice, SuperadminProfile } from './types';
import { ShieldCheck } from 'lucide-react';

// Audio chime using Web Audio API (zero external assets needed)
function playOrderChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.30); // D6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // audio context blocked by browser policy until interaction
  }
}

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(ApiService.isAuthenticated());
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('pos');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);

  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptModalTitle, setReceiptModalTitle] = useState<string>('');
  const [receiptText, setReceiptText] = useState<string>('');
  const [selectedA4Invoice, setSelectedA4Invoice] = useState<Invoice | null>(null);

  // Superadmin & Impersonation State
  const [isSuperadminAuth, setIsSuperadminAuth] = useState<boolean>(ApiService.isSuperadminAuthenticated());
  const [showSuperadminLogin, setShowSuperadminLogin] = useState<boolean>(false);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(ApiService.isImpersonating());
  const [impersonatedStore, setImpersonatedStore] = useState<string>(ApiService.getImpersonatedStoreName());

  const prevOrderCountRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSuperadminPath = window.location.pathname.startsWith('/superadmin') || window.location.search.includes('superadmin=true');
      if (isSuperadminPath && !isSuperadminAuth) {
        setShowSuperadminLogin(true);
      }
    }
  }, [isSuperadminAuth]);

  const loadData = async () => {
    if (!isAuthenticated) return;

    try {
      // 0. Fetch Store Settings / Profile
      try {
        const storeProfile = await ApiService.getSettings();
        if (storeProfile && storeProfile.id) {
          setTenant(storeProfile);
        }
      } catch (e) {
        console.warn('Store profile fetch:', e);
      }

      // 1. Fetch Orders
      const orderList = await ApiService.getOrders();
      setOrders(orderList || []);

      // Play chime if new order placed
      if (soundEnabled && prevOrderCountRef.current > 0 && orderList && orderList.length > prevOrderCountRef.current) {
        playOrderChime();
      }
      prevOrderCountRef.current = orderList ? orderList.length : 0;

      // 2. Fetch Stats
      const statData = await ApiService.getOrderStats();
      if (statData) setStats(statData);

      // 3. Fetch Products
      const prodList = await ApiService.getProducts();
      setProducts(prodList || []);

      // 4. Fetch Invoices
      try {
        const invList = await ApiService.getInvoices();
        setInvoices(invList || []);
      } catch (e) {
        console.warn('Invoices fetch fallback:', e);
      }

      // 5. Fetch Parties
      try {
        const partyList = await ApiService.getParties();
        setParties(partyList || []);
      } catch (e) {
        console.warn('Parties fetch fallback:', e);
      }
    } catch (err: any) {
      console.warn('Dashboard data fetch error:', err.message);
    }
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsAuthenticated(false);
      setTenant(null);
    };
    window.addEventListener('ad_session_expired', handleSessionExpired);
    return () => window.removeEventListener('ad_session_expired', handleSessionExpired);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load store profile from storage
    const storedName = localStorage.getItem('ad_store_name');
    const storedSubdomain = localStorage.getItem('ad_subdomain');
    const storedTenantId = localStorage.getItem('ad_tenant_id');
    const storedEmail = localStorage.getItem('ad_owner_email');
    const storedPhone = localStorage.getItem('ad_owner_phone');
    const storedVpa = localStorage.getItem('ad_upi_vpa');

    setTenant({
      id: storedTenantId || '',
      storeName: storedName || 'My Store',
      subdomain: storedSubdomain || '',
      ownerPhone: storedPhone || '',
      ownerEmail: storedEmail || '',
      status: 'ACTIVE',
      storeCategory: '',
      storeAddress: '',
      gstin: '',
      stateCode: '07',
      invoicePrefix: 'INV',
      bankName: '',
      bankAccountNumber: '',
      bankIfsc: '',
      bankBranch: '',
      upiVpa: storedVpa || (storedSubdomain ? `${storedSubdomain}@okaxis` : ''),
      deliveryRadiusKm: 5.0,
      deliveryCharge: 30.0,
      freeDeliveryAbove: 499.0,
      minOrderAmount: 0.0,
      storeTimings: '8:00 AM - 10:00 PM',
    });

    // Refresh live profile from server
    ApiService.getMe()
      .then((liveTenant) => {
        if (liveTenant) setTenant(liveTenant);
      })
      .catch((e) => console.warn('Could not refresh full tenant profile:', e.message));

    // Pre-warm AI status cache in background so AI Studio opens instantly with zero lag
    ApiService.getChatGptStatus()
      .then((status) => {
        try {
          localStorage.setItem('ad_ai_status_cache', JSON.stringify(status));
        } catch {}
      })
      .catch(() => {});

    loadData();

    // Live order polling every 15 seconds
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle ChatGPT OAuth redirect callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && isAuthenticated) {
      const codeVerifier = localStorage.getItem('chatgpt_code_verifier') || undefined;
      ApiService.handleChatGptCallback({ code, codeVerifier, state: state || undefined })
        .then((status) => {
          localStorage.removeItem('chatgpt_code_verifier');
          localStorage.removeItem('chatgpt_auth_state');
          window.history.replaceState({}, document.title, window.location.pathname);
          alert(`ChatGPT Plan connected successfully! (${status.planTier || 'ChatGPT Plus'})`);
          setActiveTab('settings');
        })
        .catch((err) => {
          console.error('ChatGPT callback error:', err);
          alert('Failed to complete ChatGPT sign-in: ' + err.message);
        });
    }
  }, [isAuthenticated]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await ApiService.updateOrderStatus(orderId, newStatus);
      loadData();
    } catch {
      // update state optimistically
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus as any } : o))
      );
    }
  };

  const handlePrintReceipt = async (order: Order) => {
    setReceiptOrder(order);
    setReceiptModalTitle(`Receipt (${order.orderNumber})`);
    try {
      const text = await ApiService.getThermalReceipt(order.id);
      setReceiptText(text);
    } catch {
      // Client-side fallback receipt formatting
      const fallback = `================================
     ${(tenant?.storeName || 'AMAZINGDEAL STORE').toUpperCase()}
           Main Bazaar, City
         Phone: ${tenant?.ownerPhone || '9876543210'}
================================
Order: ${order.orderNumber}  Type: ${order.deliveryType}
Date:  ${new Date(order.createdAt).toLocaleString('en-IN')}
Customer: ${order.customerName}
Phone:    ${order.customerPhone}
--------------------------------
Item                Qty    Amount
--------------------------------
${order.items.map(i => `${i.title.padEnd(18).slice(0, 18)}  ${i.quantity}  INR ${i.itemTotal.toFixed(2)}`).join('\n')}
--------------------------------
Delivery Charge:     INR ${order.deliveryCharge.toFixed(2)}
TOTAL AMOUNT:        INR ${order.totalAmount.toFixed(2)}
--------------------------------
Payment: ${order.paymentMethod} (${order.paymentStatus})
Deliver To: ${order.deliveryAddress}
================================
  Thank you for shopping local!
  Powered by amazingdeal.co.in
================================\n\n`;
      setReceiptText(fallback);
    }
  };

  const handleOpenA4Invoice = (invoice: Invoice) => {
    setSelectedA4Invoice(invoice);
  };

  const handleOpenThermalInvoice = async (invoice: Invoice) => {
    setReceiptModalTitle(invoice.invoiceNumber);
    try {
      const text = await ApiService.getInvoiceThermalReceipt(invoice.id);
      setReceiptText(text);
    } catch {
      const fallback = `================================
     ${(tenant?.storeName || 'AMAZINGDEAL STORE').toUpperCase()}
           GSTIN: ${tenant?.gstin || '07AAAAA0000A1Z5'}
================================
Bill No: ${invoice.invoiceNumber}
Date:    ${invoice.invoiceDate}
Customer: ${invoice.partyName}
--------------------------------
Item                Qty    Amount
--------------------------------
${invoice.items.map(i => `${i.itemName.padEnd(16).slice(0, 16)} ${i.quantity}  ₹${i.totalAmount.toFixed(2)}`).join('\n')}
--------------------------------
Subtotal:            ₹${invoice.subtotal.toFixed(2)}
Tax (GST):           ₹${((invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0)).toFixed(2)}
GRAND TOTAL:         ₹${invoice.totalAmount.toFixed(2)}
Paid (${invoice.paymentMode}):  ₹${invoice.paidAmount.toFixed(2)}
${invoice.balanceDue > 0 ? `Balance Due:         ₹${invoice.balanceDue.toFixed(2)}` : ''}
================================
  Thank you! Visit again.
================================\n\n`;
      setReceiptText(fallback);
    }
  };

  const handleSaveSettings = async (updated: Partial<Tenant>) => {
    setTenant((prev) => (prev ? { ...prev, ...updated } : null));
    if (updated.storeName) localStorage.setItem('ad_store_name', updated.storeName);
    try {
      const persisted = await ApiService.updateSettings(updated);
      if (persisted) setTenant(persisted);
    } catch (err: any) {
      console.warn('Could not persist settings to server:', err.message);
      throw err;
    }
  };

  const handleLogout = () => {
    if (isImpersonating) {
      ApiService.exitImpersonation();
      setIsImpersonating(false);
      setIsAuthenticated(false);
      setIsSuperadminAuth(true);
      return;
    }
    ApiService.clearAuth();
    setIsAuthenticated(false);
  };

  // 1. If Superadmin authenticated and NOT currently impersonating a merchant store, render Superadmin Panel
  if (isSuperadminAuth && !isImpersonating) {
    return (
      <SuperadminDashboard
        onLogout={() => {
          ApiService.superadminLogout();
          setIsSuperadminAuth(false);
        }}
        onImpersonateSuccess={(storeName, subdomain) => {
          setIsImpersonating(true);
          setImpersonatedStore(storeName);
          setIsAuthenticated(true);
          setTenant({
            id: ApiService.getTenantId() || '',
            storeName: storeName,
            subdomain: subdomain,
            ownerPhone: '',
            ownerEmail: '',
            status: 'ACTIVE',
            storeCategory: 'General Store',
            deliveryRadiusKm: 5.0,
            deliveryCharge: 30.0,
            freeDeliveryAbove: 499.0,
            minOrderAmount: 0.0,
            storeTimings: '8:00 AM - 10:00 PM',
          });
          loadData();
        }}
      />
    );
  }

  // 2. If Merchant is not signed in (and not Superadmin), show Auth screen
  if (!isAuthenticated) {
    return (
      <>
        <AuthModal
          onSuccess={(auth: AuthResponse) => {
            setTenant({
              id: auth.tenantId,
              storeName: auth.storeName,
              subdomain: auth.subdomain,
              ownerPhone: auth.ownerPhone,
              ownerEmail: auth.ownerEmail,
              status: 'ACTIVE',
              storeCategory: 'Groceries',
              upiVpa: auth.upiVpa,
              deliveryRadiusKm: 5.0,
              deliveryCharge: 30.0,
              freeDeliveryAbove: 499.0,
              minOrderAmount: 0.0,
              storeTimings: '8:00 AM - 10:00 PM',
            });
            setIsAuthenticated(true);
          }}
          onOpenSuperadmin={() => setShowSuperadminLogin(true)}
        />
        <SuperadminLoginModal
          isOpen={showSuperadminLogin}
          onClose={() => setShowSuperadminLogin(false)}
          onSuccess={(_profile) => {
            setIsSuperadminAuth(true);
            setShowSuperadminLogin(false);
          }}
        />
      </>
    );
  }

  const pendingCount = orders.filter((o) => o.orderStatus === 'PLACED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      
      {/* Impersonation Floating Sticky Alert */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2.5 text-xs font-bold shadow-lg flex flex-wrap items-center justify-between gap-2 z-50 sticky top-0">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-200" />
            <span>
              SUPERADMIN IMPERSONATION: Managing store <strong>"{tenant?.storeName || impersonatedStore}"</strong>. You have unrestricted merchant access.
            </span>
          </div>
          <button
            onClick={() => {
              ApiService.exitImpersonation();
              setIsImpersonating(false);
              setIsAuthenticated(false);
              setIsSuperadminAuth(true);
            }}
            className="px-3.5 py-1 bg-white text-orange-950 rounded-lg hover:bg-orange-50 font-black shadow-sm transition-colors text-xs"
          >
            Exit Impersonation & Return to Superadmin Dashboard ➔
          </button>
        </div>
      )}

      <Navbar
        tenant={tenant}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onLogout={handleLogout}
        pendingCount={pendingCount}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* POS Counter Billing Screen */}
        {activeTab === 'pos' && (
          <PosCounter
            tenant={tenant}
            products={products}
            parties={parties}
            onOpenA4Invoice={handleOpenA4Invoice}
            onOpenThermalReceipt={handleOpenThermalInvoice}
            onRefreshParties={loadData}
          />
        )}

        {/* Online Storefront Orders */}
        {activeTab === 'orders' && (
          <OrderBoard
            orders={orders}
            stats={stats}
            onUpdateStatus={handleUpdateStatus}
            onPrintReceipt={handlePrintReceipt}
            onOrderUpdated={(updated) => setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))}
          />
        )}

        {/* GST Invoices & Bills Management */}
        {activeTab === 'invoices' && (
          <InvoiceList
            tenant={tenant}
            invoices={invoices}
            onRefresh={loadData}
            onOpenA4Invoice={handleOpenA4Invoice}
            onOpenThermalReceipt={handleOpenThermalInvoice}
          />
        )}

        {/* Parties & Udhaar Khata */}
        {activeTab === 'parties' && (
          <PartiesKhata
            tenant={tenant}
            parties={parties}
            onRefresh={loadData}
          />
        )}

        {/* Products & Catalog */}
        {activeTab === 'products' && (
          <ProductCatalog products={products} onRefresh={loadData} storeCategory={tenant?.storeCategory} />
        )}

        {/* Store Settings */}
        {activeTab === 'settings' && (
          <StoreSettings tenant={tenant} onSave={handleSaveSettings} />
        )}
      </main>

      {/* A4 / A5 GST Tax Invoice Print & WhatsApp Modal */}
      {selectedA4Invoice && (
        <GstInvoiceModal
          invoice={selectedA4Invoice}
          tenant={tenant}
          onClose={() => setSelectedA4Invoice(null)}
        />
      )}

      {/* 58mm / 80mm ESC-POS Thermal Receipt Modal */}
      {receiptText && (
        <ThermalReceiptModal
          title={receiptModalTitle}
          order={receiptOrder}
          receiptText={receiptText}
          onClose={() => {
            setReceiptText('');
            setReceiptOrder(null);
            setReceiptModalTitle('');
          }}
        />
      )}
    </div>
  );
}

export default App;
