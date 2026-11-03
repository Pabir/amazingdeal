import React, { useState, useEffect } from 'react';
import { SuperadminNavbar, SuperadminTab } from './SuperadminNavbar';
import { SuperadminOverview } from './SuperadminOverview';
import { SuperadminMerchants } from './SuperadminMerchants';
import { SuperadminCustomers } from './SuperadminCustomers';
import { SuperadminOrders } from './SuperadminOrders';
import { SuperadminSubscriptions } from './SuperadminSubscriptions';
import { SuperadminHealth } from './SuperadminHealth';
import { ApiService } from '../../services/api';
import { PlatformStats, SuperadminMerchant, SuperadminProfile } from '../../types';

interface SuperadminDashboardProps {
  onLogout: () => void;
  onImpersonateSuccess: (storeName: string, subdomain: string) => void;
}

export const SuperadminDashboard: React.FC<SuperadminDashboardProps> = ({
  onLogout,
  onImpersonateSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<SuperadminTab>('overview');
  const [profile, setProfile] = useState<SuperadminProfile | null>(ApiService.getSuperadminProfile());
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await ApiService.getPlatformStats();
      setStats(data);
    } catch (err: any) {
      console.warn('Superadmin stats fetch:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleImpersonate = async (merchant: SuperadminMerchant) => {
    const confirmMsg = `Login as Merchant for store "${merchant.storeName}" (${merchant.subdomain})?\n\nYou will be redirected to the store's Merchant Admin panel with a top banner to return anytime.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await ApiService.impersonateMerchant(merchant.id);
      onImpersonateSuccess(res.storeName, res.subdomain);
    } catch (err: any) {
      alert('Impersonation failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Superadmin Top Navbar */}
      <SuperadminNavbar
        profile={profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <SuperadminOverview
            stats={stats}
            onSelectTab={setActiveTab}
            onImpersonate={handleImpersonate}
          />
        )}

        {activeTab === 'merchants' && (
          <SuperadminMerchants
            onImpersonate={handleImpersonate}
          />
        )}

        {activeTab === 'customers' && (
          <SuperadminCustomers />
        )}

        {activeTab === 'orders' && (
          <SuperadminOrders />
        )}

        {activeTab === 'subscriptions' && (
          <SuperadminSubscriptions />
        )}

        {activeTab === 'health' && (
          <SuperadminHealth />
        )}
      </main>

    </div>
  );
};

