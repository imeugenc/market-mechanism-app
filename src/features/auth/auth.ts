import * as Linking from "expo-linking";

import { supabase } from "@/lib/supabase";

function createAuthRedirectUrl() {
  return Linking.createURL("/auth/callback");
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
