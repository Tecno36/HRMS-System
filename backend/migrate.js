require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); 
const Employee = require('./models/Employee'); 

const migrateData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Database connected successfully.');

        const usersToMigrate = await User.find({ role: { $in: ['Employee', 'HR'] } }).lean();
        console.log(`Found ${usersToMigrate.length} users to migrate.`);

        let migratedCount = 0;

        for (const user of usersToMigrate) {
            await Employee.findOneAndUpdate(
                { userId: user._id },
                {
                    userId: user._id,
                    employeeId: user.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
                    name: user.name || 'Unknown',
                    phone: user.phone || '',
                    department: user.department || 'Not Assigned',
                    designation: user.role === 'HR' ? 'HR Manager' : 'Employee',
                    assignedHR: user.assignedHR || null,
                    salary: user.salary || 0,
                    avatar: user.avatar || '',
                    gender: user.gender || 'Male',
                    dob: user.dob || '',
                    joinDate: user.createdAt || new Date()
                },
                { upsert: true, new: true }
            );

            migratedCount++;
            console.log(`Updated/Migrated details for: ${user.name || user.email}`);
        }

        console.log(`Migration Complete! Successfully updated ${migratedCount} records in Employee table.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateData();