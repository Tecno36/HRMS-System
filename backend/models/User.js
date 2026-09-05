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
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    avatar: { 
        type: String, 
        default: '' 
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Super Admin', 'HR', 'Employee'],
        default: 'Employee'
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