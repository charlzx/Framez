import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import HomeStackNavigator from './HomeStack';
import SearchStackNavigator from './SearchStack';
import ProfileStackNavigator from './ProfileStack';

export type AppTabParamList = {
  Home: undefined;
  Search: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground ?? colors.foreground,
        tabBarStyle: {
          borderTopColor: colors.border,
          borderTopWidth: 1,
          backgroundColor: colors.background,
        },
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono_400Regular',
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              color={color}
              size={size}
              focused={focused}
              activeName="home"
              inactiveName="home-outline"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              color={color}
              size={size}
              focused={focused}
              activeName="search"
              inactiveName="search-outline"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              color={color}
              size={size}
              focused={focused}
              activeName="person"
              inactiveName="person-outline"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

type TabIconProps = {
  color: string;
  size: number;
  focused: boolean;
  activeName: React.ComponentProps<typeof Ionicons>['name'];
  inactiveName: React.ComponentProps<typeof Ionicons>['name'];
};

const TabIcon: React.FC<TabIconProps> = ({ color, size, focused, activeName, inactiveName }) => (
  <Ionicons name={focused ? activeName : inactiveName} size={size} color={color} />
);
