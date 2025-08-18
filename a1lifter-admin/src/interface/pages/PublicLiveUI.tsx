import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Clock, 
  User, 
  Target, 
  Medal,
  Calendar,
  MapPin,
  Users,
  BarChart3
} from 'lucide-react';
import { Event } from '@/domain/entities/Event';
import { Athlete } from '@/domain/entities/Athlete';
import { Attempt } from '@/domain/entities/Attempt';
import { sportPluginRegistry, SupportedSport } from '@/domain/plugins/SportPluginRegistry';

interface PublicLiveUIProps {
  eventId: string;
}

interface LeaderboardEntry {
  athlete: Athlete;
  totalScore: number;
  attempts: Attempt[];
  rank: number;
  bestLifts: Record<string, number>;
}

interface LiveAttempt {
  athlete: Athlete;
  attempt: Attempt;
  timeRemaining: number;
  status: 'upcoming' | 'current' | 'completed';
}

export const PublicLiveUI: React.FC<PublicLiveUIProps> = ({ eventId }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<LiveAttempt | null>(null);

  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [isLive] = useState(true);

  // SEO and meta data
  useEffect(() => {
    if (event) {
      // Update page title and meta description for SEO
      document.title = `${event.name} - Live Results | A1Lifter`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          `Segui in diretta ${event.name} - Risultati live, classifiche e tentativi in tempo reale su A1Lifter`
        );
      }

      // Open Graph meta tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', `${event.name} - Live Results`);
      }

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', 
          `Risultati live di ${event.name}. Segui le performance degli atleti in tempo reale.`
        );
      }
    }
  }, [event]);

  // Load event data and setup real-time listeners
  useEffect(() => {
    // Mock data for demonstration
    const mockEvent: Event = new Event(
      'event1',
      'Campionato Regionale Powerlifting 2024',
      'powerlifting',
      new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      'PalaSport Milano - Via dello Sport 123, Milano',
      'Federazione Italiana Powerlifting',
      {
        maxAttempts: 3,
        disciplines: ['squat', 'bench_press', 'deadlift'],
        scoringSystem: 'wilks',
        allowLateRegistration: false,
        requireWeighIn: true,
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
      },
      'FIP',
      'Campionato regionale di powerlifting con le migliori categorie'
    );

    const mockAthletes: Athlete[] = [
      new Athlete(
        'athlete1',
        'Marco Rossi',
        'marco.rossi@email.com',
        new Date('1995-03-15'),
        'M',
        'FIP',
        {
          squat: { weight: 180, achievedAt: new Date(), verified: true },
          bench_press: { weight: 120, achievedAt: new Date(), verified: true },
          deadlift: { weight: 220, achievedAt: new Date(), verified: true }
        },
        { weightClass: '83kg' },
        '+39 123 456 7890',
        'Team Milano',
        true,
        new Date(),
        new Date()
      ),
      new Athlete(
        'athlete2',
        'Giulia Bianchi',
        'giulia.bianchi@email.com',
        new Date('1992-07-22'),
        'F',
        'FIP',
        {
          squat: { weight: 140, achievedAt: new Date(), verified: true },
          bench_press: { weight: 80, achievedAt: new Date(), verified: true },
          deadlift: { weight: 160, achievedAt: new Date(), verified: true }
        },
        { weightClass: '59kg' },
        '+39 123 456 7891',
        'Team Roma',
        true,
        new Date(),
        new Date()
      ),
      new Athlete(
        'athlete3',
        'Alessandro Verdi',
        'alessandro.verdi@email.com',
        new Date('1988-11-10'),
        'M',
        'FIP',
        {
          squat: { weight: 250, achievedAt: new Date(), verified: true },
          bench_press: { weight: 180, achievedAt: new Date(), verified: true },
          deadlift: { weight: 280, achievedAt: new Date(), verified: true }
        },
        { weightClass: '105kg' },
        '+39 123 456 7892',
        'Team Napoli',
        true,
        new Date(),
        new Date()
      )
    ];

    // Generate mock leaderboard
    const mockLeaderboard: LeaderboardEntry[] = mockAthletes.map((athlete, index) => ({
      athlete,
      totalScore: (athlete.personalRecords.squat?.weight || 0) + (athlete.personalRecords.bench_press?.weight || 0) + (athlete.personalRecords.deadlift?.weight || 0),
      attempts: [],
      rank: index + 1,
      bestLifts: {
        squat: athlete.personalRecords.squat?.weight || 0,
        bench_press: athlete.personalRecords.bench_press?.weight || 0,
        deadlift: athlete.personalRecords.deadlift?.weight || 0
      }
    })).sort((a, b) => b.totalScore - a.totalScore);

    // Mock current attempt
    const mockCurrentAttempt: LiveAttempt = {
      athlete: mockAthletes[0],
      attempt: new Attempt(
        'attempt1',
        eventId,
        'session1',
        'athlete1',
        'squat',
        2,
        185,
        185,
        null,
        { notes: 'morning session' },
        new Date(),
        'in_progress'
      ),
      timeRemaining: 45,
      status: 'current'
    };

    setEvent(mockEvent);
    setLeaderboard(mockLeaderboard);
    setCurrentAttempt(mockCurrentAttempt);
    // setUpcomingAttempts([]);
  }, [eventId]);

  // Timer for current attempt
  useEffect(() => {
    if (!currentAttempt || currentAttempt.status !== 'current') return;

    const interval = setInterval(() => {
      setCurrentAttempt(prev => {
        if (!prev || prev.timeRemaining <= 0) return prev;
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentAttempt]);

  const getTimerColor = (timeRemaining: number) => {
    if (timeRemaining > 30) return 'text-green-600';
    if (timeRemaining > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredLeaderboard = selectedDiscipline === 'all' 
    ? leaderboard 
    : leaderboard.filter(entry => 
        entry.bestLifts[selectedDiscipline] && entry.bestLifts[selectedDiscipline] > 0
      );

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">Caricamento evento...</p>
        </div>
      </div>
    );
  }

  const plugin = sportPluginRegistry.getPlugin(event.sport as SupportedSport);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {event.date.toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {event.location}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {leaderboard.length} atleti
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Badge 
                variant={isLive ? 'default' : 'secondary'} 
                className="text-lg px-4 py-2"
              >
                {isLive ? '🔴 LIVE' : '⏸️ PAUSA'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Attempt - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Attempt Card */}
            {currentAttempt && (
              <Card className="border-2 border-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span>Tentativo in Corso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">
                            {currentAttempt.athlete.name}
                          </h3>
                          <p className="text-gray-600">
                            {currentAttempt.athlete.profile.weightClass} • 
                            {currentAttempt.attempt.discipline.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Tentativo</p>
                          <p className="text-lg font-semibold">{currentAttempt.attempt.attemptNumber}°</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Peso</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {currentAttempt.attempt.declaredWeight}kg
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Tempo rimanente</p>
                      <div className={`text-4xl font-mono font-bold ${getTimerColor(currentAttempt.timeRemaining)}`}>
                        {formatTime(currentAttempt.timeRemaining)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Statistiche Evento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {plugin.supportedDisciplines.map((discipline) => {
                    const bestLift = Math.max(
                      ...leaderboard.map(entry => entry.bestLifts[discipline] || 0)
                    );
                    return (
                      <div key={discipline} className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 capitalize">
                          {discipline.replace('_', ' ')}
                        </p>
                        <p className="text-xl font-bold text-gray-900">{bestLift}kg</p>
                        <p className="text-xs text-gray-500">Record evento</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard - Right Column */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span>Classifica</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">Totale</TabsTrigger>
                    <TabsTrigger value="squat">Squat</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={selectedDiscipline} className="mt-4">
                    <div className="space-y-3">
                      {filteredLeaderboard.slice(0, 10).map((entry, index) => (
                        <div 
                          key={entry.athlete.id} 
                          className={`flex items-center space-x-3 p-3 rounded-lg ${
                            index < 3 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {index < 3 ? <Medal className="w-4 h-4" /> : index + 1}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {entry.athlete.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {entry.athlete.profile.weightClass}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-sm">
                              {selectedDiscipline === 'all' 
                                ? `${entry.totalScore}kg`
                                : `${entry.bestLifts[selectedDiscipline] || 0}kg`
                              }
                            </p>
                            {selectedDiscipline === 'all' && (
                              <p className="text-xs text-gray-500">totale</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer with structured data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          "name": event.name,
          "startDate": event.date.toISOString(),
          "location": {
            "@type": "Place",
            "name": event.location
          },
          "organizer": {
            "@type": "Organization",
            "name": "A1Lifter"
          },
          "sport": event.sport,
          "eventStatus": "https://schema.org/EventScheduled"
        })}
      </script>
    </div>
  );
};