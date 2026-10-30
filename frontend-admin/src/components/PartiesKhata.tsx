import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, Phone, Mail, MapPin, Building2, 
  ArrowUpRight, ArrowDownLeft, Share2, Edit2, Trash2, ShieldCheck, 
  AlertCircle, X, Check, Clock, ChevronDown
} from 'lucide-react';
import { Party, Tenant } from '../types';
import { ApiService } from '../services/api';
import { GST_INDIAN_STATES } from '../data/gstStatesData';

interface PartiesKhataProps {
  tenant: Tenant | null;
  parties: Party[];
  onRefresh: () => void;
}

export const PartiesKhata: React.FC<PartiesKhataProps> = ({ tenant, parties, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    partyName: '',
    companyName: '',
    partyType: 'CUSTOMER' as 'CUSTOMER' | 'SUPPLIER' | 'BOTH',
    phone: '',
    email: '',
    gstin: '',
    pan: '',
    billingAddress: '',
    billingStateCode: '',
    openingBalance: 0,
    openingBalanceType: 'RECEIVABLE' as 'RECEIVABLE' | 'PAYABLE',
    creditLimit: 0,
    creditPeriodDays: 30,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Totals
  const totalReceivables = parties
    .filter(p => p.currentBalance > 0)
    .reduce((sum, p) => sum + p.currentBalance, 0);

  const totalPayables = parties
    .filter(p => p.currentBalance < 0)
    .reduce((sum, p) => sum + Math.abs(p.currentBalance), 0);

  const filteredParties = parties.filter(p => {
    const matchesTab = activeTab === 'ALL' || p.partyType === activeTab || p.partyType === 'BOTH';
    const matchesSearch = 
      p.partyName.toLowerCase().includes(search.toLowerCase()) ||
      (p.companyName && p.companyName.toLowerCase().includes(search.toLowerCase())) ||
      p.phone.includes(search) ||
      (p.gstin && p.gstin.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingParty(null);
    setFormData({
      partyName: '',
      companyName: '',
      partyType: 'CUSTOMER',
      phone: '',
      email: '',
      gstin: '',
      pan: '',
      billingAddress: '',
      billingStateCode: '',
      openingBalance: 0,
      openingBalanceType: 'RECEIVABLE',
      creditLimit: 0,
      creditPeriodDays: 30,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Party) => {
    setEditingParty(p);
    setFormData({
      partyName: p.partyName,
      companyName: p.companyName || '',
      partyType: p.partyType,
      phone: p.phone,
      email: p.email || '',
      gstin: p.gstin || '',
      pan: p.pan || '',
      billingAddress: p.billingAddress || '',
      billingStateCode: p.billingStateCode || '',
      openingBalance: p.openingBalance || 0,
      openingBalanceType: p.openingBalanceType || 'RECEIVABLE',
      creditLimit: p.creditLimit || 0,
      creditPeriodDays: p.creditPeriodDays || 30,
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyName.trim() || !formData.phone.trim()) {
      alert('Name and Phone number are required!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingParty) {
        await ApiService.updateParty(editingParty.id, formData);
      } else {
        await ApiService.createParty(formData);
      }
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      alert('Error saving party: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await ApiService.deleteParty(id);
      onRefresh();
    } catch (err: any) {
      alert('Failed to delete party: ' + err.message);
    }
  };

  // WhatsApp Payment Reminder deep link
  const handleSendReminder = (party: Party) => {
    const cleanPhone = party.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const dueAmount = Math.abs(party.currentBalance);

    const message = `*Payment Reminder from ${tenant?.storeName || 'Store'}*
Dear ${party.partyName},
Greetings! This is a gentle reminder that your current outstanding balance is *₹${dueAmount.toFixed(2)}*.

Kindly clear the pending dues at your convenience.
${tenant?.upiVpa ? `\n*Pay via UPI ID:* ${tenant.upiVpa}` : ''}

Thank you for your continued business!
_${tenant?.storeName || 'AmazingDeal Merchant'}_`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Receivables (Lene Hain) */}
        <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>To Receive (Lene Hain)</span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-950 mt-1">
              ₹{totalReceivables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Customer Udhaar Receivables</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 font-bold">
            ₹
          </div>
        </div>

        {/* Total Payables (Dene Hain) */}
        <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1.5">
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
              <span>To Pay (Dene Hain)</span>
            </div>
            <div className="text-2xl font-black font-mono text-amber-950 mt-1">
              ₹{totalPayables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">Supplier & Vendor Payables</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-600 font-bold">
            ₹
          </div>
        </div>

        {/* Total Parties Count */}
        <div className="p-5 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-indigo-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Total Parties in Khata</span>
            </div>
            <div className="text-2xl font-black text-indigo-950 mt-1">
              {parties.length}
            </div>
            <div className="text-[11px] text-indigo-700 mt-0.5">Active Customers & Suppliers</div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Party</span>
          </button>
        </div>

      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Parties ({parties.length})
          </button>
          <button
            onClick={() => setActiveTab('CUSTOMER')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'CUSTOMER' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customers (Lene Hain)
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIER')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'SUPPLIER' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suppliers (Dene Hain)
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search party by name, phone, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

      </div>

      {/* Parties Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredParties.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 stroke-[1.2] mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No parties found</p>
            <p className="text-xs text-slate-400 mt-1">Add customers or suppliers to manage your business Khata</p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add First Party</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Party Name</th>
                  <th className="p-3.5">Contact & GSTIN</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5 text-right">Balance</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParties.map(p => {
                  const isReceivable = p.currentBalance > 0;
                  const isPayable = p.currentBalance < 0;
                  const isZero = p.currentBalance === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Company */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">{p.partyName}</div>
                        {p.companyName && (
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{p.companyName}</span>
                          </div>
                        )}
                        {p.billingAddress && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{p.billingAddress}</div>
                        )}
                      </td>

                      {/* Contact & GSTIN */}
                      <td className="p-3.5 space-y-0.5">
                        <div className="font-semibold text-slate-800 flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{p.phone}</span>
                        </div>
                        {p.gstin && (
                          <div className="text-[11px] font-mono text-indigo-700 font-bold">
                            GSTIN: {p.gstin}
                          </div>
                        )}
                        {p.email && (
                          <div className="text-[10px] text-slate-500">{p.email}</div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.partyType === 'CUSTOMER' ? 'bg-emerald-100 text-emerald-800' :
                          p.partyType === 'SUPPLIER' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {p.partyType}
                        </span>
                      </td>

                      {/* Current Balance */}
                      <td className="p-3.5 text-right font-mono text-sm font-black">
                        <span className={
                          isReceivable ? 'text-emerald-700' :
                          isPayable ? 'text-amber-700' : 'text-slate-500'
                        }>
                          ₹{Math.abs(p.currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Balance Status Badge */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isReceivable ? 'bg-emerald-100 text-emerald-800' :
                          isPayable ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isReceivable ? 'Lene Hain' : isPayable ? 'Dene Hain' : 'Settled'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isReceivable && (
                            <button
                              onClick={() => handleSendReminder(p)}
                              title="Send WhatsApp Payment Reminder"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200 flex items-center space-x-1"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-semibold hidden sm:inline">WhatsApp</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Party"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(p.id, p.partyName)}
                            title="Delete Party"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Party Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingParty ? 'Edit Party Details' : 'Add New Party to Khata'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Party Type Radio */}
              <div className="flex space-x-4">
                {(['CUSTOMER', 'SUPPLIER', 'BOTH'] as const).map(type => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="radio"
                      name="partyType"
                      value={type}
                      checked={formData.partyType === type}
                      onChange={() => setFormData({ ...formData, partyType: type })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{type === 'CUSTOMER' ? 'Customer (Client)' : type === 'SUPPLIER' ? 'Supplier (Vendor)' : 'Both'}</span>
                  </label>
                ))}
              </div>

              {/* Name & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Party / Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.partyName}
                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Business / Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Traders & Sons"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              {/* GSTIN & State Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">GSTIN (15 Digits)</label>
                  <input
                    type="text"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      const stateCode = val.length >= 2 ? val.substring(0, 2) : formData.billingStateCode;
                      setFormData({ ...formData, gstin: val, billingStateCode: stateCode });
                    }}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">State Code (POS)</label>
                  <div className="relative mt-1">
                    <select
                      value={formData.billingStateCode ? formData.billingStateCode.slice(0, 2) : ''}
                      onChange={(e) => setFormData({ ...formData, billingStateCode: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:bg-white focus:outline-none appearance-none pr-8 cursor-pointer"
                    >
                      <option value="">Select State</option>
                      {GST_INDIAN_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <label className="font-semibold text-slate-700">Billing Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, locality, city, pincode..."
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              {/* Opening Balance (Only for new parties) */}
              {!editingParty && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Opening Balance (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.openingBalance || ''}
                      onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Balance Type</label>
                    <select
                      value={formData.openingBalanceType}
                      onChange={(e) => setFormData({ ...formData, openingBalanceType: e.target.value as any })}
                      className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg font-bold"
                    >
                      <option value="RECEIVABLE">To Receive (Lene Hain)</option>
                      <option value="PAYABLE">To Pay (Dene Hain)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? 'Saving...' : editingParty ? 'Save Changes' : 'Add Party to Khata'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
