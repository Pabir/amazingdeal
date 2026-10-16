import React from 'react';
import { Store, ExternalLink, Bell, Volume2, VolumeX, LogOut, Package, ShoppingBag, Settings } from 'lucide-react';
import { Tenant } from '../types';

interface NavbarProps {
  tenant: Tenant | null;
  activeTab: 'orders' | 'products' | 'settings';
  setActiveTab: (tab: 'orders' | 'products' | 'settings') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onLogout: () => void;
  pendingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  tenant,
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
  onLogout,
  pendingCount,
}) => {
  const isWorkersDev = typeof window !== 'undefined' && window.location.hostname.includes('workers.dev');
  const storefrontUrl = tenant?.subdomain
    ? isWorkersDev
      ? `https://${window.location.hostname.replace('amazingdeal-admin', 'amazingdeal-storefront')}?store=${tenant.subdomain}`
      : `https://${tenant.subdomain}.amazingdeal.co.in`
    : '#';

  const storefrontDisplay = tenant?.subdomain
    ? isWorkersDev
      ? `storefront?store=${tenant.subdomain}`
      : `${tenant.subdomain}.amazingdeal.co.in`
    : '';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Store Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  {tenant?.storeName || 'AmazingDeal Merchant'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Live
                </span>
              </div>
              {tenant?.subdomain && (
                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center space-x-1 group"
                >
                  <span>{storefrontDisplay}</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Live Orders</span>
              {pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'products'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4 text-teal-600" />
              <span>Products & Stock</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Store Settings</span>
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Audio chime toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Order sound alert ON' : 'Order sound alert MUTED'}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-semibold ${
              activeTab === 'orders' ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 text-[10px] rounded-full bg-amber-500 text-white font-bold">
                  {pendingCount}
                </span>
              )}
            </div>
            <span>Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-semibold ${
              activeTab === 'products' ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Products</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-semibold ${
              activeTab === 'settings' ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>

      </div>
    </header>
  );
};
