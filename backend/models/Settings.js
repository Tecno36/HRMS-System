const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    financialYear: { type: String, default: '2026-2027' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);