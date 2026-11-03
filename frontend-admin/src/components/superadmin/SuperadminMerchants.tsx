import React, { useState, useEffect } from 'react';
import { 
  Store, Search, ExternalLink, ShieldCheck, AlertTriangle, 
  CheckCircle2, XCircle, LogIn, Calendar, CreditCard, Building, 
  MapPin, Phone, Mail, RefreshCw, X, ChevronRight, Sparkles 
} from 'lucide-react';
import { SuperadminMerchant } from '../../types';
import { ApiService } from '../../services/api';

interface SuperadminMerchantsProps {
  onImpersonate: (merchant: SuperadminMerchant) => void;
}

export const SuperadminMerchants: React.FC<SuperadminMerchantsProps> = ({
  onImpersonate,
}) => {
  const [merchants, setMerchants] = useState<SuperadminMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selected merchant for inspection drawer
  const [selectedMerchant, setSelectedMerchant] = useState<SuperadminMerchant | null>(null);

  // Plan override modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanMerchant, setSelectedPlanMerchant] = useState<SuperadminMerchant | null>(null);
  const [newPlan, setNewPlan] = useState('MONTHLY');
  const [extendDays, setExtendDays] = useState(30);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getSuperadminMerchants(searchTerm, statusFilter, planFilter, page, 20);
      setMerchants(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load merchants:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [page, statusFilter, planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchMerchants();
  };

  const handleToggleStatus = async (merchant: SuperadminMerchant) => {
    const nextStatus = merchant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'ACTIVE' ? 'ACTIVATE' : 'SUSPEND'} store "${merchant.storeName}" (${merchant.subdomain})?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const updated = await ApiService.updateMerchantStatus(merchant.id, nextStatus);
      setMerchants(prev => prev.map(m => m.id === updated.id ? updated : m));
      if (selectedMerchant?.id === updated.id) setSelectedMerchant(updated);
    } catch (err: any) {
      alert('Failed to update store status: ' + err.message);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlanMerchant) return;
    setUpdatingPlan(true);
    try {
      const updated = await ApiService.updateMerchantPlan(selectedPlanMerchant.id, newPlan, extendDays);
      setMerchants(prev => prev.map(m => m.id === updated.id ? updated : m));
      if (selectedMerchant?.id === updated.id) setSelectedMerchant(updated);
      setShowPlanModal(false);
    } catch (err: any) {
      alert('Failed to update plan: ' + err.message);
    } finally {
      setUpdatingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Store className="w-5 h-5 text-indigo-600" />
              <span>Registered Stores & Merchants</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {totalElements} Stores
              </span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Manage merchant activations, inspect KYC/bank details, grant subscription extensions, and login into any store.
            </p>
          </div>

          <button
            onClick={fetchMerchants}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          <form onSubmit={handleSearchSubmit} className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by store name, subdomain, phone, email, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-20 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
            >
              Search
            </button>
          </form>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All Store Statuses</option>
              <option value="ACTIVE">Active Live Stores</option>
              <option value="SUSPENDED">Suspended Stores</option>
              <option value="TRIAL">Trial Stores</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All Subscription Plans</option>
              <option value="STARTER">Starter (₹0)</option>
              <option value="MONTHLY">Monthly Growth (₹599)</option>
              <option value="GROWTH">Annual Growth</option>
              <option value="ENTERPRISE">Enterprise Custom</option>
            </select>
          </div>

        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Store Profile</th>
                <th className="py-3 px-4">Owner & Contact</th>
                <th className="py-3 px-4">Catalog & Orders</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading stores catalog...
                  </td>
                </tr>
              ) : merchants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No stores found matching your filters.
                  </td>
                </tr>
              ) : (
                merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Store Profile */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span className="cursor-pointer hover:text-indigo-600 truncate max-w-[200px]" onClick={() => setSelectedMerchant(m)}>
                          {m.storeName}
                        </span>
                        <a
                          href={`https://${m.subdomain}.amazingdeal.co.in`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-indigo-600"
                          title="Open Live Customer Storefront"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="font-mono text-[11px] text-indigo-600 mt-0.5">
                        {m.subdomain}.amazingdeal.co.in
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[220px]">
                        {m.storeCategory || 'General Retail'}
                      </div>
                    </td>

                    {/* Owner & Contact */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-bold text-slate-800">{m.ownerEmail}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{m.ownerPhone}</div>
                      {m.gstin && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          GST: {m.gstin}
                        </div>
                      )}
                    </td>

                    {/* Metrics */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        ₹{(m.totalRevenue || 0).toLocaleString('en-IN')} GMV
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {m.productCount} Products • {m.orderCount} Orders
                      </div>
                    </td>

                    {/* Subscription */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-800">
                        <CreditCard className="w-3 h-3 text-indigo-500" />
                        <span>{m.subscriptionPlan || 'STARTER'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {m.subscriptionExpiresAt 
                          ? `Expires: ${new Date(m.subscriptionExpiresAt).toLocaleDateString('en-IN')}`
                          : 'Lifetime Free'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.status === 'SUSPENDED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {m.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* Impersonate */}
                        <button
                          onClick={() => onImpersonate(m)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                          title="Login directly into this store"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Login as Merchant</span>
                        </button>

                        {/* Plan Override */}
                        <button
                          onClick={() => {
                            setSelectedPlanMerchant(m);
                            setNewPlan(m.subscriptionPlan || 'MONTHLY');
                            setShowPlanModal(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="Change Plan & Extend Validity"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>

                        {/* Status Toggle */}
                        <button
                          onClick={() => handleToggleStatus(m)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            m.status === 'ACTIVE'
                              ? 'bg-red-50 hover:bg-red-100 text-red-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                          }`}
                          title={m.status === 'ACTIVE' ? 'Suspend Store' : 'Activate Store'}
                        >
                          {m.status === 'ACTIVE' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => setSelectedMerchant(m)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                          title="Inspect Store Profile"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page {page + 1} of {totalPages} ({totalElements} stores)
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 font-bold"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plan Extension Modal */}
      {showPlanModal && selectedPlanMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>Override Subscription Plan</span>
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Store
                </label>
                <div className="p-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-800">
                  {selectedPlanMerchant.storeName} ({selectedPlanMerchant.subdomain}.amazingdeal.co.in)
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Plan Tier
                </label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="STARTER">Starter Tier (₹0 Free)</option>
                  <option value="MONTHLY">Monthly Growth Tier (₹599/mo)</option>
                  <option value="GROWTH">Annual Pro Tier</option>
                  <option value="ENTERPRISE">Enterprise Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Add Validity Days
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDays(d)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        extendDays === d
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      +{d} Days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePlan}
                disabled={updatingPlan}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                {updatingPlan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save & Apply Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Inspection Drawer */}
      {selectedMerchant && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                Store Detailed Profile
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                {selectedMerchant.storeName}
              </h2>
            </div>
            <button
              onClick={() => setSelectedMerchant(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-5 space-y-5 text-xs">
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onImpersonate(selectedMerchant)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Login as Merchant</span>
              </button>
              <a
                href={`https://${selectedMerchant.subdomain}.amazingdeal.co.in`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Visit Store</span>
              </a>
            </div>

            {/* Store Stats */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Products</div>
                <div className="text-base font-black text-slate-900 mt-0.5">{selectedMerchant.productCount}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Orders</div>
                <div className="text-base font-black text-slate-900 mt-0.5">{selectedMerchant.orderCount}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total GMV</div>
                <div className="text-base font-black text-emerald-600 mt-0.5">₹{selectedMerchant.totalRevenue}</div>
              </div>
            </div>

            {/* General Info */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">
                Store Metadata
              </h4>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Subdomain:</span>
                  <span className="font-mono text-indigo-600 font-bold">{selectedMerchant.subdomain}.amazingdeal.co.in</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Owner Email:</span>
                  <span className="font-bold text-slate-800">{selectedMerchant.ownerEmail}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Owner Phone:</span>
                  <span className="font-mono">{selectedMerchant.ownerPhone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Store Categories:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[240px] truncate">{selectedMerchant.storeCategory || 'General'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Store Address:</span>
                  <span className="text-slate-800 text-right max-w-[240px]">{selectedMerchant.storeAddress || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Merchant GSTIN:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedMerchant.gstin || 'Unregistered'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">State Code:</span>
                  <span className="font-mono">{selectedMerchant.stateCode || '07'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">UPI VPA:</span>
                  <span className="font-mono text-emerald-600 font-bold">{selectedMerchant.upiVpa || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Razorpay BYOK:</span>
                  <span className="font-bold">{selectedMerchant.razorpayByokEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Joined On:</span>
                  <span>{new Date(selectedMerchant.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

