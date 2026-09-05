import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from '../../services/axios';
import empEmptyImg from '../../assets/web/empempty1.jpg';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [hrsList, setHrsList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', dob: '', gender: 'Male', department: '', designation: '', assignedHR: '', salary: '', bankName: '', accountNumber: '', ifscCode: '', panNumber: '' });
  const [editData, setEditData] = useState({ id: '', name: '', email: '', phone: '', dob: '', gender: 'Male', department: '', designation: '', assignedHR: '', salary: '', bankName: '', accountNumber: '', ifscCode: '', panNumber: '' });
  const [deleteId, setDeleteId] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      setCurrentUser(user);

      const resEmp = await axios.get('/employee/employee-list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(resEmp.data);

      if (user?.role === 'Super Admin') {
        const resHR = await axios.get('/hr/hr-list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHrsList(resHR.data);
      }
    } catch (err) {
      setError('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.userId?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const handleChange = (e, isEdit = false) => {
    const value = e.target.name === 'phone' || e.target.name === 'salary' ? e.target.value.replace(/\D/g, '') : e.target.value;
    
    if (isEdit) {
      const updatedEditData = { ...editData, [e.target.name]: value };
      if (e.target.name === 'assignedHR' && currentUser?.role === 'Super Admin') {
        const selectedHR = hrsList.find(hr => hr._id === value);
        if (selectedHR) {
          updatedEditData.department = selectedHR.department;
        }
      }
      setEditData(updatedEditData);
    } else {
      const updatedFormData = { ...formData, [e.target.name]: value };
      if (e.target.name === 'assignedHR' && currentUser?.role === 'Super Admin') {
        const selectedHR = hrsList.find(hr => hr._id === value);
        if (selectedHR) {
          updatedFormData.department = selectedHR.department;
        }
      }
      setFormData(updatedFormData);
    }

    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const validateForm = (data, isEdit = false) => {
    const errors = {};
    if (!data.name.trim()) errors.name = 'Full Name is required';
    
    if (!isEdit) {
      if (!data.email.trim()) {
        errors.email = 'Email Address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Enter a valid email address';
      }
    }
    
    if (data.phone && data.phone.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
    if (currentUser?.role === 'Super Admin' && !data.assignedHR) {
      errors.assignedHR = 'Please select an HR';
    }
    if (!data.department) errors.department = 'Department is required';
    if (!data.designation) errors.designation = 'Designation is required';
    if (!data.salary) errors.salary = 'Salary is required';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!validateForm(formData, false)) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('/employee/create-employee', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Employee successfully added! Credentials sent to email.');
      setFormData({ name: '', email: '', phone: '', dob: '', gender: 'Male', department: '', designation: '', assignedHR: '', salary: '', bankName: '', accountNumber: '', ifscCode: '', panNumber: '' });
      setFieldErrors({});
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (emp) => {
    setEditData({ 
      id: emp._id, 
      name: emp.name || '', 
      email: emp.userId?.email || '', 
      phone: emp.phone || '', 
      dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
      gender: emp.gender || 'Male',
      department: emp.department || '', 
      designation: emp.designation || '',
      assignedHR: emp.assignedHR?._id || '',
      salary: emp.salary || '',
      bankName: emp.bankName || '',
      accountNumber: emp.accountNumber || '',
      ifscCode: emp.ifscCode || '',
      panNumber: emp.panNumber || ''
    });
    setFieldErrors({});
    setShowEditModal(true);
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    if (!validateForm(editData, true)) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/employee/update-employee/${editData.id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Employee details updated successfully.');
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/employee/delete-employee/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Employee removed successfully.');
      setShowDeleteDialog(false);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 relative">
      
      {(success || error) && createPortal(
        <div className="fixed top-6 right-6 z-[99999] transition-all duration-300 shadow-2xl animate-[slideLeft_0.3s_ease-out]">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-md border ${
            success 
              ? 'bg-emerald-500/95 border-emerald-500 text-white shadow-emerald-500/20' 
              : 'bg-red-500/95 border-red-500 text-white shadow-red-500/20'
          }`}>
            {success ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            )}
            <p className="text-sm font-bold tracking-wide">{success || error}</p>
          </div>
        </div>,
        document.body
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Employee Management</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Manage company employees and workforce records.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search employees..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-gray-400"
            />
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto group flex items-center justify-center gap-2 px-6 py-3 bg-[#101a3d] hover:bg-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/20 transition-all duration-300 active:scale-95 whitespace-nowrap"
          >
            <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Add New Employee
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-5 rounded-tl-3xl">Employee</th>
                <th className="px-6 py-5">Contact Info</th>
                <th className="px-6 py-5">Work Details</th>
                <th className="px-6 py-5">Managed By (HR)</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-center rounded-tr-3xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {currentEmployees.length > 0 ? (
                currentEmployees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 shadow-sm group-hover:scale-105 transition-transform">
                          {emp.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{emp.name}</p>
                          <p className="text-xs font-bold text-gray-400 mt-0.5">{emp.employeeId || 'Pending ID'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-gray-700 font-medium flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"/></svg>
                          {emp.userId?.email || 'N/A'}
                        </p>
                        <p className="text-gray-500 text-xs font-medium flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                          {emp.phone || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-flex px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-[11px] font-bold tracking-wide">
                          {emp.department || 'N/A'}
                        </span>
                        <p className="text-gray-700 text-xs font-medium ml-1 mt-1">
                          {emp.designation || 'Employee'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {emp.assignedHR?.name || 'Direct / Super Admin'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {emp.userId?.isActive ? (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-sm font-bold text-emerald-600">Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <span className="text-sm font-bold text-red-600">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => openEditModal(emp)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button 
                          onClick={() => { setDeleteId(emp._id); setShowDeleteDialog(true); }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-2 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img src={empEmptyImg} alt="No Employees Found" className="w-72 h-72 object-contain" />
                      {searchTerm && (
                        <p className="text-gray-500 font-bold mt-4">No Employees found for "{searchTerm}"</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm font-medium text-gray-500">
              Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to <span className="font-bold text-gray-900">{Math.min(startIndex + itemsPerPage, filteredEmployees.length)}</span> of <span className="font-bold text-gray-900">{filteredEmployees.length}</span> entries
            </span>

            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Previous
              </button>
              
              <div className="flex items-center px-4 py-2.5 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl shadow-sm">
                Page {currentPage} of {totalPages}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {(showModal || showEditModal) && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => !loading && (showModal ? setShowModal(false) : setShowEditModal(false))}
          ></div>

          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-[2rem] shadow-2xl border border-white overflow-hidden transform transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex-shrink-0 p-8 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    {showEditModal ? 'Edit Employee Profile' : 'Add New Employee'}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    {showEditModal ? 'Update the details for this employee.' : 'Enter employee personal, work, and bank details.'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setShowEditModal(false);
                    setFieldErrors({});
                  }} 
                  disabled={loading}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-8 relative z-10">
              <form onSubmit={showEditModal ? handleEditEmployee : handleAddEmployee} noValidate className="space-y-6">
                
                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={showEditModal ? editData.name : formData.name} 
                      onChange={(e) => handleChange(e, showEditModal)} 
                      className={`w-full px-4 py-3.5 bg-gray-50/50 border rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all placeholder:text-gray-400 ${fieldErrors.name ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200 focus:ring-indigo-500/10 focus:border-indigo-500'}`} 
                      placeholder="John Doe" 
                    />
                    {fieldErrors.name && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={showEditModal ? editData.email : formData.email} 
                      onChange={(e) => handleChange(e, showEditModal)} 
                      disabled={showEditModal}
                      className={`w-full px-4 py-3.5 bg-gray-50/50 border rounded-2xl text-sm font-medium focus:outline-none transition-all placeholder:text-gray-400 ${showEditModal ? 'text-gray-500 cursor-not-allowed border-gray-200' : fieldErrors.email ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500 text-gray-900' : 'border-gray-200 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-gray-900'}`} 
                      placeholder="employee@company.com" 
                    />
                    {fieldErrors.email && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Phone Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input 
                      type="text" 
                      name="phone" 
                      value={showEditModal ? editData.phone : formData.phone} 
                      onChange={(e) => handleChange(e, showEditModal)} 
                      className={`w-full px-4 py-3.5 bg-gray-50/50 border rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all placeholder:text-gray-400 ${fieldErrors.phone ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200 focus:ring-indigo-500/10 focus:border-indigo-500'}`} 
                      placeholder="10-digit mobile number" 
                    />
                    {fieldErrors.phone && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Date of Birth</label>
                    <input 
                      type="date" 
                      name="dob" 
                      value={showEditModal ? editData.dob : formData.dob} 
                      onChange={(e) => handleChange(e, showEditModal)} 
                      className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Gender</label>
                    <select 
                      name="gender" 
                      value={showEditModal ? editData.gender : formData.gender} 
                      onChange={(e) => handleChange(e, showEditModal)} 
                      className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 pt-4 border-t border-gray-100">Work Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {currentUser?.role === 'Super Admin' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Assign to HR</label>
                      <select 
                        name="assignedHR" 
                        value={showEditModal ? editData.assignedHR : formData.assignedHR} 
                        onChange={(e) => handleChange(e, showEditModal)} 
                        className={`w-full px-4 py-3.5 bg-gray-50/50 border rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all cursor-pointer ${fieldErrors.assignedHR ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200 focus:ring-indigo-500/10 focus:border-indigo-500'}`}
                      >
                        <option value="" disabled>Select HR Administrator</option>
                        {hrsList.map((hr) => (
                          <option key={hr._id} value={hr._id}>{hr.name} ({hr.department})</option>
                        ))}
                      </select>
                      {fieldErrors.assignedHR && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.assignedHR}</p>}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Department</label>
                    <input 
                      type="text" 
                      name="department" 
                      value={currentUser?.role === 'Super Admin' ? (showEditModal ? editData.department : formData.department) : (currentUser?.department || '')} 
                      readOnly 
                      className="w-full px-4 py-3.5 bg-gray-100/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 cursor-not-allowed" 
                      placeholder={currentUser?.role === 'Super Admin' ? "Auto-selected from HR" : "Department"} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Designation</label>
                    <input 
                      type="text" 
                      name="designation" 
                      value={showEditModal ? editData.designation : formData.designation} 
                      onChange={(e) => handleChange(e, showEditModal)} 
                      className={`w-full px-4 py-3.5 bg-gray-50/50 border rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all placeholder:text-gray-400 ${fieldErrors.designation ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200 focus:ring-indigo-500/10 focus:border-indigo-500'}`} 
                      placeholder="e.g. Frontend Developer" 
                    />
                    {fieldErrors.designation && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.designation}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Basic Salary</label>
                    <input 
                      type="text" 
                      name="salary" 
                      value={showEditModal ? editData.salary : formData.salary} 
                      onChange={(e) => handleChange(e, showEditModal)} 
                      className={`w-full px-4 py-3.5 bg-gray-50/50 border rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all placeholder:text-gray-400 ${fieldErrors.salary ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200 focus:ring-indigo-500/10 focus:border-indigo-500'}`} 
                      placeholder="e.g. 25000" 
                    />
                    {fieldErrors.salary && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.salary}</p>}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 pt-4 border-t border-gray-100">Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Bank Name</label>
                    <input 
                      type="text" 
                      name="bankName" 
                      value={showEditModal ? editData.bankName : formData.bankName} 
                      onChange={(e) => handleChange(e, showEditModal)} 
                      className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all placeholder:text-gray-400 focus:ring-indigo-500/10 focus:border-indigo-500" 
                      placeholder="e.g. State Bank of India" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Account Number</label>
                    <input 
                      type="text" 
                      name="accountNumber" 
                      value={showEditModal ? editData.accountNumber : formData.accountNumber} 
                      onChange={(e) => handleChange(e, showEditModal)} 
                      className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all placeholder:text-gray-400 focus:ring-indigo-500/10 focus:border-indigo-500" 
                      placeholder="Enter Account Number" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">IFSC Code</label>
                    <input 
                      type="text" 
                      name="ifscCode" 
                      value={showEditModal ? editData.ifscCode : formData.ifscCode} 
                      onChange={(e) => handleChange(e, showEditModal)} 
                      className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all placeholder:text-gray-400 focus:ring-indigo-500/10 focus:border-indigo-500 uppercase" 
                      placeholder="e.g. SBIN0001234" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">PAN Number</label>
                    <input 
                      type="text" 
                      name="panNumber" 
                      value={showEditModal ? editData.panNumber : formData.panNumber} 
                      onChange={(e) => handleChange(e, showEditModal)} 
                      className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all placeholder:text-gray-400 focus:ring-indigo-500/10 focus:border-indigo-500 uppercase" 
                      placeholder="e.g. ABCDE1234F" 
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="flex-shrink-0 flex items-center justify-end gap-4 p-6 border-t border-gray-100 bg-gray-50/80">
              <button 
                type="button" 
                onClick={() => {
                  setShowModal(false);
                  setShowEditModal(false);
                  setFieldErrors({});
                }} 
                disabled={loading}
                className="px-6 py-3.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 shadow-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={showEditModal ? handleEditEmployee : handleAddEmployee}
                disabled={loading} 
                className="relative px-8 py-3.5 text-sm font-bold text-white bg-[#101a3d] hover:bg-indigo-600 rounded-xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {showEditModal ? 'Save Changes' : 'Create Employee'}
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {showDeleteDialog && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => !loading && setShowDeleteDialog(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 transform transition-all text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Employee?</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              This action will revoke access for this employee.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowDeleteDialog(false)}
                disabled={loading}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95 min-w-[120px] disabled:opacity-70"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}