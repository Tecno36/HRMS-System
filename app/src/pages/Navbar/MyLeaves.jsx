import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import axios from '../../services/axios';
import MainLayout from '../../layouts/MainLayout';
import leaveEmptyImg from '../../assets/image/leaveempty.jpg';

export default function MyLeaves() {
  const history = useHistory();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      const response = await axios.get('/leaves/my-leaves');
      if (response.data.status === 'success') {
        setLeaves(response.data.data);
      }
    } catch (error) {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'Rejected':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-orange-50 text-orange-500 border-orange-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
      case 'Rejected':
        return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
      default:
        return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  return (
    <MainLayout>
      <IonPage>
        <IonContent scrollY={false} className="ion-no-padding">
          <div className="h-full bg-[#F8F9FE] flex flex-col font-sans relative select-none">
            
            <div className="shrink-0 z-30 bg-[#F8F9FE] pb-2">
              <div className="bg-[#5B3CD8] pt-12 pb-14 px-5 rounded-b-[35px] relative shadow-md">
                <div className="flex items-center justify-between">
                  <button onClick={() => history.goBack()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h1 className="text-white font-bold text-lg">My Leaves</h1>
                  <Link to="/apply-leave" className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-28">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <svg className="animate-spin h-8 w-8 text-[#5B3CD8]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : leaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-12">
                  <img src={leaveEmptyImg} alt="No Leaves Found" className="w-56 h-56 object-contain mb-2" />
                  <h2 className="text-[16px] font-bold text-gray-900 mb-1">No Leaves Found</h2>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaves.map((leave) => (
                    <div key={leave._id} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_5px_25px_rgba(0,0,0,0.035)] p-4">
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#F0EDFF] flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <div>
                            <h3 className="text-[14px] font-bold text-gray-900">{leave.leaveType}</h3>
                            <p className="text-[11px] font-medium text-gray-400 mt-0.5">Applied on: {formatDate(leave.createdAt)}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${getStatusStyle(leave.status)}`}>
                          {getStatusIcon(leave.status)}
                          <span className="text-[10px] font-bold">{leave.status || 'Pending'}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-3 mb-4">
                        <div className="flex justify-between items-center">
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">From</p>
                            <p className="text-[12px] font-bold text-gray-800">{formatDate(leave.startDate)}</p>
                          </div>
                          <div className="flex flex-col items-center px-4">
                            <span className="text-[10px] font-bold text-[#5B3CD8] bg-white px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">{leave.totalDays} Days</span>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">To</p>
                            <p className="text-[12px] font-bold text-gray-800">{formatDate(leave.endDate)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="px-1">
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                          <span className="font-bold text-gray-700">Reason:</span> {leave.reason}
                        </p>
                      </div>

                    </div>
                  ))}
                </div>
              )}
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
              <Link to="/my-leaves" className="flex flex-col items-center gap-1">
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