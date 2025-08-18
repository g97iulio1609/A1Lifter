import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  User, 
  Weight, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Activity
} from 'lucide-react';
import { Athlete } from '@/domain/entities/Athlete';
import { Attempt } from '@/domain/entities/Attempt';
import { Event } from '@/domain/entities/Event';
// WarmupSet type defined inline
interface WarmupSet {
  id: string;
  weight: number;
  reps: number;
  timestamp: Date;
  intensity: 'light' | 'medium' | 'heavy' | 'opener';
  successful: boolean;
}

interface WarmupBackstageUIProps {
  eventId: string;
  mode: 'warmup' | 'backstage';
}

interface AthleteStatus {
  athlete: Athlete;
  currentDiscipline: string;
  nextAttempt: Attempt;
  warmupStatus: 'not_started' | 'warming_up' | 'ready' | 'on_platform';
  estimatedCallTime: Date;
  lastWarmupWeight: number;
  warmupSets: WarmupSet[];
  notes: string;
}

interface WarmupSet {
  id: string;
  weight: number;
  reps: number;
  timestamp: Date;
  intensity: 'light' | 'medium' | 'heavy' | 'opener';
  successful: boolean;
}

interface PlatformQueue {
  current: AthleteStatus | null;
  onDeck: AthleteStatus | null;
  inHole: AthleteStatus | null;
  upcoming: AthleteStatus[];
}

export const WarmupBackstageUI: React.FC<WarmupBackstageUIProps> = ({ eventId, mode }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [athleteStatuses, setAthleteStatuses] = useState<AthleteStatus[]>([]);
  const [platformQueue, setPlatformQueue] = useState<PlatformQueue>({
    current: null,
    onDeck: null,
    inHole: null,
    upcoming: []
  });
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteStatus | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load event data and athlete statuses
  useEffect(() => {
    // Mock data for demonstration
    // Create mock event using Event constructor
     const mockEvent = new Event(
       eventId,
       'Campionato Regionale Powerlifting 2024',
       'powerlifting',
       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now to satisfy validation
       'Palestra Comunale',
       'Federazione Italiana Powerlifting',
       {
         maxAttempts: 3,
         disciplines: ['squat', 'bench', 'deadlift'],
         scoringSystem: 'wilks',
         allowLateRegistration: false,
         requireWeighIn: true,
         timeLimits: {
           attempt: 60,
           rest: 120,
           warmup: 300
         }
       },
       {
         current: 'in_progress',
         registrationCount: 25,
         createdAt: new Date(),
         updatedAt: new Date()
       },
       'FIP', // federation
       'Campionato regionale di powerlifting' // description
     );

    const mockAthletes: Athlete[] = [
      new Athlete(
        'athlete1',
        'Marco Rossi',
        'marco.rossi@email.com',
        new Date('1995-03-15'),
        'M',
        'FIPL',
        {
          squat: { weight: 180, achievedAt: new Date(), verified: true },
          bench_press: { weight: 120, achievedAt: new Date(), verified: true },
          deadlift: { weight: 220, achievedAt: new Date(), verified: true }
        },
        {},
        '+39 123 456 7890',
        'Team Alpha'
      ),
      new Athlete(
        'athlete2',
        'Giulia Bianchi',
        'giulia.bianchi@email.com',
        new Date('1992-07-22'),
        'F',
        'FIPL',
        {
          squat: { weight: 140, achievedAt: new Date(), verified: true },
          bench_press: { weight: 80, achievedAt: new Date(), verified: true },
          deadlift: { weight: 160, achievedAt: new Date(), verified: true }
        },
        {},
        '+39 123 456 7891',
        'Team Beta'
      ),
      new Athlete(
        'athlete3',
        'Alessandro Verdi',
        'alessandro.verdi@email.com',
        new Date('1988-11-10'),
        'M',
        'FIPL',
        {
          squat: { weight: 250, achievedAt: new Date(), verified: true },
          bench_press: { weight: 180, achievedAt: new Date(), verified: true },
          deadlift: { weight: 280, achievedAt: new Date(), verified: true }
        },
        {},
        '+39 123 456 7892',
        'Team Gamma'
      )
    ];

    // Generate mock athlete statuses
    const mockStatuses: AthleteStatus[] = mockAthletes.map((athlete, index) => {
      const estimatedTime = new Date();
      estimatedTime.setMinutes(estimatedTime.getMinutes() + (index * 15) + 10);
      
      return {
        athlete,
        currentDiscipline: 'squat',
        nextAttempt: new Attempt(
          `attempt-${athlete.id}-1`,
          'event1',
          'session1',
          athlete.id,
          'squat',
          1,
          Math.floor((athlete.getPersonalRecord('squat') || 100) * 0.85),
          Math.floor((athlete.getPersonalRecord('squat') || 100) * 0.85),
          null,
          {
             rackHeight: 5
           },
          estimatedTime,
          'declared'
        ),
        warmupStatus: index === 0 ? 'on_platform' : 
                     index === 1 ? 'ready' : 
                     index === 2 ? 'warming_up' : 'not_started',
        estimatedCallTime: estimatedTime,
        lastWarmupWeight: Math.floor((athlete.getPersonalRecord('squat') || 100) * 0.7),
        warmupSets: [
          {
            id: '1',
            weight: Math.floor((athlete.getPersonalRecord('squat') || 100) * 0.4),
            reps: 5,
            timestamp: new Date(Date.now() - 600000), // 10 minutes ago
            intensity: 'light',
            successful: true
          },
          {
            id: '2',
            weight: Math.floor((athlete.getPersonalRecord('squat') || 100) * 0.6),
            reps: 3,
            timestamp: new Date(Date.now() - 300000), // 5 minutes ago
            intensity: 'medium',
            successful: true
          }
        ],
        notes: index === 2 ? 'Problema al ginocchio sinistro - monitorare' : ''
      };
    });

    // Setup platform queue
    const queue: PlatformQueue = {
      current: mockStatuses[0] || null,
      onDeck: mockStatuses[1] || null,
      inHole: mockStatuses[2] || null,
      upcoming: mockStatuses.slice(3)
    };

    setEvent(mockEvent);
    setAthleteStatuses(mockStatuses);
    setPlatformQueue(queue);
  }, [eventId]);

  const getStatusColor = (status: AthleteStatus['warmupStatus']) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'warming_up': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'on_platform': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: AthleteStatus['warmupStatus']) => {
    switch (status) {
      case 'not_started': return <Clock className="w-4 h-4" />;
      case 'warming_up': return <Activity className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'on_platform': return <Target className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTimeUntilCall = (estimatedTime: Date) => {
    const diff = estimatedTime.getTime() - currentTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 0) return 'In ritardo';
    if (minutes === 0) return 'Ora';
    if (minutes < 60) return `${minutes}min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const getIntensityColor = (intensity: WarmupSet['intensity']) => {
    switch (intensity) {
      case 'light': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'heavy': return 'bg-orange-100 text-orange-800';
      case 'opener': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">Caricamento monitor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'warmup' ? '🔥 Area Riscaldamento' : '🎭 Monitor Backstage'}
              </h1>
              <p className="text-sm text-gray-600">Powerlifting Championship</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {currentTime.toLocaleTimeString('it-IT')}
              </Badge>
              <Badge variant="default">
                {athleteStatuses.length} atleti
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {mode === 'backstage' && (
          /* Platform Queue - Only for backstage mode */
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Coda Piattaforma</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Current */}
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">🎯 In Pedana</h3>
                  {platformQueue.current ? (
                    <div>
                      <p className="font-medium">
                        {platformQueue.current.athlete.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {platformQueue.current.nextAttempt.declaredWeight}kg • 
                        {platformQueue.current.nextAttempt.discipline.replace('_', ' ')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Nessuno</p>
                  )}
                </div>

                {/* On Deck */}
                <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">⚡ Prossimo</h3>
                  {platformQueue.onDeck ? (
                    <div>
                      <p className="font-medium">
                        {platformQueue.onDeck.athlete.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {platformQueue.onDeck.nextAttempt.declaredWeight}kg • 
                        {getTimeUntilCall(platformQueue.onDeck.estimatedCallTime)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Nessuno</p>
                  )}
                </div>

                {/* In Hole */}
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">🕳️ In Buca</h3>
                  {platformQueue.inHole ? (
                    <div>
                      <p className="font-medium">
                        {platformQueue.inHole.athlete.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {platformQueue.inHole.nextAttempt.declaredWeight}kg • 
                        {getTimeUntilCall(platformQueue.inHole.estimatedCallTime)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Nessuno</p>
                  )}
                </div>

                {/* Upcoming */}
                <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">📋 In Arrivo</h3>
                  <div className="space-y-1">
                    {platformQueue.upcoming.slice(0, 3).map((status, index) => (
                      <p key={status.athlete.id} className="text-sm">
                        {index + 4}. {status.athlete.name}
                      </p>
                    ))}
                    {platformQueue.upcoming.length > 3 && (
                      <p className="text-xs text-gray-500">+{platformQueue.upcoming.length - 3} altri</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Athletes List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {athleteStatuses.map((status) => (
            <Card 
              key={status.athlete.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedAthlete?.athlete.id === status.athlete.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedAthlete(status)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {status.athlete.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {status.athlete.getWeightClass()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(status.warmupStatus)}>
                    {getStatusIcon(status.warmupStatus)}
                    <span className="ml-1 capitalize">
                      {status.warmupStatus.replace('_', ' ')}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Next Attempt Info */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Prossimo tentativo</span>
                    <span className="text-sm font-medium">
                      {status.nextAttempt.discipline.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">
                      {status.nextAttempt.declaredWeight}kg
                    </span>
                    <span className="text-sm text-gray-600">
                      {getTimeUntilCall(status.estimatedCallTime)}
                    </span>
                  </div>
                </div>

                {/* Warmup Progress */}
                {mode === 'warmup' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Ultimo riscaldamento</span>
                      <span className="text-sm font-medium">{status.lastWarmupWeight}kg</span>
                    </div>
                    
                    <div className="flex space-x-1">
                      {status.warmupSets.map((set) => (
                        <div 
                          key={set.id}
                          className={`flex-1 h-2 rounded ${
                            set.successful ? 'bg-green-400' : 'bg-red-400'
                          }`}
                          title={`${set.weight}kg x ${set.reps} (${set.intensity})`}
                        />
                      ))}
                      {/* Placeholder for remaining sets */}
                      {Array.from({ length: Math.max(0, 5 - status.warmupSets.length) }).map((_, index) => (
                        <div key={`placeholder-${index}`} className="flex-1 h-2 rounded bg-gray-200" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Alerts */}
                {status.notes && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {status.notes}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Quick Actions */}
                <div className="flex space-x-2 mt-4">
                  {mode === 'warmup' && status.warmupStatus === 'warming_up' && (
                    <Button size="sm" variant="outline" className="flex-1">
                      <Weight className="w-4 h-4 mr-1" />
                      Aggiungi Set
                    </Button>
                  )}
                  {mode === 'backstage' && status.warmupStatus === 'ready' && (
                    <Button size="sm" variant="default" className="flex-1">
                      <Target className="w-4 h-4 mr-1" />
                      Chiama
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed View Modal/Sidebar would go here */}
        {selectedAthlete && mode === 'warmup' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                Dettagli Riscaldamento - {selectedAthlete.athlete.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Serie di Riscaldamento</h4>
                  <div className="space-y-2">
                    {selectedAthlete.warmupSets.map((set, index) => (
                      <div key={set.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium">{set.weight}kg x {set.reps}</span>
                          <Badge className={getIntensityColor(set.intensity)}>
                            {set.intensity}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          {set.successful ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-xs text-gray-500">
                            {set.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Progressione Suggerita</h4>
                  <div className="space-y-2">
                    {[
                      { weight: Math.floor(selectedAthlete.nextAttempt.declaredWeight * 0.8), intensity: 'medium' as const, reps: 2 },
                      { weight: Math.floor(selectedAthlete.nextAttempt.declaredWeight * 0.9), intensity: 'heavy' as const, reps: 1 },
                      { weight: selectedAthlete.nextAttempt.declaredWeight, intensity: 'opener' as const, reps: 1 }
                    ].map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border border-dashed border-gray-300 rounded">
                        <span className="font-medium">{suggestion.weight}kg x {suggestion.reps}</span>
                        <Badge className={getIntensityColor(suggestion.intensity)}>
                          {suggestion.intensity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};