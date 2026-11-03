import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Search, RefreshCw, Clock, ExternalLink, 
  CreditCard, CheckCircle2, AlertCircle, Store 
} from 'lucide-react';
import { GlobalOrder } from '../../types';
import { ApiService } from '../../services/api';

export const SuperadminOrders: React.FC = () => {
  const [orders, setOrders] = useState<GlobalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getGlobalOrders(searchTerm, statusFilter, page, 20);
      setOrders(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load global orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              <span>Global Platform Order Stream</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {totalElements} Total Orders
              </span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Live feed of customer orders being placed and fulfilled across every merchant store in India.
            </p>
          </div>

          <button
            onClick={fetchOrders}
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
              placeholder="Search by order number (e.g. 0047), customer name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-20 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold"
            >
              Search
            </button>
          </form>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PLACED">Placed (Incoming)</option>
              <option value="ACCEPTED">Accepted by Store</option>
              <option value="PACKED">Packed & Ready</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Merchant Store</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Amount & Payment</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Order Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-600" />
                    Streaming platform orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Order Number */}
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900">
                      #{o.orderNumber}
                    </td>

                    {/* Merchant Store */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[160px]">{o.storeName}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {o.subdomain}.amazingdeal.co.in
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-bold text-slate-900">{o.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{o.customerPhone}</div>
                    </td>

                    {/* Amount & Payment */}
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 text-sm">₹{o.totalAmount}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="font-bold">{o.paymentMethod}</span>
                        <span>•</span>
                        <span className={o.paymentStatus === 'PAID' ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                          {o.paymentStatus}
                        </span>
                      </div>
                    </td>

                    {/* Fulfillment */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {o.deliveryType}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.orderStatus === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {o.orderStatus}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      {new Date(o.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
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
              Showing page {page + 1} of {totalPages} ({totalElements} orders)
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

