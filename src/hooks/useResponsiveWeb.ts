import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";

export function useClientReady() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return Platform.OS !== "web" || mounted;
}

export function useResponsiveWeb() {
  const { width } = useWindowDimensions();
  const clientReady = useClientReady();

  return {
    isCompactWeb: clientReady && Platform.OS === "web" && width < 820,
    isDesktopWeb: clientReady && Platform.OS === "web" && width >= 820,
  };
}
