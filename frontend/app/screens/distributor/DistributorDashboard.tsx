import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { useNavigation } from '@react-navigation/native';

interface DashboardStats {
  total_retailers: number;
  active_retailers: number;
  total_transactions: number;
  total_revenue: number;
  total_commission: number;
  today: {
    transactions: number;
    revenue: number;
    commission: number;
  };
  top_performers: Array<{
    name: string;
    phone: string;
    transactions: number;
    revenue: number;
  }>;
}

export default function DistributorDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/distributor/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const StatCard = ({ icon, label, value, color, subValue }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Distributor Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {user?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.referralButton}
          onPress={() => navigation.navigate('ReferralInfo')}
        >
          <MaterialCommunityIcons name="gift" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Today's Stats */}
        <View style={styles.todayCard}>
          <Text style={styles.todayTitle}>Today's Performance</Text>
          <View style={styles.todayRow}>
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>{stats?.today.transactions || 0}</Text>
              <Text style={styles.todayLabel}>Transactions</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>₹{stats?.today.revenue?.toFixed(0) || 0}</Text>
              <Text style={styles.todayLabel}>Revenue</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>₹{stats?.today.commission?.toFixed(0) || 0}</Text>
              <Text style={styles.todayLabel}>Commission</Text>
            </View>
          </View>
        </View>

        {/* Overall Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="account-group"
              label="Total Retailers"
              value={stats?.total_retailers || 0}
              color="#2196F3"
            />
            <StatCard
              icon="account-check"
              label="Active Retailers"
              value={stats?.active_retailers || 0}
              color="#4CAF50"
            />
            <StatCard
              icon="swap-horizontal"
              label="Transactions"
              value={stats?.total_transactions || 0}
              color="#FF9800"
            />
            <StatCard
              icon="currency-inr"
              label="Total Revenue"
              value={`₹${(stats?.total_revenue || 0).toFixed(0)}`}
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => navigation.navigate('AddRetailer')}
            >
              <MaterialCommunityIcons name="account-plus" size={24} color="#fff" />
              <Text style={styles.actionText}>Add Retailer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
              onPress={() => navigation.navigate('RetailerList')}
            >
              <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
              <Text style={styles.actionText}>My Retailers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => navigation.navigate('SalesReport')}
            >
              <MaterialCommunityIcons name="chart-bar" size={24} color="#fff" />
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          {stats?.top_performers && stats.top_performers.length > 0 ? (
            stats.top_performers.map((performer, index) => (
              <View key={index} style={styles.performerCard}>
                <View style={styles.performerRank}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={styles.performerName}>{performer.name}</Text>
                  <Text style={styles.performerPhone}>{performer.phone}</Text>
                </View>
                <View style={styles.performerStats}>
                  <Text style={styles.performerRevenue}>₹{performer.revenue.toFixed(0)}</Text>
                  <Text style={styles.performerTxns}>{performer.transactions} txns</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="trophy-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No performers yet</Text>
            </View>
          )}
        </View>

        {/* Commission Summary */}
        <View style={styles.commissionCard}>
          <MaterialCommunityIcons name="wallet" size={32} color="#4CAF50" />
          <View style={styles.commissionInfo}>
            <Text style={styles.commissionLabel}>Total Commission Earned</Text>
            <Text style={styles.commissionValue}>₹{(stats?.total_commission || 0).toFixed(2)}</Text>
          </View>
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
  header: {
    backgroundColor: '#1976D2',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  referralButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  todayCard: {
    backgroundColor: '#1976D2',
    margin: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  todayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  todayItem: {
    alignItems: 'center',
    flex: 1,
  },
  todayValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  todayLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  todayDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statSubValue: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  performerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  performerRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  performerPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  performerStats: {
    alignItems: 'flex-end',
  },
  performerRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  performerTxns: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  commissionCard: {
    backgroundColor: '#E8F5E9',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  commissionInfo: {
    marginLeft: 16,
    flex: 1,
  },
  commissionLabel: {
    fontSize: 14,
    color: '#666',
  },
  commissionValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
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
