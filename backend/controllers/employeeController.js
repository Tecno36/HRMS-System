const User = require('../models/User');
const Employee = require('../models/Employee');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

exports.createEmployee = async (req, res) => {
    try {
        const { name, email, phone, gender, dob, department, assignedHR, designation, salary, bankName, accountNumber, ifscCode, panNumber } = req.body;
        const companyName = req.user.companyName;
        const role = req.user.role;

        if (!name || !email || !department) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        let hrId = null;
        if (role === 'Super Admin') {
            if (!assignedHR) {
                return res.status(400).json({ message: 'Please select an HR for this employee' });
            }
            hrId = assignedHR;
        } else if (role === 'HR') {
            hrId = req.user.id;
        }

        const lastEmployee = await Employee.findOne().sort({ createdAt: -1 });
        let newEmployeeId = 'EMP-2001';
        
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

        const newUser = new User({
            companyName,
            name,
            email,
            phone,
            password: hashedPassword,
            role: 'Employee',
            isActive: true
        });

        const savedUser = await newUser.save();

        const newEmployee = new Employee({
            userId: savedUser._id,
            employeeId: newEmployeeId,
            department,
            designation,
            assignedHR: hrId,
            salary,
            bankName,
            accountNumber,
            ifscCode,
            panNumber,
            gender,
            dob,
            joinDate: new Date()
        });

        await newEmployee.save();

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #101a3d; text-align: center;">Welcome to ${companyName}</h2>
                <p style="color: #475569; font-size: 16px;">Hello ${name},</p>
                <p style="color: #475569; font-size: 16px;">You have been added as an employee in the <b>${department}</b> department.</p>
                <p style="color: #475569; font-size: 16px;">Here are your login credentials:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0; color: #334155;"><b>Employee ID:</b> ${newEmployeeId}</p>
                    <p style="margin: 5px 0; color: #334155;"><b>Email:</b> ${email}</p>
                    <p style="margin: 5px 0; color: #334155;"><b>Temporary Password:</b> <span style="color: #4f46d8; font-family: monospace; font-size: 16px;">${tempPassword}</span></p>
                </div>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: `HRMS - Your Login Credentials for ${companyName}`,
            html: html
        });

        res.status(201).json({ message: 'Employee created successfully and credentials sent to email.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEmployeeList = async (req, res) => {
    try {
        const companyName = req.user.companyName;
        const role = req.user.role;
        
        const companyUsers = await User.find({ companyName, role: 'Employee', isActive: true });
        const userIds = companyUsers.map(u => u._id);

        let query = { userId: { $in: userIds } };

        if (role === 'HR') {
            query.assignedHR = req.user.id;
        }

        const employees = await Employee.find(query)
            .populate('userId', 'email name phone avatar isActive')
            .populate('assignedHR', 'name email');
            
        const formattedEmployees = employees.map(emp => ({
            ...emp.toObject(),
            name: emp.userId.name,
            email: emp.userId.email,
            phone: emp.userId.phone,
            avatar: emp.userId.avatar
        }));

        res.status(200).json(formattedEmployees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, gender, dob, department, designation, assignedHR, salary, bankName, accountNumber, ifscCode, panNumber } = req.body;

        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        await User.findByIdAndUpdate(employee.userId, { name, phone });

        const updateData = { gender, dob, department, designation, salary, bankName, accountNumber, ifscCode, panNumber };
        
        if (req.user.role === 'Super Admin' && assignedHR) {
            updateData.assignedHR = assignedHR;
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('userId', 'name email phone avatar isActive').populate('assignedHR', 'name email');

        res.status(200).json({ message: 'Employee updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        await User.findByIdAndUpdate(employee.userId, { isActive: false });

        res.status(200).json({ message: 'Employee removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};