import React, { useState, useEffect } from 'react';
import { OrderResponse } from '../types';
import { CustomerAuthApi } from '../services/customerAuthApi';
import { X, Package, Clock, CheckCircle2, ChevronRight, Store, QrCode, RotateCcw } from 'lucide-react';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  subdomain: string;
  onReorder?: (items: any[]) => void;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  isOpen,
  onClose,
  token,
  subdomain,
  onReorder,
}) => {
  if (!isOpen) return null;

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await CustomerAuthApi.getCustomerOrders(token, subdomain);
        setOrders(data);
      } catch (e) {
        console.error('Failed to load customer orders:', e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [token, subdomain]);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">Out for Delivery</span>;
      case 'PACKED':
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Preparing Order</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Order Placed</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">My Orders & Tracking</h3>
              <p className="text-xs text-slate-500">Live order status and past invoices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-slate-50 rounded-2xl h-24 animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center max-w-sm mx-auto">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No orders placed yet</h4>
              <p className="text-xs text-slate-500 mt-1">
                Your orders placed with {subdomain} will appear here with live tracking.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-slate-900">{order.orderNumber}</span>
                        {getStatusBadge(order.orderStatus)}
                      </div>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.storeName}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-700">₹{order.totalAmount.toFixed(2)}</span>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {order.paymentMethod} • {order.paymentStatus}
                      </p>
                    </div>
                  </div>

                  {/* Items mini summary */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                    <p className="text-xs truncate max-w-xs">
                      {order.items?.map((i) => `${i.title} × ${i.quantity}`).join(', ') || 'Grocery items'}
                    </p>

                    <div className="flex items-center space-x-2">
                      {order.upiUri && order.paymentStatus === 'PENDING' && (
                        <a
                          href={order.upiUri}
                          className="px-2.5 py-1 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold flex items-center space-x-1 hover:bg-teal-100"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Pay UPI</span>
                        </a>
                      )}
                      {onReorder && (
                        <button
                          onClick={() => {
                            onReorder(order.items);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center space-x-1 hover:bg-slate-100"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          <span>Re-order</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
