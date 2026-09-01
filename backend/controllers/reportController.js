const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Leave = require('../models/Leave');
const Employee = require('../models/User'); // Assuming User model

exports.getReportData = async (req, res) => {
    try {
        const { type } = req.params;
        const companyName = req.user.companyName;
        let data = [];

        switch (type) {
            case 'attendance':
                data = await Attendance.aggregate([{ $match: { companyName } }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
                break;
            case 'payroll':
                data = await Payroll.aggregate([{ $match: { companyName } }, { $group: { _id: "$month", netSalary: { $sum: "$netSalary" } } }]);
                break;
            case 'leaves':
                data = await Leave.aggregate([{ $match: { companyName } }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
                break;
            case 'employees':
                data = await Employee.aggregate([{ $match: { companyName, role: 'Employee' } }, { $group: { _id: "$department", count: { $sum: 1 } } }]);
                break;
            default:
                data = [];
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};