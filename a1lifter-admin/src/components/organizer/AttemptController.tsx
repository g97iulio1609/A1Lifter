import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Weight,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { 
  useCurrentAttemptManager,
  useCreateAttempt,
  useCompleteCurrentAttempt 
} from '@/hooks/useAttemptResults';
import { 
  useLiveSession, 
  useNextAthlete, 
  useUpdateSessionState 
} from '@/hooks/useLiveSession';

interface AttemptControllerProps {
  sessionId: string;
}

export const AttemptController: React.FC<AttemptControllerProps> = ({
  sessionId
}) => {
  const [timer, setTimer] = useState<number>(60); // 60 secondi
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [actualWeight, setActualWeight] = useState<string>('');
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);

  const { data: liveSession } = useLiveSession(sessionId);
  const nextAthleteMutation = useNextAthlete();
  const updateSessionMutation = useUpdateSessionState();
  const createAttemptMutation = useCreateAttempt();
  const completeAttemptMutation = useCompleteCurrentAttempt();
  
  const { 
    attempt, 
    stats, 
    updateWeight,
    isUpdatingWeight 
  } = useCurrentAttemptManager(currentAttemptId);

  // Timer countdown handled below after callbacks are defined

  // Crea tentativo quando cambia atleta corrente
  const handleCreateAttempt = useCallback(async () => {
    if (!liveSession?.currentAthleteId || 
        !liveSession?.currentDiscipline || 
        !liveSession?.currentAttempt) return;
    try {
      const attemptId = await createAttemptMutation.mutateAsync({
        sessionId,
        athleteId: liveSession.currentAthleteId,
        disciplineId: liveSession.currentDiscipline,
        attemptNumber: liveSession.currentAttempt,
        requestedWeight: 100,
      });
      setCurrentAttemptId(attemptId);
      setActualWeight('100');
    } catch (error) {
      console.error('Error creating attempt:', error);
    }
  }, [createAttemptMutation, liveSession, sessionId]);

  useEffect(() => {
    if (liveSession?.currentAthleteId && 
        liveSession?.currentDiscipline && 
        liveSession?.currentAttempt &&
        liveSession?.currentState === 'active') {
      handleCreateAttempt();
    }
  }, [
    liveSession?.currentAthleteId, 
    liveSession?.currentDiscipline, 
    liveSession?.currentAttempt,
    liveSession?.currentState,
    handleCreateAttempt
  ]);

  

  const handleStartTimer = () => {
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setTimer(60);
    setIsTimerRunning(false);
  };

  const handleUpdateWeight = async () => {
    if (!currentAttemptId || !actualWeight) return;
    
    try {
      await updateWeight(parseFloat(actualWeight));
    } catch (error) {
      console.error('Error updating weight:', error);
    }
  };

  const handleNextAthlete = useCallback(async () => {
    // Completa il tentativo corrente se in corso
    if (currentAttemptId && stats?.isCompleted) {
      await completeAttemptMutation.mutateAsync(sessionId);
    }
    
    // Passa al prossimo atleta
    await nextAthleteMutation.mutateAsync(sessionId);
    
    // Reset per nuovo tentativo
    setCurrentAttemptId(null);
    setTimer(60);
    setIsTimerRunning(false);
  }, [completeAttemptMutation, currentAttemptId, nextAthleteMutation, sessionId, stats]);
  
  const handleAutoSkip = useCallback(async () => {
    if (stats && !stats.isCompleted) {
      console.log('Time expired - auto skip');
    }
    await handleNextAthlete();
  }, [stats, handleNextAthlete]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      handleAutoSkip();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer, handleAutoSkip]);

  

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timer > 30) return 'text-green-600';
    if (timer > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVoteDisplay = (position: 1 | 2 | 3) => {
    if (!attempt) return null;
    
  const vote = attempt.judgeVotes.find((v: { position: 1 | 2 | 3; vote: 'valid' | 'invalid' }) => v.position === position);
    if (!vote) return <div className="w-8 h-8 border-2 border-gray-300 rounded" />;
    
    return vote.vote === 'valid' 
      ? <CheckCircle className="w-8 h-8 text-green-500" />
      : <XCircle className="w-8 h-8 text-red-500" />;
  };

  if (!liveSession) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Sessione live non trovata</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con stato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Controllo Tentativo</span>
            <Badge 
              variant={liveSession.currentState === 'active' ? 'default' : 'secondary'}
            >
              {liveSession.currentState.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Atleta corrente */}
          {liveSession.currentAthleteId ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Atleta</p>
                <p className="text-xl font-bold">Atleta #{liveSession.currentAthleteId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Disciplina</p>
                <p className="text-xl font-bold">{liveSession.currentDiscipline}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tentativo</p>
                <p className="text-xl font-bold">{liveSession.currentAttempt}/3</p>
              </div>
            </div>
          ) : (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                Nessun atleta attivo. Avvia la sessione per iniziare.
              </AlertDescription>
            </Alert>
          )}

          {/* Timer */}
          <div className="flex items-center justify-center mb-6">
            <div className="text-center">
              <div className={`text-6xl font-mono font-bold ${getTimerColor()}`}>
                {formatTime(timer)}
              </div>
              <div className="flex space-x-2 mt-4">
                <Button 
                  onClick={handleStartTimer} 
                  disabled={isTimerRunning}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
                <Button 
                  onClick={handlePauseTimer} 
                  disabled={!isTimerRunning}
                  variant="outline"
                  size="sm"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausa
                </Button>
                <Button 
                  onClick={handleResetTimer} 
                  variant="outline"
                  size="sm"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Peso effettivo */}
          {attempt && (
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1">
                <label className="text-sm font-medium">Peso Effettivo (kg)</label>
                <Input
                  type="number"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  placeholder="Peso effettivo"
                  disabled={isUpdatingWeight}
                />
              </div>
              <Button 
                onClick={handleUpdateWeight}
                disabled={!actualWeight || isUpdatingWeight}
                size="sm"
              >
                <Weight className="h-4 w-4 mr-1" />
                Aggiorna
              </Button>
            </div>
          )}

          {/* Stato voti giudici */}
          {attempt && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">Voti Giudici</p>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((position) => (
                  <div key={position} className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Giudice {position}
                    </p>
                    {getVoteDisplay(position as 1 | 2 | 3)}
                  </div>
                ))}
              </div>
              
              {stats && (
                <div className="mt-4 text-center">
                  <div className="flex justify-center space-x-4 text-sm">
                    <span className="text-green-600">Valide: {stats.validVotes}</span>
                    <span className="text-red-600">Non Valide: {stats.invalidVotes}</span>
                    <span className="text-gray-600">In Attesa: {stats.pendingVotes}</span>
                  </div>
                  
                  {stats.isCompleted && (
                    <Badge 
                      className={`mt-2 ${
                        stats.result === 'valid' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {stats.result === 'valid' ? 'ALZATA VALIDA' : 'ALZATA NON VALIDA'}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Controlli */}
          <div className="flex space-x-3">
            <Button 
              onClick={handleNextAthlete}
              disabled={nextAthleteMutation.isPending}
              className="flex-1"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Prossimo Atleta
            </Button>
            
            {liveSession.currentState === 'active' && (
              <Button 
                onClick={() => updateSessionMutation.mutate({
                  sessionId,
                  updates: { currentState: 'paused' }
                })}
                variant="outline"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pausa Gara
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 