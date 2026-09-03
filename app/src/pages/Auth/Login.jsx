import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Device } from '@capacitor/device';
import axios from '../../services/axios';
import loginIllustration from '../../assets/image/loginimage.jpg';
import dynedgeLogo from '../../assets/image/dynedgelogo1.png';

export default function Login() {
  const history = useHistory();

  const [loginMode, setLoginMode] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ email: '', password: '' });

  const [pin, setPin] = useState('');
  const [savedUser, setSavedUser] = useState(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    checkHardware();
    const userStr = localStorage.getItem('user');

    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser && (parsedUser.mPinSet === true || parsedUser.isBiometricEnabled === true)) {
          setSavedUser(parsedUser);
          setLoginMode('mpin');
        } else {
          setLoginMode('password');
        }
      } catch (e) {
        setLoginMode('password');
      }
    } else {
      setLoginMode('password');
    }
  }, []);

  const checkHardware = async () => {
    try {
      const result = await NativeBiometric.isAvailable();
      setIsBiometricAvailable(result.isAvailable);
    } catch (err) {
      setIsBiometricAvailable(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    let errors = { email: '', password: '' };
    let hasError = false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/;

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
      hasError = true;
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
      hasError = true;
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
      hasError = true;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      hasError = true;
    }

    setValidationErrors(errors);
    if (hasError) return;

    setLoading(true);
    setError('');

    try {
      const deviceInfo = await Device.getId();
      const payload = {
        email: formData.email,
        password: formData.password,
        loginSource: 'mobile',
        deviceId: deviceInfo.identifier
      };
      
      const res = await axios.post('/auth/login', payload);
      
      const userData = res.data.user;
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(userData));

      if (userData.isFirstLogin === true || !userData.mPinSet) {
        history.push('/set-mpin');
      } else {
        history.push('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinPress = (num) => {
    setError('');
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => verifyMpin(newPin), 200);
      }
    }
  };

  const handlePinDelete = () => {
    setError('');
    setPin(pin.slice(0, -1));
  };

  const verifyMpin = async (currentPin) => {
    setLoading(true);
    try {
      const res = await axios.post('/auth/login-mpin', { 
        email: savedUser.email, 
        mPin: currentPin 
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      history.push('/dashboard');
    } catch (err) {
      setError('Incorrect mPIN. Try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        setError('Biometric hardware not available.');
        return;
      }
      
      await NativeBiometric.verifyIdentity({
        reason: 'Authenticate to login',
        title: 'Login to HRMS',
        subtitle: 'Use your fingerprint or face ID',
        useFallback: true, 
      });

      setLoading(true);
      setError('');
      
      try {
        const res = await axios.post('/auth/login-mpin', { 
          email: savedUser.email, 
          isBiometricLogin: true 
        });
        
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        history.push('/dashboard');
      } catch (apiErr) {
        setError(apiErr.response?.data?.message || 'Biometric login failed on server.');
      } finally {
        setLoading(false);
      }

    } catch (err) {
      console.error('Biometric error:', err);
      if (err.message !== 'Canceled' && err.code !== 10) {
        setError('Biometric verification failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent scrollY={true} className="bg-white">
        <div className="min-h-full bg-white flex flex-col justify-between font-sans">
          
          <div className="px-6 py-8 flex-1 flex flex-col items-center justify-center w-full">
            <div className="w-full flex justify-start mb-4 md:mb-6">
              <img 
                src={dynedgeLogo} 
                alt="Dyn Edge Logo" 
                className="h-11 w-auto object-contain"
              />
            </div>

            <div className="flex justify-center mb-4 md:mb-6">
              <img 
                src={loginIllustration} 
                alt="Login Illustration" 
                className={`${loginMode === 'mpin' ? 'w-28 md:w-40' : 'w-64'} h-auto object-contain transition-all`}
              />
            </div>

            <div className="text-center mb-4 md:mb-6 w-full">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5 md:mb-2">
                {loginMode === 'password' ? 'Welcome Back!' : `Welcome, ${savedUser?.name?.split(' ')[0]}!`}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 px-4">
                {loginMode === 'password' 
                  ? 'Login to your account and manage your work efficiently.' 
                  : 'Enter your 4-digit MPIN to continue'}
              </p>
            </div>

            {loginMode === 'mpin' && (
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

          {loginMode === 'password' ? (
            <div className="px-6 pb-12 w-full">
              <form onSubmit={handleLogin} className="space-y-2 w-full" noValidate>
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => {
                        setFormData({ ...formData, email: e.target.value });
                        if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
                        if (error) setError('');
                      }}
                      className={`w-full pl-12 pr-4 py-4 bg-white border rounded-2xl text-gray-900 text-sm focus:outline-none focus:ring-2 placeholder-gray-400 ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#5B3CD8] focus:border-transparent'}`}
                      placeholder="Email Address"
                    />
                  </div>
                  <div className="min-h-[20px] mt-1 ml-2">
                    {validationErrors.email && <p className="text-red-500 text-xs font-bold">{validationErrors.email}</p>}
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e => {
                        setFormData({ ...formData, password: e.target.value });
                        if (validationErrors.password) setValidationErrors({ ...validationErrors, password: '' });
                        if (error) setError('');
                      }}
                      className={`w-full pl-12 pr-12 py-4 bg-white border rounded-2xl text-gray-900 text-sm focus:outline-none focus:ring-2 placeholder-gray-400 ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#5B3CD8] focus:border-transparent'}`}
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      )}
                    </button>
                  </div>
                  <div className="min-h-[20px] mt-1 ml-2">
                    {validationErrors.password && <p className="text-red-500 text-xs font-bold">{validationErrors.password}</p>}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm font-semibold text-[#5B3CD8]">
                    Forgot Password?
                  </Link>
                </div>

                <div className="min-h-[24px] mt-4 flex items-center justify-center">
                  {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 bg-[#5B3CD8] text-white font-semibold rounded-2xl shadow-lg shadow-[#5B3CD8]/30 active:scale-95 transition-all flex items-center justify-center text-[15px]"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : 'Login'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[#F8F9FE] w-full rounded-t-[40px] pt-6 pb-8 px-6 md:px-8 shadow-[0_-10px_40px_rgb(0,0,0,0.03)] flex flex-col items-center mt-auto">
              
              <div className="w-full flex items-center gap-3 mb-5">
                <div className="h-px bg-[#E2E8F0] flex-1"></div>
                <div className="flex items-center gap-1.5 text-[#5B3CD8]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span className="text-[11px] font-bold tracking-wide">Secure Access</span>
                </div>
                <div className="h-px bg-[#E2E8F0] flex-1"></div>
              </div>

              <div className="w-full max-w-[300px] grid grid-cols-3 gap-3 md:gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button 
                    key={num} 
                    onClick={() => handlePinPress(num.toString())} 
                    disabled={loading} 
                    className="h-[60px] md:h-[64px] bg-white rounded-[20px] shadow-[0_4px_15px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center active:scale-95 transition-transform"
                  >
                    <span className="text-[20px] md:text-[22px] font-bold text-gray-900 leading-none">{num}</span>
                  </button>
                ))}
                
                {savedUser?.isBiometricEnabled && isBiometricAvailable ? (
                  <button 
                    onClick={handleBiometricLogin} 
                    disabled={loading} 
                    className="h-[60px] md:h-[64px] bg-[#EBE6FF] rounded-[20px] flex items-center justify-center active:scale-95 transition-transform text-[#5B3CD8]"
                  >
                    <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
                  </button>
                ) : <div />}
                
                <button 
                  onClick={() => handlePinPress('0')} 
                  disabled={loading} 
                  className="h-[60px] md:h-[64px] bg-white rounded-[20px] shadow-[0_4px_15px_rgb(0,0,0,0.04)] flex items-center justify-center active:scale-95 transition-transform"
                >
                  <span className="text-[20px] md:text-[22px] font-bold text-gray-900 leading-none">0</span>
                </button>
                
                <button 
                  onClick={handlePinDelete} 
                  disabled={loading} 
                  className="h-[60px] md:h-[64px] bg-[#EBE6FF] rounded-[20px] flex items-center justify-center active:scale-95 transition-transform text-[#5B3CD8]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"></path></svg>
                </button>
              </div>

              <button 
                onClick={() => { setLoginMode('password'); setError(''); setPin(''); }}
                className="flex items-center gap-2 text-[#5B3CD8] text-sm font-semibold active:opacity-70 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Login with Password
              </button>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}