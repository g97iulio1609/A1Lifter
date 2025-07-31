import React from 'react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

interface NotificationsPageProps {
  userId?: string;
  competitionId?: string;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ userId, competitionId }) => {
  return (
    <div className="p-6">
      <NotificationCenter userId={userId} competitionId={competitionId} />
    </div>
  );
};

export default NotificationsPage;