import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from '../../services/axios';
import MainLayout from '../../layouts/MainLayout';
import applyLeaveImg from '../../assets/image/applyLeaveImg.png';

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
    { name: 'Casual Leave', icon: 'palm' },
    { name: 'Sick Leave', icon: 'cross' },
    { name: 'Earned Leave', icon: 'plane' },
    { name: 'Compensatory Off', icon: 'calendar' },
    { name: 'Loss of Pay', icon: 'heart' }
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

  const renderTypeIcon = (icon, className) => {
    switch (icon) {
      case 'cross':
        return (
          <svg className={className} viewBox="0 0 490 490" fill="#22C55E" xmlns="http://www.w3.org/2000/svg">
            <path d="M383.7,490H106.3C48,490,0,442,0,383.7V106.3C0,48,48,0,106.3,0h277.3C442,0,490,48,490,106.3v277.3 C490,442,442,490,383.7,490z M106.3,40.7c-36.5,0-65.7,29.2-65.7,65.7v277.3c0,36.5,29.2,65.7,65.7,65.7h277.3 c36.5,0,65.7-29.2,65.7-65.7V106.3c0-36.5-29.2-65.7-65.7-65.7L106.3,40.7z"/>
            <path d="M216.9,363.9v-62.6c0-15.6-12.5-28.1-28.1-28.1h-62.6C96.4,270.9,98.1,243,98.1,243c0-15.6,12.5-28.1,28.1-28.1h62.6 c15.6,0,28.1-12.5,28.1-28.1v-60.5c0-15.6,12.5-28.1,28.1-28.1l0,0c15.6,0,28.1,12.5,28.1,28.1v60.5 c0,15.6,12.5,28.1,28.1,28.1h62.6C393.2,216.3,392,245,392,245c0,15.6-12.5,28.1-28.1,28.1h-62.6c-15.6,0-28.1,12.5-28.1,28.1 v62.6c0,15.6-12.5,28.1-28.1,28.1l0,0C229.4,392,216.9,379.5,216.9,363.9z"/>
          </svg>
        );
      case 'calendar':
        return (
          <svg className={className} fill="#38BDF8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19,4H17V3a1,1,0,0,0-2,0V4H9V3A1,1,0,0,0,7,3V4H5A3,3,0,0,0,2,7V19a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V7A3,3,0,0,0,19,4Zm1,15a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V12H20Zm0-9H4V7A1,1,0,0,1,5,6H7V7A1,1,0,0,0,9,7V6h6V7a1,1,0,0,0,2,0V6h2a1,1,0,0,1,1,1Z"/>
          </svg>
        );
      case 'plane':
        return (
          <svg className={className} fill="#5B3CD8" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M934.32 65.904c10.432 0 17.776 1.938 21.6 3.41 4.592 12.224 10.753 56.031-34.528 101.343L690.4 401.633l1.664 28.656c3.504 59.968 10 167.44 15.6 259.567 4.944 82 9.633 159.44 9.936 166.032.16 4.529.225 5.601-3.999 10.689-9.44 11.472-27.056 30.912-41.904 47.024-23.024-62.032-71.408-193.057-98.128-266.4l-34.336-94.368-71.024 71.024-130.608 125.584-18.192 18.16-.56 25.68c-.432 20.496-.336 57.28-.288 89.712.064 22.592.129 43.12-.031 54.432-.288.528 4.368 1.152 3.936 1.904-2.784-4.464-5.776-9.28-8.944-14.288-26.336-42-62.784-100.096-73.904-118.224l-8.128-13.28-13.344-8.065c-48.528-29.311-102.288-63.151-135.088-84.287 1.136-.656 2.063 2.816 2.815 2.415h2.128c10.32 0 27.376.224 46.496.496 25.008.336 53.376.752 75.088.752 8.32 0 15.712-.064 21.664-.192l25.68-.592 18.16-18.16 125.744-129.712 70.784-70.752-93.935-34.56c-70.592-25.967-205.808-76.464-269.056-100.224 16.223-14.944 35.775-32.688 47.183-42.129 3.184-2.624 5.665-3.967 7.376-3.967l2.256.064c7.056.336 94.688 6.064 179.407 11.6 89.936 5.872 191.44 12.496 249.151 16.16l28.848 1.808 231.024-231.04c32.448-32.4 64.32-37.248 80.449-37.248zm.001-63.997c-37.808 0-84.222 14.526-125.678 55.998L598.035 268.497c-118.624-7.504-422.432-27.6-429.968-27.808a100.693 100.693 0 0 0-4.88-.129c-10.256 0-27.968 1.968-48.128 18.624-23.664 19.569-73.008 65.97-73.008 65.97-11.904 11.935-17.936 26.719-16.496 40.623.88 8.4 5.44 23.712 26.064 31.777 12.528 4.912 211.904 79.504 303.969 113.376L229.844 640.642c-5.569.128-12.465.192-20.257.192-38.336 0-97.776-1.248-121.601-1.248-3.152 0-5.68 0-7.473.064-7.248.224-22.256-3.344-61.84 29.744l-2.816 2.624C3.985 683.89 1.201 695.73.945 703.554c-.256 8.064 1.904 19.68 13.568 29.024 7.008 5.664 96.848 63.184 170.527 107.68 17.665 28.817 98.945 158 103.185 165.008 6.193 10.464 16.32 16.432 28.433 16.816h1.008c11.776 0 23.872-5.84 35.712-17.344 33.504-39.184 28.88-55.407 29.023-62.224.528-21.376-.368-111.936.4-147.84l130.592-125.6c33.376 91.68 106.336 289.008 111.216 301.567 8.128 20.624 23.44 25.153 31.84 26 1.376.16 2.785.225 4.16.225 12.625 0 25.712-5.936 36.432-16.655 0 0 46.256-49.088 65.904-72.976 19.68-23.872 18.913-44.256 18.529-53.872-.16-6.656-18.689-308.816-25.569-426.816L966.561 215.89c74.657-74.689 62.785-164.688 35.057-192.368-12.24-12.304-37.024-21.615-67.297-21.616z"/>
          </svg>
        );
      case 'heart':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="#EF4444">
            <path d="M3.48877 6.00387C2.76311 7.24787 2.52428 8.97403 2.97014 10.7575C3.13059 11.3992 3.59703 12.2243 4.33627 13.174C5.06116 14.1052 5.9864 15.0787 6.96636 16.0127C8.90945 17.8648 11.0006 19.4985 12 20.254C12.5679 19.8247 13.4884 19.1118 14.5338 18.2364C14.7154 18.0844 14.9444 18 15.1812 18H15.2755C16.1864 18 16.6096 19.1044 15.9123 19.6905C14.7762 20.6456 13.7775 21.418 13.181 21.8683C12.4803 22.3974 11.5197 22.3974 10.819 21.8683C9.80433 21.1022 7.62583 19.4042 5.58648 17.4605C4.56733 16.4891 3.56585 15.4402 2.75806 14.4025C1.96461 13.3832 1.2924 12.2927 1.02986 11.2425C0.475714 9.02597 0.736884 6.75213 1.76121 4.99613C2.80291 3.21035 4.62017 2 6.99998 2C9.59038 2 11.0969 3.95772 11.8944 5.55278C11.9307 5.62535 11.9659 5.69784 12 5.77011C12.0341 5.69784 12.0693 5.62535 12.1056 5.55279C12.9031 3.95772 14.4096 2 17 2C19.3798 2 21.1971 3.21035 22.2388 4.99613C23.1118 6.49271 23.4305 8.36544 23.1625 10.2583C23.1008 10.6946 22.7141 11 22.2735 11C21.6284 11 21.169 10.3586 21.2387 9.71731C21.3774 8.44008 21.1371 7.07683 20.5112 6.00387C19.8029 4.78965 18.6202 4 17 4C15.5904 4 14.5969 5.04228 13.8944 6.44721C13.5569 7.12228 13.3275 7.80745 13.1823 8.33015C13.1102 8.58959 13.0602 8.80435 13.0286 8.95172C12.9167 9.47392 12.3143 9.5 12 9.5C11.6857 9.5 11.0823 9.46905 10.9714 8.95172C10.9398 8.80436 10.8898 8.58959 10.8177 8.33015C10.6725 7.80745 10.4431 7.12229 10.1056 6.44722C9.40308 5.04228 8.40956 4 6.99998 4C5.37979 4 4.19706 4.78965 3.48877 6.00387Z"/>
            <path d="M15.9191 9.60608C15.7658 9.24819 15.4186 9.01187 15.0294 9.00043C14.6402 8.98899 14.2797 9.20452 14.1056 9.55279L12.382 13H9C8.44771 13 8 13.4477 8 14C8 14.5523 8.44771 15 9 15H13C13.3788 15 13.725 14.786 13.8944 14.4472L14.9302 12.3757L17.0808 17.3939C17.2215 17.7221 17.5265 17.9504 17.881 17.9929C18.2355 18.0354 18.5858 17.8856 18.8 17.6L21.5 14H23C23.5523 14 24 13.5523 24 13C24 12.4477 23.5523 12 23 12H21C20.6852 12 20.3888 12.1482 20.2 12.4L18.2378 15.0163L15.9191 9.60608Z"/>
          </svg>
        );
      case 'palm':
      default:
        return (
          <svg className={className} viewBox="0 0 32 32" fill="#5B3CD8" stroke="#5B3CD8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.57,28C17.897,26.7251,16,22.2261,16,12v-.1313l1.1172.7446A6.4613,6.4613,0,0,1,20,18h2a8.457,8.457,0,0,0-3.7734-7.0508L16.8027,10h1.5308a7.04,7.04,0,0,1,4.2,1.4L24.4,12.8l1.2-1.6L23.7334,9.8a9.06,9.06,0,0,0-5.4-1.8H17.1172A7.0306,7.0306,0,0,1,22,6h2V4H22a9.035,9.035,0,0,0-7,3.3643A9.035,9.035,0,0,0,8,4H6V6H8a7.0306,7.0306,0,0,1,4.8828,2H11.6665a9.06,9.06,0,0,0-5.4,1.8L4.4,11.2l1.2,1.6L7.4668,11.4a7.04,7.04,0,0,1,4.2-1.4h1.5308l-1.4239.9492A8.457,8.457,0,0,0,8,18h2a6.4613,6.4613,0,0,1,2.8828-5.3867L14,11.8687V12c0,8.9438,1.4116,13.7646,2.3611,16H2v2H30V28Z"/>
          </svg>
        );
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedLeaveOption = leaveOptions.find(opt => opt.name === formData.leaveType);

  return (
    <MainLayout>
      <IonPage>
        <IonContent scrollY={true} className="ion-no-padding">
          <div className="min-h-full w-full max-w-full overflow-x-hidden bg-[#F8F9FE] flex flex-col font-sans relative pb-6 select-none box-border">
            
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

            <div className="relative shrink-0 bg-gradient-to-br from-[#6C4CE0] to-[#5B3CD8] pt-12 pb-14 px-6 overflow-hidden shadow-sm">
              <div className="absolute top-6 right-24 w-1.5 h-1.5 bg-white/60 rounded-full"></div>
              <div className="absolute top-16 right-10 w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="absolute top-24 right-28 w-1 h-1 bg-white/40 rounded-full"></div>

              <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => history.goBack()}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h1 className="text-white font-bold text-[22px] tracking-wide">Apply Leave</h1>
                </div>
                <div className="shrink-0 drop-shadow-lg">
                  <img src={applyLeaveImg} alt="Apply Leave" className="w-20 h-20 object-contain" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-t-[25px] -mt-6 relative z-10 pt-8 px-5 pb-6 flex-1 w-full shadow-[0_-8px_20px_rgba(0,0,0,0.02)]">
              <form onSubmit={handleSubmit} className="w-full overflow-visible box-border">
                
                <div className="mb-4 relative w-full dropdown" ref={dropdownRef}>
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 block">Leave Type <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`dropdown-toggle w-full border ${errors.leaveType ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} rounded-xl px-4 py-3.5 text-[12px] text-gray-800 flex items-center justify-between cursor-pointer box-border focus:outline-none`}
                  >
                    {selectedLeaveOption ? (
                      <div className="flex items-center gap-2.5 min-w-0">
                        {renderTypeIcon(selectedLeaveOption.icon, 'w-4 h-4 shrink-0')}
                        <span className="truncate font-bold">{selectedLeaveOption.name}</span>
                      </div>
                    ) : (
                      <span className="truncate font-medium text-gray-500">Select Leave Type</span>
                    )}
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {errors.leaveType && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.leaveType}</p>}
                  
                  {isDropdownOpen && (
                    <ul className="dropdown-menu block absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl p-1.5 max-h-56 overflow-y-auto">
                      {leaveOptions.map((option, idx) => (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => handleLeaveTypeSelect(option.name)}
                            className={`dropdown-item w-full flex items-center gap-3 px-4 py-3 text-[12px] font-bold rounded-lg transition-colors outline-none ${formData.leaveType === option.name ? 'bg-indigo-50 text-[#5B3CD8]' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            <div className="shrink-0 bg-white shadow-sm p-1.5 rounded-md">
                              {renderTypeIcon(option.icon, 'w-4 h-4')}
                            </div>
                            {option.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 w-full relative">
                  
                  <div className="w-full min-w-0 relative" ref={fromCalendarRef}>
                    <label className="text-[11px] font-bold text-gray-900 mb-1.5 block truncate">From Date <span className="text-red-500">*</span></label>
                    <div 
                      onClick={() => { setShowFromCalendar(!showFromCalendar); setShowToCalendar(false); }}
                      className={`w-full rounded-xl border ${errors.fromDate ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} py-3.5 px-3.5 text-[11px] font-bold text-gray-800 flex items-center justify-between cursor-pointer box-border`}
                    >
                      <span className="truncate">{formData.fromDate || 'Select from date'}</span>
                      <svg className="w-4 h-4 text-[#5B3CD8] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {errors.fromDate && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.fromDate}</p>}

                    {showFromCalendar && (
                      <div className="absolute left-0 z-50 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 w-[280px] sm:w-[300px] transform origin-top animate-fade-in-down">
                        <Calendar 
                          onChange={handleFromDateChange} 
                          value={formData.fromDate ? new Date(formData.fromDate) : new Date()}
                          minDate={today}
                          className="rounded-xl border-none text-xs w-full font-sans"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full min-w-0 relative" ref={toCalendarRef}>
                    <label className="text-[11px] font-bold text-gray-900 mb-1.5 block truncate">To Date <span className="text-red-500">*</span></label>
                    <div 
                      onClick={() => { setShowToCalendar(!showToCalendar); setShowFromCalendar(false); }}
                      className={`w-full rounded-xl border ${errors.toDate ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} py-3.5 px-3.5 text-[11px] font-bold text-gray-800 flex items-center justify-between cursor-pointer box-border`}
                    >
                      <span className="truncate">{formData.toDate || 'Select to date'}</span>
                      <svg className="w-4 h-4 text-[#5B3CD8] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {errors.toDate && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.toDate}</p>}

                    {showToCalendar && (
                      <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 w-[280px] sm:w-[300px] transform origin-top animate-fade-in-down">
                        <Calendar 
                          onChange={handleToDateChange} 
                          value={formData.toDate ? new Date(formData.toDate) : new Date()}
                          minDate={formData.fromDate ? new Date(formData.fromDate) : today}
                          className="rounded-xl border-none text-xs w-full font-sans"
                        />
                      </div>
                    )}
                  </div>

                </div>

                <div className="mb-4 w-full box-border">
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="text-[11px] font-bold text-gray-900">Reason <span className="text-red-500">*</span></label>
                    <span className="text-[9px] text-gray-400 font-medium shrink-0">{formData.reason.length}/500</span>
                  </div>
                  <textarea 
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    maxLength="500"
                    rows="3"
                    className={`w-full max-w-full block border ${errors.reason ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50/50'} rounded-xl px-4 py-3 text-[12px] font-medium text-gray-800 focus:border-[#5B3CD8] focus:ring-1 focus:ring-[#5B3CD8] outline-none resize-none box-border m-0`}
                    placeholder="Enter reason for leave..."
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

                <div className="mb-6 bg-[#F4F0FF] rounded-xl p-3 border border-[#E9E4FF] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Total Days Request</p>
                      <p className="text-[13px] font-bold text-[#5B3CD8] leading-tight">{totalDays} {totalDays <= 1 ? 'Day' : 'Days'}</p>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3.5 bg-[#5B3CD8] text-white font-bold text-[13px] rounded-xl shadow-[0_8px_20px_rgba(91,60,216,0.3)] active:scale-95 transition-transform flex justify-center items-center m-0 box-border"
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