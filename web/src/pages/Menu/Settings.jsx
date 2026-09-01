import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from '../../services/axios';

export default function Settings() {
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    contactEmail: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    financialYear: '2026-2027',
    logo: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setFormData({
          companyName: res.data.companyName || '',
          address: res.data.address || '',
          contactEmail: res.data.contactEmail || '',
          currency: res.data.currency || 'INR',
          timezone: res.data.timezone || 'Asia/Kolkata',
          financialYear: res.data.financialYear || '2026-2027',
          logo: res.data.logo || ''
        });
      }
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put('/settings', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Settings updated successfully!');
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-gray-900 font-bold">Loading settings...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 relative">
      
      {/* Toast Notification using createPortal */}
      {(success || error) && createPortal(
        <div className="fixed top-6 right-6 z-[99999] transition-all duration-300 shadow-2xl animate-[slideLeft_0.3s_ease-out]">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-md border ${
            success 
              ? 'bg-emerald-500/95 border-emerald-500 text-white shadow-emerald-500/20' 
              : 'bg-red-500/95 border-red-500 text-white shadow-red-500/20'
          }`}>
            {success ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            )}
            <p className="text-sm font-bold tracking-wide">{success || error}</p>
          </div>
        </div>,
        document.body
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Company Settings</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Manage your company profile, logo and core configurations.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm">
              {formData.logo ? (
                <img src={formData.logo} alt="Company Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-gray-400">No Logo</span>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase mb-2">Company Logo</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleLogoChange}
                className="file-input file-input-bordered file-input-sm w-full max-w-xs bg-gray-50 rounded-xl text-gray-900 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase mb-2">Company Name (Fixed)</label>
            <input 
              type="text" 
              value={formData.companyName} 
              disabled
              className="input input-bordered w-full bg-gray-100 border-gray-200 rounded-xl font-bold text-gray-500 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase mb-2">Contact Email</label>
            <input 
              type="email" 
              name="contactEmail" 
              value={formData.contactEmail} 
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 border-gray-200 rounded-xl font-bold text-gray-900 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase mb-2">Currency</label>
              <select 
                name="currency" 
                value={formData.currency} 
                onChange={handleChange}
                className="select select-bordered w-full bg-gray-50 border-gray-200 rounded-xl font-bold text-gray-900 text-sm"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase mb-2">Financial Year</label>
              <select 
                name="financialYear" 
                value={formData.financialYear} 
                onChange={handleChange}
                className="select select-bordered w-full bg-gray-50 border-gray-200 rounded-xl font-bold text-gray-900 text-sm"
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase mb-2">Timezone</label>
            <select 
              name="timezone" 
              value={formData.timezone} 
              onChange={handleChange}
              className="select select-bordered w-full bg-gray-50 border-gray-200 rounded-xl font-bold text-gray-900 text-sm"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase mb-2">Address</label>
            <textarea 
              name="address" 
              value={formData.address} 
              onChange={handleChange}
              rows="3"
              className="textarea textarea-bordered w-full bg-gray-50 border-gray-200 rounded-xl font-bold text-gray-900 text-sm"
            />
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}