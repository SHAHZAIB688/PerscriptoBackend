const admin = require("firebase-admin");

function ensureApp() {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID || "prescripto-e5247";
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (json) {
    return admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(json)),
      projectId,
    });
  }

  return admin.initializeApp({ projectId });
}

async function verifyFirebaseIdToken(idToken) {
  ensureApp();
  return admin.auth().verifyIdToken(idToken);
}

module.exports = { verifyFirebaseIdToken };
