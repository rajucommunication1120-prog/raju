import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const operators = [
  'Airtel', 'Jio', 'Vi (Vodafone Idea)', 'BSNL', 'MTNL',
];

export default function MobileRechargeScreen() {
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation();
  const [number, setNumber] = useState('');
  const [operator, setOperator] = useState(operators[0]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('prepaid');
  const [loading, setLoading] = useState(false);

  const handleRecharge = async () => {
    if (number.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    const rechargeAmount = parseFloat(amount);
    if (isNaN(rechargeAmount) || rechargeAmount < 10) {
      Alert.alert('Error', 'Please enter a valid amount (minimum ₹10)');
      return;
    }

    if (user && user.wallet_balance < rechargeAmount) {
      Alert.alert('Insufficient Balance', 'Please add money to your wallet first');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/recharge', {
        operator,
        number,
        amount: rechargeAmount,
        type,
      });

      await refreshUser();

      if (response.data.success) {
        Alert.alert(
          'Recharge Successful! ✓',
          `Transaction ID: ${response.data.transaction_id}\nCommission: ₹${response.data.commission.toFixed(2)}`,
          [
            { text: 'Done', onPress: () => navigation.goBack() },
          ]
        );
      } else {
        Alert.alert('Recharge Failed', response.data.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Recharge failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="cellphone" size={40} color="#fff" />
        <Text style={styles.title}>Mobile Recharge</Text>
        <Text style={styles.balance}>Balance: ₹{user?.wallet_balance.toFixed(2)}</Text>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.typeSelector}>
          <Button
            mode={type === 'prepaid' ? 'contained' : 'outlined'}
            onPress={() => setType('prepaid')}
            style={styles.typeButton}
          >
            Prepaid
          </Button>
          <Button
            mode={type === 'postpaid' ? 'contained' : 'outlined'}
            onPress={() => setType('postpaid')}
            style={styles.typeButton}
          >
            Postpaid
          </Button>
        </View>

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          mode="outlined"
          placeholder="Enter 10-digit mobile number"
          value={number}
          onChangeText={(text) => setNumber(text.replace(/[^0-9]/g, ''))}
          keyboardType="phone-pad"
          maxLength={10}
          style={styles.input}
          left={<TextInput.Icon icon="phone" />}
        />

        <Text style={styles.label}>Operator</Text>
        <View style={styles.operatorGrid}>
          {operators.map((op) => (
            <Button
              key={op}
              mode={operator === op ? 'contained' : 'outlined'}
              onPress={() => setOperator(op)}
              style={styles.operatorButton}
              contentStyle={styles.operatorButtonContent}
              labelStyle={styles.operatorLabel}
            >
              {op}
            </Button>
          ))}
        </View>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          mode="outlined"
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
          left={<TextInput.Icon icon="currency-inr" />}
        />

        <View style={styles.quickAmounts}>
          {[10, 20, 50, 100, 200, 500].map((amt) => (
            <Button
              key={amt}
              mode="outlined"
              onPress={() => setAmount(amt.toString())}
              style={styles.quickButton}
            >
              ₹{amt}
            </Button>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleRecharge}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Recharge Now
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  balance: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  operatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  operatorButton: {
    flex: 1,
    minWidth: '45%',
  },
  operatorButtonContent: {
    paddingVertical: 4,
  },
  operatorLabel: {
    fontSize: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  quickButton: {
    flex: 1,
    minWidth: '30%',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
