import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="challenge"
        options={{
          title: 'challenge',
          tabBarIcon: ({ color }) => <IconSymbol name="star" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'create',
          tabBarIcon: ({ color }) => <IconSymbol  name="palette" color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="message"
        options={{
          title: 'message',
          tabBarIcon: ({ color }) => <IconSymbol name="mail" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'profile',
          tabBarIcon: ({ color }) => <IconSymbol name="profile_frame" color={color} />,
        }}
      />
    </Tabs>
  );
}
