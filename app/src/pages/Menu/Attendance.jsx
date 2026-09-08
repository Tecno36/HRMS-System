import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import axios from '../../services/axios';
import MainLayout from '../../layouts/MainLayout';
import attendanceImg from '../../assets/image/attendanceImg.png';

export default function Attendance() {
  const history = useHistory();
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredHistory = attendanceHistory.filter((record) => {
    const recDate = new Date(record.date || record.createdAt);
    const dateString = recDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase();
    const statusText = (record.status || (record.clockIn ? 'Present' : 'Absent')).toLowerCase();
    const query = searchQuery.toLowerCase();

    return dateString.includes(query) || statusText.includes(query);
  });

  return (
    <MainLayout>
      <IonPage>
        <style>{`
          .hide-scroll::-webkit-scrollbar { display: none; }
          .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        <IonContent scrollY={false} className="ion-no-padding">
          <div className="absolute inset-0 bg-[#F8F9FE] flex flex-col font-sans select-none">
            
            <div className="sticky top-0 z-30 bg-[#F8F9FE] shrink-0">
              <div className="bg-gradient-to-br from-[#6C4CE0] to-[#5B3CD8] pt-12 pb-14 px-6 relative shadow-sm overflow-hidden">
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
                    <h1 className="text-white font-bold text-[22px] tracking-wide">Attendance</h1>
                  </div>
                  <div className="shrink-0 drop-shadow-lg">
                    <img src={attendanceImg} alt="Attendance" className="w-20 h-20 object-contain" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-t-[25px] shadow-[0_-8px_20px_rgba(0,0,0,0.02)] pt-5 pb-6 px-4 -mt-6 relative z-20 border border-gray-50">
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
                <div className="bg-white rounded-3xl p-5 shadow-[0_4px_25px_rgb(0,0,0,0.03)] border border-gray-50 mb-4 transition-all duration-300">
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

                {/* Flyon UI Search Box Starts Here */}
                <div className="mb-4 relative w-full">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by date (e.g., 10 Oct) or status..."
                    className="w-full bg-white border border-gray-200 rounded-xl py-3.5 ps-10 pe-4 text-[12px] text-gray-800 placeholder-gray-400 shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:border-[#5B3CD8] focus:ring-1 focus:ring-[#5B3CD8] outline-none box-border transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
                {/* Flyon UI Search Box Ends Here */}

                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-bold text-gray-900">Attendance History</h2>
                  <span className="text-[11px] font-bold text-[#5B3CD8]">{filteredHistory.length} Records</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-3 hide-scroll">
              {loading ? (
                <p className="text-center text-xs text-gray-400 py-4">Loading history...</p>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((record, index) => {
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

          </div>
        </IonContent>
      </IonPage>
    </MainLayout>
  );
}