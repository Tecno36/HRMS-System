import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import axios from '../../services/axios';
import MainLayout from '../../layouts/MainLayout';

export default function ApplyLeave() {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
    document: null
  });
  
  const [totalDays, setTotalDays] = useState(0);

  const leaveOptions = [
    'Casual Leave (CL)',
    'Sick Leave (SL)',
    'Earned Leave (EL)',
    'Unpaid Leave'
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (formData.fromDate && formData.toDate) {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);
      
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setTotalDays(diffDays);
      } else {
        setTotalDays(0);
      }
    } else {
      setTotalDays(0);
    }
  }, [formData.fromDate, formData.toDate]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLeaveTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, leaveType: type }));
    setIsDropdownOpen(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, document: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason) {
      showToast('Please fill all mandatory fields', 'error');
      return;
    }

    if (totalDays <= 0) {
      showToast('To Date must be greater than or equal to From Date', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const data = new FormData();
      data.append('leaveType', formData.leaveType);
      data.append('fromDate', formData.fromDate);
      data.append('toDate', formData.toDate);
      data.append('totalDays', totalDays);
      data.append('reason', formData.reason);
      if (formData.document) {
        data.append('document', formData.document);
      }

      const response = await axios.post('/leaves/apply', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 'success') {
        showToast('Leave request submitted successfully', 'success');
        setTimeout(() => history.push('/leaves'), 1500);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <IonPage>
        <IonContent scrollY={true} className="ion-no-padding">
          <div className="min-h-full w-full max-w-full overflow-x-hidden bg-[#F8F9FE] flex flex-col font-sans relative pb-28 select-none box-border">
            
            {toast.show && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down w-[90%] max-w-sm">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${toast.type === 'success' ? 'bg-white border-green-100 text-green-700' : 'bg-white border-red-100 text-red-700'}`}>
                  {toast.type === 'success' ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </div>
                  )}
                  <p className="font-semibold text-sm mr-2">{toast.message}</p>
                </div>
              </div>
            )}

            <div className="bg-[#5B3CD8] pt-12 pb-14 px-5 rounded-b-[35px] shrink-0 relative z-10 shadow-md">
              <div className="flex items-center justify-between">
                <button onClick={() => history.goBack()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-white font-bold text-lg">Apply Leave</h1>
                <div className="w-10 h-10"></div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-5 -mt-8 relative z-20 border border-gray-50 overflow-hidden flex items-center justify-center h-28">
              <div className="absolute inset-0 bg-indigo-50/40"></div>
              <svg className="w-20 h-20 text-[#5B3CD8] relative z-10 drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M4 11h16M10 15h4M12 13v4"></path>
              </svg>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#5B3CD8]/10 rounded-full blur-xl"></div>
              <div className="absolute -left-4 -top-4 w-16 h-16 bg-blue-400/10 rounded-full blur-xl"></div>
            </div>

            <div className="px-5 mt-5 relative z-10 flex-1 pb-6 w-full box-border">
              <form onSubmit={handleSubmit} className="bg-white rounded-[24px] shadow-[0_4px_25px_rgb(0,0,0,0.03)] p-5 border border-gray-50 w-full overflow-visible box-border">
                
                <div className="mb-4 relative w-full" ref={dropdownRef}>
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 block">Leave Type</label>
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full border border-gray-200 rounded-xl pl-4 pr-10 py-3.5 text-[12px] text-gray-800 bg-gray-50/50 flex items-center justify-between cursor-pointer box-border"
                  >
                    <span className="truncate">{formData.leaveType || 'Select Leave Type'}</span>
                    <svg className={`w-4 h-4 text-gray-400 absolute right-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {leaveOptions.map((option, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleLeaveTypeSelect(option)}
                          className="px-4 py-3 text-[12px] text-gray-800 hover:bg-indigo-50 hover:text-[#5B3CD8] cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 w-full box-border">
                  <div className="w-full min-w-0">
                    <label className="text-[11px] font-bold text-gray-900 mb-1.5 block">From Date</label>
                    <div className="relative w-full">
                      <input 
                        type="date" 
                        name="fromDate"
                        value={formData.fromDate}
                        onChange={handleInputChange}
                        className="w-full max-w-full block border border-gray-200 rounded-xl px-2.5 py-3.5 text-[11px] text-gray-800 bg-gray-50/50 focus:border-[#5B3CD8] focus:ring-1 focus:ring-[#5B3CD8] outline-none box-border m-0"
                      />
                    </div>
                  </div>
                  <div className="w-full min-w-0">
                    <label className="text-[11px] font-bold text-gray-900 mb-1.5 block">To Date</label>
                    <div className="relative w-full">
                      <input 
                        type="date" 
                        name="toDate"
                        value={formData.toDate}
                        min={formData.fromDate}
                        onChange={handleInputChange}
                        className="w-full max-w-full block border border-gray-200 rounded-xl px-2.5 py-3.5 text-[11px] text-gray-800 bg-gray-50/50 focus:border-[#5B3CD8] focus:ring-1 focus:ring-[#5B3CD8] outline-none box-border m-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <label className="text-[11px] font-bold text-gray-900">Total Days</label>
                  <div className="bg-gray-50 text-gray-800 text-xs font-bold px-3.5 py-1.5 rounded-lg border border-gray-100 shrink-0">
                    {totalDays} {totalDays <= 1 ? 'Day' : 'Days'}
                  </div>
                </div>

                <div className="mb-4 w-full box-border">
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="text-[11px] font-bold text-gray-900">Reason</label>
                    <span className="text-[9px] text-gray-400 font-medium shrink-0">{formData.reason.length}/250</span>
                  </div>
                  <textarea 
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    maxLength="250"
                    rows="3"
                    className="w-full max-w-full block border border-gray-200 rounded-xl px-4 py-3 text-[12px] text-gray-800 bg-gray-50/50 focus:border-[#5B3CD8] focus:ring-1 focus:ring-[#5B3CD8] outline-none resize-none box-border m-0"
                    placeholder="Write reason for leave..."
                  ></textarea>
                </div>

                <div className="mb-6 w-full box-border">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 block">Attach Document <span className="text-gray-400 font-medium">(Optional)</span></label>
                  <label className="w-full flex flex-col items-center justify-center px-4 py-3.5 bg-indigo-50 border border-dashed border-indigo-200 rounded-xl cursor-pointer active:scale-95 transition-transform overflow-hidden box-border">
                    <div className="flex items-center gap-2 text-[#5B3CD8] w-full justify-center min-w-0">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="text-[11px] font-bold truncate">
                        {formData.document ? formData.document.name : 'Upload File'}
                      </span>
                    </div>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3.5 bg-[#5B3CD8] text-white font-bold text-[13px] rounded-xl shadow-lg shadow-[#5B3CD8]/30 active:scale-95 transition-transform flex justify-center items-center m-0 box-border"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </form>
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center pt-3 pb-5 px-6 z-40 rounded-t-3xl shadow-[0_-10px_40px_rgb(0,0,0,0.03)] shrink-0 box-border">
              <Link to="/dashboard" className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span className="text-[10px] font-medium text-gray-400">Home</span>
              </Link>
              <Link to="/team" className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span className="text-[10px] font-medium text-gray-400">My Team</span>
              </Link>
              <Link to="/requests" className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <span className="text-[10px] font-medium text-gray-400">Requests</span>
              </Link>
              <Link to="/leaves" className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-[#5B3CD8]" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                <span className="text-[10px] font-bold text-[#5B3CD8]">Leaves</span>
              </Link>
              <Link to="/profile" className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className="text-[10px] font-medium text-gray-400">Profile</span>
              </Link>
            </div>

          </div>
        </IonContent>
      </IonPage>
    </MainLayout>
  );
}