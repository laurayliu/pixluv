import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Image, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import ProfileFrameSVG from '../../assets/icons/profile_frame.svg';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { token, user } = useAuth();

  if (!token) return <Redirect href="/login" />;

  return (
    
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: {backgroundColor: '#ff77a8'},
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
          tabBarIcon: () => (
            <View style={{ width: 39, height: 39, transform: [{ scale: 0.85 }] }}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={{ position: 'absolute', width: 39, height: 39, borderRadius: 19.5 }} />
              ) : null}
              <ProfileFrameSVG width={39} height={39} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="drawing"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
