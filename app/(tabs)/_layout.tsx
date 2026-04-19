import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { isOwnerEmail } from "@/constants/access";
import { useAppState } from "@/providers/AppProvider";
import { colors } from "@/theme";

export default function TabsLayout() {
  const { session, user } = useAppState();
  const isAdmin = user?.isAdmin || isOwnerEmail(session?.user?.email);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#090909",
          borderTopColor: "rgba(212, 175, 55, 0.12)",
          height: 88,
          paddingTop: 8,
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
