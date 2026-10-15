import React from 'react';
import { StoreInfo } from '../types';
import { Store, ShoppingBag, Clock, MapPin, ShieldCheck, Truck } from 'lucide-react';

interface StoreHeaderProps {
  store: StoreInfo | null;
  totalCartItems: number;
  onOpenCart: () => void;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  store,
  totalCartItems,
  onOpenCart,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      
      {/* Top Delivery Announcement Banner */}
      <div className="bg-slate-900 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center space-x-2">
        <Truck className="w-3.5 h-3.5 text-emerald-400" />
        <span>
          {store?.freeDeliveryAbove && store.freeDeliveryAbove > 0
            ? `FREE Local Delivery on orders above ₹${store.freeDeliveryAbove}!`
            : 'Fast hyperlocal delivery from your neighborhood store!'}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Store Info */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 flex-shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {store?.storeName || 'AmazingDeal Store'}
                </h1>
                <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Verified Merchant</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-slate-500">
                {store?.storeAddress && (
                  <span className="inline-flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{store.storeAddress}</span>
                  </span>
                )}
                {store?.storeTimings && (
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{store.storeTimings}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">My Cart</span>
            {totalCartItems > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white text-emerald-800 text-xs font-black shadow-sm">
                {totalCartItems}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
};
