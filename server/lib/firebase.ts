import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error("Failed to load firebase-applet-config.json:", e);
}

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export { app, db };

