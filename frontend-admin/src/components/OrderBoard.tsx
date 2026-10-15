import React, { useState } from 'react';
import { Order, OrderStats } from '../types';
import { Clock, CheckCircle2, Truck, Printer, Phone, MapPin, IndianRupee, MessageCircle, AlertCircle } from 'lucide-react';

interface OrderBoardProps {
  orders: Order[];
  stats: OrderStats | null;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
  onPrintReceipt: (order: Order) => void;
}

export const OrderBoard: React.FC<OrderBoardProps> = ({
  orders,
  stats,
  onUpdateStatus,
  onPrintReceipt,
}) => {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return o.orderStatus === 'PLACED';
    if (filter === 'PROCESSING') return ['ACCEPTED', 'PACKED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'].includes(o.orderStatus);
    if (filter === 'COMPLETED') return o.orderStatus === 'DELIVERED';
    return o.orderStatus === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">New Placed</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Accepted</span>;
      case 'PACKED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Packed</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Out for Delivery</span>;
      case 'READY_FOR_PICKUP':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">Ready for Pickup</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Delivered</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPaymentBadge = (method: string, status: string) => {
    if (method === 'UPI_ONLINE') {
      return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
        }`}>
          UPI ({status})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        Cash on Delivery
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Revenue</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              ₹{stats ? stats.totalRevenue.toLocaleString('en-IN') : '0'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Placed Orders</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">
              {stats ? stats.placedOrders : '0'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Processing / Active</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600">
              {stats ? stats.acceptedOrders : '0'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Delivered</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">
              {stats ? stats.deliveredOrders : '0'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'All Orders' },
          { id: 'PENDING', label: 'Needs Action (New)' },
          { id: 'PROCESSING', label: 'In Progress' },
          { id: 'COMPLETED', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No orders in this view</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Incoming customer orders from your storefront will instantly appear here with live notifications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const customerPhoneClean = order.customerPhone.replace(/\D/g, '');
            const waLink = `https://wa.me/91${customerPhoneClean}?text=${encodeURIComponent(
              `Hello ${order.customerName}, regarding your Order ${order.orderNumber} from our store: `
            )}`;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header: Order Number, Date, Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-black text-slate-900 tracking-tight">
                        {order.orderNumber}
                      </span>
                      {getStatusBadge(order.orderStatus)}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-600">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                    <div>{getPaymentBadge(order.paymentMethod, order.paymentStatus)}</div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 space-y-1.5 border border-slate-100">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{order.customerName}</span>
                    <div className="flex items-center space-x-2">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center space-x-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customerPhone}</span>
                      </a>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        title="Chat on WhatsApp"
                        className="p-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {order.deliveryAddress && (
                    <div className="flex items-start space-x-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{order.deliveryAddress}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-1 text-[11px] font-bold text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                      {order.deliveryType === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup (BOPIS)'}
                    </span>
                    {order.deliveryCharge > 0 && (
                      <span>Delivery Fee: ₹{order.deliveryCharge.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {/* Items Summary */}
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Ordered Items ({order.items.length})
                  </span>
                  <div className="mt-2 space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-800 font-medium">
                          <span className="font-bold text-slate-900">{item.quantity}x</span> {item.title}
                        </span>
                        <span className="font-semibold text-slate-700">₹{item.itemTotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => onPrintReceipt(order)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Thermal Receipt</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {order.orderStatus === 'PLACED' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'ACCEPTED')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      >
                        Accept Order
                      </button>
                    )}

                    {order.orderStatus === 'ACCEPTED' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, order.deliveryType === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                      >
                        {order.deliveryType === 'PICKUP' ? 'Mark Ready' : 'Dispatch'}
                      </button>
                    )}

                    {['ACCEPTED', 'PACKED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'].includes(order.orderStatus) && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                      >
                        Complete Order
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
