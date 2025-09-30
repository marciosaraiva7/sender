const API_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";

interface FirebaseLookupResponse {
  users?: Array<{
    localId?: string;
    email?: string;
    displayName?: string;
  }>;
}

export interface VerifiedFirebaseUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}

export async function verifyFirebaseToken(
  idToken: string
): Promise<VerifiedFirebaseUser | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as FirebaseLookupResponse;

    if (!data.users || data.users.length === 0) {
      return null;
    }

    const user = data.users[0];

    if (!user?.localId) {
      return null;
    }

    return {
      uid: user.localId,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
    };
  } catch {
    return null;
  }
}
