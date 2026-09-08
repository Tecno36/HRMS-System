import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import axios from '../../services/axios';
import MainLayout from '../../layouts/MainLayout';
import settingsImg from '../../assets/image/settings-3d.png'; 

export default function Settings() {
  const history = useHistory();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMpinModal, setShowMpinModal] = useState(false);
  
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [mpinData, setMpinData] = useState({ currentMpin: '', newMpin: '' });
  
  const [loading, setLoading] = useState(false);
  const [toast, setShowToastState] = useState({ show: false, message: '', type: '' });
  
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(user.isBiometricEnabled || false);

  const showToast = (message, type = 'success') => {
    setShowToastState({ show: true, message, type });
    setTimeout(() => setShowToastState({ show: false, message: '', type: '' }), 3000);
  };

  const handleBiometricToggle = async () => {
    const newValue = !isBiometricEnabled;
    setIsBiometricEnabled(newValue);
    try {
      await axios.post('/auth/toggle-biometric', { isEnabled: newValue });
      const updatedUser = { ...user, isBiometricEnabled: newValue };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      showToast('Biometric updated successfully', 'success');
    } catch (error) {
      setIsBiometricEnabled(!newValue);
      showToast('Failed to update biometric', 'error');
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await axios.post('/auth/change-password', passwordData);
      showToast(res.data.message || 'Password changed successfully', 'success');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '' });
      }, 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitMpinChange = async (e) => {
    e.preventDefault();
    const formattedCurrentMpin = mpinData.currentMpin.replace(/\s/g, '');
    const formattedNewMpin = mpinData.newMpin.replace(/\s/g, '');
    
    if (formattedCurrentMpin.length !== 4 || formattedNewMpin.length !== 4) {
      showToast('Please fill all 4 digits', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const res = await axios.post('/auth/change-mpin', {
        currentMpin: formattedCurrentMpin,
        newMpin: formattedNewMpin
      });
      showToast(res.data.message || 'mPIN changed successfully', 'success');
      setTimeout(() => {
        setShowMpinModal(false);
        setMpinData({ currentMpin: '', newMpin: '' });
      }, 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change mPIN', 'error');
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
        <IonContent scrollY={true} className="ion-no-padding">
          <div className="min-h-full w-full max-w-full overflow-x-hidden bg-[#F8F9FE] flex flex-col font-sans relative pb-6 select-none box-border">
            
            {/* Custom Toast Notification */}
            {toast.show && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down w-[90%] max-w-sm">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${toast.type === 'success' ? 'bg-white border-green-100 text-green-700' : 'bg-white border-red-100 text-red-700'}`}>
                  {toast.type === 'success' ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </div>
                  )}
                  <p className="font-semibold text-sm mr-2">{toast.message}</p>
                </div>
              </div>
            )}

            {/* Exactly Matching Header from Apply Leave */}
            <div className="relative shrink-0 bg-gradient-to-br from-[#6C4CE0] to-[#5B3CD8] pt-12 pb-14 px-6 overflow-hidden shadow-sm">
              <div className="absolute top-6 right-24 w-1.5 h-1.5 bg-white/60 rounded-full"></div>
              <div className="absolute top-16 right-10 w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="absolute top-24 right-28 w-1 h-1 bg-white/40 rounded-full"></div>

              <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => history.goBack()}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h1 className="text-white font-bold text-[22px] tracking-wide">Settings</h1>
                </div>
                <div className="shrink-0 drop-shadow-lg">
                  {/* Settings 3D Image */}
                  <img src={settingsImg} alt="Settings" className="w-20 h-20 object-contain" />
                </div>
              </div>
            </div>

            {/* Overlapping Body Content */}
            <div className="bg-white rounded-t-[25px] -mt-6 relative z-10 pt-8 px-5 pb-6 flex-1 w-full shadow-[0_-8px_20px_rgba(0,0,0,0.02)]">
              <div className="space-y-6">
                
                {/* Security Settings */}
                <div>
                  <h3 className="text-[14px] font-bold text-gray-800 mb-3 ml-1 px-1 tracking-wide">Security</h3>
                  <div className="bg-white rounded-[24px] shadow-sm border border-gray-100/50 p-2">
                    
                    <button onClick={() => setShowMpinModal(true)} className="w-full flex items-center gap-4 p-3 active:bg-gray-50/80 rounded-[18px] transition text-left">
                      <div className="w-11 h-11 rounded-2xl bg-[#F0EDFF] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-bold text-gray-900">Change mPIN</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Update your 4-digit PIN</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </button>

                    <div className="h-px bg-gray-100 mx-4 my-1"></div>

                    <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center gap-4 p-3 active:bg-gray-50/80 rounded-[18px] transition text-left">
                      <div className="w-11 h-11 rounded-2xl bg-[#EEF7FF] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-bold text-gray-900">Reset Password</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Update account password</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </button>

                    <div className="h-px bg-gray-100 mx-4 my-1"></div>

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
                        className={`w-12 h-7 rounded-full transition-colors duration-300 relative flex items-center px-1 shadow-inner ${isBiometricEnabled ? 'bg-[#5B3CD8]' : 'bg-gray-200'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 transform ${isBiometricEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Support Section */}
                <div>
                  <h3 className="text-[14px] font-bold text-gray-800 mb-3 ml-1 px-1 tracking-wide">Support</h3>
                  <div className="bg-white rounded-[24px] shadow-sm border border-gray-100/50 p-2">
                    
                    <Link to="/help" className="flex items-center gap-4 p-3 active:bg-gray-50/80 rounded-[18px] transition text-left">
                      <div className="w-11 h-11 rounded-2xl bg-[#FFF5EB] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-bold text-gray-900">Help & Support</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Contact HR support</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </Link>

                    <div className="h-px bg-gray-100 mx-4 my-1"></div>

                    <div className="flex items-center gap-4 p-3 rounded-[18px] transition text-left">
                      <div className="w-11 h-11 rounded-2xl bg-[#F0EDFF] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-bold text-gray-900">App Version</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Version 1.0.0</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Account Actions */}
                <div>
                  <h3 className="text-[14px] font-bold text-gray-800 mb-3 ml-1 px-1 tracking-wide">Account</h3>
                  <div className="bg-white rounded-[24px] shadow-sm border border-gray-100/50 p-2">
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3 active:bg-red-50/80 rounded-[18px] transition text-left">
                      <div className="w-11 h-11 rounded-2xl bg-[#FFF0F0] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-bold text-red-500">Log Out</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Sign out from device</p>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Change Password / mPIN Modals */}
            {(showPasswordModal || showMpinModal) && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-5">
                <div className="bg-white w-full max-w-sm rounded-[28px] p-6 shadow-2xl animate-fade-in-up">
                  
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[17px] font-bold text-gray-900 tracking-wide">
                      {showPasswordModal ? 'Change Password' : 'Change mPIN'}
                    </h3>
                    <button onClick={() => {setShowPasswordModal(false); setShowMpinModal(false);}} className="text-gray-400 hover:text-gray-600 bg-gray-100/80 rounded-full p-2 active:scale-95 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {showPasswordModal && (
                    <form onSubmit={submitPasswordChange} className="space-y-4">
                      <div className="relative w-full">
                        <input
                          type="password"
                          id="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="peer w-full px-4 pt-5 pb-2 border-2 border-gray-100 bg-gray-50 text-gray-900 text-[14px] font-bold rounded-2xl focus:outline-none focus:border-[#5B3CD8] focus:bg-white placeholder-transparent transition-all"
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
                          className="peer w-full px-4 pt-5 pb-2 border-2 border-gray-100 bg-gray-50 text-gray-900 text-[14px] font-bold rounded-2xl focus:outline-none focus:border-[#5B3CD8] focus:bg-white placeholder-transparent transition-all"
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

                      <button type="submit" disabled={loading} className="w-full py-4 mt-4 bg-[#5B3CD8] text-white text-[14px] tracking-wide font-bold rounded-[18px] shadow-[0_8px_16px_rgba(91,60,216,0.25)] active:scale-95 transition-transform flex justify-center items-center">
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
                              className="w-12 h-14 bg-gray-50 border-2 border-gray-100 rounded-[16px] text-center text-xl font-bold text-gray-900 focus:bg-white focus:border-[#5B3CD8] outline-none transition-all"
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
                              className="w-12 h-14 bg-gray-50 border-2 border-gray-100 rounded-[16px] text-center text-xl font-bold text-gray-900 focus:bg-white focus:border-[#5B3CD8] outline-none transition-all"
                            />
                          ))}
                        </div>
                      </div>

                      <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-[#5B3CD8] text-white text-[14px] tracking-wide font-bold rounded-[18px] shadow-[0_8px_16px_rgba(91,60,216,0.25)] active:scale-95 transition-transform flex justify-center items-center">
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