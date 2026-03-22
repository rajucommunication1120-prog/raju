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

interface AdminStats {
  total_users: number;
  total_distributors: number;
  total_retailers: number;
  total_transactions: number;
  total_revenue: number;
  total_commission: number;
  today: {
    transactions: number;
    revenue: number;
    new_users: number;
  };
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // This would need an admin API endpoint - for now using mock data
      // const response = await api.get('/admin/stats');
      // setStats(response.data);
      
      // Mock data for demo
      setStats({
        total_users: 156,
        total_distributors: 12,
        total_retailers: 144,
        total_transactions: 2847,
        total_revenue: 1250000,
        total_commission: 25000,
        today: {
          transactions: 145,
          revenue: 67500,
          new_users: 8,
        },
      });
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

  const StatCard = ({ icon, label, value, color, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <MaterialCommunityIcons name={icon} size={28} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Panel</Text>
          <Text style={styles.subtitle}>DIGIR HUB Management</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Today's Stats */}
        <View style={styles.todayCard}>
          <Text style={styles.todayTitle}>Today's Overview</Text>
          <View style={styles.todayRow}>
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>{stats?.today.transactions || 0}</Text>
              <Text style={styles.todayLabel}>Transactions</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>₹{((stats?.today.revenue || 0) / 1000).toFixed(0)}K</Text>
              <Text style={styles.todayLabel}>Revenue</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>{stats?.today.new_users || 0}</Text>
              <Text style={styles.todayLabel}>New Users</Text>
            </View>
          </View>
        </View>

        {/* User Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="account-group"
              label="Total Users"
              value={stats?.total_users || 0}
              color="#2196F3"
              onPress={() => navigation.navigate('AdminUserList')}
            />
            <StatCard
              icon="store"
              label="Distributors"
              value={stats?.total_distributors || 0}
              color="#4CAF50"
              onPress={() => navigation.navigate('AdminDistributorList')}
            />
            <StatCard
              icon="account"
              label="Retailers"
              value={stats?.total_retailers || 0}
              color="#FF9800"
              onPress={() => navigation.navigate('AdminRetailerList')}
            />
            <StatCard
              icon="swap-horizontal"
              label="Transactions"
              value={stats?.total_transactions || 0}
              color="#9C27B0"
              onPress={() => navigation.navigate('AdminTransactions')}
            />
          </View>
        </View>

        {/* Financial Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <View style={styles.financeCard}>
            <View style={styles.financeItem}>
              <MaterialCommunityIcons name="currency-inr" size={32} color="#4CAF50" />
              <View style={styles.financeInfo}>
                <Text style={styles.financeLabel}>Total Revenue</Text>
                <Text style={styles.financeValue}>₹{((stats?.total_revenue || 0) / 100000).toFixed(2)}L</Text>
              </View>
            </View>
            <View style={styles.financeDivider} />
            <View style={styles.financeItem}>
              <MaterialCommunityIcons name="wallet" size={32} color="#FF9800" />
              <View style={styles.financeInfo}>
                <Text style={styles.financeLabel}>Commission Paid</Text>
                <Text style={styles.financeValue}>₹{((stats?.total_commission || 0) / 1000).toFixed(1)}K</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#E3F2FD' }]}
              onPress={() => navigation.navigate('AdminUserList')}
            >
              <MaterialCommunityIcons name="account-search" size={32} color="#2196F3" />
              <Text style={styles.actionText}>View Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#E8F5E9' }]}
              onPress={() => navigation.navigate('AdminTransactions')}
            >
              <MaterialCommunityIcons name="receipt" size={32} color="#4CAF50" />
              <Text style={styles.actionText}>Transactions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#FFF3E0' }]}
              onPress={() => navigation.navigate('AdminReports')}
            >
              <MaterialCommunityIcons name="chart-line" size={32} color="#FF9800" />
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#F3E5F5' }]}
              onPress={() => navigation.navigate('AdminSettings')}
            >
              <MaterialCommunityIcons name="cog" size={32} color="#9C27B0" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.noteCard}>
          <MaterialCommunityIcons name="information" size={20} color="#2196F3" />
          <Text style={styles.noteText}>
            Note: This is a demo admin panel. Full admin features require backend integration.
          </Text>
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
    backgroundColor: '#673AB7',
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
  logoutButton: {
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
    backgroundColor: '#673AB7',
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
  financeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  financeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeInfo: {
    marginLeft: 16,
    flex: 1,
  },
  financeLabel: {
    fontSize: 14,
    color: '#666',
  },
  financeValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  financeDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  noteCard: {
    backgroundColor: '#E3F2FD',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 12,
    lineHeight: 20,
  },
});
