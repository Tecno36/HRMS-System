const email = process.argv[2] || 'kharjevijay017@gmail.com';
const password = process.argv[3] || 'Pass@12';

const RENDER_BASE_URL = 'https://hrms-system-1-r05y.onrender.com/api';

async function testPush() {
    console.log(`\n==============================================`);
    console.log(`🚀 TESTING LIVE PUSH NOTIFICATION ON RENDER`);
    console.log(`==============================================\n`);

    try {
        // Step 1: Login
        console.log(`1️⃣ Logging in as ${email}...`);
        const loginRes = await fetch(`${RENDER_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, loginSource: 'mobile' })
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.error('❌ Login Failed:', loginData.message || loginData);
            process.exit(1);
        }

        const token = loginData.token;
        const user = loginData.user;
        console.log(`✅ Login Success! User: ${user.name} (ID: ${user.id})`);

        // Step 2: Check Profile in DB
        console.log(`\n2️⃣ Checking current fcmToken in Database...`);
        const profileRes = await fetch(`${RENDER_BASE_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        const dbToken = profileData?.data?.fcmToken;

        console.log(`📋 DB fcmToken: ${dbToken ? '🟢 ' + dbToken.slice(0, 30) + '...' : '🔴 NULL'}`);

        if (!dbToken) {
            console.error('\n❌ Error: fcmToken is NULL in Database. Mobile app must register first.');
            process.exit(1);
        }

        // Step 3: Trigger Live Push Notification via Render
        console.log(`\n3️⃣ Triggering POST ${RENDER_BASE_URL}/notifications/test-push...`);
        const pushRes = await fetch(`${RENDER_BASE_URL}/notifications/test-push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        });

        const pushData = await pushRes.json();

        console.log(`\n==============================================`);
        console.log(`📡 RENDER SERVER RESPONSE: (HTTP ${pushRes.status})`);
        console.log(`==============================================`);
        console.log(JSON.stringify(pushData, null, 2));

        if (pushRes.ok && pushData.status === 'success') {
            console.log(`\n🎉 Google Firebase accepted the message! (ID: ${pushData.fcmResponse})`);
            console.log(`📱 आता तुमच्या मोबाईलची स्क्रीन तपासा!`);
        } else {
            console.log(`\n⚠️  Firebase / Render वर एरर आला आहे. वरील रिस्पॉन्स पहा.`);
        }

    } catch (err) {
        console.error('❌ Connection or Execution Error:', err.message);
    }
}

testPush();
