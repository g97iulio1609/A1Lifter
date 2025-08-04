import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Clock, 
  XCircle,
  Trophy,
  Weight
} from 'lucide-react';
import { useRegistrations } from '@/hooks/useCompetitions';
// Removed testDataService import - using real data only
import { liveCompetitionService, type LiveCompetitionState, type AttemptResult } from '@/services/liveCompetition';

interface LiveSessionDashboardProps {
  competitionId: string;
  competitionName: string;
}

type CompetitionState = 'setup' | 'active' | 'paused' | 'completed';
type Discipline = 'squat' | 'bench' | 'deadlift';
type Vote = 'valid' | 'invalid' | null;

interface CurrentAthlete {
  id: string;
  name: string;
  discipline: Discipline;
  attempt: number;
  weight: number;
}

interface JudgeVotes {
  judge1: Vote;
  judge2: Vote;
  judge3: Vote;
}

interface AthleteWeights {
  [athleteId: string]: {
    squat: [number, number, number]; // 3 tentativi
    bench: [number, number, number]; // 3 tentativi
    deadlift: [number, number, number]; // 3 tentativi
  };
}

type AthleteResults = LiveCompetitionState['athleteResults'];

interface CompetitionSetup {
  weightsSet: boolean;
  athleteWeights: AthleteWeights;
}

