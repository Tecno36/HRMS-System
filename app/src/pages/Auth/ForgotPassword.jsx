import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import axios from '../../services/axios';
import forgotPasswordImg from '../../assets/image/forgotPasswordImg.png'; 

export default function ForgotPassword() {
  const history = useHistory();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setLoading(true);
    try {
      // Axios route corrected to match backend
      const response = await axios.post('/auth/forgot-password-otp', { email: formData.email });
      if (response.status === 200) {
        showToast(response.data.message || 'OTP sent successfully', 'success');
        setStep(2);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.otp || !formData.newPassword || !formData.confirmPassword) {
      showToast('Please fill all fields', 'error');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (formData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/auth/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      if (response.status === 200) {
        showToast('Password reset successfully! Please login.', 'success');
        setTimeout(() => history.push('/login'), 2000);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent scrollY={false} className="ion-no-padding">
        <div className="h-full w-full bg-[#F8F9FE] flex flex-col font-sans relative select-none box-border">
          
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

          {/* Professional Gradient Header (Matching Apply Leave) */}
          <div className="relative shrink-0 bg-gradient-to-br from-[#6C4CE0] to-[#5B3CD8] pt-12 pb-14 px-6 overflow-hidden shadow-sm">
            <div className="absolute top-6 right-24 w-1.5 h-1.5 bg-white/60 rounded-full"></div>
            <div className="absolute top-16 right-10 w-1 h-1 bg-white/50 rounded-full"></div>
            <div className="absolute top-24 right-28 w-1 h-1 bg-white/40 rounded-full"></div>

            <div className="relative z-10 flex justify-between items-center">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => history.push('/login')}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                  <h1 className="text-white font-bold text-[22px] tracking-wide leading-tight">
                    {step === 1 ? 'Forgot\nPassword?' : 'Reset\nPassword'}
                  </h1>
                  <p className="text-white/80 text-[11px] font-medium mt-1">
                    {step === 1 ? 'Secure account recovery' : 'Create new credentials'}
                  </p>
                </div>
              </div>
              <div className="shrink-0 drop-shadow-lg">
                <img src={forgotPasswordImg} alt="Security" className="w-20 h-20 object-contain" />
              </div>
            </div>
          </div>

          {/* Overlapping Curved Card */}
          <div className="bg-white rounded-t-[25px] -mt-6 relative z-10 pt-8 px-5 pb-6 flex-1 w-full shadow-[0_-8px_20px_rgba(0,0,0,0.02)] overflow-y-auto">
            
            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="w-full box-border pt-2">
                
                <div className="mb-8 text-center px-4">
                  <div className="w-16 h-16 bg-indigo-50 text-[#5B3CD8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                  </div>
                  <h2 className="text-[16px] font-bold text-gray-900 mb-1">Verify Your Email</h2>
                  <p className="text-[12px] text-gray-500 font-medium leading-relaxed">
                    Please enter the email address associated with your account. We will send you a 6-digit OTP to verify your identity.
                  </p>
                </div>

                <div className="mb-8">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 block ml-1">Email Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                    </div>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-[13px] font-bold text-gray-800 bg-gray-50/50 focus:bg-white focus:border-[#5B3CD8] focus:ring-2 focus:ring-[#5B3CD8]/20 outline-none transition-all box-border placeholder:font-medium placeholder:text-gray-400"
                      placeholder="e.g. employee@company.com"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-[#5B3CD8] text-white font-bold text-[13px] rounded-xl shadow-[0_8px_20px_rgba(91,60,216,0.3)] active:scale-95 transition-transform flex justify-center items-center box-border"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Send OTP Code'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="w-full box-border pt-2 space-y-5">
                
                <div className="bg-[#F4F0FF] rounded-xl p-4 border border-[#E9E4FF] flex flex-col items-center justify-center mb-2">
                  <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">Code sent to</span>
                  <span className="text-[13px] font-bold text-[#5B3CD8]">{formData.email}</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 block ml-1">6-Digit OTP <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <input 
                      type="text" 
                      name="otp"
                      maxLength="6"
                      value={formData.otp}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-[15px] text-gray-900 bg-gray-50/50 focus:bg-white focus:border-[#5B3CD8] focus:ring-2 focus:ring-[#5B3CD8]/20 outline-none transition-all tracking-[0.4em] font-bold text-center box-border placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-400"
                      placeholder="000000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 block ml-1">New Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <input 
                      type="password" 
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-[13px] font-bold text-gray-800 bg-gray-50/50 focus:bg-white focus:border-[#5B3CD8] focus:ring-2 focus:ring-[#5B3CD8]/20 outline-none transition-all box-border placeholder:font-medium placeholder:text-gray-400"
                      placeholder="Enter minimum 6 characters"
                      required
                      minLength="6"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 block ml-1">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-[13px] font-bold text-gray-800 bg-gray-50/50 focus:bg-white focus:border-[#5B3CD8] focus:ring-2 focus:ring-[#5B3CD8]/20 outline-none transition-all box-border placeholder:font-medium placeholder:text-gray-400"
                      placeholder="Re-enter new password"
                      required
                      minLength="6"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 mt-2 bg-[#5B3CD8] text-white font-bold text-[13px] rounded-xl shadow-[0_8px_20px_rgba(91,60,216,0.3)] active:scale-95 transition-transform flex justify-center items-center box-border"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}