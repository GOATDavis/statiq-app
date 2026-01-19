import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '@/src/constants/design';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { FootballIcon } from '@/components/icons/FootballIcon';
import { SearchIcon } from '@/components/icons/SearchIcon';

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // STRICT whitelist - only these 4 tabs
  const VISIBLE_TABS = ['scores', 'following', 'browse', 'settings'];

  // Filter to only show whitelisted tabs
  const visibleRoutes = state.routes.filter((route) => {
    return VISIBLE_TABS.includes(route.name);
  });

  // Check if we're on a game detail page
  const currentRouteName = state.routes[state.index].name;
  const isOnGameDetail = currentRouteName.includes('game');

  return (
    <LinearGradient
      colors={['rgba(26, 26, 26, 0)', 'rgba(26, 26, 26, 0.95)', 'rgba(26, 26, 26, 1)']}
      locations={[0, 0.2, 1]}
      style={styles.tabBarContainer}
    >
      <View style={styles.tabBarPill}>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const routeIndex = state.routes.indexOf(route);
          // Keep scores tab active when viewing game details
          const isFocused = isOnGameDetail && route.name === 'scores' 
            ? true 
            : state.index === routeIndex;

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
              case 'scores':
                return <FootballIcon size={26} color={iconColor} />;
              case 'following':
                return (
                  <Image
                    source={isFocused 
                      ? require('@/assets/images/following-icon-outline-surge.png')
                      : require('@/assets/images/following-icon-outline-halo.png')
                    }
                    style={{ width: 26, height: 26, tintColor: iconColor }}
                    resizeMode="contain"
                  />
                );
              case 'browse':
                return <SearchIcon size={26} color={iconColor} />;
              case 'settings':
                return (
                  <Ionicons
                    name={isFocused ? 'person' : 'person-outline'}
                    size={26}
                    color={iconColor}
                  />
                );
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

export default function FanLayout() {
  const { user } = useAuth();
  const router = useRouter();

  // CRITICAL: Block non-fan users from accessing fan screens
  React.useEffect(() => {
    if (user && user.userType !== 'fan') {
      // Unauthorized access attempt - redirect to their proper home
      const redirectMap = {
        'coach': '/(coach)/dashboard',
        'player': '/(player)/my-stats',
      };
      router.replace(redirectMap[user.userType] || '/(auth)/welcome');
    }
  }, [user]);

  // If not fan, show nothing while redirecting
  if (!user || user.userType !== 'fan') {
    return null;
  }

  return (
    <Tabs
      initialRouteName="scores"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="scores"
        options={{
          title: 'Game',
        }}
      />
      <Tabs.Screen
        name="following"
        options={{
          title: 'Schedule',
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Search',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
        }}
      />
      {/* Hide other screens from tab bar */}
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="playoff-bracket"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          href: null,
          presentation: 'card',
        }}
      />
      <Tabs.Screen
        name="fan-team"
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
    paddingHorizontal: 20,
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
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.SURGE,
  },
});
