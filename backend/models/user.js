const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['Super Admin', 'HR', 'Employee'],
        default: 'Employee'
    },
    department: {
        type: String
    },
    assignedHR: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    },
    employeeId: { 
        type: String,
        unique: true,
        sparse: true
    },
    salary: {
        type: Number,
        default: 0
    },
    avatar: { 
        type: String, 
        default: '' 
    }, 
    gender: { 
        type: String, 
        enum: ['Male', 'Female', 'Other'], 
        default: 'Male' 
    },
    dob: { 
        type: String, 
        default: '' 
    },
    isActive: {
        type: Boolean,
        default: true
    },
    resetPasswordOTP: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    mPin: {
        type: String,
        default: null
    },
    isBiometricEnabled: {
        type: Boolean,
        default: false
    },
    isFirstLogin: {
        type: Boolean,
        default: true
    },
    registeredDeviceId: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);