import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Monitor, ShieldCheck, Users, BarChart3 } from 'lucide-react';
import axios from '../../services/axios';
import loginImage from '../../assets/web/loginpage.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/auth/login', {
        email,
        password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Something went wrong. Please try again.'
      );
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

          <div className="mt-10">
            <p className="text-indigo-300 text-sm font-semibold mb-2">
              HUMAN RESOURCE MANAGEMENT
            </p>
            <h2 className="text-[40px] xl:text-[44px] font-bold leading-[1.1]">
              Welcome<br />Back!
            </h2>
            <p className="text-gray-300 text-[15px] leading-6 mt-4 max-w-[320px]">
              Sign in to your account and manage your organization efficiently from one powerful HR platform.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center w-full">
          <div className="relative w-full max-w-[450px] flex justify-center items-center">
            <img
              src={loginImage}
              alt="HRMS Illustration"
              className="w-[95%] max-h-[45vh] object-contain drop-shadow-2xl z-10"
            />
            <div className="absolute -left-2 bottom-6 bg-white text-gray-800 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 z-20">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Employees</p>
                <p className="text-sm font-bold">Manage Easily</p>
              </div>
            </div>
            <div className="absolute -right-2 top-6 bg-white text-gray-800 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 z-20">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500">HR Analytics</p>
                <p className="text-sm font-bold">Smart Insights</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-8 flex-shrink-0">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span>Secure & trusted HR management platform</span>
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
              <p className="text-[10px] text-gray-500">
                Human Resource Management System
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-[32px] sm:text-[36px] font-bold text-[#111827] tracking-tight">
              Login to your account
            </h2>
            <p className="text-[15px] text-gray-500 mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
                  required
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-gray-50/50 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-gray-50/50 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Enter your password"
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
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-[15px] font-bold text-white bg-[#4f46d8] hover:bg-[#4338ca] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-70 mt-2"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-xs text-gray-400 font-medium">
                  or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex justify-center items-center py-3.5 px-4 border border-gray-200 rounded-xl bg-white text-[15px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5 mr-3" />
              Sign in with Google
            </button>

            <p className="pt-3 text-center text-[14px] text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 transition">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}