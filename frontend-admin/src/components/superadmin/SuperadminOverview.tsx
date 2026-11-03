import React from 'react';
import { 
  Store, Users, ShoppingCart, TrendingUp, CreditCard, 
  ArrowUpRight, Clock, CheckCircle2, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { PlatformStats, SuperadminMerchant } from '../../types';

interface SuperadminOverviewProps {
  stats: PlatformStats | null;
  onSelectTab: (tab: any) => void;
  onImpersonate: (merchant: SuperadminMerchant) => void;
}

export const SuperadminOverview: React.FC<SuperadminOverviewProps> = ({
  stats,
  onSelectTab,
  onImpersonate,
}) => {
  const cards = [
    {
      title: 'Active Stores / Merchants',
      value: stats ? stats.totalMerchants : 0,
      subValue: `${stats?.activeMerchants || 0} Live • ${stats?.suspendedMerchants || 0} Suspended`,
      icon: Store,
      color: 'from-blue-600 to-indigo-600',
      action: () => onSelectTab('merchants'),
    },
    {
      title: 'Platform Customers',
      value: stats ? stats.totalCustomers : 0,
      subValue: 'Registered Indian shoppers',
      icon: Users,
      color: 'from-emerald-600 to-teal-600',
      action: () => onSelectTab('customers'),
    },
    {
      title: 'Platform Orders Fulfilled',
      value: stats ? stats.totalOrders : 0,
      subValue: 'Across all hyperlocal stores',
      icon: ShoppingCart,
      color: 'from-purple-600 to-pink-600',
      action: () => onSelectTab('orders'),
    },
    {
      title: 'Total Platform GMV',
      value: `₹${(stats?.totalPlatformGmv || 0).toLocaleString('en-IN')}`,
      subValue: 'Gross merchandise value sold',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      action: () => onSelectTab('orders'),
    },
    {
      title: 'SaaS Platform Revenue',
      value: `₹${(stats?.totalSaaSRevenue || 0).toLocaleString('en-IN')}`,
      subValue: 'Subscription payments collected',
      icon: CreditCard,
      color: 'from-indigo-600 to-violet-700',
      action: () => onSelectTab('subscriptions'),
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Tenant Master Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Platform Master Dashboard
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Monitor hyperlocal stores, inspect merchant catalogs, oversee customer registrations, and manage platform SaaS subscriptions across India.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSelectTab('merchants')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Store className="w-4 h-4" />
              <span>Manage Stores</span>
            </button>
            <button
              onClick={() => onSelectTab('subscriptions')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>SaaS Subscriptions</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              onClick={c.action}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${c.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="mt-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {c.title}
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {c.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {c.subValue}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Grid: Recent Stores & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Merchants */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <Store className="w-4 h-4 text-indigo-600" />
              <h2 className="font-extrabold text-sm text-slate-900">
                Recent Merchant Signups
              </h2>
            </div>
            <button
              onClick={() => onSelectTab('merchants')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              View All Stores ➔
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {!stats?.recentMerchants || stats.recentMerchants.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No stores registered yet.
              </div>
            ) : (
              stats.recentMerchants.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-slate-900 truncate">
                        {m.storeName}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-indigo-600">{m.subdomain}.amazingdeal.co.in</span>
                      <span>•</span>
                      <span>{m.productCount} Products</span>
                      <span>•</span>
                      <span>{m.orderCount} Orders</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    <button
                      onClick={() => onImpersonate(m)}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
                      title="Login directly into this store's merchant admin"
                    >
                      Login as Merchant ➔
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-purple-600" />
              <h2 className="font-extrabold text-sm text-slate-900">
                Latest Platform Orders
              </h2>
            </div>
            <button
              onClick={() => onSelectTab('orders')}
              className="text-xs font-bold text-purple-600 hover:text-purple-800"
            >
              View Order Feed ➔
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No orders placed on the platform yet.
              </div>
            ) : (
              stats.recentOrders.map((o) => (
                <div key={o.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        #{o.orderNumber}
                      </span>
                      <span className="text-xs text-slate-600 truncate">
                        {o.customerName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                        {o.storeName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-bold text-emerald-600">₹{o.totalAmount}</span>
                      <span>•</span>
                      <span>{o.paymentMethod}</span>
                      <span>•</span>
                      <span className="capitalize">{o.orderStatus.toLowerCase().replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

