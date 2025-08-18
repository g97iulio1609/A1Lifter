import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Wifi, WifiOff, User, Weight, Trophy } from 'lucide-react';
import { useAttemptJudging } from '@/hooks/useAttemptJudging';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Attempt } from '@/domain/entities/Attempt';
import { Athlete } from '@/domain/entities/Athlete';
import { Event } from '@/domain/entities/Event';
import { sportPluginRegistry, SupportedSport } from '@/domain/plugins/SportPluginRegistry';

interface JudgesUIProps {
  judgeId: string;
  eventId: string;
  position: 'left' | 'center' | 'right'; // Judge position
}

export const JudgesUI: React.FC<JudgesUIProps> = ({ judgeId, eventId, position }) => {
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [currentAthlete, setCurrentAthlete] = useState<Athlete | null>(null);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [decision, setDecision] = useState<boolean | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const { 
    submitDecision, 
    isSubmitting, 
    error: judgingError 
  } = useAttemptJudging();

  const { 
    isOnline, 
    pendingActions, 
 
  } = useOfflineSync();

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining]);

  // Load current attempt data
  useEffect(() => {
    // This would be connected to real-time Firebase listeners
    // For now, using mock data
    const mockEvent = new Event(
      'event1',
      'Campionato Regionale Powerlifting',
      'powerlifting',
      new Date(),
      'Palestra Iron Gym',
      'org1',
      {
        maxAttempts: 3,
        disciplines: ['squat', 'bench_press', 'deadlift'],
        scoringSystem: 'ipf',
        allowLateRegistration: false,
        requireWeighIn: true,
        federation: 'IPF',
        registrationDeadline: new Date(),
        timeLimits: {
           attempt: 60,
           rest: 120,
           warmup: 300
         }
      },
      {
        current: 'in_progress',
        registrationCount: 25,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15')
      }
    );

    const mockAthlete = new Athlete(
      'athlete1',
      'Marco Rossi',
      'marco.rossi@email.com',
      new Date('1995-03-15'),
      'M',
      'IPF',
      {
        squat: {
          weight: 180,
          achievedAt: new Date('2023-12-01'),
          verified: true
        },
        bench_press: {
          weight: 120,
          achievedAt: new Date('2023-11-15'),
          verified: true
        },
        deadlift: {
          weight: 220,
          achievedAt: new Date('2023-10-20'),
          verified: true
        }
      },
      {
        weightClass: '83kg'
      }
    );

    const mockAttempt: Attempt = new Attempt(
      'attempt1',
      'event1',
      'session1',
      'athlete1',
      'squat',
      1,
      175,
      175,
      null,
      {
        rackHeight: 1
      }
    );

    setCurrentEvent(mockEvent);
    setCurrentAthlete(mockAthlete);
    setCurrentAttempt(mockAttempt);
    setTimeRemaining(60);
    setIsTimerActive(true);
  }, [eventId]);

  const handleDecision = async (isSuccessful: boolean) => {
    if (!currentAttempt) return;

    setDecision(isSuccessful);
    
    try {
      await submitDecision({
        attemptId: currentAttempt.id,
        judgeId,
        decision: isSuccessful ? 'good' : 'no_lift',
        timestamp: Date.now()
      });
      
      // Reset for next attempt
      setTimeout(() => {
        setDecision(null);
        setTimeRemaining(60);
        setIsTimerActive(false);
      }, 2000);
    } catch (error) {
      console.error('Errore nell\'invio della decisione:', error);
    }
  };

  const getTimerColor = () => {
    if (timeRemaining > 30) return 'text-green-600';
    if (timeRemaining > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDecisionButtonClass = (isSuccess: boolean) => {
    const baseClass = 'h-24 text-xl font-bold transition-all duration-200 transform active:scale-95';
    
    if (decision === null) {
      return `${baseClass} ${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`;
    }
    
    if (decision === isSuccess) {
      return `${baseClass} ${isSuccess ? 'bg-green-700 ring-4 ring-green-300' : 'bg-red-700 ring-4 ring-red-300'} text-white scale-105`;
    }
    
    return `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed`;
  };

  if (!currentAttempt || !currentAthlete || !currentEvent) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg text-gray-600">In attesa del prossimo tentativo...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plugin = sportPluginRegistry.getPlugin(currentEvent.sport as SupportedSport);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header with connection status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Badge variant={isOnline ? 'default' : 'destructive'} className="flex items-center space-x-1">
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </Badge>
            <Badge variant="outline">Giudice {position.toUpperCase()}</Badge>
            {pendingActions > 0 && (
              <Badge variant="secondary">{pendingActions} azioni in coda</Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{currentEvent.name}</p>
            <p className="text-xs text-gray-500">Altezza rack {currentAttempt.metadata?.rackHeight || 1}</p>
          </div>
        </div>

        {judgingError && (
          <Alert variant="destructive">
            <AlertDescription>{judgingError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main judging interface */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Athlete info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Atleta</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="font-semibold">{currentAthlete.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Categoria</p>
                <p className="font-semibold">{currentAthlete.profile.weightClass || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Età</p>
                <p className="font-semibold">{currentAthlete.getAge()} anni</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attempt info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Weight className="w-5 h-5" />
              <span>Tentativo Corrente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Disciplina</p>
                <p className="font-semibold text-lg capitalize">{currentAttempt.discipline.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tentativo</p>
                <p className="font-semibold text-lg">{currentAttempt.attemptNumber}°</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Peso dichiarato</p>
                <p className="font-semibold text-2xl text-blue-600">{currentAttempt.declaredWeight}kg</p>
              </div>
            </div>

            {/* Timer */}
            <div className="text-center mb-6">
              <div className={`text-6xl font-mono font-bold ${getTimerColor()}`}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {isTimerActive ? 'Timer attivo' : 'Timer fermo'}
              </p>
            </div>

            {/* Decision buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleDecision(false)}
                disabled={decision !== null || isSubmitting}
                className={getDecisionButtonClass(false)}
              >
                <XCircle className="w-8 h-8 mr-2" />
                NO VALID
              </Button>
              <Button
                onClick={() => handleDecision(true)}
                disabled={decision !== null || isSubmitting}
                className={getDecisionButtonClass(true)}
              >
                <CheckCircle className="w-8 h-8 mr-2" />
                VALID
              </Button>
            </div>

            {decision !== null && (
              <div className="mt-4 text-center">
                <Badge 
                  variant={decision ? 'default' : 'destructive'}
                  className="text-lg px-4 py-2"
                >
                  {decision ? 'ALZATA VALIDA' : 'ALZATA NON VALIDA'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Previous attempts summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Tentativi Precedenti</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              {plugin.supportedDisciplines.map((discipline) => {
                const pr = currentAthlete.personalRecords[discipline];
                return (
                  <div key={discipline} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 capitalize">{discipline.replace('_', ' ')}</p>
                    <p className="font-semibold">{pr ? `${pr}kg` : 'N/A'}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};