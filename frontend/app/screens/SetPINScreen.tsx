import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function SetPINScreen({ navigation }: any) {
  const { refreshUser } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetPIN = async () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/set-pin', { pin });
      if (response.data.success) {
        await refreshUser();
        // Navigation will automatically switch to Main tabs
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="lock-outline" size={50} color="#fff" />
          </View>
          <Text style={styles.title}>Set Your PIN</Text>
          <Text style={styles.subtitle}>Create a 4-digit PIN for quick login</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Enter PIN</Text>
          <TextInput
            mode="outlined"
            placeholder="Enter 4-digit PIN"
            value={pin}
            onChangeText={(text) => {
              setPin(text.replace(/[^0-9]/g, ''));
              setError('');
            }}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            style={styles.input}
            outlineColor="#e0e0e0"
            activeOutlineColor="#2196F3"
            left={<TextInput.Icon icon="lock" />}
          />

          <Text style={styles.label}>Confirm PIN</Text>
          <TextInput
            mode="outlined"
            placeholder="Re-enter 4-digit PIN"
            value={confirmPin}
            onChangeText={(text) => {
              setConfirmPin(text.replace(/[^0-9]/g, ''));
              setError('');
            }}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            style={styles.input}
            outlineColor="#e0e0e0"
            activeOutlineColor="#2196F3"
            left={<TextInput.Icon icon="lock-check" />}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={handleSetPIN}
            loading={loading}
            disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Set PIN
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  form: {
    padding: 24,
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
  button: {
    marginTop: 8,
    backgroundColor: '#4CAF50',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  error: {
    color: '#f44336',
    fontSize: 14,
    marginBottom: 8,
  },
});
