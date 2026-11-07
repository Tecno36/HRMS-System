import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Link, useHistory } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Geolocation } from '@capacitor/geolocation';
import axios from '../../services/axios';
import { syncFcmToken } from '../../services/fcmService';

export default function Dashboard() {
  const history = useHistory();
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', _id: '', id: '', avatar: '' };
  
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [earlyReason, setEarlyReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [punchAction, setPunchAction] = useState('in');
  const [locationStr, setLocationStr] = useState('Fetching location...');
  const [validationMsg, setValidationMsg] = useState('Look straight into the camera');
  const [scanPercentage, setScanPercentage] = useState(0);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const webcamRef = useRef(null);
  const captureInterval = useRef(null);
  const framesCaptured = useRef(0);
  const maxFrames = 6; 

  const leaveOptions = [
    'Medical Emergency',
    'Family Emergency',
    'Manager Approval',
    'Personal Work',
    'Other'
  ];

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await axios.get('/notifications?limit=25');
      if (res.data?.status === 'success') {
        setNotifications(res.data.data || []);
        setUnreadNotifCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('[Notifications] Fetch failed:', err.message);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (e) {}
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await axios.put(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadNotifCount(prev => Math.max(0, prev - 1));
      } catch (e) {}
    }
    setIsNotifModalOpen(false);
    if (notif.link) {
      history.push(notif.link);
    }
  };

  useEffect(() => {
    syncFcmToken();
    fetchTodayAttendance();
    fetchNotifications();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get('/attendance/today');
      if (response.data.status === 'success' && response.data.data) {
        setTodayAttendance(response.data.data);
      }
    } catch (error) {
      console.log('No attendance record found for today yet.');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const fetchLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
      setLocationStr(`${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
    } catch (error) {
      setLocationStr(`Loc Error: Make sure GPS is ON`);
    }
  };

  useEffect(() => {
    if (isPunchModalOpen) {
      setCapturedImages([]);
      setScanPercentage(0);
      setVerificationSuccess(false);
      setIsVerifying(false);
      framesCaptured.current = 0;
      setValidationMsg('Look UP and then look DOWN');
      fetchLocation();
    } else {
      if (captureInterval.current) {
        clearInterval(captureInterval.current);
      }
    }
  }, [isPunchModalOpen]);

  const startScanning = () => {
    if (captureInterval.current) clearInterval(captureInterval.current);
      
    framesCaptured.current = 0;
    setScanPercentage(0);
    const tempImages = [];

    captureInterval.current = setInterval(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          tempImages.push(imageSrc);
          framesCaptured.current += 1;
            
          const progress = (framesCaptured.current / maxFrames) * 100;
          setScanPercentage(progress);

          if(framesCaptured.current === 2) setValidationMsg('Now look DOWN...');
          if(framesCaptured.current === 4) setValidationMsg('Look straight again...');

          if (framesCaptured.current >= maxFrames) {
            clearInterval(captureInterval.current);
            setCapturedImages(tempImages);
            verifyLivenessOnBackend(tempImages);
          }
        }
      }
    }, 700); 
  };

  const verifyLivenessOnBackend = async (images) => {
    setIsVerifying(true);
    setValidationMsg('Verifying face movement securely...');

    try {
      const response = await axios.post('/attendance/verify-liveness', { images: images });
        
      if (response.data.status === 'success') {
        setIsVerifying(false);
        setVerificationSuccess(true);
        setValidationMsg('Face verified successfully!');
      }
    } catch (error) {
      setIsVerifying(false);
      setVerificationSuccess(false);
      setValidationMsg(error.response?.data?.message || 'Server error. Try again.');
    }
  };

  const handleAttendanceAction = async () => {
    try {
      const endpoint = punchAction === 'in' ? '/attendance/clock-in' : '/attendance/clock-out';
      
      const payload = {};
      if (punchAction === 'out' && earlyReason) {
        payload.earlyLeaveReason = earlyReason === 'Other' ? customReason : earlyReason;
      }

      const response = await axios.post(endpoint, payload);

      if (response.data.status === 'success') {
        setIsPunchModalOpen(false);
        setEarlyReason('');
        setCustomReason('');
        showToast(response.data.message, 'success');
        fetchTodayAttendance(); 
      }
    } catch (error) {
      showToast(error.response?.data?.message || `Server error while punching ${punchAction}`, 'error');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const hasClockedIn = todayAttendance?.clockIn != null;
  const hasClockedOut = todayAttendance?.clockOut != null;
  
  let liveWorkedHours = 0;
  let liveWorkedMinutes = 0;
  let progressPercentage = 0;

  if (hasClockedIn) {
    const startTime = new Date(todayAttendance.clockIn);
    const endTime = hasClockedOut ? new Date(todayAttendance.clockOut) : currentTime; 
    
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    liveWorkedHours = Math.floor(diffMins / 60);
    liveWorkedMinutes = diffMins % 60;

    progressPercentage = Math.min((diffMins / 480) * 100, 100); 
  }

  const openPunchModal = (action) => {
    setPunchAction(action);
    if (action === 'out') {
      const totalWorkedMinutes = (liveWorkedHours * 60) + liveWorkedMinutes;
      const requiredMinutes = 525; 

      if (totalWorkedMinutes < requiredMinutes) {
        setIsReasonModalOpen(true);
        return;
      }
    }
    setIsPunchModalOpen(true);
  };

  const handleReasonSubmit = () => {
    if (!earlyReason) {
      showToast('Please select a reason for leaving early', 'error');
      return;
    }
    if (earlyReason === 'Other' && !customReason.trim()) {
      showToast('Please specify the reason', 'error');
      return;
    }
    
    setIsReasonModalOpen(false);
    setIsPunchModalOpen(true);
  };

  return (
    <IonPage>
      <IonContent scrollY={false} className="ion-no-padding">
        <div className="h-full w-full bg-[#5B3CD8] flex flex-col font-sans relative select-none">
          
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

          {/* Sticky Purple Header */}
          <div className="shrink-0 pt-12 pb-[70px] px-6 relative z-0">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <p className="text-white/80 text-xs font-medium">Welcome 👋</p>
                <h1 className="text-white font-bold text-xl leading-tight mt-0.5">{user.name}</h1>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setIsNotifModalOpen(true); fetchNotifications(); }}
                  className="relative p-2 text-white active:scale-95 transition-transform"
                  aria-label="Notifications"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadNotifCount > 0 ? (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-[#5B3CD8] shadow-sm animate-pulse">
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  ) : null}
                </button>

                <Link to="/profile" className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40 overflow-hidden shadow-sm active:scale-95 transition-transform">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </Link>
              </div>
            </div>
          </div>

          {/* Main Container */}
          <div className="bg-[#F8F9FE] rounded-t-[25px] flex-1 flex flex-col relative z-10 w-full shadow-[0_-8px_20px_rgba(0,0,0,0.06)] min-h-0">
            
            {/* FIXED ATTENDANCE CARD (Sticky / Non-scrollable) */}
            <div className="shrink-0 px-5 -mt-12 relative z-20">
              <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100/50">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Attendance Overview</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{currentTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${hasClockedIn ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                    {hasClockedIn ? 'Present' : 'Not Punched In'}
                  </span>
                </div>

                <div className="flex justify-between items-center px-2 mb-6">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 font-medium mb-1">Check In</p>
                    <p className="text-[14px] font-bold text-gray-900">{formatTime(todayAttendance?.clockIn)}</p>
                  </div>
                  
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-100"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={hasClockedOut ? "text-green-500" : "text-[#5B3CD8]"}
                        strokeWidth="3"
                        strokeDasharray={`${progressPercentage}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-sm font-bold text-gray-900 leading-none">
                        {hasClockedIn ? `${liveWorkedHours}h ${liveWorkedMinutes}m` : '0h 0m'}
                      </span>
                      <span className="text-[9px] text-gray-500 mt-1">Total Hours</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 font-medium mb-1">Check Out</p>
                    <p className="text-[14px] font-bold text-gray-900">{formatTime(todayAttendance?.clockOut)}</p>
                  </div>
                </div>

                {!hasClockedIn && (
                   <button 
                     onClick={() => openPunchModal('in')}
                     className="w-full py-3.5 bg-gradient-to-r from-[#5B3CD8] to-[#7148FC] text-white font-bold rounded-[18px] shadow-lg shadow-[#5B3CD8]/30 active:scale-95 transition-all flex items-center justify-center gap-2 text-[13px]"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                     Punch In
                   </button>
                )}

                {hasClockedIn && !hasClockedOut && (
                   <button 
                     onClick={() => openPunchModal('out')}
                     className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-[18px] shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 text-[13px]"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                     Punch Out
                   </button>
                )}

                {hasClockedIn && hasClockedOut && (
                   <button 
                     disabled
                     className="w-full py-3.5 bg-gray-50 text-green-600 font-bold rounded-[18px] flex items-center justify-center gap-2 border border-green-200 text-[13px]"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     Shift Completed
                   </button>
                )}
              </div>
            </div>

            {/* INDEPENDENTLY SCROLLABLE BOTTOM CONTENT (Now fully working with min-h-0) */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 pt-6 pb-12 space-y-6">
              
              <div className="grid grid-cols-4 gap-3">
                <Link to="/profile" className="bg-white p-3 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-100/50 active:scale-95 transition-transform">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5B3CD8]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">Profile</span>
                </Link>
                <Link to="/attendance" className="bg-white p-3 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-100/50 active:scale-95 transition-transform">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">History</span>
                </Link>
                <Link to="/apply-leave" className="bg-white p-3 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-100/50 active:scale-95 transition-transform">
                  <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">Apply</span>
                </Link>
                <Link to="/payslip" className="bg-white p-3 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-100/50 active:scale-95 transition-transform">
                  <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">Payslip</span>
                </Link>
              </div>

              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[14px] font-bold text-gray-900 tracking-wide">Leave Balance</h2>
                  <Link to="/leaves" className="text-[11px] font-bold text-[#5B3CD8] bg-indigo-50 px-2 py-1 rounded-md">View All</Link>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50/80 rounded-[18px] p-4 border border-gray-100 flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold tracking-wide uppercase">Casual Leave</p>
                      <p className="text-[15px] font-bold text-gray-900 leading-tight">04 <span className="text-xs font-medium text-gray-400">/ 12</span></p>
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-50/80 rounded-[18px] p-4 border border-gray-100 flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-red-400 rounded-full"></div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold tracking-wide uppercase">Sick Leave</p>
                      <p className="text-[15px] font-bold text-gray-900 leading-tight">02 <span className="text-xs font-medium text-gray-400">/ 06</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100/50">
                <h2 className="text-[14px] font-bold text-gray-900 tracking-wide mb-4">Announcements</h2>
                <div className="flex gap-4 items-start border-b border-gray-50 pb-4 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#FFF5EB] flex items-center justify-center shrink-0">
                    <span className="text-orange-500 text-lg">🎉</span>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-gray-900">Upcoming Holiday: Diwali</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Office will remain closed on 12th and 13th Nov. Happy Diwali in advance!</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-2xl bg-[#F0EDFF] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#5B3CD8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-gray-900">Updated HR Policy</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Please review the updated leave encashment policy on the portal.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Modals Code */}
          {isReasonModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-[28px] p-6 flex flex-col relative animate-fade-in-up shadow-2xl">
                <button 
                  onClick={() => setIsReasonModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-full p-2 z-20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="w-14 h-14 bg-[#FFF5EB] text-orange-500 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>

                <h3 className="text-[17px] font-bold text-gray-900 mb-2 text-center tracking-wide">Leaving Early?</h3>
                <p className="text-[12px] text-gray-500 text-center mb-6 leading-relaxed">
                  You are punching out before completing 9 hours. Please select a reason to continue.
                </p>

                <div className="space-y-4 w-full">
                  <div className="mb-4 relative w-full dropdown" ref={dropdownRef}>
                    <label className="text-[11px] font-bold text-gray-900 mb-1.5 block">Reason for Early Leave</label>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="dropdown-toggle w-full border border-gray-100 rounded-[16px] px-4 py-4 text-[13px] font-bold text-gray-800 bg-gray-50 flex items-center justify-between cursor-pointer box-border focus:outline-none focus:border-[#5B3CD8] transition-all"
                    >
                      <span className="truncate">{earlyReason || 'Select a reason...'}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    
                    {isDropdownOpen && (
                      <ul className="dropdown-menu block absolute left-0 right-0 z-50 mt-2 bg-white border border-gray-100 rounded-[16px] shadow-xl p-1.5 max-h-48 overflow-y-auto">
                        {leaveOptions.map((option, idx) => (
                          <li key={idx}>
                            <button
                              type="button"
                              onClick={() => {
                                setEarlyReason(option);
                                setIsDropdownOpen(false);
                              }}
                              className="dropdown-item w-full text-left px-4 py-3 text-[12px] font-bold text-gray-700 rounded-xl hover:bg-indigo-50 hover:text-[#5B3CD8] transition-colors outline-none"
                            >
                              {option}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {earlyReason === 'Other' && (
                    <div className="mt-3">
                      <label className="text-[11px] font-bold text-gray-900 mb-1.5 block">Specify Reason</label>
                      <input 
                        type="text"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Please type here..."
                        className="w-full border border-gray-100 rounded-[16px] px-4 py-4 text-[13px] font-bold text-gray-800 bg-gray-50 focus:border-[#5B3CD8] focus:bg-white outline-none box-border transition-all"
                      />
                    </div>
                  )}

                  <button 
                    onClick={handleReasonSubmit}
                    className="w-full py-4 mt-2 bg-[#5B3CD8] text-white text-[13px] tracking-wide font-bold rounded-[18px] shadow-[0_8px_16px_rgba(91,60,216,0.25)] active:scale-95 transition-transform"
                  >
                    Proceed to Verification
                  </button>
                </div>
              </div>
            </div>
          )}

          {isPunchModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-[28px] p-6 flex flex-col items-center relative shadow-2xl animate-fade-in-up">
                <button 
                  onClick={() => setIsPunchModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-full p-2 z-20 transition-colors"
                  disabled={isVerifying}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h3 className="text-[17px] font-bold text-gray-900 mb-1 mt-2 tracking-wide">Face Verification</h3>
                
                <p className={`text-[12px] font-bold mb-4 text-center ${verificationSuccess ? 'text-green-600' : (isVerifying ? 'text-orange-500' : 'text-[#5B3CD8]')}`}>
                  {validationMsg}
                </p>
                
                {!verificationSuccess && (
                  <div className="w-full max-w-[200px] bg-gray-100 rounded-full h-1.5 mb-5 overflow-hidden">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${isVerifying ? 'bg-orange-400 animate-pulse w-full' : 'bg-[#5B3CD8]'}`} style={{ width: isVerifying ? '100%': `${scanPercentage}%` }}></div>
                  </div>
                )}

                <div className="relative w-64 h-64 mb-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-50 shadow-inner">
                  {!verificationSuccess ? (
                    <>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user" }}
                        className="w-full h-full object-cover transform scale-x-[-1]"
                        onUserMedia={startScanning}
                      />
                      <div className="absolute inset-0 border-[6px] z-10 transition-colors duration-500 rounded-full border-dashed border-[#5B3CD8]/40"></div>
                    </>
                  ) : (
                    <img src={capturedImages[capturedImages.length - 1]} alt="Captured Final" className="w-full h-full object-cover rounded-full border-[6px] border-green-500" />
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-gray-500 bg-gray-50 px-4 py-2.5 rounded-xl mb-4 w-full border border-gray-100/50">
                   <svg className="w-4 h-4 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                   </svg>
                   {locationStr}
                </div>

                {verificationSuccess && (
                  <button 
                    onClick={handleAttendanceAction}
                    className={`w-full py-4 text-white text-[14px] tracking-wide font-bold rounded-[18px] active:scale-95 transition-transform ${punchAction === 'in' ? 'bg-green-500 shadow-[0_8px_16px_rgba(34,197,94,0.25)]' : 'bg-red-500 shadow-[0_8px_16px_rgba(239,68,68,0.25)]'}`}
                  >
                    Confirm Punch {punchAction === 'in' ? 'In' : 'Out'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Notifications Modal / Drawer */}
          {isNotifModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
              <div 
                className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#5B3CD8]/10 flex items-center justify-center text-[#5B3CD8]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-tight">Notifications</h3>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {unreadNotifCount > 0 ? `${unreadNotifCount} unread message${unreadNotifCount > 1 ? 's' : ''}` : 'All caught up'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-bold text-[#5B3CD8] hover:text-[#4A2EC4] px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                    <button 
                      onClick={() => setIsNotifModalOpen(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Notifications List Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
                  {loadingNotifs && notifications.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                      <div className="w-8 h-8 border-3 border-[#5B3CD8] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-medium">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                      <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-[#5B3CD8] mb-3">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">No Notifications</h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                        You will see alerts for leaves, attendance, and payslips here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isUnread = !notif.isRead;
                      return (
                        <div
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 items-start ${
                            isUnread 
                              ? 'bg-purple-50/40 border-purple-200/80 shadow-sm' 
                              : 'bg-white border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          {/* Type Icon */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            notif.type === 'Leave' 
                              ? 'bg-purple-100 text-[#5B3CD8]' 
                              : notif.type === 'Attendance'
                              ? 'bg-emerald-100 text-emerald-600'
                              : notif.type === 'Payroll'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-amber-100 text-amber-600'
                          }`}>
                            {notif.type === 'Leave' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                            {notif.type === 'Attendance' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {notif.type === 'Payroll' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {notif.type !== 'Leave' && notif.type !== 'Attendance' && notif.type !== 'Payroll' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                              </svg>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h4 className={`text-xs font-bold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notif.title}
                              </h4>
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-[#5B3CD8] shrink-0"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-600 leading-snug line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 inline-block">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-center">
                  <button
                    onClick={() => setIsNotifModalOpen(false)}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700 py-1.5 px-4"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
}