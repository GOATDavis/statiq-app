import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/design';

// Import logos
import HudlLogo from "../../assets/images/notifications/Hudl.svg";
import RankOneLogo from "../../assets/images/notifications/RankOne.svg";
import CatapultLogo from "../../assets/images/notifications/Catapult.svg";
import MaxPrepsLogo from "../../assets/images/notifications/MaxPreps.svg";
import StatIQLogo from "../../assets/images/notifications/StatIQ.svg";
import SportsYouLogo from "../../assets/images/notifications/sportsYou.svg";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  const todayNotifications = [
    {
      id: "1",
      logo: HudlLogo,
      title: "Brayden Payne posted highlights vs. Highland Park on their profile.",
      time: "28m",
    },
    {
      id: "2",
      logo: HudlLogo,
      title: "Joe Strother posted highlights vs. Highland Park on their profile.",
      time: "1h",
    },
    {
      id: "3",
      logo: RankOneLogo,
      title: "Esteban Salas checked in with Athletic Trainer.",
      time: "4h",
    },
    {
      id: "4",
      logo: CatapultLogo,
      title: "Your Catapult results vs. Highland Park are uploaded.",
      time: "4h",
    },
    {
      id: "5",
      logo: MaxPrepsLogo,
      title: "Your complete stats have been uploaded to MaxPreps.com",
      time: "5h",
    },
    {
      id: "6",
      logo: StatIQLogo,
      title: "Top Performers have been updated vs. Highland Park.",
      time: "10h",
    },
  ];

  const thisWeekNotifications = [
    {
      id: "7",
      logo: SportsYouLogo,
      title: "Danny DeArman posted in AHS Weather Alerts.",
      time: "1d",
    },
    {
      id: "8",
      logo: RankOneLogo,
      title: "Taji Matthews checked in with Athletic Trainer.",
      time: "1d",
    },
    {
      id: "9",
      logo: SportsYouLogo,
      title: "Jeremy Gillmore posted in AHS Varsity Football.",
      time: "1d",
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Manage your team and preferences here.</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          
          {todayNotifications.map((notif) => (
            <Pressable key={notif.id} style={styles.notificationRow}>
              {/* Red dot indicator */}
              <View style={styles.unreadDot} />
              
              {/* Logo */}
              <View style={styles.logoContainer}>
                <notif.logo width={40} height={40} />
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                <Text style={styles.notificationText}>{notif.title}</Text>
              </View>

              {/* Time */}
              <Text style={styles.timeText}>{notif.time}</Text>
            </Pressable>
          ))}
        </View>

        {/* This Week Section */}
        <View style={[styles.section, { marginBottom: 120 }]}>
          <Text style={styles.sectionTitle}>This week</Text>
          
          {thisWeekNotifications.map((notif) => (
            <Pressable key={notif.id} style={styles.notificationRow}>
              {/* Red dot indicator */}
              <View style={styles.unreadDot} />
              
              {/* Logo */}
              <View style={styles.logoContainer}>
                <notif.logo width={40} height={40} />
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                <Text style={styles.notificationText}>{notif.title}</Text>
              </View>

              {/* Time */}
              <Text style={styles.timeText}>{notif.time}</Text>
            </Pressable>
          ))}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'NeueHaas-Bold',
    marginBottom: 16,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
    marginRight: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    paddingRight: 8,
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NeueHaas-Roman',
    lineHeight: 20,
  },
  timeText: {
    color: '#888',
    fontSize: 13,
    fontFamily: 'NeueHaas-Roman',
  },
});
