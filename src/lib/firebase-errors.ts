const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/missing-email": "Enter your email address to continue.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-login-credentials": "Incorrect email or password.",
  "auth/email-already-in-use": "An account with that email already exists. Try signing in.",
  "auth/weak-password": "Choose a stronger password (at least 8 characters).",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and retry.",
  "auth/unauthorized-domain": "This domain isn't authorised for sign-in yet.",
  "auth/operation-not-allowed": "That sign-in method isn't enabled for this project.",
  "auth/requires-recent-login": "Please sign in again to continue.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/missing-password": "Enter your password to continue.",
};

export function authErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code?: unknown }).code ?? "");
    if (AUTH_MESSAGES[code]) return AUTH_MESSAGES[code];
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

export function firestoreErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code?: unknown }).code ?? "");
    if (code === "permission-denied") {
      return "You don't have permission to do that.";
    }
    if (code === "unavailable") {
      return "You appear to be offline. Changes will sync when you reconnect.";
    }
  }
  return "Something went wrong. Please try again.";
}
