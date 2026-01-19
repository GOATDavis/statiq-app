/**
 * Admin Index - Redirects to moderation dashboard
 */

import { Redirect } from 'expo-router';

export default function AdminIndex() {
  return <Redirect href="/(admin)/moderation" />;
}
