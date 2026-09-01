import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, Monitor, ShieldCheck, Building2, Briefcase } from 'lucide-react';
import axios from '../../services/axios';
import registerImage from '../../assets/web/registerpage.png';

export default function Register() {
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return setError('Please enter a valid email address');
    }

    if (formData.phone.length !== 10) {
      return setError('Phone number must be exactly 10 digits');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (!agreed) {
      return setError('Please agree to the Terms & Conditions');
    }

    setLoading(true);

    try {
      await axios.post('/auth/register', {
        companyName: formData.companyName,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'Super Admin', 
      });

      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white font-sans flex overflow-hidden">
      
      <div className="hidden lg:flex lg:w-[40%] bg-[#eef2ff] text-indigo-950 relative flex-col justify-between h-full overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-indigo-200/40" />
        <div className="absolute -bottom-40 -right-32 w-[500px] h-[500px] rounded-full bg-purple-200/40" />

        <div className="absolute top-24 right-20 w-2 h-2 rounded-full bg-indigo-400 opacity-60" />
        <div className="absolute top-36 right-32 w-3 h-3 rounded-full bg-purple-400 opacity-40" />
        <div className="absolute bottom-40 left-16 w-2 h-2 rounded-full bg-blue-400 opacity-60" />

        <div className="relative z-10 px-10 pt-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <Monitor className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide text-indigo-950">HRMS</h1>
              <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                Human Resource Management System
              </p>
            </div>
          </div>

          <div className="mt-10 max-w-[430px]">
            <p className="text-indigo-600 text-sm font-bold mb-2 tracking-wide">
              FOR COMPANIES & ADMINS
            </p>
            <h2 className="text-[40px] xl:text-[44px] font-bold leading-[1.1] text-indigo-950">
              Register your<br />Company
            </h2>
            <p className="text-gray-600 text-[15px] leading-6 mt-4 max-w-[320px]">
              Set up your organization on HRMS. Create HR departments, add employees, and manage everything from one platform.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center w-full mt-4">
          <div className="relative w-full max-w-[450px] flex justify-center items-center">
            <img
              src={registerImage}
              alt="HRMS Registration"
              className="w-[95%] max-h-[42vh] object-contain drop-shadow-2xl z-10"
            />

            <div className="absolute -left-2 bottom-6 bg-white text-gray-800 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 z-20">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-medium">Step 1</p>
                <p className="text-sm font-bold">Register Company</p>
              </div>
            </div>

            <div className="absolute -right-2 top-6 bg-white text-gray-800 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 z-20">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-medium">Step 2</p>
                <p className="text-sm font-bold">Add HR & Employees</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-8 flex-shrink-0">
          <div className="flex items-center gap-2 text-indigo-800/60 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>Secure & trusted enterprise platform</span>
          </div>
        </div>
      </div>

      <div className="lg:w-[60%] w-full h-full flex items-center justify-center bg-white px-6 sm:px-10 overflow-y-auto">
        <div className="w-full max-w-[620px] py-10">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-indigo-950">HRMS</h1>
              <p className="text-[10px] text-gray-500 font-medium">
                Human Resource Management System
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-[30px] sm:text-[34px] font-bold text-[#111827] tracking-tight">
              Register Company
            </h2>
            <p className="text-[15px] text-gray-500 mt-2">
              Fill in the details below to register your organization (Super Admin)
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-gray-50/50 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Admin Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-gray-50/50 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-gray-50/50 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (/^[0-9]+$/.test(val) && val.length <= 10)) {
                        handleChange(e);
                      }
                    }}
                    required
                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-gray-50/50 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Enter phone number"
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
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="block w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-gray-50/50 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Create password"
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

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="block w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium bg-gray-50/50 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Confirm password"
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
            </div>

            <div className="flex items-start pt-2">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="terms" className="ml-2.5 text-sm text-gray-500 cursor-pointer leading-6">
                I agree to the <a href="#" className="text-indigo-600 font-semibold hover:text-indigo-700 transition">Terms & Conditions</a> and <a href="#" className="text-indigo-600 font-semibold hover:text-indigo-700 transition">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 rounded-xl text-[15px] font-bold text-white bg-[#4f46d8] hover:bg-[#4338ca] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-3"
            >
              {loading ? 'Registering Company...' : 'Register Company'}
            </button>

            <p className="pt-4 text-center text-[14px] text-gray-500 font-medium">
              Already have a company account?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 transition">
                Login
              </Link>
            </p>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 font-medium">
              © {new Date().getFullYear()} HRMS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}