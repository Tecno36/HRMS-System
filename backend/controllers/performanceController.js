const Performance = require('../models/Performance');

exports.createPerformance = async (req, res) => {
    try {
        const { employee, reviewDate, reviewPeriod, ratings, feedback, goals } = req.body;
        const companyName = req.user.companyName;
        const reviewer = req.user.id;

        const overall = ((Number(ratings.workQuality) + Number(ratings.punctuality) + Number(ratings.teamwork)) / 3).toFixed(1);

        const performance = new Performance({
            employee,
            reviewer,
            companyName,
            reviewDate,
            reviewPeriod,
            ratings: { ...ratings, overall },
            feedback,
            goals
        });

        await performance.save();
        res.status(201).json(performance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPerformances = async (req, res) => {
    try {
        const companyName = req.user.companyName;
        let query = { companyName };

        if (req.user.role === 'Employee') {
            query.employee = req.user.id;
        }

        const performances = await Performance.find(query)
            .populate('employee', 'name email department employeeId')
            .populate('reviewer', 'name role')
            .sort({ reviewDate: -1 });

        res.status(200).json(performances);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updatePerformance = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewDate, reviewPeriod, ratings, feedback, goals } = req.body;

        let updatedData = { reviewDate, reviewPeriod, feedback, goals };

        if (ratings) {
            const overall = ((Number(ratings.workQuality) + Number(ratings.punctuality) + Number(ratings.teamwork)) / 3).toFixed(1);
            updatedData.ratings = { ...ratings, overall };
        }

        const performance = await Performance.findByIdAndUpdate(id, updatedData, { new: true });
        res.status(200).json(performance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePerformance = async (req, res) => {
    try {
        const { id } = req.params;
        await Performance.findByIdAndDelete(id);
        res.status(200).json({ message: 'Performance record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};