import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const services = [
  { id: 'prepaid', name: 'Prepaid', icon: 'cellphone', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'postpaid', name: 'Postpaid', icon: 'cellphone-check', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'dth', name: 'DTH', icon: 'satellite-variant', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'landline', name: 'Landline', icon: 'phone-classic', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'electricity', name: 'Electricity', icon: 'lightning-bolt', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'gas', name: 'Piped Gas', icon: 'fire', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'broadband', name: 'Broadband', icon: 'wifi', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'water', name: 'Water', icon: 'water', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'loan', name: 'Loan\nRepayment', icon: 'cash-refund', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'lpg', name: 'LPG Gas\nCylinder', icon: 'gas-cylinder', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'insurance', name: 'Insurance\nPremium', icon: 'shield-check', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'fastag', name: 'FASTag', icon: 'car', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'cabletv', name: 'Cable TV', icon: 'television', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'tax', name: 'Municipal\nTaxes', icon: 'bank', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'education', name: 'Education\nFees', icon: 'school', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'housing', name: 'Housing\nSociety', icon: 'home-city', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'creditcard', name: 'Credit Card', icon: 'credit-card', color: '#FF6B35', screen: 'MobileRecharge' },
  { id: 'whatsapp', name: 'WhatsApp\nCare', icon: 'whatsapp', color: '#25D366', screen: 'MobileRecharge' },
];

const distributorServices = [
  { id: 'dashboard', name: 'Dashboard', icon: 'view-dashboard', color: '#1976D2', screen: 'DistributorDashboard' },
  { id: 'retailers', name: 'My\nRetailers', icon: 'account-group', color: '#4CAF50', screen: 'RetailerList' },
  { id: 'addRetailer', name: 'Add\nRetailer', icon: 'account-plus', color: '#FF9800', screen: 'AddRetailer' },
  { id: 'reports', name: 'Sales\nReports', icon: 'chart-bar', color: '#9C27B0', screen: 'SalesReport' },
];

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const newsScrollX = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    loadData();
    startNewsAnimation();
  }, []);

  const startNewsAnimation = () => {
    Animated.loop(
      Animated.timing(newsScrollX, {
        toValue: -width,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  };

  const loadData = async () => {
    try {
      await refreshUser();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin': return 'Admin';
      case 'distributor': return 'Distributor';
      default: return 'Retailer';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>DR</Text>
            <Text style={styles.logoSubtext}>DIGIR HUB</Text>
          </View>
          <View style={styles.balanceContainer}>
            <View style={styles.balanceItem}>
              <MaterialCommunityIcons name="wallet" size={16} color="#4CAF50" />
              <Text style={styles.balanceLabel}>Prepaid</Text>
              <Text style={styles.balanceValue}>₹ {user?.wallet_balance?.toFixed(1) || '0.0'}</Text>
            </View>
            <View style={styles.balanceItem}>
              <MaterialCommunityIcons name="wallet-outline" size={16} color="#FF9800" />
              <Text style={styles.balanceLabel}>Utility</Text>
              <Text style={styles.balanceValue}>₹ 0.0</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name} ( {getRoleLabel()} )</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>SUCCESS!</Text>
            <Text style={styles.bannerText}>ADD MONEY WORKING FINE NOW</Text>
            <Text style={styles.bannerSubtext}>Purchase Your Balance Via:</Text>
            <View style={styles.paymentIcons}>
              <View style={[styles.paymentIcon, { backgroundColor: '#5f259f' }]}>
                <Text style={styles.paymentText}>PhonePe</Text>
              </View>
              <View style={[styles.paymentIcon, { backgroundColor: '#4285F4' }]}>
                <Text style={styles.paymentText}>GPay</Text>
              </View>
              <View style={[styles.paymentIcon, { backgroundColor: '#00BAF2' }]}>
                <Text style={styles.paymentText}>Paytm</Text>
              </View>
              <View style={[styles.paymentIcon, { backgroundColor: '#FF6B00' }]}>
                <Text style={styles.paymentText}>UPI</Text>
              </View>
            </View>
            <View style={styles.commissionBadge}>
              <Text style={styles.commissionText}>Get EXTRA 1% COMMISSION</Text>
              <Text style={styles.commissionSubtext}>ON ABOVE Rs.5000 LOAD</Text>
            </View>
            <TouchableOpacity style={styles.topUpButton}>
              <Text style={styles.topUpText}>TOP UP NOW</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* News Ticker */}
        <View style={styles.newsTicker}>
          <View style={styles.newsLabel}>
            <Text style={styles.newsLabelText}>News</Text>
          </View>
          <View style={styles.newsContent}>
            <Animated.Text
              style={[
                styles.newsText,
                { transform: [{ translateX: newsScrollX }] },
              ]}
            >
              Welcome To Digir Hub - Your One Stop Digital Services Platform
            </Animated.Text>
          </View>
        </View>

        {/* Distributor Section - Show only for distributors */}
        {user?.role === 'distributor' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Super Distribution</Text>
            <View style={styles.servicesGrid}>
              {distributorServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => navigation.navigate(service.screen)}
                >
                  <View style={[styles.serviceIconWrapper]}>
                    <View style={[styles.serviceIcon, { borderColor: service.color }]}>
                      <MaterialCommunityIcons name={service.icon as any} size={28} color={service.color} />
                    </View>
                  </View>
                  <Text style={styles.serviceName}>{service.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recharge & Pay Bills</Text>
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => navigation.navigate(service.screen)}
              >
                <View style={styles.serviceIconWrapper}>
                  <View style={[styles.serviceIcon, { borderColor: '#FF6B35' }]}>
                    <MaterialCommunityIcons 
                      name={service.icon as any} 
                      size={28} 
                      color={service.id === 'whatsapp' ? '#25D366' : '#1a237e'} 
                    />
                  </View>
                </View>
                <Text style={styles.serviceName}>{service.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    backgroundColor: '#1a237e',
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    fontStyle: 'italic',
  },
  logoSubtext: {
    fontSize: 8,
    color: '#fff',
    opacity: 0.8,
  },
  balanceContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  balanceItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  balanceLabel: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  bannerContainer: {
    padding: 12,
  },
  banner: {
    backgroundColor: '#0d47a1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  bannerSubtext: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 8,
  },
  paymentIcons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  paymentIcon: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  paymentText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  commissionBadge: {
    alignItems: 'center',
    marginBottom: 8,
  },
  commissionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  commissionSubtext: {
    fontSize: 12,
    color: '#FF5722',
    fontWeight: '600',
  },
  topUpButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  topUpText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  newsTicker: {
    flexDirection: 'row',
    backgroundColor: '#1a237e',
    marginHorizontal: 12,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  newsLabel: {
    backgroundColor: '#0d47a1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  newsLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  newsContent: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  newsText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  serviceCard: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIconWrapper: {
    marginBottom: 8,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderTopWidth: 2,
    borderRightWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  serviceName: {
    fontSize: 11,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
    lineHeight: 14,
  },
});
