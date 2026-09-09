import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalToast } from '../components/Toast';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <GlobalToast />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#0f172a',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="property/[id]"
          options={{ title: 'Property Details', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="post-property/index"
          options={{ title: 'Post New Property', presentation: 'modal' }}
        />
        <Stack.Screen
          name="(auth)/login"
          options={{ title: 'Sign In', presentation: 'modal' }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{ title: 'Create Account', presentation: 'modal' }}
        />
        <Stack.Screen
          name="leads/index"
          options={{ title: 'Received Leads' }}
        />
        <Stack.Screen
          name="site-visits/index"
          options={{ title: 'Site Visits' }}
        />
        <Stack.Screen
          name="my-properties/index"
          options={{ title: 'My Listed Properties' }}
        />
        <Stack.Screen
          name="edit-property/[id]"
          options={{ title: 'Edit Property' }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
