import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Redux Store
import store from './src/redux/store';

// Theme
import { theme } from './src/theme';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Constants
import { STORAGE_KEYS } from './src/constants';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState(null);

  // Load any resources or data that might take time before the app renders
  useEffect(() => {
    async function prepare() {
      try {
        // Load stored navigation state
        const savedStateString = await AsyncStorage.getItem(STORAGE_KEYS.NAVIGATION_STATE);
        const savedState = savedStateString ? JSON.parse(savedStateString) : null;
        if (savedState) {
          setInitialState(savedState);
        }

        // Load fonts, cached resources, etc.
        // await Font.loadAsync({...});

        // Register for push notifications
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus === 'granted') {
          const token = (await Notifications.getExpoPushTokenAsync()).data;
          // TODO: Send this token to the backend
          console.log('Push token:', token);
        }
      } catch (e) {
        console.warn('Error loading app resources:', e);
      } finally {
        // After resources are loaded
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  // Hide splash screen once our app is ready
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  // Save navigation state
  const onStateChange = (state) => {
    AsyncStorage.setItem(STORAGE_KEYS.NAVIGATION_STATE, JSON.stringify(state));
  };

  if (!isReady) {
    return null;
  }

  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <NavigationContainer initialState={initialState} onStateChange={onStateChange}>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    </ReduxProvider>
  );
} 