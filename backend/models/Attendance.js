const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    clockIn: {
        type: Date,
        default: null
    },
    clockOut: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Half-day', 'On Leave'],
        default: 'Absent'
    },
    verificationMethod: {
        type: String,
        enum: ['WiFi', 'GPS', 'Manual'],
        default: 'GPS'
    },
    verificationData: {
        bssid: { type: String },
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    totalHours: {
        type: Number,
        default: 0
    },
    remarks: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);