import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Eye, 
  CheckCircle, 
  XCircle,
  Timer,
  Target,
  Activity,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedLiveInterfaceProps {
  competitionId: string;
  sessionId: string;
  isAdmin?: boolean;
}

interface CurrentAttempt {
  athleteId: string;
  athleteName: string;
  athleteNumber: number;
  discipline: string;
  attemptNumber: number;
  requestedWeight: number;
  unit: string;
  startTime?: Date;
}

interface JudgeStatus {
  id: string;
  name: string;
  position: number;
  isConnected: boolean;
  hasVoted: boolean;
  vote?: 'valid' | 'invalid';
  lastActivity?: Date;
}

interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  type: 'attempt' | 'break' | 'preparation';
  totalTime: number;
}

export const EnhancedLiveInterface: React.FC<EnhancedLiveInterfaceProps> = ({
  isAdmin = false
}) => {
  const [currentAttempt, setCurrentAttempt] = useState<CurrentAttempt | null>(null);
  const [judges, setJudges] = useState<JudgeStatus[]>([]);
  const [timer, setTimer] = useState<TimerState>({
    timeRemaining: 0,
    isActive: false,
    type: 'preparation',
    totalTime: 60
  });
  const [isConnected] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [attemptResult] = useState<{
    isValid: boolean;
    validVotes: number;
    invalidVotes: number;
  } | null>(null);

  // Mock data per demo
  useEffect(() => {
    setCurrentAttempt({
      athleteId: '1',
      athleteName: 'Mario Rossi',
      athleteNumber: 42,
      discipline: 'Squat',
      attemptNumber: 2,
      requestedWeight: 180,
      unit: 'kg'
    });

    setJudges([
      { id: '1', name: 'Giudice 1', position: 1, isConnected: true, hasVoted: true, vote: 'valid' },
      { id: '2', name: 'Giudice 2', position: 2, isConnected: true, hasVoted: true, vote: 'valid' },
      { id: '3', name: 'Giudice 3', position: 3, isConnected: true, hasVoted: false }
    ]);

    // Simula timer
    const interval = setInterval(() => {
      setTimer(prev => ({
        ...prev,
        timeRemaining: Math.max(0, prev.timeRemaining - 1)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (timer.timeRemaining <= 10) return 'text-red-500';
    if (timer.timeRemaining <= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getTimerProgress = (): number => {
    return ((timer.totalTime - timer.timeRemaining) / timer.totalTime) * 100;
  };

  const handleStartTimer = () => {
    setTimer(prev => ({ ...prev, isActive: true, timeRemaining: 60, totalTime: 60 }));
  };

  const handlePauseTimer = () => {
    setTimer(prev => ({ ...prev, isActive: false }));
  };

  const handleResetTimer = () => {
    setTimer(prev => ({ ...prev, isActive: false, timeRemaining: 60, totalTime: 60 }));
  };

  const connectedJudges = judges.filter(j => j.isConnected).length;
  const votedJudges = judges.filter(j => j.hasVoted).length;
  // const validVotes = judges.filter(j => j.vote === 'valid').length;
  // const invalidVotes = judges.filter(j => j.vote === 'invalid').length;

  return (
    <div className="space-y-6">
      {/* Header con stato connessione */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-lg">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            Live Competition
          </h1>
          <p className="text-muted-foreground">Gestione gara in tempo reale</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? 'Connesso' : 'Disconnesso'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="gap-2"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Audio
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Impostazioni
          </Button>
        </div>
      </div>

      {/* Atleta corrente e timer */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informazioni atleta */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Atleta Corrente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentAttempt ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{currentAttempt.athleteName}</h3>
                    <p className="text-muted-foreground">Numero: {currentAttempt.athleteNumber}</p>
                  </div>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    #{currentAttempt.athleteNumber}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Disciplina</p>
                    <p className="font-semibold">{currentAttempt.discipline}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tentativo</p>
                    <p className="font-semibold">{currentAttempt.attemptNumber}/3</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Peso Richiesto</p>
                    <p className="font-bold text-lg">
                      {currentAttempt.requestedWeight} {currentAttempt.unit}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nessun atleta in gara</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timer */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-orange-500" />
              Timer Tentativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className={cn("text-6xl font-mono font-bold", getTimerColor())}>
                  {formatTime(timer.timeRemaining)}
                </div>
                <Progress 
                  value={getTimerProgress()} 
                  className="mt-3 h-3"
                />
              </div>
              
              {isAdmin && (
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={handleStartTimer}
                    disabled={timer.isActive}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start
                  </Button>
                  <Button
                    onClick={handlePauseTimer}
                    disabled={!timer.isActive}
                    variant="outline"
                    className="gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pausa
                  </Button>
                  <Button
                    onClick={handleResetTimer}
                    variant="outline"
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stato giudici */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-500" />
              Stato Giudici
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Connessi: {connectedJudges}/{judges.length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Votati: {votedJudges}/{judges.length}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {judges.map((judge) => (
              <div 
                key={judge.id} 
                className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  judge.isConnected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{judge.name}</h4>
                  <Badge variant={judge.isConnected ? 'default' : 'destructive'} className="text-xs">
                    Pos. {judge.position}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {judge.isConnected ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {judge.isConnected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  
                  {judge.hasVoted && (
                    <div className="flex items-center gap-1">
                      {judge.vote === 'valid' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {judge.vote === 'valid' ? 'Valido' : 'Non valido'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risultato tentativo */}
      {attemptResult && (
        <Card className={cn(
          "border-2",
          attemptResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {attemptResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Risultato Tentativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  Tentativo {attemptResult.isValid ? 'VALIDO' : 'NON VALIDO'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Voti validi: {attemptResult.validVotes} | Voti non validi: {attemptResult.invalidVotes}
                </p>
              </div>
              <Badge 
                variant={attemptResult.isValid ? 'default' : 'destructive'} 
                className="text-lg px-4 py-2"
              >
                {attemptResult.isValid ? 'SUCCESSO' : 'FALLITO'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};