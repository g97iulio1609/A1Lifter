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
  Eye, 
  CheckCircle, 
  XCircle,
  Target,
  Activity,
  ExternalLink,
  Clock,
  ChevronLeft
} from 'lucide-react';

interface ActiveCompetition {
  id: string;
  name: string;
  date: string;
  location: string;
  status: 'active' | 'paused' | 'completed';
}

interface OptimizedLiveInterfaceProps {
  competition: ActiveCompetition | null;
  isFullscreen?: boolean;
  isJudgeMode?: boolean;
  isPublicView?: boolean;
  onExitFullscreen?: () => void;
  onToggleFullscreen?: () => void;
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

export const OptimizedLiveInterface: React.FC<OptimizedLiveInterfaceProps> = ({
  competition,
  isFullscreen = false,

  isPublicView = false,
  onExitFullscreen
}) => {
  const [currentAttempt, setCurrentAttempt] = useState<CurrentAttempt | null>(null);
  const [judges, setJudges] = useState<JudgeStatus[]>([]);
  const [timer, setTimer] = useState<TimerState>({
    timeRemaining: 60,
    isActive: false,
    type: 'preparation',
    totalTime: 60
  });
  const [isConnected] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  // const [isFullscreenLocal, setIsFullscreen] = useState(isFullscreen);
  const [attemptResult] = useState<{
    isValid: boolean;
    validVotes: number;
    invalidVotes: number;
  } | null>(null);

  // Usa i dati della competizione passata come prop o dati mock
  const competitionData = competition || {
    id: '1',
    name: 'Campionato Regionale Powerlifting 2024',
    date: '15 Marzo 2024',
    location: 'Palestra Iron Gym, Milano',
    status: 'active' as const
  };



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
        timeRemaining: prev.isActive ? Math.max(0, prev.timeRemaining - 1) : prev.timeRemaining
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
  const validVotes = judges.filter(j => j.vote === 'valid').length;
  const invalidVotes = judges.filter(j => j.vote === 'invalid').length;

  // Vista pubblica semplificata per monitor esterni
  if (isPublicView) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col">
        {/* Header pubblico */}
        <div className="bg-black/50 p-8 text-center border-b border-white/10">
          <h1 className="text-4xl font-bold mb-2">{competitionData.name}</h1>
          <div className="flex items-center justify-center gap-4 mt-2 text-lg text-gray-300">
            <span>{competitionData.date}</span>
            <span>•</span>
            <span>{competitionData.location}</span>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2 gap-2 mt-4">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            LIVE
          </Badge>
        </div>

        {/* Atleta corrente - Vista pubblica */}
        <div className="flex-1 flex items-center justify-center p-8">
          {currentAttempt ? (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-6xl font-bold">{currentAttempt.athleteName}</h2>
                <div className="flex items-center justify-center gap-8 text-2xl text-gray-300">
                  <span>#{currentAttempt.athleteNumber}</span>
                  <span>•</span>
                  <span>{currentAttempt.discipline}</span>
                  <span>•</span>
                  <span>Tentativo {currentAttempt.attemptNumber}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-8xl font-bold text-blue-400">
                  {currentAttempt.requestedWeight} {currentAttempt.unit}
                </div>
              </div>

              {/* Timer pubblico */}
              <div className="space-y-4">
                <div className={`text-6xl font-mono font-bold ${getTimerColor()}`}>
                  {formatTime(timer.timeRemaining)}
                </div>
                <Progress 
                  value={getTimerProgress()} 
                  className="h-4 w-96 mx-auto"
                />
              </div>

              {/* Risultato tentativo */}
              {attemptResult && (
                <div className="mt-8">
                  <div className={`text-4xl font-bold ${
                    attemptResult.isValid ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {attemptResult.isValid ? '✓ VALIDO' : '✗ NON VALIDO'}
                  </div>
                  <div className="text-xl text-gray-300 mt-2">
                    {validVotes} validi - {invalidVotes} non validi
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <Activity className="h-24 w-24 mx-auto mb-4" />
              <p className="text-2xl">In attesa del prossimo atleta...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista fullscreen per admin
  if (isFullscreen) {
    return (
      <div className="h-screen bg-black text-white flex flex-col">
        {/* Header fullscreen */}
        <div className="bg-black/80 p-4 flex items-center justify-between border-b border-white/20">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={onExitFullscreen}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Esci da Fullscreen
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge variant="destructive" className="gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              LIVE
            </Badge>
            <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connectedJudges}/3 Giudici
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-white hover:bg-white/10"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => window.open('/live?public=true', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenuto principale fullscreen */}
        <div className="flex-1 grid grid-cols-3 gap-6 p-6">
          {/* Atleta corrente */}
          <div className="col-span-2 space-y-6">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="h-5 w-5" />
                  Atleta Corrente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentAttempt && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-4xl font-bold mb-2">{currentAttempt.athleteName}</h2>
                      <div className="flex items-center justify-center gap-6 text-lg text-gray-300">
                        <span>#{currentAttempt.athleteNumber}</span>
                        <span>{currentAttempt.discipline}</span>
                        <span>Tentativo {currentAttempt.attemptNumber}</span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-6xl font-bold text-blue-400 mb-4">
                        {currentAttempt.requestedWeight} {currentAttempt.unit}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timer fullscreen */}
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className={`text-6xl font-mono font-bold ${getTimerColor()}`}>
                    {formatTime(timer.timeRemaining)}
                  </div>
                  <Progress 
                    value={getTimerProgress()} 
                    className="h-6"
                  />
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={timer.isActive ? handlePauseTimer : handleStartTimer}
                      size="lg"
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {timer.isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button
                      onClick={handleResetTimer}
                      size="lg"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pannello giudici */}
          <div className="space-y-6">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Eye className="h-5 w-5" />
                  Giudici ({votedJudges}/3)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {judges.map((judge) => (
                    <div key={judge.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          judge.isConnected ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <span className="font-medium">{judge.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {judge.hasVoted ? (
                          judge.vote === 'valid' ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Vista normale
  return (
    <div className="space-y-4">

      {/* Contenuto principale */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Atleta corrente */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {currentAttempt ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl text-white font-bold text-lg">
                      #{currentAttempt.athleteNumber}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{currentAttempt.athleteName}</h3>
                      <p className="text-gray-600">{currentAttempt.discipline} • Tentativo {currentAttempt.attemptNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {currentAttempt.requestedWeight} {currentAttempt.unit}
                    </div>
                    <p className="text-sm text-gray-500">Peso richiesto</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>In attesa del prossimo atleta...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pannello laterale - Timer e Giudici */}
        <div className="space-y-4">
          {/* Timer compatto */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <div className={`text-3xl font-mono font-bold ${getTimerColor()}`}>
                  {formatTime(timer.timeRemaining)}
                </div>
                <Progress value={getTimerProgress()} className="h-2" />
                <div className="flex gap-2">
                  <Button
                    onClick={timer.isActive ? handlePauseTimer : handleStartTimer}
                    size="sm"
                    className="flex-1"
                  >
                    {timer.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={handleResetTimer}
                    size="sm"
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Giudici compatti */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Giudici</span>
                  <Badge variant="outline" className="text-xs">
                    {votedJudges}/3
                  </Badge>
                </div>
                {judges.map((judge) => (
                  <div key={judge.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        judge.isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium">{judge.name}</span>
                    </div>
                    <div>
                      {judge.hasVoted ? (
                        judge.vote === 'valid' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risultato tentativo */}
          {attemptResult && (
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <div className={`text-lg font-bold ${
                    attemptResult.isValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {attemptResult.isValid ? '✓ VALIDO' : '✗ NON VALIDO'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {validVotes} validi - {invalidVotes} non validi
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};