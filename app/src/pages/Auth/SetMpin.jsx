import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import axios from '../../services/axios';

export default function SetMpin() {
  const history = useHistory();
  const [step, setStep] = useState(1);
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
      if (result.isAvailable) {
        setIsBiometricAvailable(true);
      }
    } catch (err) {
      setIsBiometricAvailable(false);
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
        const user = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...user, mPinSet: true }));
        if (isBiometricAvailable) {
          setStep(3);
        } else {
          history.push('/dashboard');
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
    try {
      if (enable) {
        const verified = await NativeBiometric.verifyIdentity({
          reason: 'Authenticate to enable biometric login',
          title: 'Enable Fingerprint'
        });
        if (verified) {
          await axios.post('/auth/toggle-biometric', { isEnabled: true });
          const user = JSON.parse(localStorage.getItem('user'));
          localStorage.setItem('user', JSON.stringify({ ...user, isBiometricEnabled: true }));
        }
      }
      history.push('/dashboard');
    } catch (err) {
      history.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent scrollY={false} className="bg-white">
        <div className="h-full bg-white flex flex-col justify-between items-center py-12 px-6 select-none font-sans">
          
          <div className="flex flex-col items-center w-full mt-10">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[#5B3CD8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              {step === 1 ? 'Set New mPIN' : step === 2 ? 'Confirm mPIN' : 'Enable Fingerprint'}
            </h1>
            
            <p className="text-sm text-gray-500 mb-8 text-center px-4">
              {step === 1 ? 'Create a 4-digit security PIN for quick access' : step === 2 ? 'Please re-enter your PIN to confirm' : 'Use your fingerprint for faster and secure access'}
            </p>

            {step < 3 && (
              <>
                <div className="flex gap-5 justify-center mb-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-[#5B3CD8] scale-110' : 'bg-gray-200'}`} />
                  ))}
                </div>
                <div className="h-6">
                  {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                </div>
              </>
            )}

            {step === 3 && (
              <div className="flex justify-center my-8">
                <svg className="w-24 h-24 text-[#5B3CD8] drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
              </div>
            )}
          </div>

          {step < 3 ? (
            <div className="w-full max-w-[280px] grid grid-cols-3 gap-y-6 gap-x-8 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handleKeyPress(num.toString())} disabled={loading} className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-medium text-gray-800 active:bg-gray-100 transition-colors mx-auto">
                  {num}
                </button>
              ))}
              <div />
              <button onClick={() => handleKeyPress('0')} disabled={loading} className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-medium text-gray-800 active:bg-gray-100 transition-colors mx-auto">
                0
              </button>
              <button onClick={handleDelete} disabled={loading} className="w-16 h-16 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-100 transition-colors mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"></path></svg>
              </button>
            </div>
          ) : (
            <div className="w-full space-y-4 px-2">
              <button onClick={() => setupBiometric(true)} disabled={loading} className="w-full py-4 bg-[#5B3CD8] text-white font-bold rounded-2xl shadow-lg shadow-[#5B3CD8]/30 active:scale-95 transition-transform flex justify-center items-center">
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Enable Fingerprint'
                )}
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