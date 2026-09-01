const Candidate = require('../models/Candidate');

exports.createCandidate = async (req, res) => {
    try {
        const { name, email, phone, jobTitle, department, status, interviewDate, resumeUrl } = req.body;
        const companyName = req.user.companyName;

        const candidate = new Candidate({
            name,
            email,
            phone,
            jobTitle,
            department,
            status,
            interviewDate,
            resumeUrl,
            companyName
        });

        await candidate.save();
        res.status(201).json(candidate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCandidates = async (req, res) => {
    try {
        const companyName = req.user.companyName;
        const candidates = await Candidate.find({ companyName }).sort({ createdAt: -1 });
        res.status(200).json(candidates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        const candidate = await Candidate.findByIdAndUpdate(id, updatedData, { new: true });
        res.status(200).json(candidate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        await Candidate.findByIdAndDelete(id);
        res.status(200).json({ message: 'Candidate deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};