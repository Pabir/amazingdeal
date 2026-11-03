import React from 'react';
import { 
  ShieldCheck, LayoutDashboard, Store, Users, ShoppingCart, 
  CreditCard, Activity, LogOut 
} from 'lucide-react';
import { SuperadminProfile } from '../../types';

export type SuperadminTab = 'overview' | 'merchants' | 'customers' | 'orders' | 'subscriptions' | 'health';

interface SuperadminNavbarProps {
  profile: SuperadminProfile | null;
  activeTab: SuperadminTab;
  setActiveTab: (tab: SuperadminTab) => void;
  onLogout: () => void;
}

export const SuperadminNavbar: React.FC<SuperadminNavbarProps> = ({
  profile,
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const tabs = [
    { id: 'overview' as SuperadminTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'merchants' as SuperadminTab, label: 'Merchants', icon: Store },
    { id: 'customers' as SuperadminTab, label: 'Customers', icon: Users },
    { id: 'orders' as SuperadminTab, label: 'Orders', icon: ShoppingCart },
    { id: 'subscriptions' as SuperadminTab, label: 'SaaS Revenue', icon: CreditCard },
    { id: 'health' as SuperadminTab, label: 'System Health', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  AmazingDeal
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
                  Superadmin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">
                Central Platform Control & Multi-Store Management
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Admin Profile & Logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-200">
                {profile?.fullName || 'Master Admin'}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                {profile?.email || 'superadmin@amazingdeal.co.in'}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
              title="Sign Out of Superadmin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};

