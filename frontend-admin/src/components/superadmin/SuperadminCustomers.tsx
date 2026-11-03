import React, { useState, useEffect } from 'react';
import { 
  Users, Search, RefreshCw, CheckCircle2, XCircle, 
  ShoppingBag, IndianRupee, ShieldAlert, Phone, Mail, Calendar 
} from 'lucide-react';
import { SuperadminCustomer } from '../../types';
import { ApiService } from '../../services/api';

export const SuperadminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<SuperadminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getSuperadminCustomers(searchTerm, statusFilter, page, 20);
      setCustomers(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load customers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchCustomers();
  };

  const handleToggleStatus = async (customer: SuperadminCustomer) => {
    const nextStatus = customer.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'ACTIVE' ? 'UNBLOCK' : 'BLOCK'} customer "${customer.fullName}" (${customer.phone || customer.email})?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const updated = await ApiService.updateCustomerStatus(customer.id, nextStatus);
      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err: any) {
      alert('Failed to update customer status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Platform Customers & Shoppers</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {totalElements} Registered Shoppers
              </span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Directory of buyers across all stores, order histories, total lifetime spend, and fraud management.
            </p>
          </div>

          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          <form onSubmit={handleSearchSubmit} className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, mobile number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-20 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
            >
              Search
            </button>
          </form>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="ALL">All Customer Statuses</option>
              <option value="ACTIVE">Active Shoppers</option>
              <option value="BLOCKED">Blocked Accounts</option>
            </select>
          </div>

        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Auth Method</th>
                <th className="py-3 px-4">Orders Placed</th>
                <th className="py-3 px-4">Total Platform Spend</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading registered customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center shrink-0 uppercase text-xs">
                          {c.fullName ? c.fullName.charAt(0) : 'C'}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900">{c.fullName || 'Registered Shopper'}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {c.firebaseUid.substring(0, 10)}...</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-mono text-slate-800">{c.phone || 'No phone'}</div>
                      <div className="text-[11px] text-slate-400">{c.email || 'No email'}</div>
                    </td>

                    {/* Auth */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {c.authProvider}
                      </span>
                    </td>

                    {/* Orders */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
                        <span>{c.orderCount} Orders</span>
                      </div>
                    </td>

                    {/* Spend */}
                    <td className="py-3 px-4">
                      <div className="font-black text-emerald-600">
                        ₹{(c.totalSpend || 0).toLocaleString('en-IN')}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          c.status === 'ACTIVE'
                            ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
                        }`}
                        title={c.status === 'ACTIVE' ? 'Block customer account' : 'Unblock customer account'}
                      >
                        {c.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                      </button>
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
              Showing page {page + 1} of {totalPages} ({totalElements} customers)
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

    </div>
  );
};

