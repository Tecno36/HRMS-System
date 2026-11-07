const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Employee = require('../models/Employee');

exports.generatePayroll = async (req, res) => {
    try {
        const { month, year } = req.body;
        const companyName = req.user.companyName;

        const companyUsers = await User.find({ companyName, role: 'Employee', isActive: true });
        const userIds = companyUsers.map(u => u._id);

        const employees = await Employee.find({ userId: { $in: userIds } }).populate('userId', 'name email companyName');

        for (const emp of employees) {
            if (!emp.userId) continue;

            const attendanceCount = await Attendance.countDocuments({
                employee: emp.userId._id,
                status: 'Present',
                date: { 
                    $gte: new Date(year, new Date(month + ' 1, 2000').getMonth(), 1),
                    $lte: new Date(year, new Date(month + ' 1, 2000').getMonth() + 1, 0)
                }
            });

            const salary = emp.salary || 0;
            const dailyRate = salary / 30;
            const netSalary = Math.round(dailyRate * attendanceCount);

            const payroll = new Payroll({
                employee: emp.userId._id,
                companyName,
                month,
                year,
                basicSalary: salary,
                daysWorked: attendanceCount,
                netSalary
            });

            await payroll.save();
        }

        res.status(201).json({ message: 'Payroll generated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEmployeePayslips = async (req, res) => {
    try {
        const payrolls = await Payroll.find({ employee: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(payrolls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};