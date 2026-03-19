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

const allServices = [
  {
    category: 'Recharge',
    items: [
      { id: 'mobile', name: 'Mobile Recharge', icon: 'cellphone', color: '#FF9800', screen: 'MobileRecharge' },
      { id: 'dth', name: 'DTH Recharge', icon: 'television', color: '#9C27B0', screen: 'DTHRecharge' },
    ],
  },
  {
    category: 'Bill Payments',
    items: [
      { id: 'electricity', name: 'Electricity Bill', icon: 'flash', color: '#F44336', screen: 'ElectricityBill' },
      { id: 'water', name: 'Water Bill', icon: 'water', color: '#2196F3', screen: 'WaterBill' },
      { id: 'gas', name: 'Gas Bill', icon: 'fire', color: '#FF5722', screen: 'GasBill' },
    ],
  },
  {
    category: 'Financial Services',
    items: [
      { id: 'aeps', name: 'AEPS', icon: 'fingerprint', color: '#4CAF50', screen: 'AEPS' },
      { id: 'dmt', name: 'Money Transfer', icon: 'bank-transfer', color: '#00BCD4', screen: 'DMT' },
      { id: 'statement', name: 'Mini Statement', icon: 'file-document', color: '#795548', screen: 'Statement' },
    ],
  },
];

export default function ServicesScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Services</Text>
      </View>

      <ScrollView style={styles.content}>
        {allServices.map((category, index) => (
          <View key={index} style={styles.category}>
            <Text style={styles.categoryTitle}>{category.category}</Text>
            <View style={styles.servicesList}>
              {category.items.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceItem}
                  onPress={() => navigation.navigate(service.screen)}
                >
                  <View style={[styles.serviceIconLarge, { backgroundColor: service.color }]}>
                    <MaterialCommunityIcons name={service.icon as any} size={32} color="#fff" />
                  </View>
                  <Text style={styles.serviceText}>{service.name}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
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
  category: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
  },
  servicesList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
