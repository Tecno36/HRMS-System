import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import axios from '../../services/axios';
import MainLayout from '../../layouts/MainLayout';
import leaveEmptyImg from '../../assets/image/leaveempty.jpg';
import calendarImg from '../../assets/image/calendar.png';

export default function MyLeaves() {
  const history = useHistory();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

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
        return 'bg-green-50 text-green-600';
      case 'Rejected':
        return 'bg-red-50 text-red-500';
      default:
        return 'bg-orange-50 text-orange-500';
    }
  };

  const getIconStyle = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('casual')) return { bg: 'bg-[#F0EDFF]', color: 'text-[#5B3CD8]', icon: 'palm' };
    if (lowerType.includes('sick')) return { bg: 'bg-green-50', color: 'text-[#22C55E]', icon: 'cross' };
    if (lowerType.includes('earn')) return { bg: 'bg-[#F0EDFF]', color: 'text-[#5B3CD8]', icon: 'plane' };
    if (lowerType.includes('compensatory')) return { bg: 'bg-sky-50', color: 'text-[#38BDF8]', icon: 'calendar' };
    if (lowerType.includes('loss') || lowerType.includes('pay')) return { bg: 'bg-red-50', color: 'text-[#EF4444]', icon: 'heart' };
    return { bg: 'bg-[#F0EDFF]', color: 'text-[#5B3CD8]', icon: 'palm' };
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filters = ['All', 'Pending', 'Approved', 'Rejected'];

  const filteredLeaves = leaves.filter((leave) => {
    if (activeFilter === 'All') return true;
    return (leave.status || 'Pending') === activeFilter;
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

            <div className="shrink-0 z-30 bg-[#F8F9FE]">
              <div className="bg-gradient-to-br from-[#6C4CE0] to-[#5B3CD8] pt-12 pb-9 px-6 relative shadow-md overflow-hidden">
                <div className="absolute top-6 right-24 w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                <div className="absolute top-16 right-10 w-1 h-1 bg-white/50 rounded-full"></div>
                <div className="absolute top-24 right-28 w-1 h-1 bg-white/40 rounded-full"></div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => history.goBack()}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <div>
                      <h1 className="text-white font-bold text-2xl leading-tight">My Leaves</h1>
                      <p className="text-white/70 text-[12px] font-medium mt-1">Manage your leaves and view details</p>
                    </div>
                    <img src={calendarImg} alt="Calendar" className="w-20 h-20 object-contain drop-shadow-md shrink-0" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-t-[25px] -mt-5 relative z-10 pt-6 flex items-center gap-2 px-5 pb-1 overflow-x-auto hide-scroll shadow-[0_-8px_20px_rgba(0,0,0,0.02)]">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors ${
                      activeFilter === filter
                        ? 'bg-[#5B3CD8] text-white shadow-sm'
                        : 'bg-white text-gray-500 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-3 pb-32 hide-scroll">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <svg className="animate-spin h-8 w-8 text-[#5B3CD8]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : filteredLeaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-12">
                  <img src={leaveEmptyImg} alt="No Leaves Found" className="w-56 h-56 object-contain mb-2" />
                  <h2 className="text-[16px] font-bold text-gray-900 mb-1">No Leaves Found</h2>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLeaves.map((leave) => {
                    const iconStyle = getIconStyle(leave.leaveType);
                    const isExpanded = expandedId === leave._id;
                    
                    return (
                      <div
                        key={leave._id}
                        className="bg-white rounded-[24px] border border-gray-50 shadow-[0_5px_25px_rgba(0,0,0,0.035)] p-4 transition-all duration-300 overflow-hidden"
                      >
                        <div onClick={() => toggleExpand(leave._id)} className="flex items-center gap-3 cursor-pointer">
                          <div className={`w-11 h-11 rounded-full ${iconStyle.bg} flex items-center justify-center shrink-0`}>
                            {renderTypeIcon(iconStyle.icon, `w-5 h-5 ${iconStyle.color}`)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-[14px] font-bold text-gray-900 truncate">{leave.leaveType}</h3>
                              <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${getStatusStyle(leave.status)}`}>
                                {leave.status || 'Pending'}
                              </span>
                            </div>
                            <p className="text-[12px] text-gray-400 font-medium mt-1">
                              {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                            </p>
                            <span className="inline-block mt-2 text-[10px] font-bold text-[#5B3CD8] bg-[#F0EDFF] px-2.5 py-1 rounded-full">
                              {leave.totalDays} {leave.totalDays === 1 ? 'Day' : 'Days'}
                            </span>
                          </div>

                          <svg className={`w-4 h-4 text-gray-300 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-100/80 animate-fade-in-down">
                            <h4 className="text-[10px] font-bold text-gray-500 mb-4 uppercase tracking-widest pl-1">Status Tracking</h4>
                            <div className="pl-2">
                              
                              <div className="relative flex items-start gap-4 pb-5">
                                <div className="absolute left-[3px] top-[14px] bottom-[-4px] w-[2px] bg-[#5B3CD8]"></div>
                                <div className="w-[8px] h-[8px] rounded-full bg-[#5B3CD8] ring-4 ring-[#F0EDFF] mt-1.5 shrink-0 relative z-10"></div>
                                <div>
                                  <p className="text-[12px] font-bold text-gray-900 leading-none">Request Submitted</p>
                                  <p className="text-[10px] text-gray-500 font-medium mt-1">{formatDate(leave.createdAt)}</p>
                                </div>
                              </div>

                              <div className="relative flex items-start gap-4 pb-5">
                                <div className={`absolute left-[3px] top-[14px] bottom-[-4px] w-[2px] ${leave.status === 'Pending' ? 'bg-gray-100' : 'bg-[#5B3CD8]'}`}></div>
                                <div className={`w-[8px] h-[8px] rounded-full mt-1.5 shrink-0 relative z-10 ${leave.status === 'Pending' ? 'bg-[#F97316] ring-4 ring-[#FFF3E0]' : 'bg-[#5B3CD8] ring-4 ring-[#F0EDFF]'}`}></div>
                                <div>
                                  <p className="text-[12px] font-bold text-gray-900 leading-none">HR Review</p>
                                  <p className="text-[10px] text-gray-500 font-medium mt-1">
                                    {leave.status === 'Pending' ? 'Pending for review' : 'Review completed'}
                                  </p>
                                </div>
                              </div>

                              <div className="relative flex items-start gap-4">
                                <div className={`w-[8px] h-[8px] rounded-full mt-1.5 shrink-0 relative z-10 ${leave.status === 'Approved' ? 'bg-[#22C55E] ring-4 ring-[#E5F7ED]' : leave.status === 'Rejected' ? 'bg-[#EF4444] ring-4 ring-[#FEECEB]' : 'bg-gray-300 ring-4 ring-gray-50'}`}></div>
                                <div>
                                  <p className="text-[12px] font-bold text-gray-900 leading-none">Final Approval</p>
                                  <p className={`text-[10px] font-medium mt-1 ${leave.status === 'Approved' ? 'text-[#22C55E]' : leave.status === 'Rejected' ? 'text-[#EF4444]' : 'text-gray-400'}`}>
                                    {leave.status === 'Approved' ? 'Leave Approved' : leave.status === 'Rejected' ? 'Leave Rejected' : 'Waiting for approval'}
                                  </p>
                                </div>
                              </div>

                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              to="/apply-leave"
              className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#5B3CD8] flex items-center justify-center text-white shadow-lg shadow-[#5B3CD8]/40 active:scale-95 transition-transform z-40"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Link>

          </div>
        </IonContent>
      </IonPage>
    </MainLayout>
  );
}