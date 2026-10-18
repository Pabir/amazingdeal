import React, { useEffect, useState } from 'react';
import { Product, StoreInfo } from '../types';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Share2,
  Check,
  Truck,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  store: StoreInfo | null;
  onViewCart?: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  store,
  onViewCart,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const isOutOfStock = product.status === 'OUT_OF_STOCK';
  const hasDiscount =
    product.comparePrice && product.comparePrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.comparePrice! - product.price) / product.comparePrice!) * 100
      )
    : null;
  const savingsAmount = hasDiscount
    ? (product.comparePrice! - product.price).toFixed(2)
    : null;

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: product.title,
      text: `Check out ${product.title} on ${store?.storeName || 'our store'}!`,
      url: url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to clipboard if cancelled or failed
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello ${store?.storeName || 'Store'}, I have a query about: ${product.title} (₹${product.price})`
  );
  const whatsappUrl = store?.ownerPhone
    ? `https://wa.me/91${store.ownerPhone.replace(/\D/g, '')}?text=${whatsappMessage}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Modal Dialog */}
      <div
        className="w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] sm:max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe/Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Product Visual Area (Left Column on Desktop, Top on Mobile) */}
        <div className="md:w-1/2 bg-slate-50 relative flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-100 min-h-[260px] sm:min-h-[340px]">
          {/* Category Badge */}
          {product.category && (
            <span className="absolute top-4 left-4 inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 shadow-xs border border-slate-200">
              <Tag className="w-3 h-3 text-emerald-600" />
              <span>{product.category}</span>
            </span>
          )}

          {/* Discount Badge */}
          {discountPercent && (
            <span className="absolute top-4 right-4 sm:right-auto sm:left-4 sm:top-12 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-sm">
              {discountPercent}% OFF
            </span>
          )}

          {/* Product Image */}
          <div className="w-full h-56 sm:h-72 flex items-center justify-center overflow-hidden rounded-2xl">
            <img
              src={
                product.imageUrl ||
                'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
              }
              alt={product.title}
              className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Out of Stock Banner */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-red-600 text-white shadow-lg">
                Currently Out of Stock
              </span>
            </div>
          )}

          {/* Store Verification pill */}
          <div className="mt-2 hidden sm:flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Guaranteed Genuine & Fresh</span>
          </div>
        </div>

        {/* Details & Actions Area (Right Column) */}
        <div className="md:w-1/2 flex flex-col justify-between overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Top Row: Store Info & Close Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>{store?.storeName || 'Official Store'}</span>
            </span>

            <button
              onClick={onClose}
              aria-label="Close product details"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Category */}
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {product.title}
            </h1>
            {product.category && (
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Category: {product.category}
              </p>
            )}
          </div>

          {/* Price & Savings */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <div className="flex items-baseline space-x-2.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm font-semibold text-slate-400 line-through">
                  ₹{product.comparePrice!.toFixed(2)}
                </span>
              )}
              {savingsAmount && (
                <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  Save ₹{savingsAmount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Inclusive of all taxes • Fresh stock directly from shop
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Product Description
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed max-h-36 overflow-y-auto pr-1">
              {product.description ? (
                <p className="whitespace-pre-line">{product.description}</p>
              ) : (
                <p className="italic text-slate-400">
                  Carefully sourced, quality-inspected, and delivered directly to your doorstep with guaranteed freshness.
                </p>
              )}
            </div>
          </div>

          {/* Store Highlights & Delivery Guarantee */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
            <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Fast Delivery</p>
                <p className="text-[10px] text-slate-500">
                  Free over ₹{store?.freeDeliveryAbove || 499}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-800">100% Genuine</p>
                <p className="text-[10px] text-slate-500">Local store warranty</p>
              </div>
            </div>
          </div>

          {/* Bottom Actions: Add to Cart / Stepper / Share / WhatsApp */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {/* Cart Button or Stepper */}
            {isOutOfStock ? (
              <div className="w-full py-3 px-4 rounded-xl text-center font-bold text-sm bg-slate-100 text-slate-400 cursor-not-allowed">
                Product Currently Out of Stock
              </div>
            ) : quantityInCart > 0 ? (
              <div className="flex items-center space-x-3">
                {/* Stepper */}
                <div className="flex-1 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 shadow-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        onUpdateQuantity(product.id, quantityInCart - 1)
                      }
                      className="w-8 h-8 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-bold shadow-xs hover:bg-emerald-100 active:scale-95 transition-all"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-emerald-950 px-2 min-w-[28px] text-center">
                      {quantityInCart}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(product.id, quantityInCart + 1)
                      }
                      className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                      Total
                    </span>
                    <span className="text-sm font-black text-emerald-950">
                      ₹{(quantityInCart * product.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* View Cart Button */}
                {onViewCart && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewCart();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md active:scale-95 transition-all whitespace-nowrap"
                  >
                    <span>View Cart</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(product)}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart • ₹{product.price.toFixed(2)}</span>
              </button>
            )}

            {/* Secondary Actions: Share & WhatsApp */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                onClick={handleShare}
                className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold text-emerald-600">
                      Link Copied!
                    </span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="font-semibold">Share Product</span>
                  </>
                )}
              </button>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-emerald-700 hover:text-emerald-800 font-semibold py-1.5 px-3 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ask Store on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
