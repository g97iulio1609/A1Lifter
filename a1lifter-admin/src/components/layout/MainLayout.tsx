import React from 'react';
import { Sidebar } from './Sidebar';
import { JudgeModeInterface } from '@/components/judge/JudgeModeInterface';
import { useJudgeMode } from '@/hooks/useJudgeMode';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { judgeMode, disableJudgeMode } = useJudgeMode();

  // Se l'utente è in modalità giudice, mostra solo l'interfaccia giudice
  if (judgeMode.isJudgeMode) {
    return (
      <JudgeModeInterface 
        onExitJudgeMode={disableJudgeMode}
      />
    );
  }

  // Layout normale per admin e giudici non in modalità attiva
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};