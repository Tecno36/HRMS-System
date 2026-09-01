import { useState, useEffect } from 'react';
import axios from '../../services/axios';
import emptyLeaveImg from '../../assets/web/leaveempty.jpg';

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // 1. New States for Search, Filter & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/leaves/company-leaves', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setLeaves(data);

      const pending = data.filter(item => item.status === 'Pending').length;
      const approved = data.filter(item => item.status === 'Approved').length;
      const rejected = data.filter(item => item.status === 'Rejected').length;

      setStats({
        total: data.length,
        pending,
        approved,
        rejected
      });
      setError('');
    } catch (err) {
      setError('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // 2. Reset page to 1 when searching or filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/leaves/update-status/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLeaves();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // 3. Logic for Search & Filter
  const filteredLeaves = leaves.filter(item => {
    const matchesSearch = item.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // 4. Logic for Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLeaves.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 relative">
      
      {/* Stats Cards - No changes here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Requests', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { title: 'Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'Approved', value: stats.approved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Rejected', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50' }
        ].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500">{stat.title}</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
          </div>
        ))}
      </div>

      {/* Header with Search and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Leave Management</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Review and manage employee leave applications.</p>
        </div>
        
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
            />
          </div>
          
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-5 rounded-tl-3xl">Employee</th>
                <th className="px-6 py-5">Leave Type</th>
                <th className="px-6 py-5">From - To</th>
                <th className="px-6 py-5">Reason</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-center rounded-tr-3xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-400 font-medium">Loading leave requests...</td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 shadow-sm">
                          {item.employee?.name ? item.employee.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.employee?.name || 'Unknown'}</p>
                          <p className="text-xs font-bold text-gray-400 mt-0.5">{item.employee?.department || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1.5 bg-purple-50 border border-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                        {item.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium max-w-xs truncate" title={item.reason}>
                      {item.reason}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${
                        item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        item.status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                        'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.status === 'Pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleStatusUpdate(item._id, 'Approved')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(item._id, 'Rejected')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-gray-400">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-2 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <img src={emptyLeaveImg} alt="No leave requests" className="w-72 h-72 object-contain opacity-75" />
                      <p className="text-gray-400 font-medium text-sm">
                        {searchTerm ? 'No results found for your search.' : 'No leave requests found.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && filteredLeaves.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-3xl">
            <span className="text-sm font-bold text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLeaves.length)} of {filteredLeaves.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPrev} 
                disabled={currentPage === 1} 
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Prev
              </button>
              
              <div className="flex items-center gap-1 hidden sm:flex">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                  <button 
                    key={num} 
                    onClick={() => paginate(num)} 
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                      currentPage === num 
                        ? 'bg-[#101a3d] text-white shadow-md' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button 
                onClick={goToNext} 
                disabled={currentPage === totalPages} 
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
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