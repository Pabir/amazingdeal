import React, { useState, useEffect } from 'react';
import { useSubdomain } from './hooks/useSubdomain';
import { useCart } from './hooks/useCart';
import { useCustomerAuth } from './hooks/useCustomerAuth';
import { StoreApi } from './services/storeApi';
import { StoreInfo, Product, OrderResponse } from './types';
import { StoreHeader } from './components/StoreHeader';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { MyOrdersModal } from './components/MyOrdersModal';
import { SavedAddressesModal } from './components/SavedAddressesModal';
import { Search, ShoppingBag, ArrowRight } from 'lucide-react';

export function App() {
  const subdomain = useSubdomain();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Product Details Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState<boolean>(false);

  // Customer Authentication Hook
  const {
    customer,
    token,
    addresses,
    loading: authLoading,
    error: authError,
    loginWithGoogle,
    loginWithEmail,
    logout,
    saveAddress,
    deleteAddress,
  } = useCustomerAuth();

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  const [isAddressesOpen, setIsAddressesOpen] = useState<boolean>(false);

  // Cart & Orders
  const {
    items: cartItems,
    addToCart,
    updateQuantity,
    clearCart,
    totalItems: totalCartItems,
    subtotal: cartSubtotal,
  } = useCart(subdomain);

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderResponse | null>(null);

  useEffect(() => {
    async function loadStoreData() {
      try {
        setLoading(true);
        const [storeData, productData] = await Promise.all([
          StoreApi.getStoreInfo(subdomain),
          StoreApi.getProducts(subdomain),
        ]);
        setStore(storeData);
        setProducts(productData);
      } catch (e) {
        console.error('Failed to load store data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStoreData();
  }, [subdomain]);

  // Open product details modal and sync with URL (?product=id)
  const handleOpenProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('product', product.id);
      window.history.pushState({ productId: product.id }, '', url.toString());
    } catch (e) {
      // ignore
    }
  };

  // Close product details modal and remove param from URL
  const handleCloseProductDetails = () => {
    setIsProductDetailsOpen(false);
    setSelectedProduct(null);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('product')) {
        url.searchParams.delete('product');
        window.history.pushState({}, '', url.toString());
      }
    } catch (e) {
      // ignore
    }
  };

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const prodId = urlParams.get('product');
        if (prodId && products.length > 0) {
          const match = products.find((p) => p.id === prodId);
          if (match) {
            setSelectedProduct(match);
            setIsProductDetailsOpen(true);
            return;
          }
        }
        setIsProductDetailsOpen(false);
        setSelectedProduct(null);
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  // Check URL on initial product load
  useEffect(() => {
    if (products.length > 0) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const prodId = urlParams.get('product');
        if (prodId) {
          const match = products.find((p) => p.id === prodId);
          if (match) {
            setSelectedProduct(match);
            setIsProductDetailsOpen(true);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [products]);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handlePlaceOrder = async (orderPayload: any) => {
    try {
      setPlacingOrder(true);
      const createdOrder = await StoreApi.placeOrder(subdomain, orderPayload);
      setConfirmedOrder(createdOrder);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      clearCart();
    } catch (e: any) {
      alert(`Could not place order: ${e.message}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleReorder = (orderItems: any[]) => {
    orderItems.forEach((item) => {
      const match = products.find((p) => p.id === item.productId || p.title === item.title);
      if (match) {
        addToCart(match);
      }
    });
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Storefront Header with Customer Profile / Sign In */}
      <StoreHeader
        store={store}
        totalCartItems={totalCartItems}
        onOpenCart={() => setIsCartOpen(true)}
        customer={customer}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenAddresses={() => setIsAddressesOpen(true)}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Search & Category Tabs */}
        <div className="space-y-3">
          <div className="relative max-w-lg mx-auto sm:mx-0">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products in this store..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
            />
          </div>

          {categories.length > 1 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Catalog Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No items match your search</h3>
            <p className="text-xs text-slate-500 mt-1">Try another keyword or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const inCart = cartItems.find((i) => i.product.id === product.id)?.quantity || 0;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={inCart}
                  onAddToCart={addToCart}
                  onUpdateQuantity={updateQuantity}
                  onProductClick={handleOpenProductDetails}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile Floating Cart Summary Bar */}
      {totalCartItems > 0 && !isCartOpen && (
        <div className="fixed bottom-4 inset-x-4 sm:hidden z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between font-bold text-xs"
          >
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-black">
                {totalCartItems}
              </span>
              <span>View Cart</span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-400 text-sm font-black">
              <span>₹{cartSubtotal.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Product Details Modal / Bottom Sheet */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={isProductDetailsOpen}
        onClose={handleCloseProductDetails}
        quantityInCart={
          selectedProduct
            ? cartItems.find((i) => i.product.id === selectedProduct.id)?.quantity || 0
            : 0
        }
        onAddToCart={addToCart}
        onUpdateQuantity={updateQuantity}
        store={store}
        onViewCart={() => {
          setIsProductDetailsOpen(false);
          setIsCartOpen(true);
        }}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        subtotal={cartSubtotal}
        store={store}
        onUpdateQuantity={updateQuantity}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        customer={customer}
        onOpenAuth={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
        onProductClick={handleOpenProductDetails}
      />

      {/* 1-Step Checkout Modal with Customer & Saved Address support */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        subtotal={cartSubtotal}
        store={store}
        onPlaceOrder={handlePlaceOrder}
        loading={placingOrder}
        customer={customer}
        addresses={addresses}
        onSaveAddress={saveAddress}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Customer Login / Signup Modal */}
      <CustomerAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onGoogleLogin={loginWithGoogle}
        onEmailLogin={loginWithEmail}
        loading={authLoading}
        error={authError}
      />

      {/* Customer Order History & Tracking Modal */}
      <MyOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        token={token}
        subdomain={subdomain}
        onReorder={handleReorder}
      />

      {/* Saved Addresses Modal */}
      <SavedAddressesModal
        isOpen={isAddressesOpen}
        onClose={() => setIsAddressesOpen(false)}
        addresses={addresses}
        onSaveAddress={saveAddress}
        onDeleteAddress={deleteAddress}
      />

      {/* Order Confirmed / UPI QR Modal */}
      <OrderSuccessModal order={confirmedOrder} onClose={() => setConfirmedOrder(null)} />
    </div>
  );
}

export default App;
