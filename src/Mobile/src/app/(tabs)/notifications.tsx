import { router } from 'expo-router';

import { NotificationsScreen } from '@/features/notifications/components/notifications-screen';

export default function NotificationsTabScreen() {
  return <NotificationsScreen onOpenJob={(jobId) => router.push(`/jobs/${jobId}`)} />;
}
