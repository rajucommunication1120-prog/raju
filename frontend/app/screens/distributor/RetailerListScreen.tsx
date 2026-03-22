import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useNavigation } from '@react-navigation/native';

interface Retailer {
  id: string;
  phone: string;
  name: string;
  email?: string;
  wallet_balance: number;
  is_active: boolean;
  created_at: string;
  stats?: {
    total_transactions: number;
    total_amount: number;
    total_commission: number;
  };
}

export default function RetailerListScreen() {
  const navigation = useNavigation<any>();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadRetailers();
  }, [search]);

  const loadRetailers = async () => {
    try {
      const params: any = { limit: 50 };
      if (search) params.search = search;
      const response = await api.get('/retailer/list', { params });
      setRetailers(response.data.retailers);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error loading retailers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRetailers();
    setRefreshing(false);
  };

  const handleWalletAction = async (retailerId: string, action: 'add' | 'deduct') => {
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
          loadRetailers();
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.detail || 'Failed to update wallet');
        }
      },
      'plain-text',
      '',
      'numeric'
    );
  };

  const renderRetailer = ({ item }: { item: Retailer }) => (
    <TouchableOpacity
      style={styles.retailerCard}
      onPress={() => navigation.navigate('RetailerDetail', { retailerId: item.id })}
    >
      <View style={styles.retailerHeader}>
        <View style={[styles.avatar, { backgroundColor: item.is_active ? '#4CAF50' : '#999' }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.retailerInfo}>
          <Text style={styles.retailerName}>{item.name}</Text>
          <Text style={styles.retailerPhone}>{item.phone}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#E8F5E9' : '#FFEBEE' }]}>
          <Text style={[styles.statusText, { color: item.is_active ? '#4CAF50' : '#F44336' }]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{item.wallet_balance.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Balance</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.stats?.total_transactions || 0}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{(item.stats?.total_amount || 0).toFixed(0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
          onPress={() => handleWalletAction(item.id, 'add')}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#F44336' }]}
          onPress={() => handleWalletAction(item.id, 'deduct')}
        >
          <MaterialCommunityIcons name="minus" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Deduct</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#2196F3' }]}
          onPress={() => navigation.navigate('RetailerDetail', { retailerId: item.id })}
        >
          <MaterialCommunityIcons name="eye" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Retailers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddRetailer')}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.countText}>{total} retailers found</Text>

      <FlatList
        data={retailers}
        keyExtractor={(item) => item.id}
        renderItem={renderRetailer}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No retailers found</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddRetailer')}
            >
              <Text style={styles.emptyButtonText}>Add First Retailer</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: 8,
    fontSize: 16,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  retailerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  retailerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  retailerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  retailerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  retailerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
