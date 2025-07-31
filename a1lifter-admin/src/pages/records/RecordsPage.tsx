import React from 'react';
import RecordManagement from '@/components/records/RecordManagement';

const RecordsPage: React.FC = () => {
  // Mock data for records page - in a real app this would come from route params or context
  const mockCompetition = {
    id: 'records-view',
    name: 'Gestione Record',
    sport: 'powerlifting' as const,
    type: 'powerlifting' as const,
    date: new Date(),
    location: '',
    status: 'completed' as const,
    categories: [],
    registrationDeadline: new Date(),
    createdBy: 'system',
    rules: {
       attempts: 3,
       disciplines: [],
       scoringSystem: 'ipf' as const
     },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return (
    <div className="p-6">
      <RecordManagement 
        competitionId="records-view"
        competition={mockCompetition}
      />
    </div>
  );
};

export default RecordsPage;