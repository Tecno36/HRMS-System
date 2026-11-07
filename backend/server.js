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

// Initialize Firebase Admin SDK (Modular SDK v14) with robust multi-source detection
global.__firebaseDebug = {
    initialized: false,
    method: null,
    error: null,
    matchedKey: null,
    detectedKeys: []
};

function initFirebaseAdmin() {
    if (getApps().length > 0) {
        global.__firebaseDebug.initialized = true;
        return;
    }

    const fs = require('fs');

    // 1. Gather any env var that could contain Firebase/Google credentials
    const allEnvKeys = Object.keys(process.env);
    const candidateKeys = allEnvKeys.filter(k => {
        const lower = k.toLowerCase();
        return lower.includes('firebase') || 
               lower.includes('service_account') || 
               lower.includes('serviceaccount') ||
               lower.includes('gcp') ||
               lower.includes('google');
    });

    global.__firebaseDebug.detectedKeys = candidateKeys;

    // Helper: safely parse JSON or Base64 service account string
    function parseServiceAccountString(rawStr) {
        if (!rawStr || typeof rawStr !== 'string') return null;
        let str = rawStr.trim();

        // Strip enclosing quotes if any
        if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
            str = str.slice(1, -1).trim();
        }

        // Try decoding as base64 first if it does not start with '{'
        if (!str.startsWith('{')) {
            try {
                const decoded = Buffer.from(str, 'base64').toString('utf-8');
                if (decoded.trim().startsWith('{')) {
                    str = decoded.trim();
                }
            } catch (e) {}
        }

        // Attempt JSON parsing
        if (str.startsWith('{')) {
            try {
                return JSON.parse(str);
            } catch (jsonErr) {
                // If it fails due to unescaped control chars (like real newlines in strings), try normalizing
                try {
                    const normalized = str.replace(/\r?\n/g, '\\n');
                    return JSON.parse(normalized);
                } catch (e) {
                    throw jsonErr;
                }
            }
        }
        return null;
    }

    // A. Priority env variables check
    const priorityKeys = [
        'FIREBASE_SERVICE_ACCOUNT',
        'FIREBASE_SERVICE_ACCOUNT_KEY',
        'SERVICE_ACCOUNT_KEY',
        'FIREBASE_KEY',
        'FIREBASE_CREDENTIALS',
        'FIREBASE_CONFIG',
        'FIREBASE_JSON',
        'GOOGLE_APPLICATION_CREDENTIALS_JSON',
        ...candidateKeys
    ];

    let serviceAccountObj = null;
    let successfulKey = null;
    const testedKeys = new Set();

    for (const key of priorityKeys) {
        if (!key || testedKeys.has(key)) continue;
        testedKeys.add(key);

        const val = process.env[key];
        if (!val) continue;

        try {
            const parsed = parseServiceAccountString(val);
            if (parsed && (parsed.project_id || parsed.projectId) && (parsed.private_key || parsed.privateKey)) {
                serviceAccountObj = parsed;
                successfulKey = key;
                break;
            }
        } catch (err) {
            global.__firebaseDebug.error = `Parse error for key "${key}": ${err.message}`;
        }
    }

    if (serviceAccountObj) {
        try {
            if (serviceAccountObj.private_key) {
                serviceAccountObj.private_key = serviceAccountObj.private_key.replace(/\\n/g, '\n');
            }
            initializeApp({ credential: cert(serviceAccountObj) });
            global.__firebaseDebug.initialized = true;
            global.__firebaseDebug.method = `Env Variable [${successfulKey}]`;
            global.__firebaseDebug.matchedKey = successfulKey;
            global.__firebaseDebug.projectId = serviceAccountObj.project_id || serviceAccountObj.projectId;
            console.log(`✅ Firebase Admin initialized from env variable [${successfulKey}] (Project: ${global.__firebaseDebug.projectId})`);
            return;
        } catch (err) {
            global.__firebaseDebug.error = `cert() error with key [${successfulKey}]: ${err.message}`;
            console.error('❌ Firebase initializeApp failed:', err.message);
        }
    }

    // B. Individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        try {
            privateKey = privateKey.trim();
            if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
                privateKey = privateKey.slice(1, -1);
            }
            privateKey = privateKey.replace(/\\n/g, '\n');
            initializeApp({
                credential: cert({ projectId, clientEmail, privateKey })
            });
            global.__firebaseDebug.initialized = true;
            global.__firebaseDebug.method = 'Individual Env Variables';
            global.__firebaseDebug.projectId = projectId;
            console.log('✅ Firebase Admin initialized from individual env variables.');
            return;
        } catch (err) {
            global.__firebaseDebug.error = `Individual env vars failed: ${err.message}`;
            console.error('❌ Failed to initialize from individual Firebase envs:', err.message);
        }
    }

    // C. File fallback (Local file or Render Secret File)
    const secretFilePaths = [
        path.join(__dirname, 'serviceAccountKey.json'),
        path.join(__dirname, '../serviceAccountKey.json'),
        '/etc/secrets/serviceAccountKey.json',
        '/etc/secrets/firebase.json'
    ];

    for (const filePath of secretFilePaths) {
        try {
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const parsed = JSON.parse(fileContent);
                if (parsed.private_key) {
                    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
                }
                initializeApp({ credential: cert(parsed) });
                global.__firebaseDebug.initialized = true;
                global.__firebaseDebug.method = `File [${filePath}]`;
                global.__firebaseDebug.projectId = parsed.project_id;
                console.log(`✅ Firebase Admin initialized from file [${filePath}].`);
                return;
            }
        } catch (err) {
            global.__firebaseDebug.error = `File error [${filePath}]: ${err.message}`;
        }
    }

    if (!global.__firebaseDebug.error) {
        global.__firebaseDebug.error = 'No valid Firebase service account found in environment variables or secret files.';
    }
    console.warn('⚠️ Firebase Admin SDK not initialized:', global.__firebaseDebug.error);
}

initFirebaseAdmin();

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