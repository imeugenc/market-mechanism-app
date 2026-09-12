import { FontAwesome5, MaterialCommunityIcons } from "@/components/StableIcons";
import { BottomTabBar, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";

import { colors } from "@/theme";

const parentTabByRoute: Record<string, string> = {
  membership: "profile",
  news: "markets",
  "admin-entry": "profile",
  altcoins: "markets",
  "markets/[market]": "markets",
  "markets/altcoins": "markets",
};

function MemberTabBar(props: BottomTabBarProps) {
  const currentRoute = props.state.routes[props.state.index]?.name;
  const parentRoute = parentTabByRoute[currentRoute];

  if (!parentRoute) {
    return <BottomTabBar {...props} />;
  }

  const parentIndex = props.state.routes.findIndex((route) => route.name === parentRoute);
  return <BottomTabBar {...props} state={{ ...props.state, index: parentIndex }} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <MemberTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: "bottom",
        tabBarLabelPosition: "below-icon",
        tabBarStyle: {
          backgroundColor: "#090909",
          borderTopColor: "rgba(212, 175, 55, 0.12)",
          height: 76,
          paddingTop: 6,
          paddingBottom: 12,
          paddingHorizontal: 4,
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
          title: "Analize",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="file-chart-outline" color={color} size={size} />,
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
        name="membership"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="admin-entry"
        options={{
          href: null,
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
