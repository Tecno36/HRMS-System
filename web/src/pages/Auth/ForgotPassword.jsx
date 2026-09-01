import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Monitor, ShieldCheck, ArrowLeft, KeyRound, CheckCircle2, Lock, Eye, EyeOff, Hash, X } from 'lucide-react';
import axios from '../../services/axios';
import forgotImage from '../../assets/web/forgotpassword.png';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (emailSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [emailSent, timer]);

  useEffect(() => {
    if (error || message) {
      const timerOut = setTimeout(() => {
        setError('');
        setMessage('');
      }, 5000);
      return () => clearTimeout(timerOut);
    }
  }, [error, message]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);

    let score = 0;
    if (val.length > 5) score += 20;
    if (val.length > 8) score += 20;
    if (/[A-Z]/.test(val)) score += 20;
    if (/[0-9]/.test(val)) score += 20;
    if (/[^A-Za-z0-9]/.test(val)) score += 20;
    
    setPasswordStrength(Math.min(score, 100));
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 40) return 'bg-red-500';
    if (passwordStrength <= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 40) return 'Weak';
    if (passwordStrength <= 80) return 'Good';
    return 'Strong';
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      return setError('Please enter your email address');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError('Please enter a valid email address');
    }

    setLoading(true);
    try {
      await axios.post('/auth/forgot-password-otp', { email });
      setMessage('OTP has been sent to your email successfully.');
      setEmailSent(true);
      setTimer(300);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.message || 'User not found with this email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndProceed = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      return setError('Please enter the complete 6-digit OTP');
    }

    setLoading(true);
    try {
      setStep(2);
      setMessage('OTP verified successfully. Please set your new password.');
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (passwordStrength < 60) {
      return setError('Please choose a stronger password');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const enteredOtp = otp.join('');
      await axios.post('/auth/reset-password', { email, otp: enteredOtp, newPassword: password });
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white font-sans flex overflow-hidden">
      
      <div className="hidden lg:flex lg:w-[40%] bg-[#101a3d] text-white relative flex-col justify-between h-full overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-indigo-500/10" />
        <div className="absolute -bottom-40 -right-32 w-[500px] h-[500px] rounded-full bg-purple-500/10" />
        <div className="absolute top-24 right-20 w-2 h-2 rounded-full bg-indigo-400 opacity-60" />
        <div className="absolute top-36 right-32 w-3 h-3 rounded-full bg-purple-400 opacity-40" />
        <div className="absolute bottom-40 left-16 w-2 h-2 rounded-full bg-blue-400 opacity-60" />

        <div className="relative z-10 px-10 pt-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-xl">
              <Monitor className="w-7 h-7 text-[#101a3d]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide">HRMS</h1>
              <p className="text-[11px] text-gray-300 mt-0.5">
                Human Resource Management System
              </p>
            </div>
          </div>

          <div className="mt-10 max-w-[410px]">
            <p className="text-indigo-300 text-sm font-semibold mb-2 tracking-wide">
              {step === 1 ? 'ACCOUNT RECOVERY' : 'SECURE RESET'}
            </p>
            <h2 className="text-[40px] xl:text-[44px] font-bold leading-[1.1]">
              {step === 1 ? (
                <>Forgot your<br />Password?</>
              ) : (
                <>Create New<br />Password</>
              )}
            </h2>
            <p className="text-gray-300 text-[15px] leading-6 mt-4 max-w-[320px]">
              {step === 1 
                ? "Don't worry! Enter your email address to receive a secure OTP code."
                : "Choose a strong new password to secure your company account."}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center w-full mt-4">
          <div className="relative w-full max-w-[450px] flex justify-center items-center">
            <img
              src={forgotImage}
              alt="Forgot Password Illustration"
              className="w-[90%] max-h-[40vh] object-contain drop-shadow-2xl z-10"
            />
            <div className="absolute -left-2 bottom-6 bg-white text-gray-800 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 z-20">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-medium">Security</p>
                <p className="text-sm font-bold">2-Step Verification</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-8 flex-shrink-0">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span>Secure & trusted enterprise platform</span>
          </div>
        </div>
      </div>

      <div className="lg:w-[60%] w-full h-full flex items-center justify-center bg-white px-6 sm:px-10 overflow-y-auto">
        <div className="w-full max-w-[450px] py-10">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-[#101a3d] flex items-center justify-center">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#101a3d]">HRMS</h1>
              <p className="text-[10px] text-gray-500 font-medium">
                Human Resource Management System
              </p>
            </div>
          </div>

          <div className="mb-8">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors mb-6">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
            
            <h2 className="text-[32px] sm:text-[36px] font-bold text-[#111827] tracking-tight">
              {step === 1 ? 'Reset Password' : 'Set New Password'}
            </h2>
            <p className="text-[15px] text-gray-500 mt-2 leading-relaxed">
              {step === 1 
                ? "Enter your email to receive verification code." 
                : "Enter your strong new password below."}
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-700">
                <X size={16} />
              </button>
            </div>
          )}

          {message && (
            <div className="mb-6 px-4 py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>{message}</span>
              </div>
              <button onClick={() => setMessage('')} className="text-emerald-400 hover:text-emerald-700">
                <X size={16} />
              </button>
            </div>
          )}

          {step === 1 && !emailSent && (
            <form onSubmit={handleSendOTP} noValidate className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-gray-50/50 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="Enter your registered email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 rounded-xl text-[15px] font-bold text-white bg-[#4f46d8] hover:bg-[#4338ca] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 1 && emailSent && (
            <form onSubmit={handleVerifyAndProceed} noValidate className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <div className="flex justify-center gap-3">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={data}
                      ref={(el) => (inputRefs.current[index] = el)}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-12 h-12 text-center text-lg font-bold border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="text-center mt-4">
                  {timer > 0 ? (
                    <p className="text-xs text-gray-500 font-medium">
                      OTP expires in <span className="font-bold text-indigo-600">{formatTime(timer)}</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 rounded-xl text-[15px] font-bold text-white bg-[#4f46d8] hover:bg-[#4338ca] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} noValidate className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    New Password
                  </label>
                  <span className={`text-[11px] font-bold ${getStrengthColor().replace('bg-', 'text-')}`}>
                    {getStrengthText()}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    className="block w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-gray-50/50 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-700 transition" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-700 transition" />
                    )}
                  </button>
                </div>
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 rounded-full ${getStrengthColor()}`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CheckCircle2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-gray-50/50 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-700 transition" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-700 transition" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 rounded-xl text-[15px] font-bold text-white bg-[#4f46d8] hover:bg-[#4338ca] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-12 text-center">
            <p className="text-xs text-gray-400 font-medium">
              © {new Date().getFullYear()} HRMS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}