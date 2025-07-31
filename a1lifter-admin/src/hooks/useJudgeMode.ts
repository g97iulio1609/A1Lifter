import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type JudgeMode = {
  isJudgeMode: boolean;
  competitionId: string | null;
  judgePosition: 1 | 2 | 3 | null;
};

const JUDGE_MODE_STORAGE_KEY = 'judgeMode';

export const useJudgeMode = () => {
  const { user } = useAuth();
  const [judgeMode, setJudgeMode] = useState<JudgeMode>({
    isJudgeMode: false,
    competitionId: null,
    judgePosition: null,
  });

  // Carica modalità giudice da localStorage al montaggio
  useEffect(() => {
    const savedMode = localStorage.getItem(JUDGE_MODE_STORAGE_KEY);
    if (savedMode) {
      try {
        const parsed = JSON.parse(savedMode) as JudgeMode;
        // Verifica che l'utente abbia ancora i permessi
        if (user && user.role === 'judge' && parsed.competitionId) {
          setJudgeMode(parsed);
        }
      } catch (error) {
        console.error('Error parsing saved judge mode:', error);
        localStorage.removeItem(JUDGE_MODE_STORAGE_KEY);
      }
    }
  }, [user]);

  // Salva modalità giudice in localStorage
  useEffect(() => {
    localStorage.setItem(JUDGE_MODE_STORAGE_KEY, JSON.stringify(judgeMode));
  }, [judgeMode]);

  const enableJudgeMode = (competitionId: string, judgePosition: 1 | 2 | 3) => {
    if (!user || user.role !== 'judge') {
      throw new Error('Solo i giudici possono abilitare la modalità giudice');
    }

    setJudgeMode({
      isJudgeMode: true,
      competitionId,
      judgePosition,
    });
  };

  const disableJudgeMode = () => {
    setJudgeMode({
      isJudgeMode: false,
      competitionId: null,
      judgePosition: null,
    });
  };

  const canEnableJudgeMode = (competitionId: string): boolean => {
    if (!user || user.role !== 'judge') return false;
    
    return user.permissions.canJudgeCompetitions.includes(competitionId) ||
           user.permissions.canJudgeCompetitions.includes('*');
  };

  return {
    judgeMode,
    enableJudgeMode,
    disableJudgeMode,
    canEnableJudgeMode,
    isJudgeUser: user?.role === 'judge',
  };
}; 