const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const hrRoutes = require('./routes/hrRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const path = require('path');

dotenv.config();

// Initialize Firebase Admin SDK (Modular SDK v14) with multi-format support
if (getApps().length === 0) {
    let initialized = false;

    // Option A: JSON string or Base64 string in FIREBASE_SERVICE_ACCOUNT
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
            // Check if wrapped in extra quotes
            if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
                raw = raw.slice(1, -1);
            }
            // Check if base64 encoded
            if (!raw.startsWith('{')) {
                try {
                    raw = Buffer.from(raw, 'base64').toString('utf-8');
                } catch (b64Err) {}
            }
            const serviceAccount = JSON.parse(raw);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            initializeApp({ credential: cert(serviceAccount) });
            initialized = true;
            console.log('✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT env.');
        } catch (err) {
            console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', err.message);
        }
    }

    // Option B: Individual environment variables
    if (!initialized && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '');
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey
                })
            });
            initialized = true;
            console.log('✅ Firebase Admin initialized from individual env variables.');
        } catch (err) {
            console.error('❌ Failed to initialize from individual Firebase envs:', err.message);
        }
    }

    // Option C: Local serviceAccountKey.json fallback
    if (!initialized) {
        const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
        try {
            const serviceAccount = require(serviceAccountPath);
            initializeApp({ credential: cert(serviceAccount) });
            initialized = true;
            console.log('✅ Firebase Admin initialized from serviceAccountKey.json.');
        } catch (err) {
            console.warn('⚠️ Firebase Admin SDK not initialized: No valid credentials found. Push notifications will be disabled.');
        }
    }
}

connectDB();

const app = express();

const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});