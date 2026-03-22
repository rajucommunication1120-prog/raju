import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

interface ReferralInfo {
  referral_code: string;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  referred_users: Array<{
    name: string;
    phone: string;
    created_at: string;
  }>;
}

export default function ReferralInfoScreen() {
  const navigation = useNavigation<any>();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadReferralInfo();
  }, []);

  const loadReferralInfo = async () => {
    try {
      const response = await api.get('/referral/info');
      setInfo(response.data);
    } catch (error) {
      console.error('Error loading referral info:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReferralInfo();
    setRefreshing(false);
  };

  const copyToClipboard = async () => {
    if (info?.referral_code) {
      await Clipboard.setStringAsync(info.referral_code);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    }
  };

  const shareReferralCode = async () => {
    if (info?.referral_code) {
      try {
        await Share.share({
          message: `Join DIGIR HUB using my referral code: ${info.referral_code} and get ₹50 bonus!`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const claimRewards = async () => {
    if (!info?.pending_earnings || info.pending_earnings === 0) {
      Alert.alert('No Rewards', 'You have no pending rewards to claim');
      return;
    }

    setClaiming(true);
    try {
      const response = await api.post('/referral/claim');
      Alert.alert(
        'Success!',
        `₹${response.data.amount} has been added to your wallet!`,
        [{ text: 'OK', onPress: loadReferralInfo }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to claim rewards');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral Program</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Referral Code Card */}
        <View style={styles.codeCard}>
          <MaterialCommunityIcons name="gift" size={48} color="#FF9800" />
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{info?.referral_code || '...'}</Text>
          </View>
          <View style={styles.codeActions}>
            <TouchableOpacity style={styles.codeButton} onPress={copyToClipboard}>
              <MaterialCommunityIcons name="content-copy" size={20} color="#2196F3" />
              <Text style={styles.codeButtonText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.codeButton} onPress={shareReferralCode}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#4CAF50" />
              <Text style={styles.codeButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{info?.total_referrals || 0}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              ₹{(info?.total_earnings || 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        {/* Pending Rewards */}
        {info?.pending_earnings && info.pending_earnings > 0 ? (
          <View style={styles.pendingCard}>
            <View style={styles.pendingInfo}>
              <MaterialCommunityIcons name="wallet-giftcard" size={32} color="#FF9800" />
              <View style={styles.pendingText}>
                <Text style={styles.pendingLabel}>Pending Rewards</Text>
                <Text style={styles.pendingValue}>₹{info.pending_earnings.toFixed(0)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.claimButton, claiming && styles.claimButtonDisabled]}
              onPress={claimRewards}
              disabled={claiming}
            >
              <Text style={styles.claimButtonText}>{claiming ? 'Claiming...' : 'Claim Now'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDesc}>Share your referral code with friends</Text>
            </View>
          </View>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>They Sign Up</Text>
              <Text style={styles.stepDesc}>When they register using your code</Text>
            </View>
          </View>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Earn ₹50</Text>
              <Text style={styles.stepDesc}>Get ₹50 bonus for each successful referral</Text>
            </View>
          </View>
        </View>

        {/* Referred Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          {info?.referred_users && info.referred_users.length > 0 ? (
            info.referred_users.map((user, index) => (
              <View key={index} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userPhone}>{user.phone}</Text>
                </View>
                <View style={styles.userReward}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.userRewardText}>+₹50</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-multiple-plus" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No referrals yet</Text>
              <Text style={styles.emptySubtext}>Start sharing your code!</Text>
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
  header: {
    backgroundColor: '#FF9800',
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
  codeCard: {
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
  codeLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  codeBox: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9800',
    letterSpacing: 4,
  },
  codeActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  codeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pendingCard: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingText: {
    marginLeft: 12,
  },
  pendingLabel: {
    fontSize: 12,
    color: '#666',
  },
  pendingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  claimButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepInfo: {
    flex: 1,
    marginLeft: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stepDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  userReward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRewardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
});
