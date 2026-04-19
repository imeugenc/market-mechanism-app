import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

export const NATIVE_CALLBACK_URL = Linking.createURL("auth/callback");
export const NATIVE_RESET_URL = Linking.createURL("auth/reset-password");

function createAuthRedirectUrl() {
  return NATIVE_CALLBACK_URL;
}

export function parseAuthTokensFromUrl(url?: string | null) {
  if (!url) {
    return {
      accessToken: undefined,
      refreshToken: undefined,
      type: undefined,
    };
  }

  const [base, fragment = ""] = url.split("#");
  const queryIndex = base.indexOf("?");
  const query = queryIndex >= 0 ? base.slice(queryIndex + 1) : "";
  const params = new URLSearchParams([query, fragment].filter(Boolean).join("&"));

  return {
    accessToken: params.get("access_token") ?? undefined,
    refreshToken: params.get("refresh_token") ?? undefined,
    type: params.get("type") ?? undefined,
    code: params.get("code") ?? undefined,
    tokenHash: params.get("token_hash") ?? params.get("token") ?? undefined,
  };
}

export function formatAuthErrorMessage(error: unknown) {
  const rawMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "A apărut o eroare necunoscută la autentificare.";

  if (rawMessage === "TypeError: Network request failed" || rawMessage === "Network request failed") {
    return "Conexiunea către Supabase a eșuat. Verifică EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY și repornește serverul Expo cu cache curățat.";
  }

  if (rawMessage.toLowerCase().includes("invalid login credentials")) {
    return "Emailul sau parola sunt incorecte.";
  }

  if (rawMessage.toLowerCase().includes("email not confirmed")) {
    return "Emailul nu este încă confirmat. Verifică inbox-ul și confirmă contul înainte de autentificare.";
  }

  return rawMessage;
}

export async function signInWithEmailPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  metadata?: {
    role?: "user" | "admin";
    plan?: "free" | "premium";
  },
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: createAuthRedirectUrl(),
    },
  });
}

export async function sendMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: createAuthRedirectUrl(),
    },
  });
}

export async function sendPasswordResetEmail(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: NATIVE_RESET_URL,
  });
}

export async function applyAuthRedirectSession(input: {
  accessToken: string;
  refreshToken: string;
}) {
  return supabase.auth.setSession({
    access_token: input.accessToken,
    refresh_token: input.refreshToken,
  });
}

export async function establishRecoverySession(input: {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  tokenHash?: string;
  type?: string;
}) {
  if (input.accessToken && input.refreshToken) {
    return applyAuthRedirectSession({
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
    });
  }

  if (input.code) {
    return supabase.auth.exchangeCodeForSession(input.code);
  }

  if (input.tokenHash && input.type) {
    return supabase.auth.verifyOtp({
      token_hash: input.tokenHash,
      type: input.type as "signup" | "recovery" | "magiclink" | "invite" | "email_change" | "email",
    });
  }

  return {
    data: { session: null, user: null },
    error: new Error("Linkul de resetare nu conține o sesiune validă."),
  };
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({
    password,
  });
}

export async function signOutRemote() {
  return supabase.auth.signOut();
}

export async function getCurrentSession() {
  return supabase.auth.getSession();
}

export function subscribeToAuthChanges(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
) {
  return supabase.auth.onAuthStateChange(callback);
}
