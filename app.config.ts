import type { ExpoConfig, ConfigContext } from "expo/config";

const appJson = require("./app.json");

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...appJson.expo,
  ...config,
  extra: {
    ...(appJson.expo.extra ?? {}),
    ...(config.extra ?? {}),
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
});
