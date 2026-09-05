const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    employeeId: { 
        type: String,
        unique: true,
        sparse: true
    },
    department: {
        type: String
    },
    designation: { 
        type: String 
    },
    assignedHR: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    },
    salary: {
        type: Number,
        default: 0
    },
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    panNumber: { type: String },
    gender: { 
        type: String, 
        enum: ['Male', 'Female', 'Other'], 
        default: 'Male' 
    },
    dob: { 
        type: String, 
        default: '' 
    },
    shift: { 
        type: String, 
        default: 'General' 
    },
    address: { type: String },
    emergencyContact: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);