import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from '../../services/axios';
import recruitmentEmptyImg from '../../assets/web/recruitmentempty1.jpg';

export default function Recruitment() {
  const [candidates, setCandidates] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Search and Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // एका पानावर १० रेकॉर्ड्स दिसतील

  const initialForm = {
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    status: 'Applied',
    interviewDate: '',
    resumeUrl: ''
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

      const res = await axios.get('/candidates/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidates(res.data);
    } catch (err) {
      setError('Failed to fetch candidates');
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

  // Reset page to 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.name.trim()) errors.name = 'Name is required';
    if (!data.jobTitle.trim()) errors.jobTitle = 'Job Title is required';
    if (!data.department.trim()) errors.department = 'Department is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/candidates/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Candidate added successfully!');
      closeModal();
      setFormData(initialForm);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(editData)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/candidates/update/${editData._id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Candidate updated successfully!');
      closeModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update candidate');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/candidates/delete/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Candidate removed.');
      setShowDeleteDialog(false);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove candidate');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (candidate) => {
    setEditData({
      ...candidate,
      interviewDate: candidate.interviewDate ? new Date(candidate.interviewDate).toISOString().split('T')[0] : ''
    });
    setFieldErrors({});
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Applied': return <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">Applied</span>;
      case 'Interviewing': return <span className="inline-flex px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">Interviewing</span>;
      case 'Hired': return <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">Hired</span>;
      case 'Rejected': return <span className="inline-flex px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold">Rejected</span>;
      default: return <span className="inline-flex px-3 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold">{status}</span>;
    }
  };

  const isManager = currentUser?.role === 'Super Admin' || currentUser?.role === 'HR';
  const activeData = showEditModal ? editData : formData;

  // -------------------------------------------------------------
  // Filtering & Pagination Logic
  // -------------------------------------------------------------
  const filteredCandidates = candidates.filter((cand) => 
    cand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cand.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cand.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cand.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentCandidates = filteredCandidates.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

      {/* Header section updated with Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Recruitment Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Manage candidates, interviews, and hiring process.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search candidates..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {isManager && (
            <button 
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto group flex justify-center items-center gap-2 px-6 py-3 bg-[#101a3d] hover:bg-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/20 transition-all duration-300 active:scale-95"
            >
              <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add Candidate
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-5 rounded-tl-3xl">Candidate</th>
                <th className="px-6 py-5">Role & Dept</th>
                <th className="px-6 py-5">Interview Date</th>
                <th className="px-6 py-5">Status</th>
                {isManager && <th className="px-6 py-5 text-center rounded-tr-3xl">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {currentCandidates.length > 0 ? (
                currentCandidates.map((cand) => (
                  <tr key={cand._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 shadow-sm group-hover:scale-105 transition-transform">
                          {cand.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{cand.name}</p>
                          <p className="text-xs font-bold text-gray-400 mt-0.5">{cand.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-700">{cand.jobTitle}</p>
                        <p className="text-xs text-gray-400 mt-1">{cand.department}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-600">
                      {cand.interviewDate ? new Date(cand.interviewDate).toLocaleDateString() : 'Not Scheduled'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(cand.status)}
                    </td>
                    {isManager && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {cand.resumeUrl && (
                            <a href={cand.resumeUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View Resume">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                            </a>
                          )}
                          <button onClick={() => openEditModal(cand)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button onClick={() => { setDeleteId(cand._id); setShowDeleteDialog(true); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isManager ? 5 : 4} className="px-2 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img src={recruitmentEmptyImg} alt="No Candidates" className="w-64 h-64 object-contain opacity-80" />
                      <p className="text-gray-500 font-bold mt-4">
                        {searchTerm ? 'No matching candidates found.' : 'No candidates in the pipeline yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-4 rounded-b-3xl">
            <p className="text-xs font-bold text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredCandidates.length)} of {filteredCandidates.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      currentPage === i + 1 
                        ? 'bg-[#101a3d] text-white shadow-md' 
                        : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {(showModal || showEditModal) && activeData && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => !loading && closeModal()}
          ></div>

          <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-white p-8 my-8 transform transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    {showEditModal ? 'Update Candidate Status' : 'Add New Candidate'}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    Enter candidate details and track their hiring progress.
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

              <form onSubmit={showEditModal ? handleEditSubmit : handleAddSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Full Name</label>
                    <input 
                      type="text" name="name" value={activeData.name} onChange={(e) => handleChange(e, showEditModal)} 
                      className={`w-full px-4 py-3 bg-gray-50/50 border rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:bg-white transition-all ${fieldErrors.name ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'}`} 
                    />
                    {fieldErrors.name && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                    <input 
                      type="email" name="email" value={activeData.email} onChange={(e) => handleChange(e, showEditModal)} 
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Job Title</label>
                    <input 
                      type="text" name="jobTitle" value={activeData.jobTitle} onChange={(e) => handleChange(e, showEditModal)} 
                      className={`w-full px-4 py-3 bg-gray-50/50 border rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:bg-white transition-all ${fieldErrors.jobTitle ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'}`} 
                    />
                    {fieldErrors.jobTitle && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.jobTitle}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Department</label>
                    <input 
                      type="text" name="department" value={activeData.department} onChange={(e) => handleChange(e, showEditModal)} 
                      className={`w-full px-4 py-3 bg-gray-50/50 border rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:bg-white transition-all ${fieldErrors.department ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'}`} 
                    />
                    {fieldErrors.department && <p className="text-xs text-red-500 font-bold ml-1">{fieldErrors.department}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Current Status</label>
                    <select 
                      name="status" value={activeData.status} onChange={(e) => handleChange(e, showEditModal)} 
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Hired">Hired</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Interview Date</label>
                    <input 
                      type="date" name="interviewDate" value={activeData.interviewDate} onChange={(e) => handleChange(e, showEditModal)} 
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Resume Link (URL)</label>
                    <input 
                      type="url" name="resumeUrl" value={activeData.resumeUrl} onChange={(e) => handleChange(e, showEditModal)} 
                      placeholder="https://drive.google.com/..."
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
                  <button type="button" onClick={closeModal} disabled={loading} className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="px-8 py-3 text-sm font-bold text-white bg-[#101a3d] hover:bg-indigo-600 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
                    {loading ? 'Saving...' : (showEditModal ? 'Update Candidate' : 'Add Candidate')}
                  </button>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Candidate?</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              This action will permanently delete candidate information.
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
                {loading ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}