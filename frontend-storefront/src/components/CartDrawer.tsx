import React from 'react';
import { CartItem, StoreInfo, Product } from '../types';
import { X, Plus, Minus, ShoppingBag, ArrowRight, Truck, Lock } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  store: StoreInfo | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onCheckout: () => void;
  customer?: any;
  onOpenAuth?: () => void;
  onProductClick?: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  store,
  onUpdateQuantity,
  onCheckout,
  customer,
  onOpenAuth,
  onProductClick,
}) => {
  if (!isOpen) return null;

  const freeDeliveryThreshold = store?.freeDeliveryAbove || 499;
  const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : store?.deliveryCharge || 30;
  const grandTotal = subtotal + deliveryFee;
  const diffForFree = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-slate-900 text-base">Your Cart ({items.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Bar */}
        {subtotal > 0 && (
          <div className="px-5 py-3 bg-emerald-50/60 border-b border-emerald-100 text-xs">
            {diffForFree > 0 ? (
              <p className="text-emerald-800 font-semibold mb-1.5 flex items-center space-x-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Add <strong>₹{diffForFree.toFixed(0)}</strong> more to unlock <strong>FREE Delivery</strong>!</span>
              </p>
            ) : (
              <p className="text-emerald-800 font-extrabold mb-1.5 flex items-center space-x-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Congratulations! You qualify for FREE Delivery!</span>
              </p>
            )}
            <div className="w-full h-1.5 rounded-full bg-emerald-200 overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-800 font-bold text-base">Your cart is empty</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Add fresh groceries and local products from the store catalog to place an order.
              </p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 space-x-3"
              >
                <div
                  onClick={() => {
                    onClose();
                    onProductClick?.(product);
                  }}
                  className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group"
                >
                  <img
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                    alt={product.title}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0 group-hover:opacity-85 transition-opacity"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                      {product.title}
                    </h4>
                    <span className="text-xs font-black text-slate-700">₹{product.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1">
                  <button
                    onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                    className="w-5 h-5 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-black text-slate-900 px-1">{quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                    className="w-5 h-5 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer with Checkout CTA */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-bold text-slate-900">
                  {deliveryFee === 0 ? <span className="text-emerald-600 font-extrabold uppercase">Free</span> : `₹${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Grand Total</span>
                <span className="text-emerald-600">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {!customer && onOpenAuth && (
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-amber-900 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Login required to place order</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs"
                >
                  Sign In
                </button>
              </div>
            )}

            <button
              onClick={() => {
                if (!customer) {
                  onOpenAuth?.();
                } else {
                  onCheckout();
                }
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
            >
              {!customer ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Place Order (₹{grandTotal.toFixed(2)})</span>
                </>
              ) : (
                <>
                  <span>Proceed to Checkout (₹{grandTotal.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
