import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Users, Trophy, Clock, Wifi, WifiOff, Volume2, VolumeX, Settings, Eye, EyeOff, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { timerService } from '@/services/timer';
import { judgeService } from '@/services/judges';
import { liveSessionService } from '@/services/liveSession';
import { notificationService } from '@/services/notifications';
import type { CompetitionTimer, JudgeVote, LiveCompetitionSession, SystemNotification } from '@/types';
import { toast } from 'sonner';

interface LiveDashboardProps {
  competitionId: string;
  sessionId: string;
  isAdmin?: boolean;
}

interface CurrentAttempt {
  athleteId: string;
  athleteName: string;
  discipline: string;
  attemptNumber: number;
  weight: number;
  startTime?: Date;
}

const LiveDashboard: React.FC<LiveDashboardProps> = ({
  competitionId,
  sessionId,
  isAdmin = false
}) => {
  const [timer, setTimer] = useState<CompetitionTimer | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState<CurrentAttempt | null>(null);
  const [judges, setJudges] = useState<any[]>([]);
  const [votes, setVotes] = useState<JudgeVote[]>([]);
  const [, setLiveSession] = useState<LiveCompetitionSession | null>(null);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isConnected] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showJudgeDetails, setShowJudgeDetails] = useState(true);
  const [attemptResult, setAttemptResult] = useState<{
    isValid: boolean;
    votes: JudgeVote[];
    validVotes: number;
    invalidVotes: number;
    isMajority: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDashboard();
  }, [competitionId, sessionId]);

  useEffect(() => {
    // Subscribe to timer updates
    const unsubscribeTimer = timerService.subscribeToTimer(
      competitionId,
      (timerData) => {
        setTimer(timerData);
        if (timerData && timerData.type === 'attempt') {
          const remaining = timerService.calculateRemainingTime(timerData);
          setTimeRemaining(remaining);
          
          // Play sound alerts
          if (soundEnabled) {
            if (remaining === 30 || remaining === 10 || remaining === 5) {
              playTimeAlert(remaining);
            }
          }
        }
      }
    );

    // Subscribe to live session updates
    const unsubscribeSession = liveSessionService.subscribeToLiveSession(
      sessionId,
      (sessionData: LiveCompetitionSession | null) => {
        setLiveSession(sessionData);
        if (sessionData?.currentAttempt && sessionData?.currentAthleteId && sessionData?.currentDiscipline) {
          const attemptData: CurrentAttempt = {
            athleteId: sessionData.currentAthleteId,
            athleteName: '', // TODO: Get athlete name
            discipline: sessionData.currentDiscipline,
            attemptNumber: sessionData.currentAttempt,
            weight: 0 // TODO: Get requested weight
          };
          setCurrentAttempt(attemptData);
          loadAttemptVotes(attemptData);
        }
      }
    );

    // Subscribe to notifications
    const unsubscribeNotifications = notificationService.subscribeToCompetitionNotifications(
      competitionId,
      (notificationData: SystemNotification[] | SystemNotification) => {
        if (Array.isArray(notificationData)) {
          setNotifications([...notificationData.slice(0, 10)]);
        } else {
          setNotifications(prev => [notificationData, ...prev.slice(0, 9)]); // Keep last 10
          if (soundEnabled && notificationData.type === 'success' && notificationData.title.includes('Record')) {
            playRecordAlert();
          }
        }
      }
    );

    return () => {
      unsubscribeTimer();
      unsubscribeSession();
      unsubscribeNotifications();
    };
  }, [competitionId, sessionId, soundEnabled]);

  useEffect(() => {
    // Update timer countdown
    const interval = setInterval(() => {
      if (timer && timer.type === 'attempt' && timer.isActive) {
        const remaining = timerService.calculateRemainingTime(timer);
        setTimeRemaining(Math.max(0, remaining));
        
        if (remaining <= 0 && currentAttempt) {
          // Auto-calculate result when time expires
          calculateAttemptResult();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timer, currentAttempt]);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      
      // Load judges for this competition
      const judgeAssignments = await judgeService.getJudgeAssignments(competitionId);
      const sessionJudges = judgeAssignments.filter(assignment => 
        assignment.sessionId === sessionId
      );
      setJudges(sessionJudges);
      
      // Load live session
      const session = await liveSessionService.getLiveSession(sessionId);
      setLiveSession(session);
      
      if (session?.currentAttempt && session?.currentAthleteId && session?.currentDiscipline) {
        const attemptData: CurrentAttempt = {
          athleteId: session.currentAthleteId,
          athleteName: '', // TODO: Get athlete name
          discipline: session.currentDiscipline,
          attemptNumber: session.currentAttempt,
          weight: 0 // TODO: Get requested weight
        };
        setCurrentAttempt(attemptData);
        await loadAttemptVotes(attemptData);
      }
      
      // Load recent notifications
      const recentNotifications = await notificationService.getNotificationsForCompetition(
        competitionId,
        10
      );
      setNotifications(recentNotifications);
      
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      toast.error('Errore durante il caricamento del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttemptVotes = async (attempt: CurrentAttempt) => {
    try {
      const attemptVotes = await judgeService.getVotesForAttempt(
        competitionId,
        attempt.athleteId,
        attempt.discipline,
        attempt.attemptNumber
      );
      setVotes(attemptVotes);
      
      // Check if all judges have voted
      if (attemptVotes.length === judges.length && attemptVotes.length > 0) {
        const result = await judgeService.calculateAttemptResult(
          competitionId,
          attempt.athleteId,
          attempt.discipline,
          attempt.attemptNumber
        );
        setAttemptResult(result);
      }
    } catch (error) {
      console.error('Error loading attempt votes:', error);
    }
  };

  const calculateAttemptResult = async () => {
    if (!currentAttempt) return;
    
    try {
      const result = await judgeService.calculateAttemptResult(
        competitionId,
        currentAttempt.athleteId,
        currentAttempt.discipline,
        currentAttempt.attemptNumber
      );
      setAttemptResult(result);
      
      if (soundEnabled) {
        if (result.isValid) {
          playSuccessAlert();
        } else {
          playFailureAlert();
        }
      }
    } catch (error) {
      console.error('Error calculating attempt result:', error);
    }
  };

  const handleTimerControl = async (action: 'start' | 'pause' | 'reset') => {
    if (!isAdmin || !timer) return;
    
    try {
      switch (action) {
        case 'start':
          if (timer.isActive) {
            await timerService.pauseTimer(timer.id);
          } else {
            await timerService.startTimer(timer.id);
          }
          break;
        case 'reset':
          await timerService.resetTimer(timer.id);
          break;
      }
    } catch (error) {
      console.error('Error controlling timer:', error);
      toast.error('Errore durante il controllo del timer');
    }
  };

  const playTimeAlert = (seconds: number) => {
    // Simple beep sound for time alerts
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = seconds <= 10 ? 800 : 400;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const playRecordAlert = () => {
    // Different sound for record alerts
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1000;
    gainNode.gain.value = 0.5;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const playSuccessAlert = () => {
    // Success sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 600;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const playFailureAlert = () => {
    // Failure sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 200;
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (timeRemaining <= 10) return 'text-red-600';
    if (timeRemaining <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getJudgeVote = (judgeId: string) => {
    return votes.find(vote => vote.judgeId === judgeId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'record_broken':
        return <Trophy className="h-4 w-4 text-yellow-600" />;
      case 'failed_attempt':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'technical_issue':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Live</h1>
              <p className="text-gray-600">Sessione {sessionId}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-700">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-red-700">Offline</span>
                  </>
                )}
              </div>
              
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg ${soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              
              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Timer and Attempt */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                {timer && timer.type === 'attempt' ? (
                  <>
                    <div className={`text-6xl font-bold ${getTimerColor()} mb-4`}>
                      {formatTime(timeRemaining)}
                    </div>
                    
                    {isAdmin && (
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => handleTimerControl('start')}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
                            timer.isActive
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {timer.isActive ? (
                            <>
                              <Pause className="h-5 w-5" />
                              Pausa
                            </>
                          ) : (
                            <>
                              <Play className="h-5 w-5" />
                              Avvia
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleTimerControl('reset')}
                          className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                        >
                          <RotateCcw className="h-5 w-5" />
                          Reset
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-xl text-gray-600">Timer non attivo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Current Attempt */}
            {currentAttempt ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tentativo Corrente</h2>
                
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-blue-600 mb-2">
                    {currentAttempt.athleteName}
                  </h3>
                  <p className="text-lg text-gray-600 capitalize mb-2">
                    {currentAttempt.discipline} - Tentativo {currentAttempt.attemptNumber}
                  </p>
                  <p className="text-4xl font-bold text-gray-900">
                    {currentAttempt.weight} kg
                  </p>
                </div>

                {/* Attempt Result */}
                {attemptResult && (
                  <div className="text-center mb-4">
                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-xl font-bold ${
                      attemptResult.isValid
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {attemptResult.isValid ? (
                        <>
                          <CheckCircle className="h-6 w-6" />
                          VALIDO
                        </>
                      ) : (
                        <>
                          <XCircle className="h-6 w-6" />
                          NON VALIDO
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {attemptResult.validVotes} voti validi su {attemptResult.votes.length}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center py-8">
                  <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-xl text-gray-600">Nessun tentativo in corso</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Judges Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Giudici</h3>
                <button
                  onClick={() => setShowJudgeDetails(!showJudgeDetails)}
                  className="p-1 rounded text-gray-500 hover:text-gray-700"
                >
                  {showJudgeDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="space-y-3">
                {judges.map((judge, index) => {
                  const vote = getJudgeVote(judge.judgeId);
                  return (
                    <div key={judge.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {showJudgeDetails ? judge.judgeName : `Giudice ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-600">{judge.position}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {vote ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            vote.decision === 'valid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {vote.decision === 'valid' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {vote.decision === 'valid' ? 'V' : 'X'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <Clock className="h-3 w-3" />
                            In attesa
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifiche</h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600 text-center py-4">
                    Nessuna notifica
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni Dashboard</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Audio Notifiche</label>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Mostra Nomi Giudici</label>
                <button
                  onClick={() => setShowJudgeDetails(!showJudgeDetails)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showJudgeDetails ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showJudgeDetails ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDashboard;