import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  Constants.expoConfig?.extra?.supabaseUrl ??
  "https://YOUR_PROJECT.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  "YOUR_SUPABASE_ANON_KEY";

export function getSupabaseConfigError() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return "Lipsește configurarea Supabase. Adaugă EXPO_PUBLIC_SUPABASE_URL și EXPO_PUBLIC_SUPABASE_ANON_KEY în fișierul .env.";
  }

  if (supabaseUrl.includes("YOUR_PROJECT") || supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY")) {
    return "Cheile Supabase sunt încă pe valorile demo. Completează fișierul .env cu URL-ul și cheia anon din proiectul tău Supabase.";
  }

  return null;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === "web",
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
  },
});
