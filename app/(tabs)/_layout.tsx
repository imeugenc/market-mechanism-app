import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, useWindowDimensions } from "react-native";

import { isOwnerEmail } from "@/constants/access";
import { useAppState } from "@/providers/AppProvider";
import { colors } from "@/theme";

export default function TabsLayout() {
  const { session, user } = useAppState();
  const isAdmin = user?.isAdmin || isOwnerEmail(session?.user?.email);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isCompactWeb = isWeb && width < 820;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarLabelPosition: isCompactWeb ? "below-icon" : isWeb ? "beside-icon" : "below-icon",
        tabBarStyle: {
          backgroundColor: "#090909",
          borderTopColor: "rgba(212, 175, 55, 0.12)",
          height: isCompactWeb ? 76 : isWeb ? 72 : 88,
          paddingTop: isCompactWeb ? 6 : 8,
          paddingBottom: isCompactWeb ? 12 : isWeb ? 8 : 0,
          paddingHorizontal: isCompactWeb ? 4 : 0,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: "#6F6A5C",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Acasă",
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="crosshairs" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          title: "Piețe",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="finance" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="newspaper-variant-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Analize personale",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="sword-cross" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="membership"
        options={{
          title: "Upgrade",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="shield-crown" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="admin-entry"
        options={{
          href: isAdmin ? undefined : null,
          title: "Admin",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="shield-account" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="altcoins"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="markets/[market]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="markets/altcoins"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
