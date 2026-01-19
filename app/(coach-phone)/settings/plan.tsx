import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/design';

const plans = [
  {
    id: 'freshman',
    name: 'Freshman',
    description: 'Includes 1 player with limited stats.',
    features: [
      'Includes 1 player profile',
      'Access to all basic features',
      'Basic reporting and analytics',
      '20GB individual data',
      'Basic email support',
    ],
  },
  {
    id: 'jv',
    name: 'JV',
    description: 'Includes 20 players with unlimited stats.',
    features: [
      'Includes 10 player profiles',
      '20+ integrations',
      'Advanced reporting and analytics',
      '100GB individual data',
      'Priority email support',
    ],
  },
  {
    id: 'varsity',
    name: 'Varsity',
    description: 'Includes unlimited players and unlimited stats.',
    features: [
      'Includes unlimited player profiles',
      '20+ integrations',
      'Unlimited player profiles',
      'Unlimited individual data',
      'Personalized priority support',
    ],
    selected: true,
  },
];

const billingHistory = [
  { date: 'Dec 1, 2022', plan: 'Varsity', users: 'Unlimited' },
  { date: 'Nov 1, 2022', plan: 'Varsity', users: 'Unlimited' },
  { date: 'Oct 1, 2022', plan: 'Varsity', users: 'Unlimited' },
];

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('varsity');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Plan</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Plans Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          
          {plans.map((plan) => (
            <Pressable
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                {selectedPlan === plan.id && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={14} color={Colors.BASALT} />
                  </View>
                )}
              </View>
              <Text style={styles.planDescription}>{plan.description}</Text>
              
              <View style={styles.featuresList}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Ionicons name="checkmark" size={16} color={Colors.SURGE} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Billing History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing History</Text>
          <Text style={styles.sectionDescription}>
            Download previous invoices.
          </Text>

          <View style={styles.historyList}>
            {billingHistory.map((invoice, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.historyItem,
                  idx === billingHistory.length - 1 && styles.historyItemLast,
                ]}
              >
                <View style={styles.historyInfo}>
                  <View style={styles.pdfIcon}>
                    <Ionicons name="document-text" size={20} color={Colors.TEXT_SECONDARY} />
                  </View>
                  <View>
                    <Text style={styles.historyPlan}>{invoice.plan}</Text>
                    <Text style={styles.historyDate}>{invoice.date}</Text>
                  </View>
                </View>
                <Pressable style={styles.downloadButton}>
                  <Ionicons name="download-outline" size={18} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
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
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: Colors.TEXT_SECONDARY,
    marginTop: -12,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: Colors.SURGE,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 18,
    fontFamily: 'NeueHaas-Bold',
    color: '#fff',
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.SURGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planDescription: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    color: Colors.TEXT_SECONDARY,
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    color: '#d0d0d0',
  },
  historyList: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  historyItemLast: {
    borderBottomWidth: 0,
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pdfIcon: {
    width: 40,
    height: 48,
    backgroundColor: '#3a3a3a',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyPlan: {
    fontSize: 15,
    fontFamily: 'NeueHaas-Medium',
    color: '#fff',
  },
  historyDate: {
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
    color: Colors.TEXT_SECONDARY,
    marginTop: 2,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
