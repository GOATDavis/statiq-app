import { Redirect } from 'expo-router';
import { Platform, Dimensions } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';

export default function Index() {
  const { user } = useAuth();

  // If no user, go to login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect to appropriate route based on user type
  if (user.userType === 'coach') {
    // Detect iPhone vs iPad - iPads have min dimension > 600
    const { width, height } = Dimensions.get('window');
    const minDimension = Math.min(width, height);
    const isTablet = Platform.OS === 'ios' && minDimension >= 600;
    
    if (isTablet) {
      return <Redirect href="/(coach)/dashboard" />;
    } else {
      return <Redirect href="/(coach-phone)/dashboard" />;
    }
  }

  if (user.userType === 'fan') {
    return <Redirect href="/(fan)/scores" />;
  }

  if (user.userType === 'player') {
    return <Redirect href="/(player)/my-stats" />;
  }

  // Default fallback to login
  return <Redirect href="/(auth)/login" />;
}
