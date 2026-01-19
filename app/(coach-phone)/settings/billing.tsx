import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/design';

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [nameOnCard, setNameOnCard] = useState('Danny DeArman');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 1234');
  const [expiry, setExpiry] = useState('01/25');
  const [cvv, setCvv] = useState('•••');
  const [billingEmail, setBillingEmail] = useState('billing@joshuaisd.org');
  const [address1, setAddress1] = useState('909 S Broadway St');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('Joshua');
  const [state, setState] = useState('Texas');
  const [zip, setZip] = useState('76058');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Billing information updated successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 500);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Billing</Text>
        <Pressable style={styles.saveButton} onPress={handleSave} disabled={isLoading}>
          <Text style={styles.saveButtonText}>{isLoading ? '...' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Details</Text>
          <Text style={styles.sectionDescription}>
            Your card will automatically be charged.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name on card</Text>
            <TextInput
              style={styles.input}
              value={nameOnCard}
              onChangeText={setNameOnCard}
              placeholder="Name on card"
              placeholderTextColor={Colors.TEXT_TERTIARY}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Card number</Text>
            <View style={styles.cardRow}>
              <View style={[styles.input, styles.cardInput]}>
                <Ionicons name="card-outline" size={20} color={Colors.TEXT_SECONDARY} />
                <TextInput
                  style={styles.cardNumberInput}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="Card number"
                  placeholderTextColor={Colors.TEXT_TERTIARY}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={styles.cardDetailsRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={expiry}
                onChangeText={setExpiry}
                placeholder="MM/YY"
                placeholderTextColor={Colors.TEXT_TERTIARY}
              />
              <TextInput
                style={[styles.input, { width: 80 }]}
                value={cvv}
                onChangeText={setCvv}
                placeholder="CVV"
                placeholderTextColor={Colors.TEXT_TERTIARY}
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {/* Billing Email Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Address</Text>
          <Text style={styles.sectionDescription}>
            Invoices will be sent to this email address.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={billingEmail}
              onChangeText={setBillingEmail}
              placeholder="Billing email"
              placeholderTextColor={Colors.TEXT_TERTIARY}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Billing Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Address</Text>
          <Text style={styles.sectionDescription}>
            Don't worry, we won't send anything here.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={address1}
              onChangeText={setAddress1}
              placeholder="Address 1"
              placeholderTextColor={Colors.TEXT_TERTIARY}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={address2}
              onChangeText={setAddress2}
              placeholder="Address 2 (optional)"
              placeholderTextColor={Colors.TEXT_TERTIARY}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={Colors.TEXT_TERTIARY}
            />
          </View>

          <View style={styles.stateZipRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={state}
              onChangeText={setState}
              placeholder="State"
              placeholderTextColor={Colors.TEXT_TERTIARY}
            />
            <TextInput
              style={[styles.input, { width: 100 }]}
              value={zip}
              onChangeText={setZip}
              placeholder="ZIP"
              placeholderTextColor={Colors.TEXT_TERTIARY}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BASALT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: Colors.SURGE,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: Colors.BASALT,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: Colors.TEXT_SECONDARY,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    color: '#fff',
  },
  cardRow: {
    marginBottom: 12,
  },
  cardInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardNumberInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'NeueHaas-Roman',
    color: '#fff',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stateZipRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
