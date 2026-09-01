import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from '../../services/axios';
import performanceEmptyImg from '../../assets/web/performanceempty.jpg';

const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs font-bold text-gray-700">{rating}</span>
    </div>
  );
};

export default function Performance() {
  const [performances, setPerformances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const initialForm = {
    employee: '',
    reviewDate: new Date().toISOString().split('T')[0],
    reviewPeriod: 'Monthly',
    ratings: { workQuality: 5, punctuality: 5, teamwork: 5 },
    feedback: '',
    goals: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [editData, setEditData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      setCurrentUser(user);

      const resPerf = await axios.get('/performance/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPerformances(resPerf.data);

      if (user?.role === 'Super Admin' || user?.role === 'HR') {
        const resEmp = await axios.get('/employee/employee-list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(resEmp.data);
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
      const timer = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleRatingChange = (e, isEdit) => {
    const { name, value } = e.target;
    if (isEdit) {
      setEditData(prev => ({ ...prev, ratings: { ...prev.ratings, [name]: Number(value) } }));
    } else {
      setFormData(prev => ({ ...prev, ratings: { ...prev.ratings, [name]: Number(value) } }));
    }
  };

  const handleChange = (e, isEdit) => {
    const { name, value } = e.target;
    if (isEdit) {
      setEditData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setShowEditModal(false);
    setFieldErrors({});
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    const data = showEditModal ? editData : formData;
    const errors = {};
    if (!data.employee && !showEditModal) errors.employee = 'Employee is required';
    
    setFieldErrors(errors);
    if (Object.keys(errors).length === 0) {
      setCurrentStep(2);
    }
  };

  const validateFinalForm = (data) => {
    const errors = {};
    if (!data.feedback.trim()) errors.feedback = 'Feedback is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateFinalForm(formData)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/performance/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Performance review added successfully!');
      closeModal();
      setFormData(initialForm);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add review');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateFinalForm(editData)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/performance/update/${editData._id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Performance review updated successfully!');
      closeModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update review');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/performance/delete/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Performance record deleted.');
      setShowDeleteDialog(false);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (perf) => {
    setEditData({
      ...perf,
      employee: perf.employee?._id,
      reviewDate: new Date(perf.reviewDate).toISOString().split('T')[0]
    });
    setFieldErrors({});
    setCurrentStep(1);
    setShowEditModal(true);
  };

  const isManager = currentUser?.role === 'Super Admin' || currentUser?.role === 'HR';
  const activeData = showEditModal ? editData : formData;

  const filteredPerformances = performances.filter(perf => 
    perf.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perf.employee?.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPerformances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPerformances.length / itemsPerPage);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 relative">
      
      {(success || error) && createPortal(
        <div className="fixed top-6 right-6 z-[99999] transition-all duration-300 shadow-2xl animate-[slideLeft_0.3s_ease-out]">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-md border ${
            success ? 'bg-emerald-500/95 border-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500/95 border-red-500 text-white shadow-red-500/20'
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Performance Reviews</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Track and evaluate employee performance & goals.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          {isManager && (
            <button 
              onClick={() => { setShowModal(true); setCurrentStep(1); }}
              className="group flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto bg-[#101a3d] hover:bg-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/20 transition-all duration-300 active:scale-95"
            >
              <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add Review
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-5 rounded-tl-3xl">Employee</th>
                <th className="px-6 py-5">Review Period</th>
                <th className="px-6 py-5">Overall Rating</th>
                <th className="px-6 py-5">Reviewer</th>
                {isManager && <th className="px-6 py-5 text-center rounded-tr-3xl">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {currentItems.length > 0 ? (
                currentItems.map((perf) => (
                  <tr key={perf._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 shadow-sm group-hover:scale-105 transition-transform">
                          {perf.employee?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{perf.employee?.name}</p>
                          <p className="text-xs font-bold text-gray-400 mt-0.5">{perf.employee?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-flex px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold tracking-wide">
                          {perf.reviewPeriod}
                        </span>
                        <p className="text-gray-500 text-xs font-medium flex items-center gap-2 mt-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          {new Date(perf.reviewDate).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StarRating rating={perf.ratings?.overall || 0} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-700">{perf.reviewer?.name}</p>
                      <p className="text-xs text-gray-400">{perf.reviewer?.role}</p>
                    </td>
                    {isManager && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => openEditModal(perf)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button onClick={() => { setDeleteId(perf._id); setShowDeleteDialog(true); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isManager ? 5 : 4} className="px-2 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img src={performanceEmptyImg} alt="No Reviews Found" className="w-72 h-72 object-contain opacity-80" />
                      <p className="text-gray-400 font-medium text-sm mt-4">No performance reviews found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-100 gap-4">
            <p className="text-sm font-medium text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPerformances.length)} of {filteredPerformances.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="text-sm font-bold text-gray-700 px-3">
                {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {(showModal || showEditModal) && activeData && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => !loading && closeModal()}
          ></div>

          <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-white p-8 overflow-hidden transform transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    {showEditModal ? 'Edit Performance Review' : 'Add New Review'}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    {currentStep === 1 ? 'Step 1: Employee & Ratings' : 'Step 2: Feedback & Goals'}
                  </p>
                </div>
                <button 
                  onClick={closeModal} 
                  disabled={loading}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="flex gap-2 mb-8">
                <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${currentStep >= 1 ? 'bg-indigo-600' : 'bg-gray-100'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-gray-100'}`}></div>
              </div>

              <form onSubmit={showEditModal ? handleEditSubmit : handleAddSubmit} noValidate className="space-y-6">
                
                {currentStep === 1 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {!showEditModal && (
                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 ml-1">Select Employee</label>
                          <div className="relative">
                            <select 
                              name="employee" 
                              value={activeData.employee} 
                              onChange={(e) => handleChange(e, showEditModal)} 
                              className={`w-full appearance-none pl-4 pr-10 py-3.5 bg-gray-50/50 border rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all cursor-pointer ${fieldErrors.employee ? 'border-red-400 focus:ring-red-500/10' : 'border-gray-200 focus:ring-indigo-500/10 focus:border-indigo-500'}`}
                            >
                              <option value="" disabled>Select Employee</option>
                              {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.name} ({emp.department})</option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                            </div>
                          </div>
                          {fieldErrors.employee && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.employee}</p>}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-1">Review Date</label>
                        <input 
                          type="date" 
                          name="reviewDate" 
                          value={activeData.reviewDate} 
                          onChange={(e) => handleChange(e, showEditModal)} 
                          className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all" 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-1">Review Period</label>
                        <div className="relative">
                          <select 
                            name="reviewPeriod" 
                            value={activeData.reviewPeriod} 
                            onChange={(e) => handleChange(e, showEditModal)} 
                            className="w-full appearance-none pl-4 pr-10 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                          >
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Yearly">Yearly</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-gray-50/80 border border-gray-100 rounded-2xl space-y-4">
                      <h4 className="font-bold text-gray-900 mb-2">Performance Ratings (1-5)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-gray-600 ml-1">Work Quality</label>
                          <input type="number" min="1" max="5" name="workQuality" value={activeData.ratings.workQuality} onChange={(e) => handleRatingChange(e, showEditModal)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-gray-600 ml-1">Punctuality</label>
                          <input type="number" min="1" max="5" name="punctuality" value={activeData.ratings.punctuality} onChange={(e) => handleRatingChange(e, showEditModal)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-gray-600 ml-1">Teamwork</label>
                          <input type="number" min="1" max="5" name="teamwork" value={activeData.ratings.teamwork} onChange={(e) => handleRatingChange(e, showEditModal)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Feedback & Comments</label>
                      <textarea 
                        name="feedback" 
                        value={activeData.feedback} 
                        onChange={(e) => handleChange(e, showEditModal)} 
                        rows="4" 
                        className={`w-full px-4 py-3.5 bg-gray-50/50 border rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:bg-white transition-all placeholder:text-gray-400 ${fieldErrors.feedback ? 'border-red-400 focus:ring-red-500/10' : 'border-gray-200 focus:ring-indigo-500/10 focus:border-indigo-500'}`} 
                        placeholder="Manager's detailed feedback..."
                      ></textarea>
                      {fieldErrors.feedback && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.feedback}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Future Goals <span className="text-gray-400 font-normal">(Optional)</span></label>
                      <textarea 
                        name="goals" 
                        value={activeData.goals} 
                        onChange={(e) => handleChange(e, showEditModal)} 
                        rows="4" 
                        className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-400" 
                        placeholder="Goals for the next review period..."
                      ></textarea>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
                  {currentStep === 1 ? (
                    <>
                      <button type="button" onClick={closeModal} disabled={loading} className="px-6 py-3.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                        Cancel
                      </button>
                      <button type="button" onClick={handleNextStep} className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-[#101a3d] hover:bg-indigo-600 rounded-xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 group">
                        Next Step
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setCurrentStep(1)} disabled={loading} className="px-6 py-3.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                        Back
                      </button>
                      <button type="submit" disabled={loading} className="relative px-8 py-3.5 text-sm font-bold text-white bg-[#101a3d] hover:bg-indigo-600 rounded-xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group">
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Saving...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            {showEditModal ? 'Save Changes' : 'Submit Review'}
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </form>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Review?</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              This action will permanently delete this performance record.
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