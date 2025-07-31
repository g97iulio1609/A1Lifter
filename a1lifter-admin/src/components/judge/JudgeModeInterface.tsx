import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, X, Clock, User, Weight, Trophy, LogOut } from 'lucide-react';
import { useJudgeMode } from '@/hooks/useJudgeMode';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveSession, useConnectionStatus } from '@/hooks/useLiveSession';
import { useCurrentAttemptManager } from '@/hooks/useAttemptResults';
import { toast } from 'sonner';

type JudgeVoteStatus = {
  position1?: 'valid' | 'invalid';
  position2?: 'valid' | 'invalid';
  position3?: 'valid' | 'invalid';
};

interface JudgeModeInterfaceProps {
  onExitJudgeMode: () => void;
}

export const JudgeModeInterface: React.FC<JudgeModeInterfaceProps> = ({
  onExitJudgeMode
}) => {
  const { user } = useAuth();
  const { judgeMode } = useJudgeMode();
  const [myVote, setMyVote] = useState<'valid' | 'invalid' | null>(null);
  const [otherVotes] = useState<JudgeVoteStatus>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // TODO: Per ora uso sessionId mock, andrà collegato alla competizione
  const mockSessionId = judgeMode.competitionId ? `session_${judgeMode.competitionId}` : null;
  
  const { data: liveSession } = useLiveSession(mockSessionId);
  const { isOnline, shouldShowOfflineWarning } = useConnectionStatus();
  
  // Determina attemptId corrente dalla sessione
  const currentAttemptId = liveSession ? 
    `attempt_${liveSession.currentAthleteId}_${liveSession.currentDiscipline}_${liveSession.currentAttempt}` 
    : null;
  
  const { attempt, submitVote, isSubmittingVote } = useCurrentAttemptManager(currentAttemptId);

  // Determina alzata corrente dall'attempt
  const currentLift = attempt ? {
    id: attempt.id,
    athleteName: attempt.athleteName || 'Mario Rossi', // TODO: ottenere da registro atleti
    athleteNumber: 42, // TODO: ottenere da registro atleti  
    discipline: attempt.discipline,
    attemptNumber: attempt.attemptNumber,
    requestedWeight: attempt.requestedWeight,
    unit: 'kg',
    competitionId: attempt.competitionId,
    sessionId: attempt.sessionId || '',
    athleteId: attempt.athleteId,
  } : null;

  // Timer mock - TODO: implementare timer reale
  useEffect(() => {
    if (!currentLift) return;
    
    setTimeLeft(60);
    const timer = setInterval(() => {
      setTimeLeft(prev => prev ? Math.max(0, prev - 1) : null);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentLift]);

  const handleVote = async (vote: 'valid' | 'invalid') => {
    if (!judgeMode.judgePosition || !user?.id || !currentLift) return;

    try {
      setMyVote(vote);
      setHasVoted(true);
      
      await submitVote({
        id: `${user.id}-${Date.now()}`,
        judgeId: user.id,
        position: judgeMode.judgePosition,
        vote,
        decision: vote,
        competitionId: currentLift.competitionId,
        sessionId: currentLift.sessionId,
        athleteId: currentLift.athleteId,
        athleteName: currentLift.athleteName,
        discipline: currentLift.discipline,
        attemptNumber: currentLift.attemptNumber,
        weight: currentLift.requestedWeight
      });
      
      toast.success(`Voto registrato: ${vote === 'valid' ? 'VALIDA' : 'NON VALIDA'}`);
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Errore nel registrare il voto');
      setMyVote(null);
      setHasVoted(false);
    }
  };

  const handleCorrectVote = async (newVote: 'valid' | 'invalid') => {
    if (!currentLift || !judgeMode.judgePosition) return;

    try {
      // Salva correzione
      const correctionData = {
        liftId: currentLift.id,
        judgeId: user?.id,
        position: judgeMode.judgePosition,
        originalVote: myVote,
        correctedVote: newVote,
        timestamp: new Date().toISOString(),
      };
      
      const corrections = JSON.parse(localStorage.getItem('voteCorrections') || '[]');
      corrections.push(correctionData);
      localStorage.setItem('voteCorrections', JSON.stringify(corrections));

      // TODO: Invia correzione a Firebase
      console.log('Correzione inviata:', correctionData);

      setMyVote(newVote);
      
      toast.success(`Voto corretto: ${newVote === 'valid' ? 'VALIDA' : 'NON VALIDA'}`);
    } catch (error) {
      toast.error('Errore nella correzione del voto');
      console.error('Error correcting vote:', error);
    }
  };

  const getPositionLabel = (position: 1 | 2 | 3) => {
    switch (position) {
      case 1: return 'Sinistra';
      case 2: return 'Centro';
      case 3: return 'Destra';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentLift) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <h2 className="text-2xl font-bold mb-2">In Attesa...</h2>
          <p className="text-gray-400">Aspettando la prossima alzata</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              GIUDICE {getPositionLabel(judgeMode.judgePosition!)}
            </Badge>
            <h1 className="text-xl font-bold">{user?.name}</h1>
            
            {/* Indicatore connessione */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-gray-400">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {isSubmittingVote && (
                <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onExitJudgeMode}>
            <LogOut className="mr-2 h-4 w-4" />
            Esci Modalità Giudice
          </Button>
        </div>
        
        {/* Warning per disconnessione */}
        {shouldShowOfflineWarning && (
          <div className="mt-2 p-3 bg-yellow-900 border border-yellow-600 rounded-md">
            <p className="text-yellow-200 text-sm">
              ⚠️ Connessione persa - I voti vengono salvati localmente e sincronizzati automaticamente
            </p>
          </div>
        )}
      </div>

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Informazioni alzata corrente */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-white flex items-center justify-center">
              <User className="mr-3 h-8 w-8" />
              {currentLift.athleteName}
            </CardTitle>
            <CardDescription className="text-xl text-gray-300">
              Atleta #{currentLift.athleteNumber}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                <p className="text-sm text-gray-400">Disciplina</p>
                <p className="text-2xl font-bold text-white">{currentLift.discipline}</p>
              </div>
              <div>
                <Badge className="h-8 w-8 mx-auto mb-2 text-2xl flex items-center justify-center">
                  {currentLift.attemptNumber}
                </Badge>
                <p className="text-sm text-gray-400">Tentativo</p>
                <p className="text-2xl font-bold text-white">{currentLift.attemptNumber}°</p>
              </div>
              <div>
                <Weight className="h-8 w-8 mx-auto mb-2 text-red-400" />
                <p className="text-sm text-gray-400">Peso</p>
                <p className="text-4xl font-bold text-white">
                  {currentLift.requestedWeight}
                  <span className="text-xl text-gray-400 ml-1">{currentLift.unit}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer */}
        {timeLeft !== null && timeLeft > 0 && (
          <Card className="mb-6 bg-yellow-900 border-yellow-600">
            <CardContent className="text-center py-4">
              <Clock className="h-6 w-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatTime(timeLeft)}</p>
              <p className="text-sm">Tempo rimanente</p>
            </CardContent>
          </Card>
        )}

        {/* Stato altri giudici */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-center">Stato Giudici</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((position) => (
                <div key={position} className="text-center">
                  <p className="text-sm text-gray-400 mb-2">
                    {getPositionLabel(position as 1 | 2 | 3)}
                  </p>
                  <div className={`h-12 w-12 mx-auto rounded-full flex items-center justify-center ${
                    position === judgeMode.judgePosition
                      ? myVote === 'valid'
                        ? 'bg-green-600'
                        : myVote === 'invalid'
                        ? 'bg-red-600'
                        : 'bg-gray-600'
                      : otherVotes[`position${position}` as keyof JudgeVoteStatus] === 'valid'
                      ? 'bg-green-600'
                      : otherVotes[`position${position}` as keyof JudgeVoteStatus] === 'invalid'
                      ? 'bg-red-600'
                      : 'bg-gray-600'
                  }`}>
                    {(position === judgeMode.judgePosition ? myVote : otherVotes[`position${position}` as keyof JudgeVoteStatus]) === 'valid' ? (
                      <Check className="h-6 w-6" />
                    ) : (position === judgeMode.judgePosition ? myVote : otherVotes[`position${position}` as keyof JudgeVoteStatus]) === 'invalid' ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Clock className="h-6 w-6" />
                    )}
                  </div>
                  <p className="text-xs mt-1">
                    {position === judgeMode.judgePosition ? 'TU' : 'Giudice'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pulsanti voto */}
        {!hasVoted ? (
          <div className="grid grid-cols-2 gap-6">
            <Button
              size="lg"
              className="h-24 text-2xl bg-green-600 hover:bg-green-700"
              onClick={() => handleVote('valid')}
            >
              <Check className="mr-3 h-8 w-8" />
              VALIDA
            </Button>
            <Button
              size="lg"
              className="h-24 text-2xl bg-red-600 hover:bg-red-700"
              onClick={() => handleVote('invalid')}
            >
              <X className="mr-3 h-8 w-8" />
              NON VALIDA
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-blue-900 border-blue-600">
              <Check className="h-4 w-4" />
              <AlertDescription className="text-white">
                Hai votato: <strong>{myVote === 'valid' ? 'VALIDA' : 'NON VALIDA'}</strong>
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <p className="text-gray-400 mb-4">Vuoi correggere il tuo voto?</p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="border-green-600 text-green-400 hover:bg-green-900"
                  onClick={() => handleCorrectVote('valid')}
                  disabled={myVote === 'valid'}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Correggi: VALIDA
                </Button>
                <Button
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900"
                  onClick={() => handleCorrectVote('invalid')}
                  disabled={myVote === 'invalid'}
                >
                  <X className="mr-2 h-4 w-4" />
                  Correggi: NON VALIDA
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};