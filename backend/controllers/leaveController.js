const Leave = require('../models/Leave');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

exports.applyLeave = async (req, res) => {
    try {
        const { leaveType, fromDate, toDate, totalDays, reason } = req.body;
        const employeeId = req.user.id;
        const companyName = req.user.companyName;

        if (!leaveType || !fromDate || !toDate || !reason || !totalDays) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        let attachmentPath = null;
        if (req.file) {
            attachmentPath = req.file.path;
        }

        const newLeave = new Leave({
            employee: employeeId,
            companyName,
            leaveType,
            startDate: fromDate,
            endDate: toDate,
            totalDays,
            reason,
            attachment: attachmentPath
        });

        await newLeave.save();

        const user = await User.findById(employeeId).populate('assignedHR');

        if (user && user.assignedHR && user.assignedHR.email) {
            const hrEmail = user.assignedHR.email;
            const subject = `New Leave Request - ${user.name}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
                    <h2 style="color: #5B3CD8; margin-top: 0;">New Leave Request</h2>
                    <p>Hello,</p>
                    <p>A new leave request has been submitted by <strong>${user.name}</strong>.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">
                        <tr>
                            <td style="padding: 10px; border: 1px solid #eee; background-color: #f8f9fe; font-weight: bold; width: 30%;">Employee ID</td>
                            <td style="padding: 10px; border: 1px solid #eee;">${user.employeeId || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #eee; background-color: #f8f9fe; font-weight: bold;">Leave Type</td>
                            <td style="padding: 10px; border: 1px solid #eee;">${leaveType}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #eee; background-color: #f8f9fe; font-weight: bold;">Duration</td>
                            <td style="padding: 10px; border: 1px solid #eee;">${fromDate} to ${toDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #eee; background-color: #f8f9fe; font-weight: bold;">Total Days</td>
                            <td style="padding: 10px; border: 1px solid #eee;">${totalDays}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #eee; background-color: #f8f9fe; font-weight: bold;">Reason</td>
                            <td style="padding: 10px; border: 1px solid #eee;">${reason}</td>
                        </tr>
                    </table>
                    <p>Please log in to the HRMS portal to review this request.</p>
                </div>
            `;

            try {
                await sendEmail({ email: hrEmail, subject, html });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }
        }

        res.status(201).json({ status: 'success', message: 'Leave application submitted successfully', leave: newLeave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEmployeeLeaves = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const leaves = await Leave.find({ employee: employeeId }).sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', data: leaves });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCompanyLeaves = async (req, res) => {
    try {
        const companyName = req.user.companyName;
        const leaves = await Leave.find({ companyName })
            .populate('employee', 'name email employeeId department')
            .sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', data: leaves });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const hrId = req.user.id;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updatedLeave = await Leave.findByIdAndUpdate(
            id,
            { status, approvedBy: hrId },
            { new: true }
        );

        if (!updatedLeave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        res.status(200).json({ status: 'success', message: `Leave request ${status.toLowerCase()} successfully`, leave: updatedLeave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};