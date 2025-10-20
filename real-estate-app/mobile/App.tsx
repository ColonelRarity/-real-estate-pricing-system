import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import PropertyFormScreen from './src/screens/PropertyFormScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PropertyMapScreen from './src/screens/PropertyMapScreen';

// Import services
import { AdService } from './src/services/AdService';
import { PropertyService } from './src/services/PropertyService';

export type RootStackParamList = {
  Main: undefined;
  PropertyForm: { editMode?: boolean; propertyId?: string };
  Results: { propertyId: string };
  PropertyMap: { propertyId?: string; showSimilar?: boolean };
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'History') {
            iconName = 'history';
          } else {
            iconName = 'settings';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Головна' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Історія' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Налаштування' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize AdMob
      await AdService.initialize();

      // Initialize Property Service
      await PropertyService.initialize();

      // Check if user has seen onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        // Show onboarding or rewarded ad
        await AdService.showRewardedAd();
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // You can add a loading screen here
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PropertyForm"
            component={PropertyFormScreen}
            options={{ title: 'Опис нерухомості' }}
          />
          <Stack.Screen
            name="Results"
            component={ResultsScreen}
            options={{ title: 'Результат оцінки' }}
          />
          <Stack.Screen
            name="PropertyMap"
            component={PropertyMapScreen}
            options={{ title: 'Карта нерухомості' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
