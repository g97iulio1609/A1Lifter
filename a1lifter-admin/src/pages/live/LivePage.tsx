import React from 'react';
import LiveDashboard from '@/components/live/LiveDashboard';

interface LivePageProps {
  competitionId?: string;
}

const LivePage: React.FC<LivePageProps> = ({ competitionId }) => {
  if (!competitionId) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <p>Nessuna competizione selezionata</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <LiveDashboard competitionId={competitionId} sessionId="default" />
    </div>
  );
};

export default LivePage;