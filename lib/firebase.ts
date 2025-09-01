import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Em componentes client, variáveis devem ser  para serem expostas.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
};

if (!firebaseConfig.apiKey) {
  throw new Error("Firebase: FIREBASE_API_KEY ausente. Defina no .env.");
}

let app: FirebaseApp;
if (getApps().length) {
  app = getApps()[0];
} else {
  app = initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
export default app;
