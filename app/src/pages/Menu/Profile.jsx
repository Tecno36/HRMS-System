import React, { useState, useEffect, useRef } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axios from '../../services/axios';
import MainLayout from '../../layouts/MainLayout';

export default function Profile() {
  const history = useHistory();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || {
      name: 'User',
      email: '--',
      role: 'Employee',
      employeeId: 'Not Assigned',
      phone: 'Not Added',
      department: 'Not Assigned',
      designation: 'Employee',
      shift: 'General',
      manager: 'Not Assigned',
      joinDate: '--',
      location: 'Not Added',
      avatar: ''
    }
  );

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/auth/profile');

      if (response.data && response.data.status === 'success') {
        const userData = response.data.data;
        let formattedJoinDate = '--';

        if (userData.createdAt) {
          const date = new Date(userData.createdAt);
          formattedJoinDate = date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        }

        const hrName =
          userData.assignedHR && userData.assignedHR.name
            ? userData.assignedHR.name
            : 'Not Assigned';

        const updatedUser = {
          name: userData.name || 'User',
          email: userData.email || '--',
          role: userData.role || 'Employee',
          employeeId: userData.employeeId || 'Not Assigned',
          phone: userData.phone || 'Not Added',
          department: userData.department || 'Not Assigned',
          designation: userData.designation || userData.role || 'Employee',
          manager: hrName,
          joinDate: formattedJoinDate,
          shift: userData.shift || 'General',
          location: userData.address || 'Not Added',
          avatar: userData.avatar || '',
          mPinSet: userData.mPin ? true : false,
          isBiometricEnabled: userData.isBiometricEnabled ? true : false
        };

        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.log('Error fetching profile data');
    }
  };

  const getInitials = () => {
    if (!user.name) return 'U';
    const words = user.name.trim().split(' ');
    if (words.length > 1) {
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        setUser({ ...user, avatar: base64Image });
        
        try {
          await axios.put('/auth/update-profile', { avatar: base64Image });
          const updatedUser = { ...user, avatar: base64Image };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
          console.log('Error saving profile image');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <MainLayout>
      <IonPage>
        <IonContent scrollY={false} className="ion-no-padding">
          <div className="h-full bg-[#F8F9FE] flex flex-col font-sans relative select-none">
            
            <div className="shrink-0 z-30 bg-[#F8F9FE] pb-6">
              <div className="bg-[#5B3CD8] pt-12 pb-20 px-5 rounded-b-[40px] relative shadow-sm">
                
                <div className="flex items-center justify-between relative z-20">
                   <button onClick={() => history.goBack()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h1 className="text-white font-medium text-lg">My Profile</h1>
                  <button className="p-2 -mr-2 text-white active:scale-95 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                </div>

                <div className="flex flex-col items-center mt-6 relative z-20">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center p-1 shadow-lg relative overflow-hidden">
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-full">
                          <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                      {user.avatar ? (
                        <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center">
                          <span className="text-[#5B3CD8] text-3xl font-bold">{getInitials()}</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={triggerImageUpload}
                      disabled={isUploading}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 active:scale-95 transition-transform"
                    >
                      <svg className="w-4 h-4 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  <h2 className="text-white text-xl font-bold mt-4">
                    {user.name}
                  </h2>
                  <div className="bg-white/20 px-4 py-1.5 rounded-full mt-2">
                    <span className="text-white text-[12px] font-medium">{user.designation}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-5 px-4 grid grid-cols-3 mx-5 -mt-10 relative z-40 border border-gray-50">
                <div className="text-center flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium mb-1">Employee ID</span>
                  <p className="text-[12px] font-bold text-gray-900">{user.employeeId}</p>
                </div>

                <div className="text-center flex flex-col items-center border-l border-r border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium mb-1">Joined On</span>
                  <p className="text-[12px] font-bold text-gray-900">{user.joinDate}</p>
                </div>

                <div className="text-center flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium mb-1">Shift</span>
                  <p className="text-[12px] font-bold text-gray-900">{user.shift}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-0 pb-24">
              
              <div className="mb-6">
                <h3 className="text-[15px] font-bold text-gray-900 mb-3 px-1">Contact Information</h3>
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                  
                  <div className="flex items-center gap-4 p-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-[#F0EDFF] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-500">Email Address</p>
                      <p className="text-[14px] font-semibold text-gray-900 mt-0.5 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF9F4] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-gray-500">Phone Number</p>
                      <p className="text-[14px] font-semibold text-gray-900 mt-0.5">{user.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF5EB] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-gray-500">Location</p>
                      <p className="text-[14px] font-semibold text-gray-900 mt-0.5">{user.location}</p>
                    </div>
                  </div>

                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-[15px] font-bold text-gray-900 mb-3 px-1">Work Information</h3>
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                  
                  <div className="flex items-center gap-4 p-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-[#F0EDFF] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-gray-500">Department</p>
                      <p className="text-[14px] font-semibold text-gray-900 mt-0.5">{user.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF9F4] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-gray-500">Designation</p>
                      <p className="text-[14px] font-semibold text-gray-900 mt-0.5">{user.designation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF7FF] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-gray-500">Reporting To</p>
                      <p className="text-[14px] font-semibold text-gray-900 mt-0.5">{user.manager}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF5EB] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-gray-500">Work Shift</p>
                      <p className="text-[14px] font-semibold text-gray-900 mt-0.5">{user.shift}</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </IonContent>
      </IonPage>
    </MainLayout>
  );
}