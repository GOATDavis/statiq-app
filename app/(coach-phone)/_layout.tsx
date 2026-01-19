import { Tabs, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform, Text } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/src/constants/design';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Path, Polygon, Rect, G } from 'react-native-svg';
import { FootballIcon } from '@/components/icons/FootballIcon';
import { SearchIcon } from '@/components/icons/SearchIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "https://statiq-api.usestatiq.com/api/v1";

// Custom Icon Components (matching coach iPad icons)
const DashboardIcon = ({ color = "#EDEDED", size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <Path d="M70.391,22.949H24.916C15.38,32.486,10.034,37.832.497,47.368v65.88c9.537,9.536,14.883,14.883,24.419,24.419h45.474c9.536-9.536,14.882-14.883,24.419-24.419V47.368c-9.537-9.536-14.883-14.883-24.419-24.419h0ZM76.147,116.35H19.161V44.266h56.986v72.085h0Z" fill={color}/>
    <Rect x="107.857" y="22.949" width="52.261" height="51.81" fill={color}/>
    <Path d="M140.065,85.406h-12.153l-20.054,20.054v12.153c7.832,7.832,12.223,12.223,20.054,20.054h12.153c7.832-7.832,12.223-12.223,20.054-20.054v-12.153c-7.832-7.832-12.223-12.223-20.054-20.054Z" fill={color}/>
  </Svg>
);

const NotificationsIcon = ({ color = "#EDEDED", size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
    <Path d="M112.494,1.352H48.122c-10.926,10.926-17.052,17.052-27.977,27.977v62.071h21.856V26.315h76.614v65.085h21.856V29.329c-10.926-10.926-17.052-17.052-27.977-27.977Z" fill={color}/>
    <Path d="M147.873,101.948H12.743L.229,114.462v12.449h160.159v-12.449l-12.515-12.515h0Z" fill={color}/>
    <Path d="M58.503,137.459c0,12.043,9.763,21.806,21.806,21.806s21.806-9.763,21.806-21.806h-43.612Z" fill={color}/>
  </Svg>
);

const SettingsIcon = ({ color = "#EDEDED", size = 24 }) => (
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

// Custom Tab Bar Component (styled like fan version)
// Map nested routes to their parent tab (keeps parent highlighted when on nested screen)
const getParentTab = (routeName: string): string => {
  const parentMap: Record<string, string> = {
    'game/[id]': 'dashboard',
    'game/finished/[id]': 'dashboard',
    'team/[id]': 'dashboard',
    'players/[id]': 'dashboard',
    'district': 'dashboard',
    'search': 'browse',
  };
  return parentMap[routeName] || routeName;
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // Define tab order explicitly
  const VISIBLE_TABS = ['dashboard', 'scores', 'browse', 'notifications', 'settings'];

  // Filter and sort routes to match our desired order
  const visibleRoutes = VISIBLE_TABS
    .map(tabName => state.routes.find(route => route.name === tabName))
    .filter(Boolean) as typeof state.routes;

  // Dynamic notification count
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadNotifications(data.count || 0);
        }
      } catch (error) {
        console.log('Failed to fetch notification count:', error);
      }
    };

    fetchNotificationCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LinearGradient
      colors={['rgba(26, 26, 26, 0)', 'rgba(26, 26, 26, 0.95)', 'rgba(26, 26, 26, 1)']}
      locations={[0, 0.2, 1]}
      style={styles.tabBarContainer}
    >
      <View style={styles.tabBarPill}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          // Get the currently active route and map it to its parent tab
          const currentRouteName = state.routes[state.index]?.name;
          const effectiveCurrentRoute = getParentTab(currentRouteName);
          const isFocused = route.name === effectiveCurrentRoute;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Render icon based on route
          const renderIcon = () => {
            const iconColor = isFocused ? Colors.BASALT : Colors.TEXT_SECONDARY;

            switch (route.name) {
              case 'dashboard':
                return <DashboardIcon size={24} color={iconColor} />;
              case 'scores':
                return <FootballIcon size={24} color={iconColor} />;
              case 'browse':
                return <SearchIcon size={24} color={iconColor} />;
              case 'notifications':
                return (
                  <View>
                    <NotificationsIcon size={24} color={iconColor} />
                    {unreadNotifications > 0 && !isFocused && (
                      <View style={[
                        styles.notificationBadge,
                        unreadNotifications > 9 && styles.notificationBadgeWide
                      ]}>
                        <Text style={styles.notificationBadgeText}>
                          {unreadNotifications > 99 ? '99+' : unreadNotifications}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              case 'settings':
                return <SettingsIcon size={24} color={iconColor} />;
              default:
                return null;
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              {isFocused ? (
                <View style={styles.iconContainerActive}>
                  {renderIcon()}
                </View>
              ) : (
                renderIcon()
              )}
            </Pressable>
          );
        })}
      </View>
    </LinearGradient>
  );
}

export default function CoachPhoneLayout() {
  const { user } = useAuth();
  const router = useRouter();

  // CRITICAL: Block non-coach users from accessing coach screens
  React.useEffect(() => {
    if (user && user.userType !== 'coach') {
      // Unauthorized access attempt - redirect to their proper home
      const redirectMap: Record<string, string> = {
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
    <Tabs
      initialRouteName="dashboard"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="scores"
        options={{
          title: 'Scores',
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      {/* Hide other screens from tab bar */}
      <Tabs.Screen
        name="district"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="team/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="players/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="game/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="game/finished/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    paddingTop: 18,
    paddingHorizontal: 0,
    borderTopWidth: 0,
  },
  tabBarPill: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 0,
  },
  iconContainerActive: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.SURGE,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeWide: {
    minWidth: 24,
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'NeueHaas-Bold',
  },
});
