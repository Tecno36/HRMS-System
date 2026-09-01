import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchModal({ isOpen, onClose, data }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredResults = data.filter((item) => 
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.module.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-20">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center px-4 border-b border-gray-100">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            autoFocus
            type="text"
            placeholder="Search employees, documents..."
            className="w-full px-4 py-4 bg-transparent border-none outline-none text-sm font-medium text-gray-900"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500">ESC</kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {query.length > 0 ? (
            filteredResults.length > 0 ? (
              filteredResults.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => { navigate(item.path); onClose(); }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 cursor-pointer group transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-700">{item.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.module}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-sm text-gray-400 font-medium">No results found.</p>
            )
          ) : (
            <p className="p-4 text-center text-sm text-gray-400 font-medium">Type to search...</p>
          )}
        </div>
      </div>
    </div>
  );
}