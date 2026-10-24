import React, { useState } from 'react';
import { Order, OrderStats } from '../types';
import {
  Clock, CheckCircle2, Truck, Printer, Phone, MapPin, IndianRupee,
  MessageCircle, AlertCircle, Package, Send, ExternalLink, Calendar,
  ShieldCheck, UserCheck, X
} from 'lucide-react';
import { ApiService } from '../services/api';

interface OrderBoardProps {
  orders: Order[];
  stats: OrderStats | null;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
  onPrintReceipt: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
}

export const OrderBoard: React.FC<OrderBoardProps> = ({
  orders,
  stats,
  onUpdateStatus,
  onPrintReceipt,
  onOrderUpdated,
}) => {
  const [filter, setFilter] = useState<string>('ALL');

  // Rider Assignment Modal State
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [riderName, setRiderName] = useState<string>('Manoj');
  const [riderPhone, setRiderPhone] = useState<string>('9845012345');
  const [dispatchingRider, setDispatchingRider] = useState<boolean>(false);
  const [shippingShiprocketId, setShippingShiprocketId] = useState<string | null>(null);

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

  const getPaymentBadge = (order: Order) => {
    const method = order.paymentMethod?.toUpperCase();
    const status = order.paymentStatus?.toUpperCase();

    if (method === 'RAZORPAY_BYOK' || method === 'ONLINE_GATEWAY') {
      return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          Card/Netbanking ({status})
        </span>
      );
    }

    if (method === 'UPI_ONLINE' || method === 'DIRECT_UPI') {
      return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
        }`}>
          Direct UPI ({status})
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        Cash on Delivery {order.codExtraCharge && order.codExtraCharge > 0 ? `(+₹${order.codExtraCharge})` : ''}
      </span>
    );
  };

  const handleShipViaShiprocket = async (orderId: string) => {
    try {
      setShippingShiprocketId(orderId);
      const res = await ApiService.shipViaShiprocket(orderId);
      if (res.success) {
        alert(`Shipment Created via Shiprocket!\nAWB: ${res.awbCode}\nCourier: ${res.courierName}`);
        if (onOrderUpdated && res.order) {
          onOrderUpdated(res.order);
        } else {
          onUpdateStatus(orderId, 'OUT_FOR_DELIVERY');
        }
      }
    } catch (err: any) {
      alert('Shiprocket Error: ' + err.message);
    } finally {
      setShippingShiprocketId(null);
    }
  };

  const handleDispatchStoreRider = async () => {
    if (!assigningOrder) return;
    try {
      setDispatchingRider(true);
      const res = await ApiService.assignStoreRider(assigningOrder.id, riderName, riderPhone);
      if (res.success) {
        if (onOrderUpdated && res.order) {
          onOrderUpdated(res.order);
        } else {
          onUpdateStatus(assigningOrder.id, 'OUT_FOR_DELIVERY');
        }
        setAssigningOrder(null);
        // Automatically open WhatsApp dispatch link
        if (res.whatsappDispatchUrl) {
          window.open(res.whatsappDispatchUrl, '_blank');
        }
      }
    } catch (err: any) {
      alert('Failed to assign rider: ' + err.message);
    } finally {
      setDispatchingRider(false);
    }
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
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivered / Completed</span>
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
      <div className="flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">No orders found in this view</h4>
          <p className="text-xs text-slate-400 mt-1">Orders placed by customers will automatically appear here in real time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
            const waLink = `https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(order.customerName)},%20regarding%20your%20order%20${order.orderNumber}...`;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-extrabold text-base text-slate-900">{order.orderNumber}</span>
                      {getStatusBadge(order.orderStatus)}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">₹{order.totalAmount.toFixed(2)}</span>
                    <div className="mt-1">{getPaymentBadge(order)}</div>
                  </div>
                </div>

                {/* Logistics & Delivery Info Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-bold">{order.customerName}</span>
                    <div className="flex items-center space-x-2">
                      <a href={`tel:${order.customerPhone}`} className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{order.customerPhone}</span>
                      </a>
                      <a href={waLink} target="_blank" rel="noreferrer" title="Chat on WhatsApp" className="p-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600">
                        <MessageCircle className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {order.deliveryAddress && (
                    <div className="flex items-start space-x-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                      <span>{order.deliveryAddress} {order.pincode ? `(${order.pincode})` : ''}</span>
                    </div>
                  )}

                  {/* Expected Delivery Date & Slot */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-bold text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      {order.deliveryType === 'PICKUP' ? 'Store Counter Pickup' : 'Home Delivery'}
                    </span>

                    {order.deliveryTimeSlot && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{order.deliveryTimeSlot}</span>
                      </span>
                    )}

                    {order.expectedDeliveryDate && (
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                        EDD: {order.expectedDeliveryDate}
                      </span>
                    )}

                    {order.deliveryCharge > 0 && (
                      <span className="text-slate-500">Delivery: ₹{order.deliveryCharge.toFixed(2)}</span>
                    )}
                  </div>

                  {/* Shiprocket Tracking details */}
                  {order.shiprocketAwbCode && (
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-extrabold text-purple-900">Shiprocket AWB: {order.shiprocketAwbCode}</span>
                        <span className="text-purple-700 block mt-0.5">{order.shiprocketCourierName || 'Domestic Courier'}</span>
                      </div>
                      {order.shippingLabelUrl && (
                        <a
                          href={order.shippingLabelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold flex items-center gap-1 hover:bg-purple-700"
                        >
                          <span>Track / Label</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Own Rider details */}
                  {order.deliveryBoyName && (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-900">
                        🛵 Assigned Rider: {order.deliveryBoyName} ({order.deliveryBoyPhone})
                      </span>
                    </div>
                  )}
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
                    <span>Print Receipt</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.orderStatus === 'PLACED' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'ACCEPTED')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      >
                        Accept Order
                      </button>
                    )}

                    {order.orderStatus === 'ACCEPTED' && (
                      <>
                        {/* Assign Store Rider Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningOrder(order);
                            setRiderName(order.deliveryBoyName || 'Manoj');
                            setRiderPhone(order.deliveryBoyPhone || '9845012345');
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Rider</span>
                        </button>

                        {/* Ship via Shiprocket Button */}
                        <button
                          type="button"
                          disabled={shippingShiprocketId === order.id}
                          onClick={() => handleShipViaShiprocket(order.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-sm flex items-center gap-1"
                        >
                          <Package className="w-3 h-3" />
                          <span>{shippingShiprocketId === order.id ? 'Shipping...' : 'Shiprocket'}</span>
                        </button>
                      </>
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

      {/* Assign Store Rider Modal */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-extrabold text-slate-900 text-base">Assign Store Delivery Rider</h4>
              </div>
              <button onClick={() => setAssigningOrder(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Assign order <span className="font-bold text-slate-800">{assigningOrder.orderNumber}</span> to your local rider. We will generate a WhatsApp dispatch message with the customer address, Google Maps link, and cash collection instructions.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rider Name
                </label>
                <input
                  type="text"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  placeholder="e.g. Manoj / Ramesh"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rider WhatsApp Phone Number
                </label>
                <input
                  type="text"
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  placeholder="e.g. 9845012345"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dispatchingRider || !riderName.trim()}
                onClick={handleDispatchStoreRider}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dispatchingRider ? 'Dispatching...' : 'Dispatch & Send WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
