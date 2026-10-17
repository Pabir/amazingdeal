import React, { useState } from 'react';
import { CustomerAddress } from '../types';
import { X, MapPin, Plus, Trash2, Home, Briefcase, Check } from 'lucide-react';

interface SavedAddressesModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: CustomerAddress[];
  onSaveAddress: (address: CustomerAddress) => Promise<any>;
  onDeleteAddress: (addressId: string) => Promise<any>;
}

export const SavedAddressesModal: React.FC<SavedAddressesModalProps> = ({
  isOpen,
  onClose,
  addresses,
  onSaveAddress,
  onDeleteAddress,
}) => {
  if (!isOpen) return null;

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim()) return;

    try {
      setSubmitting(true);
      await onSaveAddress({
        label,
        addressLine: addressLine.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        isDefault,
      });
      setShowForm(false);
      setAddressLine('');
      setLandmark('');
      setCity('');
      setPincode('');
    } catch (e: any) {
      alert(`Could not save address: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Saved Addresses</h3>
              <p className="text-xs text-slate-500">Fast 1-click delivery address selection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-emerald-700 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Delivery Address</span>
            </button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Add New Address</span>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['Home', 'Work', 'Other'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLabel(l)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      label === l
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Flat/House No, Building, Street *"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Landmark (e.g. Near Shiv Temple)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Pincode (e.g. 110001)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Set as default delivery address</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                {submitting ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          )}

          {addresses.length === 0 && !showForm ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No addresses saved yet. Add your home or office address for faster checkout.
            </div>
          ) : (
            <div className="space-y-2.5">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start justify-between hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600 mt-0.5">
                      {addr.label === 'Work' ? <Briefcase className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-xs text-slate-900">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug">{addr.addressLine}</p>
                      {addr.landmark && (
                        <p className="text-[11px] text-slate-400">Landmark: {addr.landmark}</p>
                      )}
                    </div>
                  </div>

                  {addr.id && (
                    <button
                      onClick={() => onDeleteAddress(addr.id!)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
