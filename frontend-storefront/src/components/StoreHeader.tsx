import React, { useState, useRef, useEffect } from 'react';
import { StoreInfo, CustomerProfile } from '../types';
import { Store, ShoppingBag, Clock, MapPin, ShieldCheck, Truck, ChevronDown, Check, User, Package, LogOut } from 'lucide-react';

interface StoreHeaderProps {
  store: StoreInfo | null;
  totalCartItems: number;
  onOpenCart: () => void;
  customer?: CustomerProfile | null;
  onOpenAuth?: () => void;
  onOpenOrders?: () => void;
  onOpenAddresses?: () => void;
  onLogout?: () => void;
}

const AVAILABLE_STORES = [
  { name: 'Gupta Kirana Store', subdomain: 'guptakiranastore', badge: 'Groceries' },
  { name: 'Patel Brothers Store', subdomain: 'patelbrothers', badge: 'Staples & Dairy' },
  { name: 'Verma Kirana Stores', subdomain: 'vermakiranastores', badge: 'Daily Essentials' },
];

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  store,
  totalCartItems,
  onOpenCart,
  customer,
  onOpenAuth,
  onOpenOrders,
  onOpenAddresses,
  onLogout,
}) => {
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const customerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setStoreMenuOpen(false);
      }
      if (customerMenuRef.current && !customerMenuRef.current.contains(e.target as Node)) {
        setCustomerMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchStore = (subdomain: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('store', subdomain);
    window.location.href = url.toString();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      
      {/* Top Delivery Announcement Banner */}
      <div className="bg-slate-900 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center space-x-2">
        <Truck className="w-3.5 h-3.5 text-emerald-400" />
        <span>
          {store?.freeDeliveryAbove && store.freeDeliveryAbove > 0
            ? `FREE Local Delivery on orders above ₹${store.freeDeliveryAbove}!`
            : 'Fast hyperlocal delivery from your neighborhood store!'}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Store Info */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 flex-shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {store?.storeName || 'AmazingDeal Store'}
                </h1>
                <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Verified Merchant</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-slate-500">
                {store?.storeAddress && (
                  <span className="inline-flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{store.storeAddress}</span>
                  </span>
                )}
                {store?.storeTimings && (
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{store.storeTimings}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Actions: Store Switcher & Cart */}
          <div className="flex items-center space-x-3">
            {/* Store Switcher Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setStoreMenuOpen(!storeMenuOpen)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
                title="Switch between active merchants"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Browse Stores</span>
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px]">3</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {storeMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Active Merchants ({AVAILABLE_STORES.length})
                    </p>
                  </div>
                  <div className="py-1">
                    {AVAILABLE_STORES.map((s) => {
                      const isCurrent = store?.subdomain?.toLowerCase() === s.subdomain.toLowerCase();
                      return (
                        <button
                          key={s.subdomain}
                          onClick={() => {
                            setStoreMenuOpen(false);
                            switchStore(s.subdomain);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                            isCurrent ? 'bg-emerald-50/70 font-bold text-emerald-900' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-slate-900">{s.name}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ?store={s.subdomain}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            {s.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Auth / Profile Button */}
            {!customer ? (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-xs"
                title="Customer Sign In"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            ) : (
              <div className="relative" ref={customerMenuRef}>
                <button
                  onClick={() => setCustomerMenuOpen(!customerMenuOpen)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
                  title="My Account"
                >
                  {customer.avatarUrl ? (
                    <img
                      src={customer.avatarUrl}
                      alt={customer.fullName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                      {customer.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline font-bold text-xs max-w-[100px] truncate">
                    {customer.fullName.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {customerMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-black text-slate-900 truncate">{customer.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {customer.email || customer.phone || 'Valued Customer'}
                      </p>
                    </div>

                    <div className="py-1 text-xs">
                      <button
                        onClick={() => {
                          setCustomerMenuOpen(false);
                          onOpenOrders?.();
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-center space-x-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                      >
                        <Package className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold">My Orders</span>
                      </button>

                      <button
                        onClick={() => {
                          setCustomerMenuOpen(false);
                          onOpenAddresses?.();
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-center space-x-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold">Saved Addresses</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setCustomerMenuOpen(false);
                          onLogout?.();
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-center space-x-2 text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-semibold">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline">My Cart</span>
              {totalCartItems > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white text-emerald-800 text-xs font-black shadow-sm">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

