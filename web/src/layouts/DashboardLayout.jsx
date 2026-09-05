import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from '../services/axios';
import SearchModal from '../pages/navbar/SearchModal';

export default function DashboardLayout() {
  const [user, setUser] = useState(null);
  const [companyInfo, setCompanyInfo] = useState({ companyName: '', logo: '' });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchData, setSearchData] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setCompanyInfo({ 
        companyName: parsedUser.companyName || 'HRMS', 
        logo: parsedUser.logo || '' 
      });
      
      fetchUserProfile(token);
      fetchCompanySettings(token);
      
      if (parsedUser.role === 'Super Admin') {
        fetchSearchData(token);
      }
    }

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      const res = await axios.get('/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
      }
    } catch (err) {}
  };

  const fetchCompanySettings = async (token) => {
    try {
      const res = await axios.get('/settings', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data) {
        setCompanyInfo({ 
          companyName: res.data.companyName || 'HRMS', 
          logo: res.data.logo || '' 
        });
      }
    } catch (err) {}
  };

  const fetchSearchData = async (token) => {
    try {
      const resEmp = await axios.get('/employee/employee-list', { headers: { Authorization: `Bearer ${token}` } });
      const empData = resEmp.data.map(emp => ({
        name: emp.name,
        module: 'Employees',
        path: '/dashboard/employees'
      }));

      const resHr = await axios.get('/hr/hr-list', { headers: { Authorization: `Bearer ${token}` } });
      const hrData = resHr.data.map(hr => ({
        name: hr.name,
        module: 'HR Management',
        path: '/dashboard/hrs'
      }));

      setSearchData([...empData, ...hrData]);
    } catch (err) {}
  };

  const isActive = (path) => location.pathname === path;
  const isSuperAdmin = user?.role === 'Super Admin';

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
      <aside className="w-[260px] bg-[#0F1940] text-gray-300 flex flex-col h-full hidden lg:flex shrink-0">
        <div className="h-20 flex items-center px-6 gap-3 border-b border-gray-800">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-indigo-400/30">
            {companyInfo.logo ? (
              <img src={companyInfo.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-white text-xl tracking-wider">
                {companyInfo.companyName ? companyInfo.companyName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'HR'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-base tracking-wide truncate">{companyInfo.companyName || 'HRMS'}</h1>
            <p className="text-[10px] text-gray-400 truncate">Enterprise Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/dashboard') ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800/50 hover:text-white'}`}>Dashboard</Link>
          {isSuperAdmin && <Link to="/dashboard/hrs" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/dashboard/hrs') ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800/50 hover:text-white'}`}>HR Management</Link>}
          <Link to="/dashboard/employees" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/dashboard/employees') ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800/50 hover:text-white'}`}>Employees</Link>
          <Link to="/dashboard/attendance" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/dashboard/attendance') ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800/50 hover:text-white'}`}>Attendance</Link>
          <Link to="/dashboard/leaves" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/dashboard/leaves') ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800/50 hover:text-white'}`}>Leave Management</Link>
          <Link to="/dashboard/payslips" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/dashboard/payslips') ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800/50 hover:text-white'}`}>Payroll</Link>
          <Link to="/dashboard/recruitment" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/dashboard/recruitment') ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800/50 hover:text-white'}`}>Recruitment</Link>
          <Link to="/dashboard/performance" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/dashboard/performance') ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800/50 hover:text-white'}`}>Performance</Link>
          {isSuperAdmin && <Link to="/dashboard/reports" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/dashboard/reports') ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800/50 hover:text-white'}`}>Reports</Link>}
          <Link to="/dashboard/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${isActive('/dashboard/settings') ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800/50 hover:text-white'}`}>Settings</Link>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center justify-center flex-1">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 w-full max-w-md pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 hover:border-indigo-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span>Search employees, HRs...</span>
              <div className="ml-auto flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-500">Ctrl</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-500">K</kbd>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </button>
            <Link to="/dashboard/profile" className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold overflow-hidden border border-gray-200 shadow-sm shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</span>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-700">{user?.name || 'Admin'}</p>
                <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wide">{user?.role || 'User'}</p>
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50/50">
          <Outlet />
        </div>
      </main>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} data={searchData} />
    </div>
  );
}