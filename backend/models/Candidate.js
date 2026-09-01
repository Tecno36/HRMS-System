const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    jobTitle: { type: String, required: true },
    department: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Applied', 'Interviewing', 'Hired', 'Rejected'], 
        default: 'Applied' 
    },
    interviewDate: { type: Date },
    resumeUrl: { type: String },
    companyName: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);