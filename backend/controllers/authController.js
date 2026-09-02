const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

exports.registerUser = async (req, res) => {
    try {
        const { companyName, name, email, phone, password, role } = req.body;

        if (!companyName || !name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            companyName,
            name,
            email,
            phone,
            password: hashedPassword,
            role: role || 'Super Admin'
        });

        await newUser.save();

        res.status(201).json({ message: 'Company registered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password, loginSource } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'Employee' && loginSource !== 'mobile') {
            return res.status(403).json({ message: 'Employees are only allowed to log in via the mobile application.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, companyName: user.companyName },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            status: 'success',
            token,
            user: {
                id: user._id,
                companyName: user.companyName,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatar: user.avatar,
                mPinSet: user.mPin ? true : false, 
                isBiometricEnabled: user.isBiometricEnabled ? true : false 
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.forgotPasswordOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email address' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #101a3d; text-align: center;">HRMS Password Reset</h2>
                <p style="color: #475569; font-size: 16px;">Hello ${user.name},</p>
                <p style="color: #475569; font-size: 16px;">You requested a password reset. Here is your secure OTP:</p>
                <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <h1 style="color: #4f46d8; letter-spacing: 5px; margin: 0;">${otp}</h1>
                </div>
                <p style="color: #475569; font-size: 14px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
            </div>
        `;

        await sendEmail({
            to: user.email,
            subject: 'HRMS - Password Reset OTP',
            html: html
        });

        res.status(200).json({ message: 'OTP sent successfully to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending email. Please try again later.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('assignedHR', 'name');

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;
        const userId = req.user.id;

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { name, phone, avatar }, 
            { new: true }
        )
        .select('-password')
        .populate('assignedHR', 'name');

        if (!updatedUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.status(200).json({
            status: 'success',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.setMpin = async (req, res) => {
    try {
        const { mPin } = req.body;
        const userId = req.user.id;

        if (!mPin || mPin.length !== 4) {
            return res.status(400).json({ status: 'fail', message: 'Invalid mPIN' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedMpin = await bcrypt.hash(mPin, salt);

        await User.findByIdAndUpdate(userId, { mPin: hashedMpin });

        return res.status(200).json({ status: 'success', message: 'mPIN set successfully' });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.loginWithMpin = async (req, res) => {
    try {
        const { email, mPin, isBiometricLogin } = req.body;

        const user = await User.findOne({ email });
        if (!user || !user.mPin) {
            return res.status(401).json({ status: 'fail', message: 'Invalid credentials or mPIN not set' });
        }

        if (!isBiometricLogin) {
            const isMatch = await bcrypt.compare(mPin, user.mPin);
            if (!isMatch) {
                return res.status(401).json({ status: 'fail', message: 'Incorrect mPIN' });
            }
        }

        const payload = { id: user._id, role: user.role, companyName: user.companyName };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        return res.status(200).json({
            status: 'success',
            token,
            user: {
                id: user._id,
                companyName: user.companyName,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatar: user.avatar,
                mPinSet: true,
                isBiometricEnabled: user.isBiometricEnabled ? true : false
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.toggleBiometric = async (req, res) => {
    try {
        const { isEnabled } = req.body;
        const userId = req.user.id;

        const user = await User.findByIdAndUpdate(userId, { isBiometricEnabled: isEnabled }, { new: true });

        return res.status(200).json({ status: 'success', isBiometricEnabled: user.isBiometricEnabled });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};