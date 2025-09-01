import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Em componentes client, variáveis devem ser  para serem expostas.
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
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
