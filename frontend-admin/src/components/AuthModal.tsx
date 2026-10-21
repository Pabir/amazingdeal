import React, { useState } from 'react';
import { Store, ArrowRight, Sparkles, ExternalLink, Lock, Mail } from 'lucide-react';
import { ApiService } from '../services/api';
import { AuthResponse } from '../types';

interface AuthModalProps {
  onSuccess: (auth: AuthResponse) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State (Merchant Sign In)
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await ApiService.login({
        email: ownerEmail.trim().toLowerCase(),
        password,
      });
      ApiService.setAuth(res);
      onSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      
      {/* Branding Header */}
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
          
          {/* Sign In Header */}
          <div className="mb-6 text-center">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Merchant Sign In
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with your registered merchant account to access your store operations dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Owner Email *</span>
              </label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="merchant@example.com"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Password *</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Option A: Dedicated New Merchant Registration Callout */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 border border-emerald-500/20 rounded-2xl p-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                  <Store className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Don't have a store yet?</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      New
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Choose a zero-commission subscription plan (Monthly, Quarterly, or Yearly) and launch your storefront in under 2 minutes.
                  </p>
                </div>
              </div>

              <a
                href="https://amazingdeal.co.in#pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3.5 w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all group"
              >
                <span>Choose a Plan & Register on amazingdeal.co.in</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Quick Demo Access */}
          <div className="mt-4 pt-3 text-center">
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
              className="text-xs text-slate-500 hover:text-emerald-600 font-semibold inline-flex items-center space-x-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-50 transition-colors"
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
