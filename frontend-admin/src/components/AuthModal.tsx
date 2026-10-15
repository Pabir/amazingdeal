import React, { useState } from 'react';
import { Store, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { ApiService } from '../services/api';
import { AuthResponse } from '../types';

interface AuthModalProps {
  onSuccess: (auth: AuthResponse) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [storeName, setStoreName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeCategory, setStoreCategory] = useState('Groceries');
  const [upiVpa, setUpiVpa] = useState('');

  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
    setSubdomain(slug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'REGISTER') {
        const res = await ApiService.registerStore({
          storeName,
          subdomain,
          ownerPhone,
          ownerEmail,
          password,
          storeCategory,
          upiVpa: upiVpa || `${subdomain}@upi`,
        });
        ApiService.setAuth(res);
        onSuccess(res);
      } else {
        const res = await ApiService.login({
          email: ownerEmail,
          password,
        });
        ApiService.setAuth(res);
        onSuccess(res);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-3xl font-black text-white tracking-tight">
          AmazingDeal Merchant
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Hyperlocal e-commerce platform for offline businesses
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">
          
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              onClick={() => { setMode('LOGIN'); setError(null); }}
              className={`w-1/2 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('REGISTER'); setError(null); }}
              className={`w-1/2 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Register New Store
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Store / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    placeholder="e.g. Sharma Kirana Store"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subdomain Claim *
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                    <input
                      type="text"
                      required
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="sharmakirana"
                      className="w-full px-3.5 py-2.5 text-sm focus:outline-none font-mono"
                    />
                    <span className="px-3 bg-slate-50 text-slate-500 text-xs font-bold whitespace-nowrap border-l border-slate-200 py-3">
                      .amazingdeal.co.in
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Store Category
                  </label>
                  <select
                    value={storeCategory}
                    onChange={(e) => setStoreCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="Groceries">Groceries & Kirana</option>
                    <option value="Apparel & Fashion">Apparel & Fashion</option>
                    <option value="Sweets & Bakery">Sweets, Snacks & Bakery</option>
                    <option value="Hardware & Electricals">Hardware & Electricals</option>
                    <option value="Stationery & Books">Stationery & Books</option>
                    <option value="Pharmacy">Medicines & Healthcare</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Merchant Phone (10 digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    UPI VPA (Direct Bank QR Payments)
                  </label>
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="e.g. sharma@okaxis (optional, defaults to subdomain@upi)"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Owner Email *
              </label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="merchant@example.com"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : mode === 'REGISTER' ? 'Launch My Online Store' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                const demoAuth: AuthResponse = {
                  token: 'demo-token-123',
                  tokenType: 'Bearer',
                  tenantId: 'd3b07384-d113-40f4-8a1a-4d23253b2d1d',
                  storeName: 'Sharma General Store',
                  subdomain: 'sharma',
                  storefrontUrl: 'https://sharma.amazingdeal.co.in',
                  ownerEmail: 'sharma@amazingdeal.co.in',
                  ownerPhone: '9876543210',
                  upiVpa: 'sharma@okaxis',
                };
                ApiService.setAuth(demoAuth);
                onSuccess(demoAuth);
              }}
              className="text-xs text-slate-500 hover:text-emerald-600 font-semibold inline-flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Explore Instant Demo Store Dashboard</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
