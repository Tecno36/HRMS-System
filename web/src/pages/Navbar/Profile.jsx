import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/axios';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', phone: '', avatar: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const res = await axios.get(`/auth/profile`);
        
        const userData = res.data?.data || res.data || storedUser;
        
        setUser(userData);
        setProfileData({
          name: userData.name || '',
          phone: userData.phone || '',
          avatar: userData.avatar || ''
        });
      } catch (err) {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          setUser(storedUser);
          setProfileData({ name: storedUser.name || '', phone: storedUser.phone || '', avatar: storedUser.avatar || '' });
        }
      }
    };
    fetchProfile();
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

  const handleProfileChange = (e) => {
    const value = e.target.name === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
    setProfileData({ ...profileData, [e.target.name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    try {
      await axios.put('/auth/update-profile', profileData);
      
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('All password fields are required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setPassLoading(true);
    try {
      await axios.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 relative">
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

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-500/30 overflow-hidden">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
              Change
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user.name}</h1>
            <p className="text-gray-500 font-medium mt-1 flex items-center justify-center md:justify-start gap-2">
              <span className="inline-flex px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold tracking-wide">
                {user.role}
              </span>
              {user.department && (
                <span className="inline-flex px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold tracking-wide">
                  {user.department}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-100 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Log Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-black text-gray-900 mb-6">Personal Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Profile Picture Upload</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange}
                className="w-full file-input file-input-bordered bg-gray-50/50 rounded-xl text-sm font-medium text-gray-900 cursor-pointer" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Full Name</label>
              <input 
                type="text" 
                name="name" 
                value={profileData.name} 
                onChange={handleProfileChange} 
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Email Address (Read-only)</label>
              <input 
                type="email" 
                value={user.email} 
                readOnly 
                className="w-full px-4 py-3 bg-gray-100/80 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Phone Number</label>
              <input 
                type="text" 
                name="phone" 
                value={profileData.phone} 
                onChange={handleProfileChange} 
                placeholder="10-digit mobile number"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all" 
              />
            </div>
            <div className="pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 text-sm font-bold text-white bg-[#101a3d] hover:bg-indigo-600 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-black text-gray-900 mb-6">Security & Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Current Password</label>
              <input 
                type="password" 
                name="currentPassword" 
                value={passwordData.currentPassword} 
                onChange={handlePasswordChange} 
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">New Password</label>
              <input 
                type="password" 
                name="newPassword" 
                value={passwordData.newPassword} 
                onChange={handlePasswordChange} 
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Confirm New Password</label>
              <input 
                type="password" 
                name="confirmPassword" 
                value={passwordData.confirmPassword} 
                onChange={handlePasswordChange} 
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all" 
              />
            </div>
            <div className="pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={passLoading} 
                className="w-full py-3.5 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {passLoading ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}