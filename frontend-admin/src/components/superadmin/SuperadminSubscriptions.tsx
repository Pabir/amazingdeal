import React, { useState, useEffect } from 'react';
import { 
  CreditCard, RefreshCw, CheckCircle2, ShieldCheck, 
  ExternalLink, Calendar, IndianRupee, Store 
} from 'lucide-react';
import { SubscriptionTx } from '../../types';
import { ApiService } from '../../services/api';

export const SuperadminSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionTx[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getSubscriptions();
      setSubscriptions(data || []);
    } catch (err: any) {
      console.error('Failed to load subscriptions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const totalRevenue = subscriptions
    .filter(s => s.status === 'CAPTURED' || s.status === 'PAID')
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header & KPI Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Master Razorpay Gateway (Live)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              SaaS Subscriptions & Platform Revenue
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Direct-to-bank platform revenue collected via AmazingDeal Master Razorpay integration whenever merchants subscribe or upgrade.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-right">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Total SaaS Revenue Captured
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <h2 className="font-extrabold text-sm text-slate-900">
              Subscription Transaction History
            </h2>
          </div>
          <button
            onClick={fetchSubscriptions}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Store Subdomain</th>
                <th className="py-3 px-4">Plan Subscribed</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Razorpay Order ID</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading platform revenue transactions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No subscription payments recorded yet.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Subdomain */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{s.subdomain || 'Unknown store'}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {s.subdomain}.amazingdeal.co.in
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] border border-indigo-200">
                        {s.planId || 'MONTHLY'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                      ₹{s.amount}
                    </td>

                    {/* Order ID */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {s.orderId}
                    </td>

                    {/* Payment ID */}
                    <td className="py-3.5 px-4 font-mono text-slate-700 text-[11px]">
                      {s.paymentId || 'Pending capture'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'CAPTURED' || s.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-right text-slate-500 text-[11px]">
                      {new Date(s.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

