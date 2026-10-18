import React from 'react';
import { Product } from '../types';
import { Plus, Minus, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onProductClick?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  onProductClick,
}) => {
  const isOutOfStock = product.status === 'OUT_OF_STOCK';
  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  return (
    <div
      onClick={() => onProductClick?.(product)}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300/80 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onProductClick?.(product);
        }
      }}
    >
      
      {/* Product Image Area */}
      <div className="h-44 sm:h-48 bg-slate-100 relative overflow-hidden">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {product.category && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 backdrop-blur-sm text-slate-700 shadow-xs">
            {product.category}
          </span>
        )}

        {discountPercent && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500 text-white shadow-xs">
            {discountPercent}% OFF
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-md">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info & Add to Cart */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {product.title}
          </h3>
          {product.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base sm:text-lg font-black text-slate-900">
                ₹{product.price.toFixed(2)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.comparePrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Stepper or Add button with e.stopPropagation() */}
          {quantityInCart > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-1"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(product.id, quantityInCart - 1);
                }}
                aria-label="Decrease quantity"
                className="w-6 h-6 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-bold shadow-xs hover:bg-emerald-100 active:scale-95 transition-transform"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black text-emerald-900 px-1">
                {quantityInCart}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(product.id, quantityInCart + 1);
                }}
                aria-label="Increase quantity"
                className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs hover:bg-emerald-700 active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              disabled={isOutOfStock}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-emerald-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
