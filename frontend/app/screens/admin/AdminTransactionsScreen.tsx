import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Transaction {
  id: string;
  user_name: string;
  user_phone: string;
  type: string;
  service: string;
  amount: number;
  commission: number;
  status: string;
  created_at: string;
}

export default function AdminTransactionsScreen() {
  const navigation = useNavigation<any>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recharge' | 'bill' | 'wallet'>('all');

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      // Mock data for demo
      const mockTransactions: Transaction[] = [
        { id: '1', user_name: 'John Distributor', user_phone: '9876543210', type: 'recharge', service: 'prepaid', amount: 500, commission: 10, status: 'success', created_at: '2024-03-22T10:30:00' },
        { id: '2', user_name: 'Jane Retailer', user_phone: '9876543211', type: 'recharge', service: 'dth', amount: 350, commission: 7, status: 'success', created_at: '2024-03-22T09:15:00' },
        { id: '3', user_name: 'Bob Retailer', user_phone: '9876543212', type: 'wallet', service: 'add_money', amount: 2000, commission: 0, status: 'success', created_at: '2024-03-22T08:45:00' },
        { id: '4', user_name: 'Alice Distributor', user_phone: '9876543213', type: 'recharge', service: 'prepaid', amount: 199, commission: 4, status: 'failed', created_at: '2024-03-21T16:20:00' },
        { id: '5', user_name: 'Charlie Retailer', user_phone: '9876543214', type: 'recharge', service: 'dth', amount: 850, commission: 17, status: 'success', created_at: '2024-03-21T14:10:00' },
      ];
      
      let filtered = mockTransactions;
      if (filter !== 'all') {
        filtered = mockTransactions.filter(t => t.type === filter);
      }
      setTransactions(filtered);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      recharge: 'cellphone',
      bill: 'file-document',
      wallet: 'wallet',
      aeps: 'fingerprint',
      dmt: 'bank-transfer',
    };
    return icons[type] || 'cash';
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      recharge: '#FF9800',
      bill: '#2196F3',
      wallet: '#4CAF50',
      aeps: '#9C27B0',
      dmt: '#00BCD4',
    };
    return colors[type] || '#999';
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.txnCard}>
      <View style={styles.txnHeader}>
        <View style={[styles.txnIcon, { backgroundColor: getTypeColor(item.type) }]}>
          <MaterialCommunityIcons name={getTypeIcon(item.type) as any} size={20} color="#fff" />
        </View>
        <View style={styles.txnInfo}>
          <Text style={styles.txnUser}>{item.user_name}</Text>
          <Text style={styles.txnPhone}>{item.user_phone}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'success' ? '#E8F5E9' : '#FFEBEE' }]}>
          <Text style={[styles.statusText, { color: item.status === 'success' ? '#4CAF50' : '#F44336' }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.txnDetails}>
        <View style={styles.txnDetail}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{item.type.toUpperCase()}</Text>
        </View>
        <View style={styles.txnDetail}>
          <Text style={styles.detailLabel}>Service</Text>
          <Text style={styles.detailValue}>{item.service.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <View style={styles.txnDetail}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={[styles.detailValue, { color: '#4CAF50' }]}>₹{item.amount}</Text>
        </View>
        <View style={styles.txnDetail}>
          <Text style={styles.detailLabel}>Commission</Text>
          <Text style={styles.detailValue}>₹{item.commission}</Text>
        </View>
      </View>

      <Text style={styles.txnDate}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Transactions</Text>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'recharge', 'wallet'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="receipt" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No transactions found</Text>
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
    backgroundColor: '#673AB7',
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
  filterRow: {
    flexDirection: 'row',
    padding: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#673AB7',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  txnCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  txnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txnInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txnUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  txnPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  txnDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  txnDetail: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  txnDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
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
});
