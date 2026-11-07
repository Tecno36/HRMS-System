require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const User = require('./models/User');

// 1. Initialize Firebase Admin
let messaging;
try {
    const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
    const app = initializeApp({
        credential: cert(serviceAccount)
    });
    messaging = getMessaging(app);
    console.log('✅ 1. Firebase Admin SDK initialized successfully!');
} catch (err) {
    console.error('❌ Failed to initialize Firebase:', err.message);
    process.exit(1);
}

async function run() {
    try {
        // 2. Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ 2. Connected to MongoDB successfully!');

        // 3. Find users with an FCM Token
        const users = await User.find({}, 'name email role fcmToken');
        console.log(`\n📋 Registered Users in Database (${users.length}):`);
        
        const usersWithToken = [];
        users.forEach((u, i) => {
            const hasToken = !!u.fcmToken;
            if (hasToken) usersWithToken.push(u);
            console.log(`   ${i + 1}. ${u.name} (${u.email}) [Role: ${u.role}] -> FCM: ${hasToken ? '🟢 YES (' + u.fcmToken.slice(0, 15) + '...)' : '🔴 NO'}`);
        });

        if (usersWithToken.length === 0) {
            console.log('\n⚠️  कोणत्याही यूजरचे FCM Token अजून डेटाबेसमध्ये नाही.');
            console.log('👉 टेस्ट करण्यासाठी:');
            console.log('   १. मोबाईल अ‍ॅप उघडा आणि कोणत्याही Employee अकाऊंटने Login करा.');
            console.log('   २. लॉगिन होताच तुमचे FCM Token ऑटोमॅटिक डेटाबेसमध्ये सेव्ह होईल.');
            console.log('   ३. त्यानंतर पुन्हा `node test_push.js` रन करा, नोटिफिकेशन थेट फोनवर येईल!');
            process.exit(0);
        }

        // 4. Send test notification to the first user with a token
        const targetUser = usersWithToken[0];
        console.log(`\n🚀 Sending Test Notification to: ${targetUser.name} (${targetUser.email})...`);

        const message = {
            token: targetUser.fcmToken,
            notification: {
                title: '🎉 Test Notification: HRMS',
                body: `Hello ${targetUser.name}! Push notifications are working perfectly!`
            },
            data: {
                route: '/dashboard'
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'hrms_notifications',
                    sound: 'default'
                }
            }
        };

        const response = await messaging.send(message);
        console.log('🎉 4. SUCCESS! Push notification sent successfully to device!');
        console.log('   FCM Message ID:', response);
        console.log('\n👉 आता तुमच्या मोबाईलची स्क्रीन तपासा, वर नोटिफिकेशन आलेले दिसेल!');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error during test:', err.message);
        process.exit(1);
    }
}

run();
