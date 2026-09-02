import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import axios from '../../services/axios';

import passwordVector from '../../assets/image/password.jpg';
import mpinVector from '../../assets/image/mpin.jpg';
import fingerprintVector from '../../assets/image/fingerprint.jpg';
import dynedgeLogo from '../../assets/image/dynedgelogo1.png';

export default function SetMpin() {
  const history = useHistory();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  
  const [step, setStep] = useState(user?.isFirstLogin ? 0 : 1);
  
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkHardware();
  }, []);

  const checkHardware = async () => {
    try {
      const result = await NativeBiometric.isAvailable();
      if (result.isAvailable) setIsBiometricAvailable(true);
    } catch (err) {
      setIsBiometricAvailable(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setError('');
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/auth/setup-password', { newPassword: passwords.newPassword });
      if (response.data.status === 'success') {
        const updatedUser = { ...user, isFirstLogin: false };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setStep(1);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num) => {
    setError('');
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => processPin(newPin), 250);
      }
    }
  };

  const handleDelete = () => {
    setError('');
    setPin(pin.slice(0, -1));
  };

  const processPin = async (currentPin) => {
    if (step === 1) {
      setConfirmPin(currentPin);
      setPin('');
      setStep(2);
    } else if (step === 2) {
      if (currentPin === confirmPin) {
        await saveMpin(currentPin);
      } else {
        setError('PIN does not match. Try again.');
        setPin('');
        setConfirmPin('');
        setStep(1);
      }
    }
  };

  const saveMpin = async (finalPin) => {
    setLoading(true);
    try {
      const response = await axios.post('/auth/set-mpin', { mPin: finalPin });
      if (response.data.status === 'success') {
        const updatedUser = { ...user, mPinSet: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (isBiometricAvailable) {
          setStep(3);
        } else {
          history.push('/login');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set mPIN');
      setPin('');
      setConfirmPin('');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const setupBiometric = async (enable) => {
    setLoading(true);
    setError('');
    try {
      if (enable) {
        await NativeBiometric.verifyIdentity({
          reason: 'Authenticate to enable biometric login',
          title: 'Enable Fingerprint'
        });
        
        await axios.post('/auth/toggle-biometric', { isEnabled: true });
        
        const currentUser = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...currentUser, isBiometricEnabled: true }));
      }
      history.push('/login');
    } catch (err) {
      setError('Biometric scan failed. Try again or Skip.');
    } finally {
      setLoading(false);
    }
  };

  const getStepImage = () => {
    if (step === 0) return passwordVector;
    if (step === 1 || step === 2) return mpinVector;
    return fingerprintVector;
  };

  return (
    <IonPage>
      <IonContent scrollY={false} className="bg-white">
        <div className="h-full bg-white flex flex-col justify-between font-sans">
          
          <div className="px-6 pt-10 flex-1 flex flex-col items-center justify-center w-full">
            
            <div className="w-full flex justify-start mb-6">
              <img 
                src={dynedgeLogo} 
                alt="Dyn Edge Logo" 
                className="h-11 w-auto object-contain"
              />
            </div>

            <div className="flex justify-center mb-6">
              <img 
                src={getStepImage()} 
                alt="Setup Step" 
                className="w-56 md:w-64 h-auto object-contain transition-all duration-300"
              />
            </div>

            <div className="text-center mb-6 w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {step === 0 ? 'Create New Password' : step === 1 ? 'Set New MPIN' : step === 2 ? 'Confirm MPIN' : 'Enable Fingerprint'}
              </h1>
              <p className="text-sm text-gray-500 px-4">
                {step === 0 ? 'Please change your auto-generated password' : step === 1 ? 'Create a 4-digit security PIN for quick access' : step === 2 ? 'Please re-enter your PIN to confirm' : 'Use your fingerprint for faster and secure access'}
              </p>
            </div>

            {step === 0 && (
              <form onSubmit={submitPassword} className="w-full max-w-sm">
                <div className="mb-4">
                  <input
                    type="password"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="New Password"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-4 text-[13px] text-gray-800 bg-gray-50/50 focus:border-[#5B3CD8] focus:ring-1 focus:ring-[#5B3CD8] outline-none"
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm Password"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-4 text-[13px] text-gray-800 bg-gray-50/50 focus:border-[#5B3CD8] focus:ring-1 focus:ring-[#5B3CD8] outline-none"
                  />
                </div>
                <div className="h-6 mb-2">
                  {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#5B3CD8] text-white font-bold rounded-2xl shadow-lg shadow-[#5B3CD8]/30 active:scale-95 transition-transform flex justify-center items-center"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : 'Update Password'}
                </button>
              </form>
            )}

            {(step === 1 || step === 2) && (
              <div className="w-full flex flex-col items-center">
                <div className="flex gap-4 justify-center mb-2">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-[#5B3CD8] shadow-[0_0_8px_#5B3CD860]' : 'border-2 border-[#DCD4FF] bg-transparent'}`} 
                    />
                  ))}
                </div>
                <div className="h-6">
                  {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                </div>
              </div>
            )}
          </div>

          {(step === 1 || step === 2) && (
            <div className="bg-[#F8F9FE] w-full rounded-t-[40px] pt-8 pb-8 px-6 md:px-8 shadow-[0_-10px_40px_rgb(0,0,0,0.03)] flex flex-col items-center mt-auto">
              <div className="w-full max-w-[300px] grid grid-cols-3 gap-3 md:gap-4 mb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} onClick={() => handleKeyPress(num.toString())} disabled={loading} className="h-[60px] md:h-[64px] bg-white rounded-[20px] shadow-[0_4px_15px_rgb(0,0,0,0.04)] flex items-center justify-center text-[22px] font-bold text-gray-900 active:scale-95 transition-transform">
                    {num}
                  </button>
                ))}
                <div />
                <button onClick={() => handleKeyPress('0')} disabled={loading} className="h-[60px] md:h-[64px] bg-white rounded-[20px] shadow-[0_4px_15px_rgb(0,0,0,0.04)] flex items-center justify-center text-[22px] font-bold text-gray-900 active:scale-95 transition-transform">
                  0
                </button>
                <button onClick={handleDelete} disabled={loading} className="h-[60px] md:h-[64px] bg-[#EBE6FF] rounded-[20px] flex items-center justify-center text-[#5B3CD8] active:scale-95 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"></path></svg>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="w-full space-y-4 px-6 pb-12 mt-auto">
              <div className="h-6 text-center mb-2">
                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
              </div>
              <button onClick={() => setupBiometric(true)} disabled={loading} className="w-full py-4 bg-[#5B3CD8] text-white font-bold rounded-2xl shadow-lg shadow-[#5B3CD8]/30 active:scale-95 transition-transform flex justify-center items-center">
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Enable Fingerprint'}
              </button>
              <button onClick={() => setupBiometric(false)} disabled={loading} className="w-full py-4 bg-white text-gray-600 font-bold rounded-2xl border border-gray-200 active:bg-gray-50 transition-colors">
                Skip for now
              </button>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}