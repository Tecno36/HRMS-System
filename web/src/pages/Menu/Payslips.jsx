import { useState, useEffect } from 'react';
import axios from '../../services/axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import emptyPayslipImg from '../../assets/web/payempty.jpg'; 

export default function Payslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/payroll/my-payslips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayslips(res.data);
    } catch (err) {
      console.error("Error fetching payslips", err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (payroll) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Salary Slip", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Month: ${payroll.month} ${payroll.year}`, 20, 30);
    doc.text(`Status: ${payroll.status}`, 20, 37);
    doc.autoTable({
      startY: 50,
      head: [['Description', 'Details']],
      body: [
        ['Basic Salary', `Rs.${payroll.basicSalary}`],
        ['Days Worked', payroll.daysWorked],
        ['Net Salary', `Rs.${payroll.netSalary}`],
      ],
    });
    doc.text("Authorized Signature", 150, 150);
    doc.save(`Payslip_${payroll.month}_${payroll.year}.pdf`);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': 
        return <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold tracking-wide">Paid</span>;
      case 'pending': 
        return <span className="inline-flex px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold tracking-wide">Pending</span>;
      default: 
        return <span className="inline-flex px-3 py-1 bg-gray-50 text-gray-700 border border-gray-100 rounded-lg text-xs font-bold tracking-wide">{status || 'N/A'}</span>;
    }
  };

  const filteredData = payslips.filter(p => 
    `${p.month} ${p.year} ${p.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Payroll Management</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">View and download your monthly salary slips.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <input 
            type="text" 
            placeholder="Search month, year or status..." 
            className="input input-bordered w-full bg-gray-50 border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-5 rounded-tl-3xl">Month</th>
                <th className="px-6 py-5">Basic Salary</th>
                <th className="px-6 py-5">Days Worked</th>
                <th className="px-6 py-5">Net Salary</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-center rounded-tr-3xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-16 text-center text-gray-400 font-medium">Loading...</td></tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-900">{p.month} {p.year}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">₹{p.basicSalary}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{p.daysWorked}</td>
                    <td className="px-6 py-4 font-black text-emerald-600">₹{p.netSalary}</td>
                    <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => generatePDF(p)} 
                        className="px-5 py-2.5 bg-[#101a3d] hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 mx-auto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <img src={emptyPayslipImg} alt="No payslips" className="w-64 h-64 object-contain opacity-80" />
                      <p className="text-gray-400 font-medium text-sm mt-4">No payslips found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-100 flex justify-center items-center gap-4 bg-gray-50/30">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-5 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-sm font-bold disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Prev
            </button>
            <span className="px-4 py-2 font-bold text-sm text-gray-700 bg-white border border-gray-100 rounded-lg shadow-sm">
              {currentPage} <span className="text-gray-400 mx-1">/</span> {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-5 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-sm font-bold disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm flex items-center gap-1"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}