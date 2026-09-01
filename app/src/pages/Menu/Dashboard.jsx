import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Geolocation } from '@capacitor/geolocation';
import axios from '../../services/axios';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', _id: '', id: '' };
  
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
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

  useEffect(() => {
    fetchTodayAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
      
      const response = await axios.post(endpoint, {});

      if (response.data.status === 'success') {
        setIsPunchModalOpen(false);
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
    setIsPunchModalOpen(true);
  };

  return (
    <IonPage>
      <IonContent scrollY={false} className="ion-no-padding">
        <div className="h-full w-full bg-[#F8F9FE] flex flex-col font-sans relative select-none">
          
          {/* Toasts */}
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

          {/* Sticky Top Section */}
          <div className="shrink-0 z-30 bg-[#F8F9FE] pb-2">
            {/* Header */}
            <div className="bg-[#5B3CD8] pt-12 pb-28 px-6 rounded-b-[40px]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40 overflow-hidden">
                    <span className="text-white font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-medium">Welcome back 👋</p>
                    <h1 className="text-white font-bold text-lg leading-tight">{user.name}</h1>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-white font-bold text-sm bg-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Overview Card (Sticky) */}
            <div className="px-6 -mt-20 relative z-20">
              <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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
                     className="w-full py-3.5 bg-gradient-to-r from-[#5B3CD8] to-[#7148FC] text-white font-bold rounded-2xl shadow-lg shadow-[#5B3CD8]/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                     Punch In
                   </button>
                )}

                {hasClockedIn && !hasClockedOut && (
                   <button 
                     onClick={() => openPunchModal('out')}
                     className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                     Punch Out
                   </button>
                )}

                {hasClockedIn && hasClockedOut && (
                   <button 
                     disabled
                     className="w-full py-3.5 bg-gray-100 text-green-600 font-bold rounded-2xl flex items-center justify-center gap-2 border border-green-200"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     Shift Completed
                   </button>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Bottom Section */}
          <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6 pt-2">
            
            <div className="grid grid-cols-4 gap-3">
              <Link to="/profile" className="bg-white p-3 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-[0_4px_20px_rgb(0,0,0,0.03)] active:scale-95 transition-transform">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-[#5B3CD8]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-[10px] font-semibold text-gray-700">Profile</span>
              </Link>
              <Link to="/attendance" className="bg-white p-3 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-[0_4px_20px_rgb(0,0,0,0.03)] active:scale-95 transition-transform">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-[10px] font-semibold text-gray-700">History</span>
              </Link>
              <Link to="/apply-leave" className="bg-white p-3 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-[0_4px_20px_rgb(0,0,0,0.03)] active:scale-95 transition-transform">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                </div>
                <span className="text-[10px] font-semibold text-gray-700">Apply</span>
              </Link>
              <Link to="/payslip" className="bg-white p-3 rounded-[20px] flex flex-col items-center justify-center gap-2 shadow-[0_4px_20px_rgb(0,0,0,0.03)] active:scale-95 transition-transform">
                <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-[10px] font-semibold text-gray-700">Payslip</span>
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-gray-900">Leave Balance</h2>
                <Link to="/leaves" className="text-[11px] font-bold text-[#5B3CD8]">View All</Link>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium">Casual Leave</p>
                    <p className="text-sm font-bold text-gray-900">04 <span className="text-xs font-medium text-gray-400">/ 12</span></p>
                  </div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-red-400 rounded-full"></div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium">Sick Leave</p>
                    <p className="text-sm font-bold text-gray-900">02 <span className="text-xs font-medium text-gray-400">/ 06</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Announcements</h2>
              <div className="flex gap-4 items-start border-b border-gray-100 pb-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <span className="text-orange-500 text-lg">🎉</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Upcoming Holiday: Diwali</h3>
                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Office will remain closed on 12th and 13th Nov. Happy Diwali in advance!</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-[#5B3CD8]/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#5B3CD8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Updated HR Policy</h3>
                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Please review the updated leave encashment policy on the portal.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Face Verification Modal (Fixed Overlay) */}
          {isPunchModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 flex flex-col items-center relative">
                <button 
                  onClick={() => setIsPunchModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 bg-gray-100 rounded-full p-1 z-20"
                  disabled={isVerifying}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h3 className="text-lg font-bold text-gray-900 mb-1 mt-2">Face Verification</h3>
                
                <p className={`text-xs font-bold mb-2 text-center ${verificationSuccess ? 'text-green-600' : (isVerifying ? 'text-orange-500' : 'text-[#5B3CD8]')}`}>
                  {validationMsg}
                </p>
                
                {!verificationSuccess && (
                  <div className="w-48 bg-gray-200 rounded-full h-1.5 mb-4 overflow-hidden">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${isVerifying ? 'bg-orange-400 animate-pulse w-full' : 'bg-[#5B3CD8]'}`} style={{ width: isVerifying ? '100%': `${scanPercentage}%` }}></div>
                  </div>
                )}

                <div className="relative w-64 h-64 mb-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 shadow-inner">
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
                      <div className="absolute inset-0 border-4 z-10 transition-colors duration-500 rounded-full border-dashed border-[#5B3CD8]/50"></div>
                    </>
                  ) : (
                    <img src={capturedImages[capturedImages.length - 1]} alt="Captured Final" className="w-full h-full object-cover rounded-full border-4 border-green-500" />
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-xl mb-4 w-full">
                   <svg className="w-4 h-4 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                   </svg>
                   {locationStr}
                </div>

                {verificationSuccess && (
                  <button 
                    onClick={handleAttendanceAction}
                    className={`w-full py-3 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all ${punchAction === 'in' ? 'bg-green-500 shadow-green-500/30' : 'bg-red-500 shadow-red-500/30'}`}
                  >
                    Confirm Punch {punchAction === 'in' ? 'In' : 'Out'}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
}