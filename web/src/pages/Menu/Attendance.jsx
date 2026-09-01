import { useState, useEffect } from 'react';
import axios from '../../services/axios';
import emptyImg from '../../assets/web/attempty.jpg';

const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Attendance() {
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, halfDay: 0 });

  const fetchAttendance = async (date) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/attendance/company-report?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseData = res.data;
      
      const records = Array.isArray(responseData) 
        ? responseData 
        : (Array.isArray(responseData?.data) ? responseData.data : []);

      setAttendanceList(records);

      const present = records.filter(item => item.status === 'Present').length;
      const late = records.filter(item => item.status === 'Late').length;
      const halfDay = records.filter(item => item.status === 'Half-day').length;
      
      setStats({
        total: records.length,
        present: present,
        late: late,
        halfDay: halfDay
      });

      setError('');
    } catch (err) {
      setError('Failed to fetch attendance report');
      setAttendanceList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate]);

  const filteredList = Array.isArray(attendanceList) ? attendanceList.filter(item => {
    const empName = item.employee?.name?.toLowerCase() || '';
    const empId = item.employee?.employeeId?.toLowerCase() || '';
    const empDept = item.employee?.department?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return empName.includes(search) || empId.includes(search) || empDept.includes(search);
  }) : [];

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  const formatWorkedHours = (checkIn, checkOut, recordDate) => {
    if (!checkIn) return '-';
    
    const todayStr = getLocalDateString();
    const recordDateStr = new Date(recordDate).toISOString().split('T')[0];
    const isToday = todayStr === recordDateStr || selectedDate === todayStr;

    if (!checkOut) {
      if (isToday) {
        const start = new Date(checkIn);
        const diffMs = new Date() - start;
        if (diffMs < 0) return '-';
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs / (1000 * 60)) % 60);
        return `${hrs}h ${mins}m`;
      } else {
        return 'Missed';
      }
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end - start;
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs / (1000 * 60)) % 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Records', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { title: 'Present', value: stats.present, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Late Arrivals', value: stats.late, color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'Half Day', value: stats.halfDay, color: 'text-blue-600', bg: 'bg-blue-50' }
        ].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500">{stat.title}</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Daily Attendance Report</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Detailed log of all employee check-ins.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="form-control w-full sm:w-64">
            <label className="label hidden sm:flex">
              <span className="label-text font-bold text-gray-700">Search Employee</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <input 
                type="text" 
                placeholder="Name, ID or Dept..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full pl-10 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 rounded-xl font-bold text-sm px-4 py-2.5"
              />
            </div>
          </div>

          <div className="form-control w-full sm:w-auto">
            <label className="label hidden sm:flex">
              <span className="label-text font-bold text-gray-700">Filter by Date</span>
            </label>
            <div className="relative">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input input-bordered w-full bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 rounded-xl font-bold text-sm px-4 py-2.5"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-5 rounded-tl-3xl">Employee</th>
                <th className="px-6 py-5">Department</th>
                <th className="px-6 py-5">Clock In</th>
                <th className="px-6 py-5">Clock Out</th>
                <th className="px-6 py-5">Total Hours</th>
                <th className="px-6 py-5 text-center rounded-tr-3xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-400 font-medium">Loading...</td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((item) => {
                  const todayStr = getLocalDateString();
                  const isPastDateWithoutPunchOut = !item.clockOut && selectedDate !== todayStr;
                  
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 shadow-sm">
                            {item.employee?.name ? item.employee.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{item.employee?.name || 'Unknown'}</p>
                            <p className="text-xs font-bold text-gray-400 mt-0.5">{item.employee?.employeeId || item.employee?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                          {item.employee?.department || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {item.clockIn ? new Date(item.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {item.clockOut ? (
                          <span className="text-gray-700 font-medium">{new Date(item.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : isPastDateWithoutPunchOut ? (
                          <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-100">Missed Punch Out</span>
                        ) : (
                          <span className="text-emerald-500 font-bold text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-bold">
                        {formatWorkedHours(item.clockIn, item.clockOut, item.date)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${
                          item.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          item.status === 'Late' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          item.status === 'Half-day' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-2 py-2 text-center py-10">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <img src={emptyImg} alt="No records" className="w-60 h-60 object-contain opacity-75" />
                      <p className="text-gray-400 font-medium text-sm">
                        {searchTerm ? 'No matching records found.' : 'No attendance records found for this date.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
            <span className="text-sm font-bold text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredList.length)} of {filteredList.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-bold text-gray-900 bg-indigo-50 border border-indigo-100 rounded-lg">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}