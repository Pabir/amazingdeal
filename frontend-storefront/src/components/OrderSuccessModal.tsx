import React from 'react';
import { OrderResponse } from '../types';
import { CheckCircle2, MessageCircle, QrCode, Phone, ArrowRight, ExternalLink } from 'lucide-react';

interface OrderSuccessModalProps {
  order: OrderResponse | null;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const isUpi = order.paymentMethod === 'UPI_ONLINE';
  const cleanPhone = order.customerPhone.replace(/\D/g, '');
  const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Hi! I have placed Order ${order.orderNumber} on your online store for amount ₹${order.totalAmount.toFixed(2)}.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 my-8">
        
        {/* Celebration Header */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            Order Confirmed {order.orderNumber}
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-2">
            Thank you, {order.customerName}!
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Your order has been sent directly to <strong>{order.storeName}</strong>.
          </p>
        </div>

        {/* Dynamic UPI Payment Card if UPI chosen */}
        {isUpi && (
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-200 space-y-3 text-left">
            <div className="flex items-center space-x-2 text-emerald-900">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <h4 className="font-extrabold text-sm">Scan to Pay ₹{order.totalAmount.toFixed(2)}</h4>
            </div>

            {/* QR Code image or fallback SVG generator */}
            <div className="bg-white p-3 rounded-xl border border-emerald-200 flex flex-col items-center justify-center">
              {order.upiQrBase64 ? (
                <img
                  src={order.upiQrBase64}
                  alt="UPI QR Code"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-500 p-2 text-center font-mono">
                  {order.upiUri || 'upi://pay?pa=store@okaxis'}
                </div>
              )}
              <span className="text-[11px] font-mono text-slate-500 mt-2">
                UPI ID: <strong>{order.upiVpa || 'merchant@upi'}</strong>
              </span>
            </div>

            {/* Mobile Direct Pay Button */}
            {order.upiUri && (
              <a
                href={order.upiUri}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5"
              >
                <span>Tap to Pay with Google Pay / PhonePe / Paytm</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Order Details Brief */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 text-left space-y-1.5">
          <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-slate-200">
            <span>Total Payable:</span>
            <span className="text-emerald-600 font-black">₹{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Mode:</span>
            <span className="font-semibold">{order.paymentMethod} ({order.paymentStatus})</span>
          </div>
          <div className="flex justify-between">
            <span>Fulfillment:</span>
            <span className="font-semibold">{order.deliveryType === 'PICKUP' ? 'Store Pickup' : 'Home Delivery'}</span>
          </div>
          {order.deliveryAddress && (
            <p className="text-slate-500 text-[11px] pt-1">
              Deliver to: {order.deliveryAddress}
            </p>
          )}
        </div>

        {/* WhatsApp Notification Button */}
        <div className="pt-2 flex flex-col gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Notify Store on WhatsApp</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
};
