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
import { ApiService } from './services/api';
import { Order, OrderStats, Product, Tenant, AuthResponse, Party, Invoice } from './types';

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

  const prevOrderCountRef = useRef<number>(0);

  const loadData = async () => {
    if (!isAuthenticated) return;

    try {
      // 1. Fetch Orders
      const orderList = await ApiService.getOrders();
      setOrders(orderList);

      // Play chime if new order placed
      if (soundEnabled && prevOrderCountRef.current > 0 && orderList.length > prevOrderCountRef.current) {
        playOrderChime();
      }
      prevOrderCountRef.current = orderList.length;

      // 2. Fetch Stats
      const statData = await ApiService.getOrderStats();
      setStats(statData);

      // 3. Fetch Products
      const prodList = await ApiService.getProducts();
      setProducts(prodList);

      // 4. Fetch Invoices
      try {
        const invList = await ApiService.getInvoices();
        setInvoices(invList);
      } catch (e) {
        console.warn('Invoices fetch fallback:', e);
      }

      // 5. Fetch Parties
      try {
        const partyList = await ApiService.getParties();
        setParties(partyList);
      } catch (e) {
        console.warn('Parties fetch fallback:', e);
      }
    } catch (err: any) {
      console.warn('Dashboard data fetch fallback:', err.message);
      // Demo fallback data if API is initializing
      seedDemoDataIfEmpty();
    }
  };

  const seedDemoDataIfEmpty = () => {
    if (orders.length === 0) {
      setOrders([
        {
          id: 'ord-101',
          orderNumber: '#ORD-101',
          storeName: tenant?.storeName || 'Sharma Kirana Store',
          customerName: 'Aarav Mehta',
          customerPhone: '9820123456',
          deliveryAddress: 'Flat 402, Sunshine Heights, Civil Lines',
          deliveryType: 'DELIVERY',
          paymentMethod: 'UPI_ONLINE',
          paymentStatus: 'PAID',
          orderStatus: 'PLACED',
          totalAmount: 311.00,
          deliveryCharge: 0.00,
          items: [
            { title: 'Fresh Farm Dairy Milk (1L)', price: 66.0, quantity: 1, itemTotal: 66.0 },
            { title: 'Whole Wheat Atta (5kg)', price: 245.0, quantity: 1, itemTotal: 245.0 }
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'ord-100',
          orderNumber: '#ORD-100',
          storeName: tenant?.storeName || 'Sharma Kirana Store',
          customerName: 'Pooja Verma',
          customerPhone: '9811223344',
          deliveryAddress: 'Store Pickup',
          deliveryType: 'PICKUP',
          paymentMethod: 'COD',
          paymentStatus: 'PAID',
          orderStatus: 'DELIVERED',
          totalAmount: 140.00,
          deliveryCharge: 0.00,
          items: [
            { title: 'Organic Premium Basmati Rice (1kg)', price: 140.0, quantity: 1, itemTotal: 140.0 }
          ],
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        }
      ]);
      setStats({
        totalOrders: 2,
        placedOrders: 1,
        acceptedOrders: 0,
        deliveredOrders: 1,
        totalRevenue: 451.00,
      });
      setProducts([
        {
          id: 'prod-1',
          title: 'Fresh Farm Dairy Milk (1L)',
          price: 66.0,
          comparePrice: 70.0,
          category: 'Dairy & Eggs',
          hsnSac: '0401',
          gstRate: 5,
          barcode: '890103000101',
          unit: 'litre',
          inventoryQuantity: 45,
          tracksInventory: true,
          status: 'ACTIVE',
          imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'prod-2',
          title: 'Whole Wheat Atta (5kg)',
          price: 245.0,
          comparePrice: 280.0,
          category: 'Grains & Flours',
          hsnSac: '1101',
          gstRate: 5,
          barcode: '890103000102',
          unit: 'pcs',
          inventoryQuantity: 28,
          tracksInventory: true,
          status: 'ACTIVE',
          imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'prod-3',
          title: 'Organic Premium Basmati Rice (1kg)',
          price: 140.0,
          comparePrice: 160.0,
          category: 'Grains & Flours',
          hsnSac: '1006',
          gstRate: 5,
          barcode: '890103000103',
          unit: 'pcs',
          inventoryQuantity: 35,
          tracksInventory: true,
          status: 'ACTIVE',
          imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
        }
      ]);
      setParties([
        {
          id: 'pty-1',
          partyType: 'CUSTOMER',
          partyName: 'Aarav Mehta',
          companyName: 'Mehta Textiles',
          phone: '9820123456',
          email: 'aarav@mehta.in',
          gstin: '07AAACM1234A1Z5',
          billingAddress: 'Flat 402, Sunshine Heights, Civil Lines, Delhi',
          billingStateCode: '07',
          currentBalance: 1250.00, // Lene Hain
          creditLimit: 10000,
          creditPeriodDays: 30,
        },
        {
          id: 'pty-2',
          partyType: 'CUSTOMER',
          partyName: 'Pooja Verma',
          phone: '9811223344',
          billingAddress: 'C-12, Sector 15, Rohini, Delhi',
          billingStateCode: '07',
          currentBalance: 0.00,
          creditLimit: 5000,
          creditPeriodDays: 15,
        },
        {
          id: 'pty-3',
          partyType: 'SUPPLIER',
          partyName: 'Aggarwal Flour & Grain Mill',
          companyName: 'Aggarwal Agro Industries Ltd',
          phone: '9899001122',
          gstin: '07AAGCA9876B1Z2',
          billingAddress: 'Naya Bazaar, Old Delhi',
          billingStateCode: '07',
          currentBalance: -4500.00, // Dene Hain
          creditLimit: 50000,
          creditPeriodDays: 45,
        }
      ]);
      setInvoices([
        {
          id: 'inv-1001',
          invoiceNumber: 'INV-2026-0001',
          partyName: 'Aarav Mehta',
          partyPhone: '9820123456',
          partyGstin: '07AAACM1234A1Z5',
          documentType: 'TAX_INVOICE',
          invoiceDate: new Date().toISOString().split('T')[0],
          placeOfSupply: '07',
          subtotal: 1060.00,
          cgstAmount: 26.50,
          sgstAmount: 26.50,
          igstAmount: 0.00,
          roundOff: 0.00,
          totalAmount: 1113.00,
          paidAmount: 1113.00,
          balanceDue: 0.00,
          paymentStatus: 'PAID',
          paymentMode: 'UPI',
          items: [
            {
              itemName: 'Whole Wheat Atta (5kg)',
              hsnSac: '1101',
              quantity: 2,
              unit: 'pcs',
              unitPrice: 245.0,
              discountPct: 0,
              gstRate: 5,
              cgstAmount: 12.25,
              sgstAmount: 12.25,
              totalAmount: 514.50,
            },
            {
              itemName: 'Organic Premium Basmati Rice (1kg)',
              hsnSac: '1006',
              quantity: 4,
              unit: 'pcs',
              unitPrice: 140.0,
              discountPct: 0,
              gstRate: 5,
              cgstAmount: 14.00,
              sgstAmount: 14.00,
              totalAmount: 588.00,
            }
          ],
          createdAt: new Date().toISOString(),
        }
      ]);
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
      id: storedTenantId || 'tenant-1',
      storeName: storedName || 'Sharma Kirana Store',
      subdomain: storedSubdomain || 'mystore',
      ownerPhone: storedPhone || '9876543210',
      ownerEmail: storedEmail || 'merchant@amazingdeal.co.in',
      status: 'ACTIVE',
      storeCategory: 'Groceries',
      storeAddress: 'Shop 14, Main Bazaar, Civil Lines, Delhi - 110054',
      gstin: '07AAAAA0000A1Z5',
      stateCode: '07',
      invoicePrefix: 'INV',
      bankName: 'HDFC Bank',
      bankAccountNumber: '50200012345678',
      bankIfsc: 'HDFC0001234',
      bankBranch: 'Civil Lines, Delhi',
      upiVpa: storedVpa || `${storedSubdomain || 'mystore'}@okaxis`,
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
    }
  };

  const handleLogout = () => {
    ApiService.clearAuth();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
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
      />
    );
  }

  const pendingCount = orders.filter((o) => o.orderStatus === 'PLACED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
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
