import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Slot, usePathname, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import StatIQLogo from "../../assets/images/Main - 3 TP.svg";
import Svg, { Path, Polygon, Rect, G } from "react-native-svg";
import { useAuth } from "../../src/context/AuthContext";
import { FootballIcon } from "../../components/icons/FootballIcon";
import { getDashboard } from "../../src/lib/coach-api";

const BG = "#262626";

// Device detection - GameTime only available on iPad
const isIPad = Platform.OS === 'ios' && Platform.isPad;

// Custom Icon Components
const DashboardIcon = ({ color = "#EDEDED", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <Path d="M70.391,22.949H24.916C15.38,32.486,10.034,37.832.497,47.368v65.88c9.537,9.536,14.883,14.883,24.419,24.419h45.474c9.536-9.536,14.882-14.883,24.419-24.419V47.368c-9.537-9.536-14.883-14.883-24.419-24.419h0ZM76.147,116.35H19.161V44.266h56.986v72.085h0Z" fill={color}/>
    <Rect x="107.857" y="22.949" width="52.261" height="51.81" fill={color}/>
    <Path d="M140.065,85.406h-12.153l-20.054,20.054v12.153c7.832,7.832,12.223,12.223,20.054,20.054h12.153c7.832-7.832,12.223-12.223,20.054-20.054v-12.153c-7.832-7.832-12.223-12.223-20.054-20.054Z" fill={color}/>
  </Svg>
);

const NotificationsIcon = ({ color = "#EDEDED", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <Path d="M112.494,1.352H48.122c-10.926,10.926-17.052,17.052-27.977,27.977v62.071h21.856V26.315h76.614v65.085h21.856V29.329c-10.926-10.926-17.052-17.052-27.977-27.977Z" fill={color}/>
    <Path d="M147.873,101.948H12.743L.229,114.462v12.449h160.159v-12.449l-12.515-12.515h0Z" fill={color}/>
    <Path d="M58.503,137.459c0,12.043,9.763,21.806,21.806,21.806s21.806-9.763,21.806-21.806h-43.612Z" fill={color}/>
  </Svg>
);

const DistrictIcon = ({ color = "#EDEDED", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <Path d="M31.756,7.455v75.125c8.817,8.817,13.761,13.761,22.578,22.578h51.949l22.578-22.578V7.455H31.756ZM111.222,85.012h-61.828V27.601h61.828v57.411Z" fill={color}/>
    <Polygon points="22.578 63.661 0 41.083 0 27.601 22.578 27.601 22.578 63.661" fill={color}/>
    <Polygon points="138.038 63.661 160.616 41.083 160.616 27.601 138.038 27.601 138.038 63.661" fill={color}/>
    <Path d="M113.774,133.016h-24.647v-15.858h-17.638v15.858h-24.215c-4.619,4.619-7.208,7.208-11.827,11.827v8.318h90.154v-8.318c-4.619-4.619-7.208-7.208-11.827-11.827Z" fill={color}/>
  </Svg>
);

const SearchIcon = ({ color = "#EDEDED", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <Path d="M133.274,46.244L87.031,0h-36.79L0,50.241v36.79l46.244,46.244h36.79l50.241-50.241v-36.79h0ZM66.637,121.553L11.722,66.637,66.637,11.722l54.915,54.915-54.915,54.915h0Z" fill={color}/>
    <Rect x="125.589" y="109.993" width="19.883" height="51.073" transform="translate(-56.138 135.53) rotate(-45)" fill={color}/>
  </Svg>
);

const SettingsIcon = ({ color = "#EDEDED", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <G>
      <Path d="M50.939,49.531h11.172c7.2-7.2,11.237-11.236,18.436-18.436v-11.172c-.793-.793-1.542-1.542-2.266-2.266-.242-.242-.49-.49-.726-.726h0c-5.461-5.46-9.306-9.305-15.444-15.444h-11.172c-7.2,7.2-11.236,11.236-18.436,18.436v11.172c7.2,7.2,11.237,11.236,18.436,18.436Z" fill={color}/>
      <Polygon points="91.951 16.93 91.951 19.922 91.951 31.094 91.951 34.087 160.616 34.087 160.616 16.93 91.951 16.93" fill={color}/>
      <Polygon points="21.1 31.094 21.1 19.922 21.1 16.93 0 16.93 0 34.087 21.1 34.087 21.1 31.094" fill={color}/>
      <Path d="M76.645,111.086h-11.172l-15.444,15.444h0c-.944.944-1.931,1.931-2.992,2.993v11.172h0c.793.793,1.542,1.542,2.266,2.266.242.242.49.49.726.726h0c5.46,5.46,9.306,9.305,15.444,15.444h11.172c6.936-6.936,10.945-10.945,17.666-17.666.257-.257.505-.505.77-.77v-11.172c-.508-.508-.997-.997-1.475-1.474-6.307-6.307-10.27-10.27-16.962-16.962h0Z" fill={color}/>
      <Polygon points="0 143.687 35.633 143.687 35.633 140.694 35.633 129.522 35.633 126.529 0 126.529 0 143.687" fill={color}/>
      <Polygon points="106.485 129.522 106.485 140.694 106.485 143.687 160.616 143.687 160.616 126.529 106.485 126.529 106.485 129.522" fill={color}/>
    </G>
    <Path d="M140.293,71.729l-1.71-1.71-9.218-9.218-9.218-9.218-1.948-1.948h-16.681l-1.948,1.948-9.355,9.355-9.082,9.082-1.71,1.71H0v17.158h79.424l1.71,1.71,9.082,9.082,9.355,9.354,1.948,1.948h16.681l1.948-1.948,9.218-9.218,9.218-9.218,1.71-1.71h20.323v-17.158h-20.324ZM125.638,96.088h-31.56v-31.56h31.56v31.56Z" fill={color}/>
  </Svg>
);

const GameTimeIcon = ({ color = "#EDEDED", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <Path d="M80.308,0C35.985,0,0,35.985,0,80.308s35.985,80.308,80.308,80.308,80.308-35.985,80.308-80.308S124.631,0,80.308,0ZM80.308,145.159c-35.783,0-64.851-29.068-64.851-64.851S44.525,15.457,80.308,15.457s64.851,29.068,64.851,64.851-29.068,64.851-64.851,64.851Z" fill={color}/>
    <Polygon points="72.579 38.686 72.579 80.308 72.579 87.768 110.771 87.768 110.771 72.579 88.037 72.579 88.037 38.686 72.579 38.686" fill={color}/>
  </Svg>
);

const RankingsIcon = ({ color = "#EDEDED", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <Path d="M53.539,70.772H20.308v62.886h33.231V70.772ZM46.616,126.735h-19.385v-49.04h19.385v49.04Z" fill={color}/>
    <Path d="M96.847,36.958h-33.231v96.7h33.231V36.958ZM89.924,126.735h-19.385V43.881h19.385v82.854Z" fill={color}/>
    <Path d="M140.308,86.729h-33.231v46.929h33.231v-46.929ZM133.385,126.735h-19.385v-33.083h19.385v33.083Z" fill={color}/>
    <Polygon points="80.308 0 60.923 19.385 73.385 19.385 73.385 26.957 87.231 26.957 87.231 19.385 99.693 19.385 80.308 0" fill={color}/>
  </Svg>
);

// Scores icon (football) - matches coach-phone version
const ScoresIcon = ({ color = "#EDEDED", size = 20 }: { color?: string; size?: number }) => (
  <FootballIcon color={color} size={size} />
);

const LogOutIcon = ({ color = "#FF5A5A", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <Path d="M24.895,30.027h89.064V8.231H27.901C17.005,19.127,10.896,25.236,0,36.132v88.353c10.896,10.896,17.005,17.005,27.901,27.901h86.058v-21.797H24.895V30.027Z" fill={color}/>
    <Polygon points="113.959 30.027 113.959 69.41 44.902 69.41 44.902 91.207 113.959 91.207 113.959 130.589 160.616 80.308 113.959 30.027" fill={color}/>
  </Svg>
);

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = React.useState(6);
  const [teamColor, setTeamColor] = React.useState("#0066cc");
  const { logout } = useAuth();
  const isIPad = Platform.OS === 'ios' && Platform.isPad;

  // Fetch team color on mount
  React.useEffect(() => {
    const loadTeamColor = async () => {
      try {
        const data = await getDashboard();
        if (data.team?.primary_color) {
          setTeamColor(data.team.primary_color);
        }
      } catch (err) {
        console.log("Failed to load team color:", err);
      }
    };
    loadTeamColor();
  }, []);

  // Clear notifications when viewing notifications screen
  React.useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadNotifications(0);
    }
  }, [pathname]);

  const NavItem = ({ label, route, active, badge, danger, icon: Icon }: any) => (
    <Pressable
      onPress={() => router.push(route)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
      }}
    >
      {Icon && <Icon color={danger ? "#FF5A5A" : (active ? "#fff" : "#EDEDED")} size={20} />}
      <Text style={{ color: danger ? "#FF5A5A" : (active ? "#fff" : "#EDEDED"), fontSize: 16, fontFamily: active ? "NeueHaas-Bold" : "NeueHaas-Medium" }}>
        {label}
      </Text>
      {typeof badge === "number" && badge > 0 && (
        <View
          style={{
            backgroundColor: "#E74C3C",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            minWidth: 24,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "auto",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 12, fontFamily: "NeueHaas-Bold" }}>
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View
      style={{
        width: 280,
        borderRadius: 20,
        padding: 20,
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 12, marginTop: -20 }}>
          <StatIQLogo width={180} height={180} />
        </View>

        {/* GameTime Button */}
        <Pressable
          onPress={() => router.push("/(gametime)")}
          style={{
            backgroundColor: teamColor,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <FootballIcon color="#fff" size={20} />
          <Text style={{ color: "#fff", fontSize: 16, fontFamily: "NeueHaas-Bold" }}>
            START GAMETIME
          </Text>
        </Pressable>

        {/* Nav Items */}
        <View style={{ gap: 4 }}>
          <NavItem
            label="Dashboard"
            route="/(coach)/dashboard"
            active={pathname.includes("/dashboard")}
            icon={DashboardIcon}
          />
          <NavItem
            label="Scores"
            route="/(coach)/scores"
            active={pathname.includes("/scores")}
            icon={ScoresIcon}
          />
          <NavItem
            label="Browse"
            route="/(coach)/browse"
            active={pathname.includes("/browse") || pathname.includes("/search")}
            icon={SearchIcon}
          />
          <NavItem
            label="Notifications"
            route="/(coach)/notifications"
            badge={unreadNotifications}
            active={pathname.includes("/notifications")}
            icon={NotificationsIcon}
          />
        </View>
      </View>

      {/* Bottom Section */}
      <View style={{ gap: 4 }}>
        <NavItem
          label="Settings"
          route="/(coach)/settings"
          active={pathname === "/settings"}
          icon={SettingsIcon}
        />
        <Pressable
          onPress={logout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 16,
            gap: 12,
          }}
        >
          <LogOutIcon color="#FF5A5A" size={20} />
          <Text style={{ color: "#FF5A5A", fontSize: 16, fontFamily: "NeueHaas-Medium" }}>
            Log Out
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CoachLayout() {
  const { user } = useAuth();
  const router = useRouter();

  // CRITICAL: Block non-coach users from accessing coach screens
  React.useEffect(() => {
    if (user && user.userType !== 'coach') {
      // Unauthorized access attempt - redirect to their proper home
      const redirectMap = {
        'fan': '/(fan)/scores',
        'player': '/(player)/my-stats',
      };
      router.replace(redirectMap[user.userType] || '/(auth)/welcome');
    }
  }, [user]);

  // If not coach, show nothing while redirecting
  if (!user || user.userType !== 'coach') {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top", "left", "right"]}>
      <View style={{ flex: 1, flexDirection: "row", gap: 16, padding: 16 }}>
        <Sidebar />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    </SafeAreaView>
  );
}
