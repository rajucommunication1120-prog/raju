import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from './contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Import screens
import LoginScreen from './screens/LoginScreen';
import OTPScreen from './screens/OTPScreen';
import SetPINScreen from './screens/SetPINScreen';
import MainTabs from './navigation/MainTabs';
import MobileRechargeScreen from './screens/MobileRechargeScreen';

// Import Distributor screens
import DistributorDashboard from './screens/distributor/DistributorDashboard';
import RetailerListScreen from './screens/distributor/RetailerListScreen';
import AddRetailerScreen from './screens/distributor/AddRetailerScreen';
import RetailerDetailScreen from './screens/distributor/RetailerDetailScreen';
import SalesReportScreen from './screens/distributor/SalesReportScreen';
import ReferralInfoScreen from './screens/distributor/ReferralInfoScreen';

// Import Admin screens
import AdminDashboard from './screens/admin/AdminDashboard';
import AdminUserListScreen from './screens/admin/AdminUserListScreen';
import AdminTransactionsScreen from './screens/admin/AdminTransactionsScreen';
import AdminReportsScreen from './screens/admin/AdminReportsScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <NavigationContainer independent={true}>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="SetPIN" component={SetPINScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="MobileRecharge" component={MobileRechargeScreen} />
            
            {/* Distributor Screens */}
            <Stack.Screen name="DistributorDashboard" component={DistributorDashboard} />
            <Stack.Screen name="RetailerList" component={RetailerListScreen} />
            <Stack.Screen name="AddRetailer" component={AddRetailerScreen} />
            <Stack.Screen name="RetailerDetail" component={RetailerDetailScreen} />
            <Stack.Screen name="SalesReport" component={SalesReportScreen} />
            <Stack.Screen name="ReferralInfo" component={ReferralInfoScreen} />
            
            {/* Admin Screens */}
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="AdminUserList" component={AdminUserListScreen} />
            <Stack.Screen name="AdminTransactions" component={AdminTransactionsScreen} />
            <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function Index() {
  return <AppNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
