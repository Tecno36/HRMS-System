import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import axios from '../../services/axios';
import MainLayout from '../../layouts/MainLayout';

export default function Attendance() {
  const history = useHistory();
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/attendance/history');
      if (response.data.status === 'success' && response.data.data) {
        setAttendanceHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = (date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(monday);
      nextDate.setDate(monday.getDate() + i);
      week.push(nextDate);
    }
    return week;
  };

  const currentWeekDates = getWeekDates(selectedDate);

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatTotalHours = (hoursDecimal, clockIn, clockOut) => {
    if (hoursDecimal && hoursDecimal > 0) {
      const hrs = Math.floor(hoursDecimal);
      const mins = Math.round((hoursDecimal - hrs) * 60);
      return `${hrs}h ${mins > 0 ? mins + 'm' : ''}`;
    }
    
    if (clockIn && clockOut) {
      const start = new Date(clockIn);
      const end = new Date(clockOut);
      const diffMs = end - start;
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hrs}h ${mins}m`;
    }

    return '--';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'half-day': 
      case 'half day': return 'bg-orange-50 text-orange-500 border-orange-100';
      case 'absent': return 'bg-red-50 text-red-500 border-red-100';
      case 'late': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const getSelectedDayRecord = () => {
    const record = attendanceHistory.find(item => 
      new Date(item.date).toDateString() === selectedDate.toDateString()
    );

    if (record) {
      return {
        status: record.status || (record.clockIn ? 'Present' : 'Absent'),
        checkIn: formatTime(record.clockIn),
        checkOut: formatTime(record.clockOut),
        total: formatTotalHours(record.totalHours, record.clockIn, record.clockOut)
      };
    }
    
    return { status: 'No Record', checkIn: '--:--', checkOut: '--:--', total: '--' };
  };

  const selectedRecord = getSelectedDayRecord();

  const changeWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  return (
    <MainLayout>
      <IonPage>
        <IonContent scrollY={false} className="ion-no-padding">
          <div className="h-full bg-[#F8F9FE] flex flex-col font-sans relative select-none">
            
            <div className="sticky top-0 z-30 bg-[#F8F9FE] shrink-0">
              <div className="bg-[#5B3CD8] pt-12 pb-14 px-5 rounded-b-[35px] relative z-10 shadow-md">
                <div className="flex items-center justify-between">
                  <button onClick={() => history.goBack()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h1 className="text-white font-bold text-lg">Attendance</h1>
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] pt-5 pb-6 px-4 mx-5 -mt-8 relative z-20 border border-gray-50">
                <div className="flex items-center justify-between mb-5 px-1">
                  <button onClick={() => changeWeek('prev')} className="active:scale-90 transition-transform p-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-sm font-bold text-gray-900">
                    {selectedDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => changeWeek('next')} className="active:scale-90 transition-transform p-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                <div className="flex justify-between items-center px-0.5">
                  {currentWeekDates.map((dateObj, index) => {
                    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    const isActive = dateObj.toDateString() === selectedDate.toDateString();
                    const isToday = dateObj.toDateString() === new Date().toDateString();
                    
                    return (
                      <div 
                        key={index} 
                        onClick={() => setSelectedDate(dateObj)}
                        className={`flex flex-col items-center justify-center w-[42px] h-14 rounded-2xl cursor-pointer transition-all ${isActive ? 'bg-[#5B3CD8] shadow-lg shadow-[#5B3CD8]/30' : (isToday ? 'bg-indigo-50' : 'bg-transparent')}`}
                      >
                        <span className={`text-[10px] mb-1 font-semibold ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{dayNames[index]}</span>
                        <span className={`text-sm font-bold ${isActive ? 'text-white' : (isToday ? 'text-[#5B3CD8]' : 'text-gray-800')}`}>{dateObj.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 mt-5">
                <div className="bg-white rounded-3xl p-5 shadow-[0_4px_25px_rgb(0,0,0,0.03)] border border-gray-50 mb-6 transition-all duration-300">
                  <div className="flex justify-between items-center mb-5 border-b border-gray-50 pb-4">
                    <h3 className="text-sm font-bold text-gray-900">
                      {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </h3>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border capitalize ${getStatusColor(selectedRecord.status)}`}>
                      {selectedRecord.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider">Check In</p>
                      <p className="text-sm font-bold text-emerald-600">{selectedRecord.checkIn}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider">Check Out</p>
                      <p className="text-sm font-bold text-[#5B3CD8]">{selectedRecord.checkOut}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider">Total Hours</p>
                      <p className="text-sm font-bold text-gray-900">{selectedRecord.total}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-sm font-bold text-gray-900">Attendance History</h2>
                  <span className="text-[11px] font-bold text-[#5B3CD8]">{attendanceHistory.length} Records</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-3">
              {loading ? (
                <p className="text-center text-xs text-gray-400 py-4">Loading history...</p>
              ) : attendanceHistory.length > 0 ? (
                attendanceHistory.map((record, index) => {
                  const recDate = new Date(record.date || record.createdAt);
                  const statusText = record.status || (record.clockIn ? 'Present' : 'Absent');
                  return (
                    <div key={index} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-[0_4px_15px_rgb(0,0,0,0.02)] border border-gray-50">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#F8F9FE] border border-gray-100 flex items-center justify-center text-[#5B3CD8]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">
                            {recDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            {formatTime(record.clockIn)} {record.clockOut && `- ${formatTime(record.clockOut)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border capitalize ${getStatusColor(statusText)}`}>
                          {statusText}
                        </span>
                        <span className="text-[11px] font-bold text-gray-900">
                          {formatTotalHours(record.totalHours, record.clockIn, record.clockOut)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 bg-white rounded-2xl border border-gray-50">
                  <p className="text-xs text-gray-400 font-semibold">No attendance records found.</p>
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-between items-center pt-3 pb-5 px-6 z-40 rounded-t-3xl shadow-[0_-10px_40px_rgb(0,0,0,0.03)] shrink-0">
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
              <Link to="/attendance" className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-[#5B3CD8]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                <span className="text-[10px] font-bold text-[#5B3CD8]">Attendance</span>
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