import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function MainLayout({ children }) {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="h-screen bg-[#F8F9FE] flex flex-col font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-24">
        {children}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-around items-center pt-3 pb-5 px-4 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgb(0,0,0,0.03)] shrink-0">
        <Link to="/dashboard" className="flex flex-col items-center gap-1 min-w-[64px]">
          <svg className={`w-6 h-6 ${path === '/dashboard' ? 'text-[#5B3CD8]' : 'text-gray-400'}`} fill={path === '/dashboard' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className={`text-[10px] ${path === '/dashboard' ? 'font-bold text-[#5B3CD8]' : 'font-medium text-gray-400'}`}>Dashboard</span>
        </Link>
        <Link to="/team" className="flex flex-col items-center gap-1 min-w-[64px]">
          <svg className={`w-6 h-6 ${path === '/team' ? 'text-[#5B3CD8]' : 'text-gray-400'}`} fill={path === '/team' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <span className={`text-[10px] ${path === '/team' ? 'font-bold text-[#5B3CD8]' : 'font-medium text-gray-400'}`}>My Team</span>
        </Link>
        <Link to="/leaves" className="flex flex-col items-center gap-1 min-w-[64px]">
          <svg className={`w-6 h-6 ${path === '/leaves' ? 'text-[#5B3CD8]' : 'text-gray-400'}`} fill={path === '/leaves' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          <span className={`text-[10px] ${path === '/leaves' ? 'font-bold text-[#5B3CD8]' : 'font-medium text-gray-400'}`}>Requests</span>
        </Link>
        <Link to="/settings" className="flex flex-col items-center gap-1 min-w-[64px]">
          <svg className={`w-6 h-6 ${path === '/settings' ? 'text-[#5B3CD8]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path  strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span className={`text-[10px] ${path === '/settings' ? 'font-bold text-[#5B3CD8]' : 'font-medium text-gray-400'}`}>Settings</span>
        </Link>
      </div>
    </div>
  );
}