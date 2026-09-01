const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
    try {
        const companyName = req.user.companyName;
        let settings = await Settings.findOne({ companyName });
        if (!settings) {
            settings = await Settings.create({ companyName });
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const companyName = req.user.companyName;
        const { address, contactEmail, currency, timezone, financialYear, logo } = req.body;
        
        let settings = await Settings.findOne({ companyName });

        if (!settings) {
            settings = new Settings({ 
                companyName, 
                address, 
                contactEmail, 
                currency, 
                timezone, 
                financialYear, 
                logo,
                updatedBy: req.user.id 
            });
        } else {
            settings.address = address !== undefined ? address : settings.address;
            settings.contactEmail = contactEmail !== undefined ? contactEmail : settings.contactEmail;
            settings.currency = currency || settings.currency;
            settings.timezone = timezone || settings.timezone;
            settings.financialYear = financialYear || settings.financialYear;
            if (logo) settings.logo = logo;
            settings.updatedBy = req.user.id;
        }

        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};