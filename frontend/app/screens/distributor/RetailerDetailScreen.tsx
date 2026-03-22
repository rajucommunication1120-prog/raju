import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';

interface RetailerDetail {
  retailer: {
    id: string;
    phone: string;
    name: string;
    email?: string;
    wallet_balance: number;
    is_active: boolean;
    kyc_status: string;
    commission_rates: {
      recharge: number;
      bill: number;
      aeps: number;
      dmt: number;
    };
    created_at: string;
    referral_code: string;
  };
  stats_by_type: Array<{
    _id: string;
    count: number;
    total_amount: number;
    total_commission: number;
  }>;
}

export default function RetailerDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { retailerId } = route.params;
  
  const [data, setData] = useState<RetailerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRetailerDetail();
  }, []);

  const loadRetailerDetail = async () => {
    try {
      const response = await api.get(`/retailer/${retailerId}`);
      setData(response.data);
    } catch (error) {
      console.error('Error loading retailer:', error);
      Alert.alert('Error', 'Failed to load retailer details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRetailerDetail();
    setRefreshing(false);
  };

  const toggleActive = async () => {
    try {
      await api.put(`/retailer/${retailerId}`, {
        is_active: !data?.retailer.is_active,
      });
      loadRetailerDetail();
    } catch (error) {
      Alert.alert('Error', 'Failed to update retailer status');
    }
  };

  const handleWalletAction = async (action: 'add' | 'deduct') => {
    Alert.prompt(
      `${action === 'add' ? 'Add' : 'Deduct'} Balance`,
      'Enter amount:',
      async (amount) => {
        if (!amount) return;
        try {
          await api.post(`/retailer/${retailerId}/wallet`, {
            retailer_id: retailerId,
            amount: parseFloat(amount),
            action,
          });
          Alert.alert('Success', `₹${amount} ${action}ed successfully`);
          loadRetailerDetail();
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.detail || 'Failed to update wallet');
        }
      },
      'plain-text',
      '',
      'numeric'
    );
  };

  const getServiceIcon = (service: string) => {
    const icons: { [key: string]: string } = {
      recharge: 'cellphone',
      bill: 'file-document',
      aeps: 'fingerprint',
      dmt: 'bank-transfer',
      wallet: 'wallet',
    };
    return icons[service] || 'cash';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Retailer not found</Text>
      </View>
    );
  }

  const { retailer, stats_by_type } = data;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Retailer Details</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: retailer.is_active ? '#4CAF50' : '#999' }]}>
            <Text style={styles.avatarText}>{retailer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{retailer.name}</Text>
          <Text style={styles.profilePhone}>{retailer.phone}</Text>
          {retailer.email && <Text style={styles.profileEmail}>{retailer.email}</Text>}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Active Status</Text>
            <Switch
              value={retailer.is_active}
              onValueChange={toggleActive}
              trackColor={{ false: '#ccc', true: '#81C784' }}
              thumbColor={retailer.is_active ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletInfo}>
            <MaterialCommunityIcons name="wallet" size={32} color="#4CAF50" />
            <View style={styles.walletText}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Text style={styles.walletValue}>₹{retailer.wallet_balance.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.walletActions}>
            <TouchableOpacity
              style={[styles.walletBtn, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleWalletAction('add')}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.walletBtnText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.walletBtn, { backgroundColor: '#F44336' }]}
              onPress={() => handleWalletAction('deduct')}
            >
              <MaterialCommunityIcons name="minus" size={20} color="#fff" />
              <Text style={styles.walletBtnText}>Deduct</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Referral Code</Text>
              <Text style={styles.infoValue}>{retailer.referral_code}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>KYC Status</Text>
              <View style={[
                styles.kycBadge,
                { backgroundColor: retailer.kyc_status === 'verified' ? '#E8F5E9' : '#FFF3E0' }
              ]}>
                <Text style={[
                  styles.kycText,
                  { color: retailer.kyc_status === 'verified' ? '#4CAF50' : '#FF9800' }
                ]}>
                  {retailer.kyc_status.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Joined On</Text>
              <Text style={styles.infoValue}>
                {new Date(retailer.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Commission Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commission Rates</Text>
          <View style={styles.ratesGrid}>
            <View style={styles.rateCard}>
              <Text style={styles.rateValue}>{retailer.commission_rates.recharge}%</Text>
              <Text style={styles.rateLabel}>Recharge</Text>
            </View>
            <View style={styles.rateCard}>
              <Text style={styles.rateValue}>{retailer.commission_rates.bill}%</Text>
              <Text style={styles.rateLabel}>Bill Pay</Text>
            </View>
            <View style={styles.rateCard}>
              <Text style={styles.rateValue}>{retailer.commission_rates.dmt}%</Text>
              <Text style={styles.rateLabel}>DMT</Text>
            </View>
          </View>
        </View>

        {/* Transaction Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Statistics</Text>
          {stats_by_type && stats_by_type.length > 0 ? (
            stats_by_type.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statIcon}>
                  <MaterialCommunityIcons
                    name={getServiceIcon(stat._id) as any}
                    size={24}
                    color="#2196F3"
                  />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statName}>{stat._id.toUpperCase()}</Text>
                  <Text style={styles.statCount}>{stat.count} transactions</Text>
                </View>
                <View style={styles.statNumbers}>
                  <Text style={styles.statAmount}>₹{stat.total_amount.toFixed(0)}</Text>
                  <Text style={styles.statCommission}>+₹{stat.total_commission.toFixed(0)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chart-bar" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1976D2',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profilePhone: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  walletCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletText: {
    marginLeft: 16,
  },
  walletLabel: {
    fontSize: 12,
    color: '#666',
  },
  walletValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  walletBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  kycBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kycText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  rateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  rateLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statNumbers: {
    alignItems: 'flex-end',
  },
  statAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statCommission: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
