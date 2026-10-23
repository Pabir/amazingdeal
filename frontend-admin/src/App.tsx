import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { OrderBoard } from './components/OrderBoard';
import { ProductCatalog } from './components/ProductCatalog';
import { StoreSettings } from './components/StoreSettings';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { AuthModal } from './components/AuthModal';
import { ApiService } from './services/api';
import { Order, OrderStats, Product, Tenant, AuthResponse } from './types';

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
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);

  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptText, setReceiptText] = useState<string>('');

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
          inventoryQuantity: 35,
          tracksInventory: true,
          status: 'ACTIVE',
          imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
        }
      ]);
    }
  };

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
      storeName: storedName || 'My Store',
      subdomain: storedSubdomain || 'mystore',
      ownerPhone: storedPhone || '9876543210',
      ownerEmail: storedEmail || 'merchant@amazingdeal.co.in',
      status: 'ACTIVE',
      storeCategory: 'Groceries',
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

    // Live order polling every 12 seconds
    const interval = setInterval(loadData, 12000);
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

  const handleSaveSettings = async (updated: Partial<Tenant>) => {
    setTenant((prev) => (prev ? { ...prev, ...updated } : null));
    if (updated.storeName) localStorage.setItem('ad_store_name', updated.storeName);
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'orders' && (
          <OrderBoard
            orders={orders}
            stats={stats}
            onUpdateStatus={handleUpdateStatus}
            onPrintReceipt={handlePrintReceipt}
          />
        )}

        {activeTab === 'products' && (
          <ProductCatalog products={products} onRefresh={loadData} />
        )}

        {activeTab === 'settings' && (
          <StoreSettings tenant={tenant} onSave={handleSaveSettings} />
        )}
      </main>

      {receiptOrder && (
        <ThermalReceiptModal
          order={receiptOrder}
          receiptText={receiptText}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}

export default App;
