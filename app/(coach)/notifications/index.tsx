import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import ScreenLayout from "../../../components/ScreenLayout";

// Import logos
import HudlLogo from "../../../assets/images/notifications/Hudl.svg";
import RankOneLogo from "../../../assets/images/notifications/RankOne.svg";
import CatapultLogo from "../../../assets/images/notifications/Catapult.svg";
import MaxPrepsLogo from "../../../assets/images/notifications/MaxPreps.svg";
import StatIQLogo from "../../../assets/images/notifications/StatIQ.svg";
import SportsYouLogo from "../../../assets/images/notifications/sportsYou.svg";

export default function NotificationsScreen() {
  // Dummy notifications data with real logos
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
    <ScreenLayout 
      title="Notifications" 
      subtitle="Manage your team and preferences here."
    >
      {/* Today Section */}
      <View style={{ marginBottom: 40 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 20 }}>
          Today
        </Text>
        
        {todayNotifications.map((notif) => (
          <Pressable
            key={notif.id}
            style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              marginBottom: 16
            }}
          >
            {/* Red dot indicator */}
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff4444", marginRight: 16 }} />
            
            {/* Logo */}
            <View style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 10, 
              overflow: "hidden",
              marginRight: 16
            }}>
              <notif.logo width={48} height={48} />
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 17, fontFamily: "NeueHaas-Roman", lineHeight: 24 }}>
                {notif.title}
              </Text>
            </View>

            {/* Time - 24px gap from text */}
            <Text style={{ color: "#d0d0d0", fontSize: 15, fontFamily: "NeueHaas-Roman", marginLeft: 24 }}>
              {notif.time}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* This Week Section */}
      <View>
        <Text style={{ color: "#fff", fontSize: 18, fontFamily: "NeueHaas-Bold", marginBottom: 20 }}>
          This week
        </Text>
        
        {thisWeekNotifications.map((notif) => (
          <Pressable
            key={notif.id}
            style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              marginBottom: 16
            }}
          >
            {/* Red dot indicator */}
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff4444", marginRight: 16 }} />
            
            {/* Logo */}
            <View style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 10, 
              overflow: "hidden",
              marginRight: 16
            }}>
              <notif.logo width={48} height={48} />
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 17, fontFamily: "NeueHaas-Roman", lineHeight: 24 }}>
                {notif.title}
              </Text>
            </View>

            {/* Time - 24px gap from text */}
            <Text style={{ color: "#d0d0d0", fontSize: 15, fontFamily: "NeueHaas-Roman", marginLeft: 24 }}>
              {notif.time}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScreenLayout>
  );
}
