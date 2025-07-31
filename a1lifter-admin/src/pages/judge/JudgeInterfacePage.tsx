import React from 'react';
import JudgeInterface from '@/components/judges/JudgeInterface';

interface JudgeInterfacePageProps {
  judgeId?: string;
  competitionId?: string;
}

const JudgeInterfacePage: React.FC<JudgeInterfacePageProps> = ({ judgeId, competitionId }) => {
  if (!judgeId || !competitionId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Parametri mancanti per l'interfaccia giudice</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <JudgeInterface 
        judgeId={judgeId} 
        competitionId={competitionId} 
        judgeName="Giudice" 
        sessionId="default" 
      />
    </div>
  );
};

export default JudgeInterfacePage;