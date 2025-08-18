import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Clock, User, Trophy, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { judgeService } from '@/services/judges';
import { timerService } from '@/services/timer';
import type { JudgeVote, CompetitionTimer } from '@/types';
import { toast } from 'sonner';

interface JudgeInterfaceProps {
  judgeId: string;
  judgeName: string;
  competitionId: string;
  sessionId: string;
  currentAttempt?: {
    athleteId: string;
    athleteName: string;
    discipline: string;
    attemptNumber: number;
    weight: number;
  };
  isConnected?: boolean;
}

const JudgeInterface: React.FC<JudgeInterfaceProps> = ({
  judgeId,
  judgeName,
  competitionId,
  sessionId,
  currentAttempt,
  isConnected = true
}) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [currentVote, setCurrentVote] = useState<'valid' | 'invalid' | null>(null);
  const [timer, setTimer] = useState<CompetitionTimer | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteHistory, setVoteHistory] = useState<JudgeVote[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingVote, setPendingVote] = useState<'valid' | 'invalid' | null>(null);

  const loadAttemptVotes = useCallback(async () => {
    if (!currentAttempt) return;
    try {
      const votes = await judgeService.getVotesForAttempt(
        competitionId,
        currentAttempt.athleteId,
        currentAttempt.discipline,
        currentAttempt.attemptNumber
      );
      setVoteHistory(votes);
      const myVote = votes.find(vote => vote.judgeId === judgeId);
      if (myVote) {
        setHasVoted(true);
        setCurrentVote(myVote.decision);
      }
    } catch (error) {
      console.error('Error loading attempt votes:', error);
    }
  }, [competitionId, currentAttempt, judgeId]);

  useEffect(() => {
    if (currentAttempt) {
      setHasVoted(false);
      setCurrentVote(null);
      setShowConfirmation(false);
      setPendingVote(null);
      loadAttemptVotes();
    }
  }, [currentAttempt, loadAttemptVotes]);

  useEffect(() => {
    // Subscribe to timer updates
    const unsubscribe = timerService.subscribeToTimer(
      competitionId,
      (timerData) => {
        setTimer(timerData);
        if (timerData && timerData.type === 'attempt') {
          const remaining = timerService.calculateRemainingTime(timerData);
          setTimeRemaining(remaining);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [competitionId]);

  useEffect(() => {
    // Update timer countdown
    const interval = setInterval(() => {
      if (timer && timer.type === 'attempt' && timer.isActive) {
        const remaining = timerService.calculateRemainingTime(timer);
        setTimeRemaining(Math.max(0, remaining));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timer]);

  

  const handleVote = (decision: 'valid' | 'invalid') => {
    if (hasVoted) {
      toast.error('Hai già votato per questo tentativo');
      return;
    }
    
    if (!currentAttempt) {
      toast.error('Nessun tentativo in corso');
      return;
    }

    setPendingVote(decision);
    setShowConfirmation(true);
  };

  const confirmVote = async () => {
    if (!pendingVote || !currentAttempt) return;
    
    setIsSubmitting(true);
    
    try {
      await judgeService.recordJudgeVote({
        judgeId,
        competitionId,
        sessionId,
        athleteId: currentAttempt.athleteId,
        athleteName: currentAttempt.athleteName,
        discipline: currentAttempt.discipline,
        attemptNumber: currentAttempt.attemptNumber,
        weight: currentAttempt.weight,
        decision: pendingVote,
        vote: pendingVote,
        position: 1 as 1 | 2 | 3,
        notes: ''
      });
      
      setHasVoted(true);
      setCurrentVote(pendingVote);
      setShowConfirmation(false);
      setPendingVote(null);
      
      toast.success(`Voto registrato: ${pendingVote === 'valid' ? 'Valido' : 'Non valido'}`);
      
      // Reload votes to see other judges' votes
      loadAttemptVotes();
    } catch (error) {
      console.error('Error recording vote:', error);
      toast.error('Errore durante la registrazione del voto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelVote = () => {
    setShowConfirmation(false);
    setPendingVote(null);
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

  const getOtherJudgesVotes = () => {
    return voteHistory.filter(vote => vote.judgeId !== judgeId);
  };

  if (!currentAttempt) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <Clock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">In Attesa</h2>
          <p className="text-gray-600">Nessun tentativo in corso</p>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <User className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">{judgeName}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Connesso</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">Disconnesso</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{judgeName}</h1>
                <p className="text-sm text-gray-600">Giudice - Sessione {sessionId}</p>
              </div>
            </div>
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
          </div>
          
          {/* Timer */}
          {timer && timer.type === 'attempt' && timer.isActive && (
            <div className="text-center">
              <div className={`text-4xl font-bold ${getTimerColor()}`}>
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Tempo rimanente</p>
            </div>
          )}
        </div>

        {/* Current Attempt */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">{currentAttempt.athleteName}</h2>
            </div>
            <p className="text-lg text-gray-600 capitalize">
              {currentAttempt.discipline} - Tentativo {currentAttempt.attemptNumber}
            </p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {currentAttempt.weight} kg
            </p>
          </div>

          {/* Vote Status */}
          {hasVoted ? (
            <div className="text-center mb-6">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold ${
                currentVote === 'valid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {currentVote === 'valid' ? (
                  <>
                    <Check className="h-6 w-6" />
                    Voto: VALIDO
                  </>
                ) : (
                  <>
                    <X className="h-6 w-6" />
                    Voto: NON VALIDO
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">Voto registrato con successo</p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <p className="text-lg text-gray-600 mb-4">Esprimi il tuo voto:</p>
              
              {/* Vote Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleVote('valid')}
                  disabled={isSubmitting}
                  className="flex-1 max-w-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-6 px-8 rounded-xl text-xl transition-colors duration-200 flex items-center justify-center gap-3 shadow-lg"
                >
                  <Check className="h-8 w-8" />
                  VALIDO
                </button>
                
                <button
                  onClick={() => handleVote('invalid')}
                  disabled={isSubmitting}
                  className="flex-1 max-w-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-6 px-8 rounded-xl text-xl transition-colors duration-200 flex items-center justify-center gap-3 shadow-lg"
                >
                  <X className="h-8 w-8" />
                  NON VALIDO
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Other Judges Votes */}
        {getOtherJudgesVotes().length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Voti Altri Giudici</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getOtherJudgesVotes().map((vote, index) => (
                <div key={vote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Giudice {index + 1}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    vote.decision === 'valid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {vote.decision === 'valid' ? (
                      <>
                        <Check className="h-3 w-3" />
                        Valido
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        Non valido
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning for offline mode */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>Modalità Offline:</strong> I voti verranno sincronizzati quando la connessione sarà ripristinata.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && pendingVote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conferma Voto</h3>
            
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-2">Stai per votare:</p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold ${
                pendingVote === 'valid'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {pendingVote === 'valid' ? (
                  <>
                    <Check className="h-5 w-5" />
                    VALIDO
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5" />
                    NON VALIDO
                  </>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{currentAttempt.athleteName}</p>
                <p className="text-sm text-gray-600">
                  {currentAttempt.discipline} - {currentAttempt.weight}kg
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelVote}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
              >
                Annulla
              </button>
              <button
                onClick={confirmVote}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold disabled:bg-gray-400 ${
                  pendingVote === 'valid'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? 'Registrando...' : 'Conferma Voto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeInterface;