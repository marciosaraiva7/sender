import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

let app: FirebaseApp;
if (getApps().length) {
  app = getApps()[0];
} else {
  app = initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
export default app;
