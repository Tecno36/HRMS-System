const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true },
    reviewDate: { type: Date, required: true },
    reviewPeriod: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], required: true },
    ratings: {
        workQuality: { type: Number, required: true, min: 1, max: 5 },
        punctuality: { type: Number, required: true, min: 1, max: 5 },
        teamwork: { type: Number, required: true, min: 1, max: 5 },
        overall: { type: Number, required: true, min: 1, max: 5 }
    },
    feedback: { type: String, required: true },
    goals: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Performance', performanceSchema);