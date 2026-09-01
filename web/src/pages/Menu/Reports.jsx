import { useState, useMemo } from 'react';
import axios from '../../services/axios';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import reportEmptyImg from '../../assets/web/reportempty.jpg';

export default function Reports() {
  const [reportType, setReportType] = useState('attendance');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/reports/${reportType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data || []);
      setSearchTerm('');
      setCurrentPage(1);
    } catch (err) {
      alert("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${reportType}_report.xlsx`);
  };

  const dataKeyName = reportType === 'payroll' ? 'netSalary' : 'count';
  const categoryLabel = reportType === 'payroll' ? 'Month' : reportType === 'employees' ? 'Department' : 'Category / Status';
  const valueLabel = reportType === 'payroll' ? 'Total Salary (₹)' : 'Total Count';

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const idMatch = String(item._id || '').toLowerCase().includes(searchLower);
      const valMatch = String(item[dataKeyName] || '').toLowerCase().includes(searchLower);
      return idMatch || valMatch;
    });
  }, [data, searchTerm, dataKeyName]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
    setData([]);
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
      
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Analytics Reports</h1>
          <p className="text-sm font-medium text-gray-500">Generate and export company insights.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select 
            className="select select-bordered bg-gray-50 rounded-xl font-bold"
            value={reportType}
            onChange={handleReportTypeChange}
          >
            <option value="attendance">Attendance Report</option>
            <option value="payroll">Payroll Report</option>
            <option value="leaves">Leave Management Report</option>
            <option value="employees">Employee Department Report</option>
          </select>
          <button onClick={fetchReport} className="btn btn-gradient btn-success">
            {loading ? 'Loading...' : 'Generate'}
          </button>
          <button 
            onClick={exportToExcel} 
            disabled={data.length === 0}
            className={`btn btn-gradient btn-accent ${data.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-black text-gray-900 mb-6 capitalize">{reportType} Visualization</h2>
        
        {data.length > 0 ? (
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey={dataKeyName} fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 py-10">
            <img src={reportEmptyImg} alt="No report data" className="w-64 h-64 object-contain opacity-75" />
            <p className="text-gray-400 font-medium text-sm">No data available. Click Generate to load the report.</p>
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-black text-gray-900">Detailed Data View</h3>
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search records..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-5">{categoryLabel}</th>
                  <th className="px-6 py-5 text-right">{valueLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {currentRows.length > 0 ? (
                  currentRows.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{row._id || 'N/A'}</td>
                      <td className="px-6 py-4 font-medium text-gray-600 text-right">
                        {reportType === 'payroll' ? `₹ ${row[dataKeyName]?.toLocaleString('en-IN')}` : row[dataKeyName]}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="px-6 py-8 text-center text-gray-400 font-medium">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
              <p className="text-xs font-bold text-gray-500">
                Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredData.length)} of {filteredData.length} entries
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => handlePageChange('prev')} 
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-black border border-indigo-100">
                  {currentPage} / {totalPages}
                </div>
                <button 
                  onClick={() => handlePageChange('next')} 
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}