export const LiveSessionDashboard: React.FC<LiveSessionDashboardProps> = ({
  competitionId,
  competitionName
}) => {
  const { data: registrations = [], isLoading } = useRegistrations(competitionId);
  
  // Stato gara semplificato
  const [competitionState, setCompetitionState] = useState<CompetitionState>('setup');
  const [currentAthlete, setCurrentAthlete] = useState<CurrentAthlete | null>(null);
  const [timer, setTimer] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedAttempts, setCompletedAttempts] = useState(0);
  const [currentVotes, setCurrentVotes] = useState<JudgeVotes>({ judge1: null, judge2: null, judge3: null });
  const [attemptComplete, setAttemptComplete] = useState(false);
  
  // Gestione pesi
  const [currentWeight, setCurrentWeight] = useState<string>('100');
  
  // Setup competizione professionale
  const [competitionSetup, setCompetitionSetup] = useState<CompetitionSetup>({
    weightsSet: false,
    athleteWeights: {}
  });
  const [showWeightSetup, setShowWeightSetup] = useState(false);
  
  // Risultati tentativi
  const [athleteResults, setAthleteResults] = useState<AthleteResults>({});
  
  // Stato di caricamento
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      handleNextAthlete();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  // Carica stato gara da Firebase al mount
  useEffect(() => {
    const loadCompetitionState = async () => {
      try {
        setIsLoadingState(true);
        
        // Carica stato principale
        const liveState = await liveCompetitionService.loadLiveCompetitionState(competitionId);
        
        if (liveState) {
          setCompetitionState(liveState.state);
          setCompletedAttempts(liveState.completedAttempts);
          setTimer(liveState.timer);
          setIsTimerRunning(liveState.isTimerRunning);
          setCompetitionSetup({
            weightsSet: Object.keys(liveState.athleteWeights).length > 0,
            athleteWeights: liveState.athleteWeights
          });
          setAthleteResults(liveState.athleteResults);
          
          // Ricostruisci currentAthlete se esiste
          if (liveState.currentAthleteId && liveState.currentDiscipline && liveState.currentAttempt) {
            const athleteName = getAthleteName(liveState.currentAthleteId);
            const weight = liveState.athleteWeights[liveState.currentAthleteId]?.[liveState.currentDiscipline]?.[liveState.currentAttempt - 1] || 100;
            
            setCurrentAthlete({
              id: liveState.currentAthleteId,
              name: athleteName,
              discipline: liveState.currentDiscipline,
              attempt: liveState.currentAttempt,
              weight: weight
            });
            setCurrentWeight(weight.toString());
          }
          
          setLastSaved(liveState.updatedAt);
        }
        
      } catch (error) {
        console.error('Error loading competition state:', error);
      } finally {
        setIsLoadingState(false);
      }
    };

    loadCompetitionState();
  }, [competitionId]);

  // Salva stato su Firebase quando cambia
  useEffect(() => {
    if (isLoadingState) return; // Non salvare durante il caricamento
    
    const saveState = async () => {
      try {
        const stateToSave: Omit<LiveCompetitionState, 'createdAt' | 'updatedAt'> = {
          id: competitionId,
          competitionId,
          state: competitionState,
          currentAthleteId: currentAthlete?.id,
          currentDiscipline: currentAthlete?.discipline,
          currentAttempt: currentAthlete?.attempt,
          completedAttempts,
          athleteWeights: competitionSetup.athleteWeights,
          athleteResults,
          timer,
          isTimerRunning
        };
        
        await liveCompetitionService.saveLiveCompetitionState(stateToSave);
        setLastSaved(new Date());
        
      } catch (error) {
        console.error('Error saving competition state:', error);
      }
    };

    // Debounce il salvataggio per evitare troppe chiamate
    const timeoutId = setTimeout(saveState, 1000);
    return () => clearTimeout(timeoutId);
    
  }, [
    competitionState, 
    currentAthlete, 
    completedAttempts, 
    competitionSetup.athleteWeights, 
    athleteResults, 
    timer, 
    isTimerRunning,
    isLoadingState,
    competitionId
  ]);

  // Removed test data initialization - using real data only

  // Inizializza risultati per tutti gli atleti
  const initializeAthleteResults = () => {
    const results: AthleteResults = {};
    registrations.forEach(reg => {
      results[reg.athleteId] = {
        squat: [
          { weight: 0, status: 'pending', completed: false },
          { weight: 0, status: 'pending', completed: false },
          { weight: 0, status: 'pending', completed: false }
        ],
        bench: [
          { weight: 0, status: 'pending', completed: false },
          { weight: 0, status: 'pending', completed: false },
          { weight: 0, status: 'pending', completed: false }
        ],
        deadlift: [
          { weight: 0, status: 'pending', completed: false },
          { weight: 0, status: 'pending', completed: false },
          { weight: 0, status: 'pending', completed: false }
        ]
      };
    });
    setAthleteResults(results);
  };

  // Determina se un peso può essere modificato
  const canModifyWeight = (athleteId: string, discipline: Discipline, attempt: number): boolean => {
    const results = athleteResults[athleteId];
    if (!results) return true;
    
    const disciplineResults = results[discipline];
    
    // Può modificare solo se il tentativo non è stato completato
    return !disciplineResults[attempt - 1].completed;
  };




  // Ottieni nome atleta reale (genera nomi di fantasia per demo)
  const getAthleteName = (athleteId: string) => {
    // TODO: Ottenere il nome reale dell'atleta dal servizio Firebase
    return `Atleta ${athleteId}`;
  };

  // Genera ordine di gara dinamico basato sui tentativi ancora da completare
  const generateLiftingOrder = () => {
    // Inizializza pesi di default se non esistono
    if (Object.keys(competitionSetup.athleteWeights).length === 0) {
      const defaultWeights: AthleteWeights = {};
      registrations.forEach(reg => {
        defaultWeights[reg.athleteId] = {
          squat: [100, 110, 120],
          bench: [80, 90, 100],
          deadlift: [120, 130, 140]
        };
      });
      setCompetitionSetup(prev => ({
        ...prev,
        athleteWeights: defaultWeights
      }));
    }
    
    const pendingAttempts: Array<{
      athleteId: string;
      athleteName: string;
      discipline: Discipline;
      attempt: number;
      weight: number;
      order: number;
    }> = [];

    const disciplines: Discipline[] = ['squat', 'bench', 'deadlift'];
    
    // Raccoglie tutti i tentativi ancora da completare
    disciplines.forEach(discipline => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        registrations.forEach(reg => {
          const athleteWeights = competitionSetup.athleteWeights[reg.athleteId] || {
            squat: [100, 110, 120],
            bench: [80, 90, 100],
            deadlift: [120, 130, 140]
          };
          
          const results = athleteResults[reg.athleteId];
          const isCompleted = results?.[discipline]?.[attempt - 1]?.completed || false;
          
          // Aggiungi solo se non completato
          if (!isCompleted) {
            const weight = athleteWeights[discipline][attempt - 1];
            pendingAttempts.push({
              athleteId: reg.athleteId,
              athleteName: getAthleteName(reg.athleteId),
              discipline,
              attempt,
              weight,
              order: 0 // verrà riassegnato dopo l'ordinamento
            });
          }
        });
      }
    });
    
    // Ordina per disciplina, poi per tentativo, poi per peso crescente
    pendingAttempts.sort((a, b) => {
      // Prima per disciplina
      const disciplineOrder = { squat: 0, bench: 1, deadlift: 2 };
      if (disciplineOrder[a.discipline] !== disciplineOrder[b.discipline]) {
        return disciplineOrder[a.discipline] - disciplineOrder[b.discipline];
      }
      
      // Poi per tentativo
      if (a.attempt !== b.attempt) {
        return a.attempt - b.attempt;
      }
      
      // Infine per peso crescente
      return a.weight - b.weight;
    });
    
    // Riassegna gli ordini
    pendingAttempts.forEach((attempt, index) => {
      attempt.order = index;
    });

    return pendingAttempts;
  };

  // Avvia la gara (senza obbligo di setup pesi)
  const handleStartCompetition = () => {
    if (registrations.length === 0) return;
    
    // Inizializza pesi di default se non esistono
    if (Object.keys(competitionSetup.athleteWeights).length === 0) {
      const defaultWeights: AthleteWeights = {};
      registrations.forEach(reg => {
        defaultWeights[reg.athleteId] = {
          squat: [100, 110, 120],
          bench: [80, 90, 100],
          deadlift: [120, 130, 140]
        };
      });
      setCompetitionSetup({
        weightsSet: true,
        athleteWeights: defaultWeights
      });
    }
    
    // Inizializza risultati degli atleti
    if (Object.keys(athleteResults).length === 0) {
      initializeAthleteResults();
    }
    
    const liftingOrder = generateLiftingOrder();
    if (liftingOrder.length === 0) return;
    
    const firstLift = liftingOrder[0];
    setCompetitionState('active');
    setCurrentAthlete({
      id: firstLift.athleteId,
      name: firstLift.athleteName,
      discipline: firstLift.discipline,
      attempt: firstLift.attempt,
      weight: firstLift.weight
    });
    setCurrentWeight(firstLift.weight.toString());
    setCompletedAttempts(0);
    setTimer(60);
  };

  // Pausa/riprendi gara
  const handleTogglePause = () => {
    if (competitionState === 'active') {
      setCompetitionState('paused');
      setIsTimerRunning(false);
    } else if (competitionState === 'paused') {
      setCompetitionState('active');
    }
  };

  // Gestione pesi
  const handleWeightChange = (newWeight: string) => {
    setCurrentWeight(newWeight);
    if (currentAthlete) {
      setCurrentAthlete(prev => prev ? { ...prev, weight: parseInt(newWeight) || 0 } : null);
    }
  };


  // Gestione voti giudici
  const handleJudgeVote = (judge: keyof JudgeVotes, vote: 'valid' | 'invalid') => {
    setCurrentVotes(prev => ({ ...prev, [judge]: vote }));
  };

  // Controlla se tutti i giudici hanno votato
  const allJudgesVoted = currentVotes.judge1 !== null && currentVotes.judge2 !== null && currentVotes.judge3 !== null;

  // Calcola risultato tentativo (maggioranza)
  const getAttemptResult = () => {
    const votes = [currentVotes.judge1, currentVotes.judge2, currentVotes.judge3];
    const validVotes = votes.filter(v => v === 'valid').length;
    return validVotes >= 2 ? 'valid' : 'invalid';
  };

  // Auto-advance quando tutti hanno votato
  useEffect(() => {
    if (allJudgesVoted && !attemptComplete && currentAthlete) {
      setAttemptComplete(true);
      
      // Registra il risultato del tentativo
      const isValid = getAttemptResult() === 'valid';
      const attemptResult: AttemptResult = {
        weight: currentAthlete.weight,
        status: isValid ? 'valid' : 'invalid',
        completed: true,
        judgeVotes: currentVotes,
        completedAt: new Date()
      };

      // Aggiorna stato locale
      setAthleteResults(prev => ({
        ...prev,
        [currentAthlete.id]: {
          ...prev[currentAthlete.id],
          [currentAthlete.discipline]: prev[currentAthlete.id][currentAthlete.discipline].map((result, i) =>
            i === currentAthlete.attempt - 1 ? attemptResult : result
          ) as [AttemptResult, AttemptResult, AttemptResult]
        }
      }));

      // Salva su Firebase
      (async () => {
        try {
          await liveCompetitionService.saveAttemptResult(
            competitionId,
            currentAthlete.id,
            currentAthlete.discipline,
            currentAthlete.attempt,
            attemptResult
          );
        } catch (error) {
          console.error('Error saving attempt result:', error);
        }
      })();
      
      setTimeout(() => {
        handleNextAthlete();
      }, 2000); // 2 secondi per vedere il risultato
    }
  }, [allJudgesVoted, attemptComplete, currentAthlete]);

  // Prossimo atleta (con ordine professionale)
  const handleNextAthlete = () => {
    setTimer(60);
    setIsTimerRunning(false);
    setCurrentVotes({ judge1: null, judge2: null, judge3: null });
    setAttemptComplete(false);
    
    const liftingOrder = generateLiftingOrder();
    const nextIndex = completedAttempts + 1;
    
    if (nextIndex >= liftingOrder.length) {
      setCompetitionState('completed');
      setCurrentAthlete(null);
      return;
    }

    const nextLift = liftingOrder[nextIndex];
    setCurrentAthlete({
      id: nextLift.athleteId,
      name: nextLift.athleteName,
      discipline: nextLift.discipline,
      attempt: nextLift.attempt,
      weight: nextLift.weight
    });
    setCurrentWeight(nextLift.weight.toString());
    setCompletedAttempts(nextIndex);
  };

  // Start/stop timer
  const handleTimerToggle = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setTimer(60);
    setIsTimerRunning(false);
  };

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

  const getDisciplineName = (discipline: Discipline) => {
    switch (discipline) {
      case 'squat': return 'Squat';
      case 'bench': return 'Bench Press';
      case 'deadlift': return 'Deadlift';
    }
  };


  if (isLoading || isLoadingState) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="text-center py-8">
            <div className="text-lg text-gray-600">
              {isLoadingState ? 'Caricamento stato gara...' : 'Caricamento registrazioni...'}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Nessuna registrazione trovata per questa competizione. Aggiungi registrazioni reali per iniziare la sessione live.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Componente per setup pesi pre-gara migliorato
  const WeightSetupInterface = () => {
    const [localWeights, setLocalWeights] = useState<AthleteWeights>(
      competitionSetup.athleteWeights
    );

    const updateLocalWeight = (athleteId: string, discipline: Discipline, attempt: number, weight: string) => {
      const numWeight = parseFloat(weight) || 0;
      setLocalWeights(prev => {
        const existingAthlete = prev[athleteId] || {
          squat: [100, 110, 120],
          bench: [80, 90, 100],
          deadlift: [120, 130, 140]
        };
        
        const updatedWeights = [...existingAthlete[discipline]];
        updatedWeights[attempt - 1] = numWeight;
        
        return {
          ...prev,
          [athleteId]: {
            ...existingAthlete,
            [discipline]: updatedWeights as [number, number, number]
          }
        };
      });
    };

    const quickSetWeights = (athleteId: string, discipline: Discipline, baseWeight: number) => {
      const weights: [number, number, number] = [
        baseWeight,
        baseWeight + 10,
        baseWeight + 20
      ];
      
      setLocalWeights(prev => {
        const existingAthlete = prev[athleteId] || {
          squat: [100, 110, 120],
          bench: [80, 90, 100],
          deadlift: [120, 130, 140]
        };
        
        return {
          ...prev,
          [athleteId]: {
            ...existingAthlete,
            [discipline]: weights
          }
        };
      });
    };

    const confirmWeights = () => {
      setCompetitionSetup(prev => ({
        ...prev,
        weightsSet: true,
        athleteWeights: localWeights
      }));
      setShowWeightSetup(false);
    };

    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Setup Pesi - {competitionName}</h1>
            <p className="text-gray-600">Imposta i pesi per tutti i tentativi. I pesi vengono salvati automaticamente.</p>
          </div>
          <Badge className="bg-orange-500 text-white px-3 py-1">
            Setup Pesi
          </Badge>
        </div>

        <div className="grid gap-4">
          {registrations.map(reg => (
            <Card key={reg.athleteId} className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Atleta {reg.athleteId}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {(['squat', 'bench', 'deadlift'] as Discipline[]).map(discipline => (
                    <div key={discipline} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-lg">{getDisciplineName(discipline)}</h4>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => quickSetWeights(reg.athleteId, discipline, discipline === 'squat' ? 100 : discipline === 'bench' ? 80 : 120)}
                            className="text-xs px-2 py-1 h-6"
                          >
                            Auto
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map(attempt => (
                          <div key={attempt} className="text-center">
                            <label className="text-xs text-gray-600 block mb-1">
                              {attempt}° tent.
                            </label>
                            <Input
                              type="number"
                              value={localWeights[reg.athleteId]?.[discipline]?.[attempt - 1] || ''}
                              onChange={(e) => updateLocalWeight(
                                reg.athleteId,
                                discipline,
                                attempt,
                                e.target.value
                              )}
                              className="w-full text-center font-bold text-lg"
                              min="20"
                              max="500"
                              step="2.5"
                              placeholder="kg"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button 
            onClick={() => {
              // Inizializza pesi default per tutti gli atleti
              const defaultWeights: AthleteWeights = {};
              registrations.forEach(reg => {
                defaultWeights[reg.athleteId] = {
                  squat: [100, 110, 120],
                  bench: [80, 90, 100],
                  deadlift: [120, 130, 140]
                };
              });
              setLocalWeights(defaultWeights);
            }} 
            variant="outline"
            className="bg-blue-50"
          >
            <Weight className="w-4 h-4 mr-2" />
            Pesi di Default per Tutti
          </Button>
          
          <div className="space-x-3">
            <Button 
              onClick={() => setShowWeightSetup(false)}
              variant="outline"
            >
              Annulla
            </Button>
            <Button 
              onClick={confirmWeights}
              disabled={Object.keys(localWeights).length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Conferma e Inizia Gara
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const getStateColor = (state: CompetitionState) => {
    switch (state) {
      case 'setup': return 'bg-gray-500';
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
    }
  };

  const getStateLabel = (state: CompetitionState) => {
    switch (state) {
      case 'setup': return 'Setup';
      case 'active': return 'In Corso';
      case 'paused': return 'In Pausa';
      case 'completed': return 'Completata';
    }
  };

  // Mostra interfaccia setup pesi se richiesto
  if (showWeightSetup) {
    return <WeightSetupInterface />;
  }

  const totalAttempts = registrations.length * 3 * 3;
  const liftingOrder = generateLiftingOrder();
  const nextAthlete = liftingOrder[completedAttempts + 1];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header professionale */}
      <div className="bg-black text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{competitionName}</h1>
            <p className="text-gray-300">Live Competition Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={`${getStateColor(competitionState)} text-white px-4 py-2 text-lg`}>
              {getStateLabel(competitionState)}
            </Badge>
            <div className="text-right">
              <p className="text-sm text-gray-300">Progress</p>
              <p className="text-xl font-bold">{completedAttempts}/{totalAttempts}</p>
            </div>
            {lastSaved && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Ultimo salvataggio</p>
                <p className="text-sm text-green-300">✓ {lastSaved.toLocaleTimeString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Competition Interface */}
      <div className="p-6 space-y-6">
        
        {/* Controlli di setup */}
        {competitionState === 'setup' && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Avvia Competizione</h3>
                <p className="text-blue-700">I pesi verranno inizializzati automaticamente e potrai modificarli durante la gara</p>
              </div>
              <div className="flex space-x-3">
                <Button onClick={() => setShowWeightSetup(true)} variant="outline" size="lg">
                  <Weight className="h-5 w-5 mr-2" />
                  Setup Pesi Opzionale
                </Button>
                <Button onClick={handleStartCompetition} size="lg" className="bg-green-600 hover:bg-green-700">
                  <Play className="h-5 w-5 mr-2" />
                  Inizia Gara
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Current & Next Athlete Display - stile OpenLifter */}
        {currentAthlete && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Current Athlete */}
            <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium opacity-90">CURRENT LIFTER</div>
                <div className="flex space-x-2">
                  {competitionState === 'active' && (
                    <Button onClick={handleTogglePause} variant="outline" size="sm" className="text-green-600 bg-white hover:bg-gray-100">
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  {competitionState === 'paused' && (
                    <Button onClick={handleTogglePause} size="sm" className="bg-green-700 hover:bg-green-800">
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                </div>
              </div>
              <div className="mb-2">
                <div className="text-3xl font-bold">{currentAthlete.name}</div>
                <div className="text-lg opacity-90">
                  {getDisciplineName(currentAthlete.discipline)} - Attempt {currentAthlete.attempt}
                </div>
              </div>
              <div className="flex items-center text-5xl font-bold">
                {currentAthlete.weight}kg / {Math.round(currentAthlete.weight * 2.205)}lb
              </div>
              
              {/* Timer */}
              <div className="mt-4 text-center">
                <div className={`text-6xl font-mono font-bold ${getTimerColor()}`}>
                  {formatTime(timer)}
                </div>
                <div className="flex justify-center space-x-2 mt-2">
                  <Button 
                    onClick={handleTimerToggle}
                    disabled={competitionState !== 'active'}
                    size="lg"
                    className="bg-white text-green-600 hover:bg-gray-100"
                  >
                    {isTimerRunning ? <Pause className="h-5 w-5 mr-1" /> : <Play className="h-5 w-5 mr-1" />}
                    {isTimerRunning ? 'PAUSE' : 'START'}
                  </Button>
                  <Button 
                    onClick={handleResetTimer} 
                    variant="outline" 
                    size="lg"
                    className="bg-white text-green-600 hover:bg-gray-100"
                  >
                    <Clock className="h-5 w-5 mr-1" />
                    RESET
                  </Button>
                </div>
              </div>
            </div>

            {/* Next Athlete */}
            <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg">
              <div className="text-sm font-medium opacity-90 mb-4">NEXT UP</div>
              {nextAthlete ? (
                <>
                  <div className="mb-2">
                    <div className="text-3xl font-bold">{nextAthlete.athleteName}</div>
                    <div className="text-lg opacity-90">
                      {getDisciplineName(nextAthlete.discipline)} - Attempt {nextAthlete.attempt}
                    </div>
                  </div>
                  <div className="flex items-center text-4xl font-bold">
                    {nextAthlete.weight}kg / {Math.round(nextAthlete.weight * 2.205)}lb
                  </div>
                </>
              ) : (
                <div className="text-xl">Competition Complete!</div>
              )}
              
              {/* Weight modification for current athlete */}
              {competitionState === 'active' && (
                <div className="mt-4 bg-white bg-opacity-20 p-4 rounded">
                  <p className="text-sm font-medium mb-3">ADJUST CURRENT WEIGHT</p>
                  <div className="grid grid-cols-5 gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const newWeight = Math.max(20, currentAthlete.weight - 5);
                        handleWeightChange(newWeight.toString());
                      }}
                      disabled={attemptComplete}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                    >
                      -5kg
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const newWeight = Math.max(20, currentAthlete.weight - 2.5);
                        handleWeightChange(newWeight.toString());
                      }}
                      disabled={attemptComplete}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                    >
                      -2.5
                    </Button>
                    <Input
                      type="number"
                      value={currentWeight}
                      onChange={(e) => handleWeightChange(e.target.value)}
                      className="text-center text-black font-bold"
                      min="20"
                      max="500"
                      step="2.5"
                      disabled={attemptComplete}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const newWeight = Math.min(500, currentAthlete.weight + 2.5);
                        handleWeightChange(newWeight.toString());
                      }}
                      disabled={attemptComplete}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                    >
                      +2.5
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const newWeight = Math.min(500, currentAthlete.weight + 5);
                        handleWeightChange(newWeight.toString());
                      }}
                      disabled={attemptComplete}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                    >
                      +5kg
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Competition Table & Judge Controls */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Competition Results Table */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Competition Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left">Lifter</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Division</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Bwt</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Class</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">S1</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">S2</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">S3</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">B1</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">B2</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">B3</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">D1</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">D2</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">D3</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((reg, index) => {
                        const athleteWeights = competitionSetup.athleteWeights[reg.athleteId] || {
                          squat: [100, 110, 120],
                          bench: [80, 90, 100],
                          deadlift: [120, 130, 140]
                        };
                        const isCurrentAthlete = currentAthlete?.id === reg.athleteId;
                        
                        // Funzione per aggiornare peso specifico
                        const updateWeight = (discipline: Discipline, attempt: number, weight: number) => {
                          setCompetitionSetup(prev => ({
                            ...prev,
                            athleteWeights: {
                              ...prev.athleteWeights,
                              [reg.athleteId]: {
                                ...athleteWeights,
                                [discipline]: athleteWeights[discipline].map((w, i) => 
                                  i === attempt ? weight : w
                                ) as [number, number, number]
                              }
                            }
                          }));
                        };
                        
                        return (
                          <tr key={reg.athleteId} className={`${isCurrentAthlete ? 'bg-green-100 font-bold' : ''} ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                            <td className="border border-gray-300 px-3 py-2 font-medium">
                              {getAthleteName(reg.athleteId)}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center text-sm">Masters</td>
                            <td className="border border-gray-300 px-3 py-2 text-center">75.5</td>
                            <td className="border border-gray-300 px-3 py-2 text-center">80kg</td>
                            
                            {/* Squat attempts */}
                            {[0, 1, 2].map(attempt => {
                              const result = athleteResults[reg.athleteId]?.squat?.[attempt];
                              const canModify = canModifyWeight(reg.athleteId, 'squat', attempt + 1);
                              const cellClass = result?.completed 
                                ? result.status === 'valid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                                : '';
                              
                              return (
                                <td key={`squat-${attempt}`} className={`border border-gray-300 px-1 py-2 text-center ${cellClass}`}>
                                  {result?.completed ? (
                                    <div className="w-16 h-8 flex items-center justify-center text-sm font-bold">
                                      {result.status === 'valid' ? '✓' : '✗'} {result.weight}
                                    </div>
                                  ) : (
                                    <Input
                                      type="number"
                                      value={athleteWeights.squat[attempt] || ''}
                                      onChange={(e) => updateWeight('squat', attempt, parseFloat(e.target.value) || 0)}
                                      className="w-16 h-8 text-center text-sm border-0 bg-transparent"
                                      min="20"
                                      max="500"
                                      step="2.5"
                                      disabled={!canModify}
                                    />
                                  )}
                                </td>
                              );
                            })}
                            
                            {/* Bench attempts */}
                            {[0, 1, 2].map(attempt => {
                              const result = athleteResults[reg.athleteId]?.bench?.[attempt];
                              const canModify = canModifyWeight(reg.athleteId, 'bench', attempt + 1);
                              const cellClass = result?.completed 
                                ? result.status === 'valid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                                : '';
                              
                              return (
                                <td key={`bench-${attempt}`} className={`border border-gray-300 px-1 py-2 text-center ${cellClass}`}>
                                  {result?.completed ? (
                                    <div className="w-16 h-8 flex items-center justify-center text-sm font-bold">
                                      {result.status === 'valid' ? '✓' : '✗'} {result.weight}
                                    </div>
                                  ) : (
                                    <Input
                                      type="number"
                                      value={athleteWeights.bench[attempt] || ''}
                                      onChange={(e) => updateWeight('bench', attempt, parseFloat(e.target.value) || 0)}
                                      className="w-16 h-8 text-center text-sm border-0 bg-transparent"
                                      min="20"
                                      max="500"
                                      step="2.5"
                                      disabled={!canModify}
                                    />
                                  )}
                                </td>
                              );
                            })}
                            
                            {/* Deadlift attempts */}
                            {[0, 1, 2].map(attempt => {
                              const result = athleteResults[reg.athleteId]?.deadlift?.[attempt];
                              const canModify = canModifyWeight(reg.athleteId, 'deadlift', attempt + 1);
                              const cellClass = result?.completed 
                                ? result.status === 'valid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                                : '';
                              
                              return (
                                <td key={`deadlift-${attempt}`} className={`border border-gray-300 px-1 py-2 text-center ${cellClass}`}>
                                  {result?.completed ? (
                                    <div className="w-16 h-8 flex items-center justify-center text-sm font-bold">
                                      {result.status === 'valid' ? '✓' : '✗'} {result.weight}
                                    </div>
                                  ) : (
                                    <Input
                                      type="number"
                                      value={athleteWeights.deadlift[attempt] || ''}
                                      onChange={(e) => updateWeight('deadlift', attempt, parseFloat(e.target.value) || 0)}
                                      className="w-16 h-8 text-center text-sm border-0 bg-transparent"
                                      min="20"
                                      max="500"
                                      step="2.5"
                                      disabled={!canModify}
                                    />
                                  )}
                                </td>
                              );
                            })}
                            
                            <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                              {(() => {
                                const results = athleteResults[reg.athleteId];
                                if (!results) return '-';
                                
                                // Calcola il totale basato sui migliori tentativi validi
                                const bestSquat = Math.max(0, ...results.squat.filter(r => r.status === 'valid').map(r => r.weight));
                                const bestBench = Math.max(0, ...results.bench.filter(r => r.status === 'valid').map(r => r.weight));
                                const bestDeadlift = Math.max(0, ...results.deadlift.filter(r => r.status === 'valid').map(r => r.weight));
                                
                                const total = bestSquat + bestBench + bestDeadlift;
                                return total > 0 ? total : '-';
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Judge Controls & Next Lifters */}
          <div className="space-y-6">
            
            {/* Judge Voting Panel */}
            {currentAthlete && competitionState === 'active' && (
              <Card>
                <CardHeader>
                  <CardTitle>Judge Decisions</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Judge votes display */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {['judge1', 'judge2', 'judge3'].map((judge, index) => (
                      <div key={judge} className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Judge {index + 1}</p>
                        <div className="w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center bg-gray-100">
                          {currentVotes[judge as keyof JudgeVotes] === 'valid' && (
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                              <Trophy className="w-6 h-6 text-white" />
                            </div>
                          )}
                          {currentVotes[judge as keyof JudgeVotes] === 'invalid' && (
                            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                              <XCircle className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Big Judge Buttons - stile OpenLifter */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button 
                      onClick={() => {
                        // Simula tutti i giudici che votano "invalid"
                        setCurrentVotes({ judge1: 'invalid', judge2: 'invalid', judge3: 'invalid' });
                      }}
                      disabled={allJudgesVoted}
                      size="lg"
                      className="h-16 bg-red-600 hover:bg-red-700 text-white font-bold text-xl"
                    >
                      No Lift
                    </Button>
                    <Button 
                      onClick={() => {
                        // Simula tutti i giudici che votano "valid"
                        setCurrentVotes({ judge1: 'valid', judge2: 'valid', judge3: 'valid' });
                      }}
                      disabled={allJudgesVoted}
                      size="lg"
                      className="h-16 bg-green-600 hover:bg-green-700 text-white font-bold text-xl"
                    >
                      Good Lift
                    </Button>
                  </div>

                  {/* Individual judge controls */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Individual Judge Votes:</p>
                    {['judge1', 'judge2', 'judge3'].map((judge, index) => (
                      <div key={judge} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">Judge {index + 1}:</span>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => handleJudgeVote(judge as keyof JudgeVotes, 'valid')}
                            size="sm"
                            variant={currentVotes[judge as keyof JudgeVotes] === 'valid' ? 'default' : 'outline'}
                            className="text-green-600 hover:text-green-700"
                          >
                            Good
                          </Button>
                          <Button 
                            onClick={() => handleJudgeVote(judge as keyof JudgeVotes, 'invalid')}
                            size="sm"
                            variant={currentVotes[judge as keyof JudgeVotes] === 'invalid' ? 'default' : 'outline'}
                            className="text-red-600 hover:text-red-700"
                          >
                            No
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Result display */}
                  {allJudgesVoted && (
                    <div className={`mt-4 p-4 rounded-lg text-center ${
                      getAttemptResult() === 'valid' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      <p className="font-bold text-lg">
                        {getAttemptResult() === 'valid' ? '✅ GOOD LIFT' : '❌ NO LIFT'}
                      </p>
                      <p className="text-sm">
                        Good lifts: {[currentVotes.judge1, currentVotes.judge2, currentVotes.judge3].filter(v => v === 'valid').length}/3
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleNextAthlete}
                    disabled={competitionState !== 'active'}
                    className="w-full mt-4"
                    size="lg"
                  >
                    <SkipForward className="h-5 w-5 mr-2" />
                    Next Lifter
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Lifters */}
            <Card>
              <CardHeader>
                <CardTitle>Lifting Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {liftingOrder.length > 0 ? (
                    liftingOrder.slice(completedAttempts, completedAttempts + 8).map((lift, index) => (
                      <div 
                        key={`${lift.athleteId}-${lift.discipline}-${lift.attempt}`}
                        className={`flex items-center justify-between p-3 rounded border ${
                          index === 0 ? 'bg-green-100 border-green-300 font-bold' : 
                          index === 1 ? 'bg-red-100 border-red-300 font-semibold' :
                          'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="w-8 h-8 flex items-center justify-center text-xs">
                            {completedAttempts + index + 1}
                          </Badge>
                          <div>
                            <div className="font-medium">{lift.athleteName}</div>
                            <div className="text-sm text-gray-600">
                              {getDisciplineName(lift.discipline)} - Attempt {lift.attempt}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{lift.weight}kg</div>
                          <div className="text-sm text-gray-600">{Math.round(lift.weight * 2.205)}lb</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {competitionSetup.weightsSet ? 'Competition complete' : 'Set up weights to see lifting order'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
};