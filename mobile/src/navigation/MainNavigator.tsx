import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

// Placeholder screens - will be implemented later
function MapScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.placeholder, { paddingTop: insets.top }]}>
      <Text style={styles.placeholderText}>Map Screen</Text>
      <Text style={styles.placeholderSubtext}>Coming soon...</Text>
    </View>
  );
}

function CatchesScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.placeholder, { paddingTop: insets.top }]}>
      <Text style={styles.placeholderText}>Catches Screen</Text>
      <Text style={styles.placeholderSubtext}>Coming soon...</Text>
    </View>
  );
}

function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.placeholder, { paddingTop: insets.top }]}>
      <Text style={styles.placeholderText}>Favorites Screen</Text>
      <Text style={styles.placeholderSubtext}>Coming soon...</Text>
    </View>
  );
}

function InsightsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.placeholder, { paddingTop: insets.top }]}>
      <Text style={styles.placeholderText}>Insights Screen</Text>
      <Text style={styles.placeholderSubtext}>Coming soon...</Text>
    </View>
  );
}

function AccountScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.placeholder, { paddingTop: insets.top }]}>
      <Text style={styles.placeholderText}>Account Screen</Text>
      <Text style={styles.placeholderSubtext}>Coming soon...</Text>
    </View>
  );
}

// Tab icon component
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconColor = focused ? colors.primary : colors.text.tertiary;

  // Simple text-based icons for now
  const icons: Record<string, string> = {
    Map: '🗺️',
    Catches: '🐟',
    Favorites: '⭐',
    Insights: '📊',
    Account: '👤',
  };

  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>
      {icons[name] || '•'}
    </Text>
  );
}

export type MainTabParamList = {
  Map: undefined;
  Catches: undefined;
  Favorites: undefined;
  Insights: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main App Navigator (Bottom Tabs)
 * Shows after user is authenticated
 */
export function MainNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border.default,
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 8,
          paddingTop: 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Catches" component={CatchesScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderSubtext: {
    color: colors.text.tertiary,
    fontSize: 16,
  },
});
