import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function AdminReportsScreen() {
  const navigation = useNavigation<any>();

  const reports = [
    { id: 'daily', name: 'Daily Report', icon: 'calendar-today', color: '#2196F3', desc: 'View daily transaction summary' },
    { id: 'weekly', name: 'Weekly Report', icon: 'calendar-week', color: '#4CAF50', desc: 'Week-wise performance analysis' },
    { id: 'monthly', name: 'Monthly Report', icon: 'calendar-month', color: '#FF9800', desc: 'Monthly revenue and growth' },
    { id: 'user', name: 'User Report', icon: 'account-group', color: '#9C27B0', desc: 'User-wise transaction report' },
    { id: 'commission', name: 'Commission Report', icon: 'cash-multiple', color: '#00BCD4', desc: 'Commission paid to users' },
    { id: 'service', name: 'Service Report', icon: 'chart-pie', color: '#F44336', desc: 'Service-wise breakdown' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color="#673AB7" />
          <Text style={styles.infoText}>
            Select a report type to view detailed analytics. Reports are generated in real-time based on transaction data.
          </Text>
        </View>

        {reports.map((report) => (
          <TouchableOpacity key={report.id} style={styles.reportCard}>
            <View style={[styles.reportIcon, { backgroundColor: report.color }]}>
              <MaterialCommunityIcons name={report.icon as any} size={28} color="#fff" />
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>{report.name}</Text>
              <Text style={styles.reportDesc}>{report.desc}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}

        <View style={styles.noteCard}>
          <MaterialCommunityIcons name="file-download" size={20} color="#4CAF50" />
          <Text style={styles.noteText}>
            Reports can be exported as PDF or Excel. Feature coming soon!
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
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#EDE7F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#673AB7',
    marginLeft: 12,
    lineHeight: 20,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reportIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 16,
  },
  reportName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  reportDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  noteCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 12,
  },
});
