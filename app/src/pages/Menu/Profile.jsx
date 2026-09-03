import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import axios from '../../services/axios';
import MainLayout from '../../layouts/MainLayout';

export default function Profile() {
  const history = useHistory();

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
    }
  );

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
          designation: userData.role || 'Employee',
          manager: hrName,
          joinDate: formattedJoinDate,
          shift: 'General',
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const getInitials = () => {
    if (!user.name) return 'U';
    const words = user.name.trim().split(' ');
    if (words.length > 1) {
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <MainLayout>
      <IonPage>
        <IonContent scrollY={false} className="ion-no-padding">
          <div className="h-full bg-[#F8F9FE] flex flex-col font-sans relative select-none">
            
            <div className="shrink-0 z-30 bg-[#F8F9FE] pb-2">
              <div className="bg-[#5B3CD8] pt-12 pb-16 px-5 rounded-b-[35px] relative shadow-md">
                <div className="flex items-center justify-between">
                  <button onClick={() => history.goBack()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h1 className="text-white font-bold text-lg">My Profile</h1>
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>

                <div className="flex flex-col items-center mt-6">
                  <div className="w-[82px] h-[82px] rounded-[26px] bg-white p-1 shadow-xl">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full rounded-[22px] object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[22px] bg-gradient-to-br from-[#EEE9FF] to-[#DCD4FF] flex items-center justify-center">
                        <span className="text-[#5B3CD8] text-2xl font-bold">
                          {getInitials()}
                        </span>
                      </div>
                    )}
                  </div>

                  <h2 className="text-white text-[18px] font-bold mt-3">
                    {user.name}
                  </h2>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-white/90 text-[11px] font-medium">
                      {user.designation}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/50" />
                    <span className="text-white/70 text-[11px]">
                      {user.department}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 grid grid-cols-3 mx-5 -mt-8 relative z-20 border border-gray-50">
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                      Employee ID
                    </span>
                  </div>
                  <p className="text-[12px] font-bold text-gray-900 truncate px-1">
                    {user.employeeId}
                  </p>
                </div>

                <div className="border-l border-gray-100 text-center">
                  <div className="flex justify-center mb-1">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                      Joined
                    </span>
                  </div>
                  <p className="text-[12px] font-bold text-gray-900">
                    {user.joinDate}
                  </p>
                </div>

                <div className="border-l border-gray-100 text-center">
                  <div className="flex justify-center mb-1">
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                      Shift
                    </span>
                  </div>
                  <p className="text-[12px] font-bold text-gray-900">
                    {user.shift}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-3 pb-24">
              <div className="mb-5">
                <div className="flex items-center justify-between px-1 mb-3">
                  <div>
                    <p className="text-[10px] text-[#5B3CD8] font-bold uppercase tracking-wider">
                      Personal
                    </p>
                    <h3 className="text-[16px] font-bold text-gray-900">
                      Personal Information
                    </h3>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_5px_25px_rgba(0,0,0,0.035)] overflow-hidden">
                  <div className="flex items-center gap-3.5 p-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-[#F0EDFF] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                        Email Address
                      </p>
                      <p className="text-[13px] font-semibold text-gray-900 mt-0.5 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF9F4] flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                        Phone Number
                      </p>
                      <p className="text-[13px] font-semibold text-gray-900 mt-0.5">
                        {user.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF6E6] flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                        Account Role
                      </p>
                      <p className="text-[13px] font-semibold text-gray-900 mt-0.5">
                        {user.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <div className="px-1 mb-3">
                  <p className="text-[10px] text-[#5B3CD8] font-bold uppercase tracking-wider">
                    Employment
                  </p>
                  <h3 className="text-[16px] font-bold text-gray-900">
                    Work Information
                  </h3>
                </div>

                <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_5px_25px_rgba(0,0,0,0.035)] p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-[#F8F7FC] p-3.5 border border-gray-50">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm mb-2.5">
                        <svg className="w-4 h-4 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                      </div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-gray-400">
                        Department
                      </p>
                      <p className="text-[12px] font-bold text-gray-900 mt-1 truncate">
                        {user.department}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F8F7FC] p-3.5 border border-gray-50">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm mb-2.5">
                        <svg className="w-4 h-4 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      </div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-gray-400">
                        Designation
                      </p>
                      <p className="text-[12px] font-bold text-gray-900 mt-1 truncate">
                        {user.designation}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F8F7FC] p-3.5 border border-gray-50">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm mb-2.5">
                        <svg className="w-4 h-4 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      </div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-gray-400">
                        Reporting HR
                      </p>
                      <p className="text-[12px] font-bold text-gray-900 mt-1 truncate">
                        {user.manager}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F8F7FC] p-3.5 border border-gray-50">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm mb-2.5">
                        <svg className="w-4 h-4 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      </div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-gray-400">
                        Work Shift
                      </p>
                      <p className="text-[12px] font-bold text-gray-900 mt-1">
                        {user.shift}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <div className="px-1 mb-3">
                  <p className="text-[10px] text-[#5B3CD8] font-bold uppercase tracking-wider">
                    Account
                  </p>
                  <h3 className="text-[16px] font-bold text-gray-900">
                    Account Settings
                  </h3>
                </div>

                <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_5px_25px_rgba(0,0,0,0.035)] overflow-hidden">
                  <Link
                    to="/change-password"
                    className="flex items-center gap-3.5 px-4 py-4 border-b border-gray-50 active:bg-gray-50 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F0EDFF] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#5B3CD8]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-gray-900">
                        Change Password
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Update your account password
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </Link>

                  <Link
                    to="/help"
                    className="flex items-center gap-3.5 px-4 py-4 active:bg-gray-50 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#EEF7FF] flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-gray-900">
                        Help & Support
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Get help with your HRMS account
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </Link>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-[18px] bg-red-50 border border-red-100 text-red-600 text-[13px] font-bold active:scale-[0.98] transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                Log Out
              </button>
            </div>

          </div>
        </IonContent>
      </IonPage>
    </MainLayout>
  );
}