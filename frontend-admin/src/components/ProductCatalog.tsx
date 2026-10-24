import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Search, Check, AlertCircle, Trash2, Edit3, Image as ImageIcon, Sparkles, RotateCw, Zap, Tag, ChevronDown } from 'lucide-react';
import { ApiService } from '../services/api';
import { AiProductScannerModal } from './AiProductScannerModal';
import { CatalogItemSuggestion, getItemsForCategories, searchCatalogSuggestions, MASTER_STORE_CATEGORIES } from '../data/categoriesData';

interface ProductCatalogProps {
  products: Product[];
  onRefresh: () => void;
  storeCategory?: string;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ products, onRefresh, storeCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [imageUrl, setImageUrl] = useState('');
  const [inventoryQuantity, setInventoryQuantity] = useState('50');

  // Smart Catalog & Autocomplete State
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [quickCategoryFilter, setQuickCategoryFilter] = useState('ALL');

  // Pre-load items matching the merchant's store verticals
  const storeItemPool = getItemsForCategories(storeCategory);
  const matchingTitleSuggestions = searchCatalogSuggestions(title, storeCategory);

  const handleSelectSuggestedItem = (item: CatalogItemSuggestion) => {
    setTitle(item.title);
    setCategory(item.category);
    setPrice(item.price.toString());
    setComparePrice(item.comparePrice ? item.comparePrice.toString() : '');
    setDescription(item.description);
    setImageUrl(item.imageUrl);
    setShowTitleSuggestions(false);
  };

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean) as string[])
  );

  const filtered = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleToggleStock = async (product: Product) => {
    try {
      const newStatus = product.status === 'ACTIVE' ? 'OUT_OF_STOCK' : 'ACTIVE';
      await ApiService.toggleStock(product.id, newStatus);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to update stock: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await ApiService.deleteProduct(id);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      alert('Title and Price are required');
      return;
    }

    try {
      setLoading(true);
      await ApiService.createProduct({
        title,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
        category,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
        inventoryQuantity: parseInt(inventoryQuantity) || 100,
        tracksInventory: true,
        status: 'ACTIVE',
      });

      // Reset
      setTitle('');
      setDescription('');
      setPrice('');
      setComparePrice('');
      setImageUrl('');
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to create product: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by title..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 hover:from-slate-800 hover:to-slate-800 text-white border border-emerald-500/30 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/10 transition-all group"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span>AI Magic Scan (Photo)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No products found</h3>
          <p className="text-xs text-slate-500 mt-1">Click "Add New Product" to stock your store catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const inStock = product.status === 'ACTIVE';
            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col ${
                  inStock ? 'border-slate-200 shadow-sm' : 'border-amber-200 bg-amber-50/20 opacity-80'
                }`}
              >
                {/* Product Image */}
                <div className="h-44 bg-slate-100 relative overflow-hidden group">
                  <img
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.category && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
                      {product.category}
                    </span>
                  )}
                  {product.imagesJson && (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-950/85 backdrop-blur-sm text-emerald-400 flex items-center space-x-1 shadow-sm border border-emerald-500/20">
                      <RotateCw className="w-2.5 h-2.5 text-emerald-400" />
                      <span>360° Studio</span>
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(product.id)}
                    title="Delete product"
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-600 backdrop-blur-sm shadow-sm transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{product.title}</h4>
                    {product.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                    )}
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="text-lg font-black text-slate-900">₹{product.price.toFixed(2)}</span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{product.comparePrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock Toggle Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Qty: <span className="font-bold text-slate-800">{product.inventoryQuantity}</span>
                    </span>

                    <button
                      onClick={() => handleToggleStock(product)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        inStock
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                      }`}
                    >
                      {inStock ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>In Stock</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Out of Stock</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Add Product to Catalog</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick from standard items below or type to search our instant catalog bank.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Pick Popular Items for Store Category */}
            <div className="p-3 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-xl border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span>Popular Quick-Pick Items ({storeCategory || 'All Verticals'}):</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Click to 1-tap fill</span>
              </div>

              {/* Horizontal Scroll Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
                {storeItemPool.slice(0, 10).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestedItem(item)}
                    className="shrink-0 text-left px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200/80 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 transition-all text-xs shadow-xs group"
                  >
                    <div className="font-semibold truncate max-w-[170px] group-hover:text-emerald-700">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <span className="font-bold text-emerald-600">₹{item.price}</span>
                      <span>•</span>
                      <span className="truncate">{item.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              
              {/* Product Title with Smart Instant Autocomplete */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Product Title *
                  </label>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-suggests from catalog</span>
                  </span>
                </div>

                <input
                  type="text"
                  required
                  value={title}
                  onFocus={() => setShowTitleSuggestions(true)}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setShowTitleSuggestions(true);
                  }}
                  placeholder="Type item name (e.g. Atta, Milk, T-Shirt, Earbuds, Oil)..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />

                {/* Autocomplete Dropdown Popover */}
                {showTitleSuggestions && matchingTitleSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 flex items-center justify-between">
                      <span>Matching Standard Catalog Items:</span>
                      <button
                        type="button"
                        onClick={() => setShowTitleSuggestions(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ✕ Close
                      </button>
                    </div>
                    {matchingTitleSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestedItem(item)}
                        className="w-full p-2.5 text-left hover:bg-emerald-50/80 transition-colors flex items-center gap-3"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-extrabold text-emerald-600">₹{item.price}</span>
                            {item.comparePrice && (
                              <span className="line-through text-slate-400 text-[10px]">
                                ₹{item.comparePrice}
                              </span>
                            )}
                            <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded font-medium">
                              {item.category}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 shrink-0">
                          Fill ➔
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="275.00"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    MRP / Compare Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    placeholder="290.00"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Dairy, Grains, Apparel, Tech..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {/* Category Quick Chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Grains & Flours', 'Cooking Oils', 'Dairy & Milk', 'Beverages', 'Instant Food', 'Men Fashion', 'Audio & Tech'].map((catChip) => (
                      <button
                        key={catChip}
                        type="button"
                        onClick={() => setCategory(catChip)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          category === catChip
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {catChip}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    value={inventoryQuantity}
                    onChange={(e) => setInventoryQuantity(e.target.value)}
                    placeholder="50"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Image URL (Cloudflare R2 or Web link)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or R2 bucket URL"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief specifications or weight details"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Product Scanner Modal (Powered by ChatGPT Vision) */}
      <AiProductScannerModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onProductCreated={onRefresh}
        categories={categories}
      />

    </div>
  );
};
