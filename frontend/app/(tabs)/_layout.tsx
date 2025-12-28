import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0e27',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 215, 0, 0.2)',
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="content-tips"
        options={{
          title: 'Tips',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bulb-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="main"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="planet-outline" size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="creator-universe"
        options={{
          title: 'Universe',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="telescope-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}