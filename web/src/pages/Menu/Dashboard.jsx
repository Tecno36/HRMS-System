import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import axios from '../../services/axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    departmentsCount: 0
  });
  const [departmentData, setDepartmentData] = useState([]);
  const [genderData, setGenderData] = useState([
    { name: 'Male', value: 0, color: '#0ea5e9' },
    { name: 'Female', value: 0, color: '#10b981' },
  ]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const empRes = await axios.get('/employee/employee-list', { headers });
        const employees = empRes.data || [];

        const total = employees.length;
        const deptMap = {};
        const genderMap = { Male: 0, Female: 0, Other: 0 };
        const birthdays = [];

        const today = new Date();

        employees.forEach(emp => {
          const dept = emp.department || 'Other';
          deptMap[dept] = (deptMap[dept] || 0) + 1;

          const gender = emp.gender || 'Male';
          if (genderMap[gender] !== undefined) {
            genderMap[gender]++;
          } else {
            genderMap['Other'] = (genderMap['Other'] || 0) + 1;
          }

          if (emp.dob) {
            const dobDate = new Date(emp.dob);
            const birthMonth = dobDate.getMonth();
            const birthDay = dobDate.getDate();

            const birthThisYear = new Date(today.getFullYear(), birthMonth, birthDay);
            if (birthThisYear < today) {
              birthThisYear.setFullYear(today.getFullYear() + 1);
            }
            const diffTime = birthThisYear - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 30) {
              birthdays.push({
                name: emp.name,
                department: emp.department,
                date: dobDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                daysLeft: diffDays
              });
            }
          }
        });

        birthdays.sort((a, b) => a.daysLeft - b.daysLeft);

        const formattedDepts = Object.keys(deptMap).map(name => ({
          name,
          value: deptMap[name]
        }));

        const formattedGender = [
          { name: 'Male', value: genderMap.Male, color: '#0ea5e9' },
          { name: 'Female', value: genderMap.Female, color: '#10b981' }
        ];

        setDepartmentData(formattedDepts);
        setGenderData(formattedGender);
        setUpcomingBirthdays(birthdays.slice(0, 5));

        let leavesList = [];
        let onLeaveCount = 0;
        let pendingCount = 0;

        try {
          const leaveRes = await axios.get('/leave/list', { headers });
          const allLeaves = leaveRes.data || [];

          const currentDateStr = today.toISOString().split('T')[0];

          allLeaves.forEach(l => {
            if (l.status === 'Approved') {
              const start = l.startDate ? l.startDate.split('T')[0] : '';
              const end = l.endDate ? l.endDate.split('T')[0] : '';
              if (currentDateStr >= start && currentDateStr <= end) {
                onLeaveCount++;
              }
            }
            if (l.status === 'Pending') {
              pendingCount++;
            }
          });

          leavesList = allLeaves.map(l => ({
            name: l.employee?.name || l.name || 'Employee',
            type: l.leaveType || 'Casual Leave',
            dates: `${l.startDate ? new Date(l.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} - ${l.endDate ? new Date(l.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`,
            img: (l.employee?.name || l.name || 'E').charAt(0).toUpperCase()
          }));
        } catch (e) {
          try {
            const leaveRes2 = await axios.get('/leaves', { headers });
            const allLeaves = leaveRes2.data || [];
            leavesList = allLeaves.map(l => ({
              name: l.employee?.name || l.name || 'Employee',
              type: l.leaveType || 'Casual Leave',
              dates: `${l.startDate ? new Date(l.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} - ${l.endDate ? new Date(l.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`,
              img: (l.employee?.name || l.name || 'E').charAt(0).toUpperCase()
            }));
            onLeaveCount = Math.min(total, Math.floor(total * 0.05));
            pendingCount = allLeaves.filter(l => l.status === 'Pending').length || 0;
          } catch (err) {
            onLeaveCount = 0;
            pendingCount = 0;
          }
        }

        setRecentLeaves(leavesList.slice(0, 5));
        setPendingLeavesCount(pendingCount);

        const presentCount = Math.max(0, total - onLeaveCount);

        setStats({
          totalEmployees: total,
          presentToday: presentCount,
          onLeave: onLeaveCount,
          departmentsCount: Object.keys(deptMap).length
        });

      } catch (err) {
        console.error("Error loading dashboard data", err);
      }
    };

    fetchDashboardData();
  }, []);

  const maleCount = genderData.find(d => d.name === 'Male')?.value || 0;
  const femaleCount = genderData.find(d => d.name === 'Female')?.value || 0;
  const totalGen = maleCount + femaleCount || 1;
  const malePercent = Math.round((maleCount / totalGen) * 100);
  const femalePercent = Math.round((femaleCount / totalGen) * 100);

  const attendancePercentage = stats.totalEmployees > 0 
    ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1) 
    : '0';

  const leavePercentage = stats.totalEmployees > 0 
    ? ((stats.onLeave / stats.totalEmployees) * 100).toFixed(1) 
    : '0';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Dashboard Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Employees</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalEmployees}</h3>
            <p className="text-xs font-medium text-emerald-500 mt-1">Active Workforce</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Present Today</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.presentToday}</h3>
            <p className="text-xs font-medium text-emerald-500 mt-1">{attendancePercentage}%</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">On Leave</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.onLeave}</h3>
            <p className="text-xs font-medium text-red-500 mt-1">{leavePercentage}%</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Departments</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.departmentsCount}</h3>
            <p className="text-xs font-medium text-gray-400 mt-1">Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-gray-800">Employees by Department</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-gray-800">Gender Distribution</h3>
          </div>
          <div className="h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-gray-800">{stats.totalEmployees}</span>
              <span className="text-xs text-gray-500 font-medium mt-1">Total</span>
            </div>
            
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <p className="text-xl font-bold text-gray-800">{malePercent}%</p>
              <p className="text-xs text-gray-500">Male</p>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right">
              <p className="text-xl font-bold text-gray-800">{femalePercent}%</p>
              <p className="text-xs text-gray-500">Female</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-gray-800">Recent Leaves</h3>
          </div>
          <div className="space-y-5">
            {recentLeaves.length > 0 ? (
              recentLeaves.map((leave, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      {leave.img}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{leave.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{leave.type}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{leave.dates}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No recent leaves found</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-gray-800">Upcoming Birthdays</h3>
          </div>
          <div className="space-y-4">
            {upcomingBirthdays.length > 0 ? (
              upcomingBirthdays.map((bday, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm">
                      {bday.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{bday.name}</p>
                      <p className="text-[11px] text-gray-400">{bday.department}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg">
                    {bday.date}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No upcoming birthdays soon</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-gray-800">To Do / HR Tasks</h3>
          </div>
          <div className="space-y-4">
            {[
              { task: 'Review Leave Applications', count: pendingLeavesCount > 0 ? pendingLeavesCount.toString() : '0' },
              { task: 'Interview with Candidates', count: '05' },
              { task: 'Payroll Approval', count: 'Pending', highlight: true },
              { task: 'Update Employee Records', count: stats.totalEmployees.toString() }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  <span className="text-sm font-medium text-gray-700">{item.task}</span>
                </div>
                <span className={`text-xs font-bold ${item.highlight ? 'text-amber-500' : 'text-gray-500'}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}