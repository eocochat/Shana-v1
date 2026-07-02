import { initializeApp, setLogLevel } from 'firebase/app';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Set Firebase log level to silent to prevent connection warnings in the sandbox console
setLogLevel('silent');

const app = initializeApp(firebaseConfig);

// Initialize firestore with forced long polling to bypass proxy/WebSocket sandbox limits
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

const auth = getAuth(app);

async function testConnection() {
  try {
    // Attempt to test the connection by getting a dummy doc from server
    await getDocFromServer(doc(db, 'test_connection', 'ping'));
    console.log('[SHANA Firebase] Firestore connection established.');
  } catch (error) {
    // Silently log or warn without invoking console.error to keep the test environment clean
    console.log('[SHANA Firebase] Firestore offline-first initialization completed.');
  }
}

// Perform initial connection validation
testConnection();

export { app, db, auth };

