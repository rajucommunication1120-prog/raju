import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useNavigation } from '@react-navigation/native';

interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  wallet_balance: number;
  role: string;
  is_active: boolean;
  kyc_status: string;
  created_at: string;
}

export default function AdminUserListScreen() {
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'distributor' | 'retailer'>('all');

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    try {
      // This would need an admin API - using mock data for demo
      // const response = await api.get('/admin/users', { params: { role: filter !== 'all' ? filter : undefined } });
      // setUsers(response.data.users);
      
      // Mock data
      const mockUsers: User[] = [
        { id: '1', phone: '9876543210', name: 'John Distributor', role: 'distributor', wallet_balance: 50000, is_active: true, kyc_status: 'verified', created_at: '2024-01-15' },
        { id: '2', phone: '9876543211', name: 'Jane Retailer', role: 'retailer', wallet_balance: 15000, is_active: true, kyc_status: 'verified', created_at: '2024-02-20' },
        { id: '3', phone: '9876543212', name: 'Bob Retailer', role: 'retailer', wallet_balance: 8500, is_active: true, kyc_status: 'pending', created_at: '2024-03-10' },
        { id: '4', phone: '9876543213', name: 'Alice Distributor', role: 'distributor', wallet_balance: 75000, is_active: true, kyc_status: 'verified', created_at: '2024-01-20' },
        { id: '5', phone: '9876543214', name: 'Charlie Retailer', role: 'retailer', wallet_balance: 3200, is_active: false, kyc_status: 'pending', created_at: '2024-03-15' },
      ];
      
      let filtered = mockUsers;
      if (filter !== 'all') {
        filtered = mockUsers.filter(u => u.role === filter);
      }
      if (search) {
        filtered = filtered.filter(u => 
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.phone.includes(search)
        );
      }
      setUsers(filtered);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'distributor' ? '#4CAF50' : '#2196F3';
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={[styles.avatar, { backgroundColor: getRoleBadgeColor(item.role) }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userPhone}>{item.phone}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) + '20' }]}>
          <Text style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}>
            {item.role.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{item.wallet_balance.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Balance</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[
            styles.statusDot,
            { backgroundColor: item.is_active ? '#4CAF50' : '#F44336' }
          ]} />
          <Text style={styles.statLabel}>{item.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[
            styles.kycBadge,
            { backgroundColor: item.kyc_status === 'verified' ? '#E8F5E9' : '#FFF3E0' }
          ]}>
            <Text style={[
              styles.kycText,
              { color: item.kyc_status === 'verified' ? '#4CAF50' : '#FF9800' }
            ]}>
              {item.kyc_status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Users</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            loadUsers();
          }}
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'distributor', 'retailer'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
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
  userCard: {
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
  userHeader: {
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
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  userStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  kycBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kycText: {
    fontSize: 10,
    fontWeight: '600',
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
