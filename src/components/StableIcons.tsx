import { ComponentProps, useEffect, useState } from "react";
import {
  FontAwesome5 as ExpoFontAwesome5,
  MaterialCommunityIcons as ExpoMaterialCommunityIcons,
} from "@expo/vector-icons";
import { Platform, View } from "react-native";

function useCanRenderWebIcon() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return Platform.OS !== "web" || mounted;
}

function StableMaterialCommunityIcon(props: ComponentProps<typeof ExpoMaterialCommunityIcons>) {
  const canRender = useCanRenderWebIcon();
  if (!canRender) {
    return <View aria-hidden style={{ height: props.size ?? 24, width: props.size ?? 24 }} />;
  }
  return <ExpoMaterialCommunityIcons {...props} />;
}

function StableFontAwesome5Icon(props: ComponentProps<typeof ExpoFontAwesome5>) {
  const canRender = useCanRenderWebIcon();
  if (!canRender) {
    return <View aria-hidden style={{ height: props.size ?? 24, width: props.size ?? 24 }} />;
  }
  return <ExpoFontAwesome5 {...props} />;
}

export const MaterialCommunityIcons = Object.assign(StableMaterialCommunityIcon, {
  glyphMap: ExpoMaterialCommunityIcons.glyphMap,
});

export const FontAwesome5 = Object.assign(StableFontAwesome5Icon, {
  glyphMap: ExpoFontAwesome5.glyphMap,
});
