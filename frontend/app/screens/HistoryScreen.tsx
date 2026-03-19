import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const [transResponse, statsResponse] = await Promise.all([
        api.get('/transactions?limit=100'),
        api.get('/transactions/stats'),
      ]);
      setTransactions(transResponse.data.transactions);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Commission Card */}
        {stats && (
          <View style={styles.commissionCard}>
            <View style={styles.commissionItem}>
              <Text style={styles.commissionLabel}>Total Commission Earned</Text>
              <Text style={styles.commissionAmount}>₹{stats.total_commission}</Text>
            </View>
          </View>
        )}

        {/* Transactions List */}
        <View style={styles.section}>
          {transactions.length > 0 ? (
            transactions.map((transaction: any) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionIcon}>
                    <MaterialCommunityIcons
                      name={getTransactionIcon(transaction.type)}
                      size={24}
                      color={transaction.status === 'success' ? '#4CAF50' : '#F44336'}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>
                      {transaction.service.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.transactionId}>ID: {transaction.id.slice(0, 12)}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionFooter}>
                  <View style={styles.amountRow}>
                    <Text style={styles.label}>Amount:</Text>
                    <Text style={styles.amount}>₹{transaction.amount.toFixed(2)}</Text>
                  </View>
                  {transaction.commission > 0 && (
                    <View style={styles.amountRow}>
                      <Text style={styles.label}>Commission:</Text>
                      <Text style={styles.commission}>+₹{transaction.commission.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={styles.amountRow}>
                    <Text style={styles.label}>Status:</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            transaction.status === 'success' ? '#E8F5E9' : '#FFEBEE',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: transaction.status === 'success' ? '#4CAF50' : '#F44336' },
                        ]}
                      >
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="inbox" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function getTransactionIcon(type: string) {
  const icons: any = {
    recharge: 'cellphone',
    bill: 'file-document',
    aeps: 'fingerprint',
    dmt: 'bank-transfer',
    wallet: 'wallet',
  };
  return icons[type] || 'cash';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  commissionCard: {
    backgroundColor: '#4CAF50',
    margin: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  commissionItem: {
    alignItems: 'center',
  },
  commissionLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  commissionAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  transactionFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  commission: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});
