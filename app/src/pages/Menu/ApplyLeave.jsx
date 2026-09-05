import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from '../../services/axios';
import MainLayout from '../../layouts/MainLayout';

export default function ApplyLeave() {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [toast, setShowToastState] = useState({ show: false, message: '', type: '' });
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);
  const fromCalendarRef = useRef(null);
  const toCalendarRef = useRef(null);

  const [formData, setFormData] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
    document: null
  });

  const [errors, setErrors] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: ''
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
      if (fromCalendarRef.current && !fromCalendarRef.current.contains(event.target)) {
        setShowFromCalendar(false);
      }
      if (toCalendarRef.current && !toCalendarRef.current.contains(event.target)) {
        setShowToCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
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
    setShowToastState({ show: true, message, type });
    setTimeout(() => setShowToastState({ show: false, message: '', type: '' }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (value) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLeaveTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, leaveType: type }));
    setIsDropdownOpen(false);
    setErrors(prev => ({ ...prev, leaveType: '' }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, document: e.target.files[0] }));
    }
  };

  const handleFromDateChange = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      setErrors(prev => ({ ...prev, fromDate: 'Past dates are not allowed' }));
      return;
    }

    const formattedDate = date.toLocaleDateString('en-CA');
    setFormData(prev => ({ 
      ...prev, 
      fromDate: formattedDate,
      toDate: prev.toDate && prev.toDate < formattedDate ? '' : prev.toDate 
    }));
    setShowFromCalendar(false);
    setErrors(prev => ({ ...prev, fromDate: '', toDate: '' }));
  };

  const handleToDateChange = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      setErrors(prev => ({ ...prev, toDate: 'Past dates are not allowed' }));
      return;
    }

    if (formData.fromDate && date < new Date(formData.fromDate)) {
      setErrors(prev => ({ ...prev, toDate: 'To Date cannot be before From Date' }));
      return;
    }

    const formattedDate = date.toLocaleDateString('en-CA');
    setFormData(prev => ({ ...prev, toDate: formattedDate }));
    setShowToCalendar(false);
    setErrors(prev => ({ ...prev, toDate: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let newErrors = { leaveType: '', fromDate: '', toDate: '', reason: '' };
    let hasError = false;

    if (!formData.leaveType) {
      newErrors.leaveType = 'Please select leave type';
      hasError = true;
    }
    if (!formData.fromDate) {
      newErrors.fromDate = 'Please select from date';
      hasError = true;
    }
    if (!formData.toDate) {
      newErrors.toDate = 'Please select to date';
      hasError = true;
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Please enter reason';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-CA');
    if (formData.fromDate < todayStr) {
      setErrors(prev => ({ ...prev, fromDate: 'Cannot select past dates' }));
      return;
    }

    if (totalDays <= 0) {
      setErrors(prev => ({ ...prev, toDate: 'To Date must be greater than or equal to From Date' }));
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
        setTimeout(() => history.push('/my-leaves'), 1500);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <MainLayout>
      <IonPage>
        <IonContent scrollY={true} className="ion-no-padding">
          <div className="min-h-full w-full max-w-full overflow-x-hidden bg-[#F8F9FE] flex flex-col font-sans relative pb-12 select-none box-border">
            
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
                
                <div className="mb-4 relative w-full dropdown" ref={dropdownRef}>
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 block">Leave Type</label>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="dropdown-toggle w-full border border-gray-200 rounded-xl px-4 py-3.5 text-[12px] text-gray-800 bg-gray-50/50 flex items-center justify-between cursor-pointer box-border focus:outline-none"
                  >
                    <span className="truncate">{formData.leaveType || 'Select Leave Type'}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {errors.leaveType && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.leaveType}</p>}
                  
                  {isDropdownOpen && (
                    <ul className="dropdown-menu block absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl p-1 max-h-48 overflow-y-auto">
                      {leaveOptions.map((option, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleLeaveTypeSelect(option)}
                            className="dropdown-item w-full text-left px-4 py-2.5 text-[12px] text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-[#5B3CD8] transition-colors outline-none"
                          >
                            {option}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 w-full relative">
                  
                  <div className="w-full min-w-0 relative" ref={fromCalendarRef}>
                    <label className="text-[10px] font-bold text-gray-900 mb-1 block truncate">From Date</label>
                    <div 
                      onClick={() => { setShowFromCalendar(!showFromCalendar); setShowToCalendar(false); }}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-3 text-[11px] font-medium text-gray-800 flex items-center justify-between cursor-pointer box-border"
                    >
                      <span className="truncate">{formData.fromDate || 'Select'}</span>
                      <svg className="w-3.5 h-3.5 text-[#5B3CD8] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                      </svg>
                    </div>
                    {errors.fromDate && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.fromDate}</p>}

                    {showFromCalendar && (
                      <div className="absolute left-0 z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-2 w-[280px] sm:w-[300px]">
                        <Calendar 
                          onChange={handleFromDateChange} 
                          value={formData.fromDate ? new Date(formData.fromDate) : new Date()}
                          minDate={today}
                          className="rounded-xl border-none text-xs w-full"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full min-w-0 relative" ref={toCalendarRef}>
                    <label className="text-[10px] font-bold text-gray-900 mb-1 block truncate">To Date</label>
                    <div 
                      onClick={() => { setShowToCalendar(!showToCalendar); setShowFromCalendar(false); }}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-3 text-[11px] font-medium text-gray-800 flex items-center justify-between cursor-pointer box-border"
                    >
                      <span className="truncate">{formData.toDate || 'Select'}</span>
                      <svg className="w-3.5 h-3.5 text-[#5B3CD8] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                      </svg>
                    </div>
                    {errors.toDate && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.toDate}</p>}

                    {showToCalendar && (
                      <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-2 w-[280px] sm:w-[300px]">
                        <Calendar 
                          onChange={handleToDateChange} 
                          value={formData.toDate ? new Date(formData.toDate) : new Date()}
                          minDate={formData.fromDate ? new Date(formData.fromDate) : today}
                          className="rounded-xl border-none text-xs w-full"
                        />
                      </div>
                    )}
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
                  {errors.reason && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.reason}</p>}
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

          </div>
        </IonContent>
      </IonPage>
    </MainLayout>
  );
}