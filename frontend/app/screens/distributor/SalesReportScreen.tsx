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
import { api } from '../../services/api';
import { useNavigation } from '@react-navigation/native';

interface SalesReport {
  summary: {
    total_transactions: number;
    total_amount: number;
    total_commission: number;
  };
  by_service: Array<{
    _id: string;
    count: number;
    total_amount: number;
    total_commission: number;
  }>;
  by_date: Array<{
    _id: string;
    count: number;
    amount: number;
  }>;
}

export default function SalesReportScreen() {
  const navigation = useNavigation<any>();
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const response = await api.get('/reports/sales');
      setReport(response.data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReport();
    setRefreshing(false);
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

  const getServiceColor = (service: string) => {
    const colors: { [key: string]: string } = {
      recharge: '#FF9800',
      bill: '#2196F3',
      aeps: '#4CAF50',
      dmt: '#9C27B0',
      wallet: '#00BCD4',
    };
    return colors[service] || '#999';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Report</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{report?.summary.total_transactions || 0}</Text>
              <Text style={styles.summaryLabel}>Transactions</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>₹{(report?.summary.total_amount || 0).toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>Revenue</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>₹{(report?.summary.total_commission || 0).toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>Commission</Text>
            </View>
          </View>
        </View>

        {/* Service Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service-wise Breakdown</Text>
          {report?.by_service && report.by_service.length > 0 ? (
            report.by_service.map((service, index) => (
              <View key={index} style={styles.serviceCard}>
                <View style={[styles.serviceIcon, { backgroundColor: getServiceColor(service._id) }]}>
                  <MaterialCommunityIcons
                    name={getServiceIcon(service._id) as any}
                    size={24}
                    color="#fff"
                  />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service._id.toUpperCase()}</Text>
                  <Text style={styles.serviceCount}>{service.count} transactions</Text>
                </View>
                <View style={styles.serviceStats}>
                  <Text style={styles.serviceAmount}>₹{service.total_amount.toFixed(0)}</Text>
                  <Text style={styles.serviceCommission}>+₹{service.total_commission.toFixed(0)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chart-bar" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No data available</Text>
            </View>
          )}
        </View>

        {/* Date-wise Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>
          {report?.by_date && report.by_date.length > 0 ? (
            report.by_date.map((day, index) => (
              <View key={index} style={styles.dateCard}>
                <View style={styles.dateInfo}>
                  <MaterialCommunityIcons name="calendar" size={20} color="#666" />
                  <Text style={styles.dateText}>{day._id}</Text>
                </View>
                <View style={styles.dateStats}>
                  <Text style={styles.dateCount}>{day.count} txns</Text>
                  <Text style={styles.dateAmount}>₹{day.amount.toFixed(0)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No recent transactions</Text>
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
  summaryCard: {
    backgroundColor: '#FF9800',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  summaryDivider: {
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
  serviceCard: {
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
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  serviceCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  serviceStats: {
    alignItems: 'flex-end',
  },
  serviceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceCommission: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  dateStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCount: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
  },
  dateAmount: {
    fontSize: 16,
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
