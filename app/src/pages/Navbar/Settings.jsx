import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import axios from '../../services/axios';
import MainLayout from '../../layouts/MainLayout';

export default function Settings() {
  const history = useHistory();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMpinModal, setShowMpinModal] = useState(false);
  
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [mpinData, setMpinData] = useState({ currentMpin: '', newMpin: '' });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(user.isBiometricEnabled || false);

  const handleBiometricToggle = async () => {
    const newValue = !isBiometricEnabled;
    setIsBiometricEnabled(newValue);
    try {
      await axios.post('/auth/toggle-biometric', { isEnabled: newValue });
      const updatedUser = { ...user, isBiometricEnabled: newValue };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      setIsBiometricEnabled(!newValue);
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await axios.post('/auth/change-password', passwordData);
      setMessage({ type: 'success', text: res.data.message });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '' });
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const submitMpinChange = async (e) => {
    e.preventDefault();
    const formattedCurrentMpin = mpinData.currentMpin.replace(/\s/g, '');
    const formattedNewMpin = mpinData.newMpin.replace(/\s/g, '');
    
    if (formattedCurrentMpin.length !== 4 || formattedNewMpin.length !== 4) {
      setMessage({ type: 'error', text: 'Please fill all 4 digits for both mPINs' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await axios.post('/auth/change-mpin', {
        currentMpin: formattedCurrentMpin,
        newMpin: formattedNewMpin
      });
      setMessage({ type: 'success', text: res.data.message });
      setTimeout(() => {
        setShowMpinModal(false);
        setMpinData({ currentMpin: '', newMpin: '' });
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change mPIN' });
    } finally {
      setLoading(false);
    }
  };

  const handleMpinChange = (val, field, index) => {
    const char = val.replace(/\D/g, '').slice(-1);
    let currentStr = (mpinData[field] || '').padEnd(4, ' ').split('');
    currentStr[index] = char || ' ';
    setMpinData({ ...mpinData, [field]: currentStr.join('') });
    
    if (char && index < 3) {
      document.getElementById(`${field}-${index + 1}`)?.focus();
    }
  };

  const handleMpinKey = (e, field, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      let currentStr = (mpinData[field] || '').padEnd(4, ' ').split('');
      
      if (currentStr[index] !== ' ') {
        currentStr[index] = ' ';
        setMpinData({ ...mpinData, [field]: currentStr.join('') });
      } else if (index > 0) {
        document.getElementById(`${field}-${index - 1}`)?.focus();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  return (
    <MainLayout>
      <IonPage>
        <IonContent scrollY={false} className="ion-no-padding">
          <div className="h-full bg-[#F8F9FE] flex flex-col font-sans relative select-none">
            
            <div className="shrink-0 bg-[#5B3CD8] pt-12 pb-14 px-6 rounded-b-[40px] relative overflow-hidden z-10 shadow-sm">
              <div className="absolute top-10 right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="flex items-center justify-between relative z-20">
                <button onClick={() => history.goBack()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                <h1 className="text-white font-semibold text-lg">Settings</h1>
                <div className="w-10"></div>
              </div>

              <div className="flex justify-between items-start mt-6 relative z-20">
                <div className="max-w-[55%]">
                  <p className="text-white text-[13px] leading-relaxed font-medium opacity-90">
                    Manage your account & app preferences
                  </p>
                </div>
                <div className="relative mr-4 -mt-2">
                  <svg className="w-16 h-16 text-white/20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                  </svg>
                  <svg className="w-10 h-10 text-white/30 absolute bottom-[-10px] left-[-15px]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24 relative z-0">
              
              <div className="mb-6">
                <h3 className="text-[14px] font-bold text-gray-900 mb-3 ml-1">Security</h3>
                <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2">
                  
                  <button onClick={() => setShowMpinModal(true)} className="w-full flex items-center gap-4 p-3 active:bg-gray-50 rounded-[18px] transition text-left">
                    <div className="w-11 h-11 rounded-2xl bg-[#F0EDFF] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-gray-900">Change mPIN</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">Update your 4-digit mPIN</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>

                  <div className="h-px bg-gray-50 mx-4 my-1"></div>

                  <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center gap-4 p-3 active:bg-gray-50 rounded-[18px] transition text-left">
                    <div className="w-11 h-11 rounded-2xl bg-[#EEF7FF] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-gray-900">Reset Password</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">Change your account password</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>

                  <div className="h-px bg-gray-50 mx-4 my-1"></div>

                  <div className="w-full flex items-center gap-4 p-3 rounded-[18px] transition">
                    <div className="w-11 h-11 rounded-2xl bg-[#EEF9F4] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-gray-900">Biometric Login</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">Login using fingerprint</p>
                    </div>
                    <button 
                      onClick={handleBiometricToggle}
                      className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${isBiometricEnabled ? 'bg-[#5B3CD8]' : 'bg-gray-200'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform transform ${isBiometricEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-[14px] font-bold text-gray-900 mb-3 ml-1">Support</h3>
                <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2">
                  
                  <Link to="/help" className="flex items-center gap-4 p-3 active:bg-gray-50 rounded-[18px] transition text-left">
                    <div className="w-11 h-11 rounded-2xl bg-[#FFF5EB] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-gray-900">Help & Support</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">Get help and contact support</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </Link>

                  <div className="h-px bg-gray-50 mx-4 my-1"></div>

                  <div className="flex items-center gap-4 p-3 active:bg-gray-50 rounded-[18px] transition text-left">
                    <div className="w-11 h-11 rounded-2xl bg-[#F0EDFF] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-gray-900">About HRMS App</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">Version 1.0.0</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </div>

                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-[14px] font-bold text-gray-900 mb-3 ml-1">Account</h3>
                <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-2">
                  <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3 active:bg-red-50 rounded-[18px] transition text-left">
                    <div className="w-11 h-11 rounded-2xl bg-[#FFF0F0] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-red-500">Log Out</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">Logout from your account</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>

            </div>

            {(showPasswordModal || showMpinModal) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-5">
                <div className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl animate-fade-in-up">
                  
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">
                      {showPasswordModal ? 'Change Password' : 'Change mPIN'}
                    </h3>
                    <button onClick={() => {setShowPasswordModal(false); setShowMpinModal(false); setMessage({type: '', text: ''});}} className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {message.text && (
                    <div className={`p-3 rounded-xl mb-4 text-[12px] font-bold text-center ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                      {message.text}
                    </div>
                  )}

                  {showPasswordModal && (
                    <form onSubmit={submitPasswordChange} className="space-y-4">
                      <div className="relative w-full">
                        <input
                          type="password"
                          id="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="peer w-full px-4 pt-5 pb-2 border-2 border-gray-100 bg-gray-50 text-gray-900 text-[13px] font-medium rounded-2xl focus:outline-none focus:border-[#5B3CD8] focus:bg-white placeholder-transparent transition-all"
                          placeholder="Current Password"
                          required
                        />
                        <label
                          htmlFor="currentPassword"
                          className="absolute left-4 top-1.5 text-[10px] font-bold text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[13px] peer-placeholder-shown:font-medium peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-[#5B3CD8] cursor-text"
                        >
                          Current Password
                        </label>
                      </div>
                      
                      <div className="relative w-full">
                        <input
                          type="password"
                          id="newPassword"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="peer w-full px-4 pt-5 pb-2 border-2 border-gray-100 bg-gray-50 text-gray-900 text-[13px] font-medium rounded-2xl focus:outline-none focus:border-[#5B3CD8] focus:bg-white placeholder-transparent transition-all"
                          placeholder="New Password"
                          required
                          minLength={6}
                        />
                        <label
                          htmlFor="newPassword"
                          className="absolute left-4 top-1.5 text-[10px] font-bold text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[13px] peer-placeholder-shown:font-medium peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-[#5B3CD8] cursor-text"
                        >
                          New Password
                        </label>
                      </div>

                      <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-[#5B3CD8] text-white text-[13px] font-bold rounded-2xl shadow-lg shadow-[#5B3CD8]/30 active:scale-95 transition-transform flex justify-center items-center">
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  )}

                  {showMpinModal && (
                    <form onSubmit={submitMpinChange}>
                      <div className="mb-6">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Current mPIN</label>
                        <div className="flex justify-between gap-3">
                          {[0, 1, 2, 3].map((i) => (
                            <input
                              key={`current-${i}`}
                              id={`currentMpin-${i}`}
                              type="password"
                              inputMode="numeric"
                              maxLength={1}
                              value={(mpinData.currentMpin || '').padEnd(4, ' ')[i].trim()}
                              onChange={(e) => handleMpinChange(e.target.value, 'currentMpin', i)}
                              onKeyDown={(e) => handleMpinKey(e, 'currentMpin', i)}
                              className="w-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-[14px] text-center text-xl font-bold text-gray-900 focus:bg-white focus:border-[#5B3CD8] focus:ring-2 focus:ring-[#5B3CD8]/20 outline-none transition-all"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">New mPIN</label>
                        <div className="flex justify-between gap-3">
                          {[0, 1, 2, 3].map((i) => (
                            <input
                              key={`new-${i}`}
                              id={`newMpin-${i}`}
                              type="password"
                              inputMode="numeric"
                              maxLength={1}
                              value={(mpinData.newMpin || '').padEnd(4, ' ')[i].trim()}
                              onChange={(e) => handleMpinChange(e.target.value, 'newMpin', i)}
                              onKeyDown={(e) => handleMpinKey(e, 'newMpin', i)}
                              className="w-12 h-12 bg-gray-50 border-2 border-gray-100 rounded-[14px] text-center text-xl font-bold text-gray-900 focus:bg-white focus:border-[#5B3CD8] focus:ring-2 focus:ring-[#5B3CD8]/20 outline-none transition-all"
                            />
                          ))}
                        </div>
                      </div>

                      <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-[#5B3CD8] text-white text-[13px] font-bold rounded-2xl shadow-lg shadow-[#5B3CD8]/30 active:scale-95 transition-transform flex justify-center items-center">
                        {loading ? 'Updating...' : 'Update mPIN'}
                      </button>
                    </form>
                  )}
                  
                </div>
              </div>
            )}
          </div>
        </IonContent>
      </IonPage>
    </MainLayout>
  );
}