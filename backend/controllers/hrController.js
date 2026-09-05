const User = require('../models/User');
const Employee = require('../models/Employee');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

exports.createHR = async (req, res) => {
    try {
        const { name, email, phone, gender, dob, department, designation, salary, bankName, accountNumber, ifscCode, panNumber } = req.body;
        const companyName = req.user.companyName;

        if (!name || !email || !department) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const lastEmployee = await Employee.findOne().sort({ createdAt: -1 });
        let newEmployeeId = 'EMP-1001';
        
        if (lastEmployee && lastEmployee.employeeId) {
            const lastIdParts = lastEmployee.employeeId.split('-');
            if (lastIdParts.length === 2) {
                const lastNumber = parseInt(lastIdParts[1]);
                if (!isNaN(lastNumber)) {
                    newEmployeeId = `EMP-${lastNumber + 1}`;
                }
            }
        }

        const tempPassword = crypto.randomBytes(4).toString('hex') + '@1A';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        const newHRUser = new User({
            companyName,
            name,
            email,
            phone,
            password: hashedPassword,
            role: 'HR',
            isActive: true
        });

        const savedUser = await newHRUser.save();

        const newHREmployee = new Employee({
            userId: savedUser._id,
            employeeId: newEmployeeId,
            department,
            designation: designation || 'HR Manager',
            salary: salary || 0,
            bankName,
            accountNumber,
            ifscCode,
            panNumber,
            gender,
            dob,
            joinDate: new Date()
        });

        await newHREmployee.save();

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #101a3d; text-align: center;">Welcome to ${companyName} HRMS</h2>
                <p style="color: #475569; font-size: 16px;">Hello ${name},</p>
                <p style="color: #475569; font-size: 16px;">You have been added as an HR Administrator for the <b>${department}</b> department.</p>
                <p style="color: #475569; font-size: 16px;">Here are your login credentials:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0; color: #334155;"><b>Employee ID:</b> ${newEmployeeId}</p>
                    <p style="margin: 5px 0; color: #334155;"><b>Email:</b> ${email}</p>
                    <p style="margin: 5px 0; color: #334155;"><b>Temporary Password:</b> <span style="color: #4f46d8; font-family: monospace; font-size: 16px;">${tempPassword}</span></p>
                </div>
                <p style="color: #475569; font-size: 14px;">Please login to the portal and change your password using the Forgot Password option if needed.</p>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: `HRMS - Your HR Login Credentials for ${companyName}`,
            html: html
        });

        res.status(201).json({ message: 'HR created successfully and credentials sent to email.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getHRList = async (req, res) => {
    try {
        const companyName = req.user.companyName;
        
        const companyHRUsers = await User.find({ companyName, role: 'HR', isActive: true });
        const hrUserIds = companyHRUsers.map(u => u._id);

        const hrs = await Employee.find({ userId: { $in: hrUserIds } })
            .populate('userId', 'email name phone avatar isActive');
            
        const formattedHRs = hrs.map(hr => ({
            ...hr.toObject(),
            name: hr.userId.name,
            email: hr.userId.email,
            phone: hr.userId.phone,
            avatar: hr.userId.avatar
        }));

        res.status(200).json(formattedHRs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateHR = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, gender, dob, department, designation, salary, bankName, accountNumber, ifscCode, panNumber } = req.body;

        const hrEmployee = await Employee.findById(id);
        if (!hrEmployee) {
            return res.status(404).json({ message: 'HR not found' });
        }

        await User.findByIdAndUpdate(hrEmployee.userId, { name, phone });

        const updatedHR = await Employee.findByIdAndUpdate(
            id,
            { gender, dob, department, designation, salary, bankName, accountNumber, ifscCode, panNumber },
            { new: true }
        ).populate('userId', 'name email phone avatar isActive');

        res.status(200).json({ message: 'HR details updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteHR = async (req, res) => {
    try {
        const { id } = req.params;

        const hrEmployee = await Employee.findById(id);
        if (!hrEmployee) {
            return res.status(404).json({ message: 'HR not found' });
        }

        await User.findByIdAndUpdate(hrEmployee.userId, { isActive: false });

        res.status(200).json({ message: 'HR access revoked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};