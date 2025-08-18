import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Event } from '@/domain/entities/Event';
import { Athlete } from '@/domain/entities/Athlete';
import { Attempt } from '@/domain/entities/Attempt';
import { LiveSession } from '@/domain/entities/LiveSession';

interface UseRealTimeEventReturn {
  event: Event | null;
  athletes: Athlete[];
  currentAttempts: Attempt[];
  liveSession: LiveSession | null;
  loading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

/**
 * Hook for real-time event data synchronization
 * Manages Firebase listeners for event, athletes, attempts, and live session data
 */
export const useRealTimeEvent = (eventId: string): UseRealTimeEventReturn => {
  const [event, setEvent] = useState<Event | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [currentAttempts, setCurrentAttempts] = useState<Attempt[]>([]);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setConnectionStatus('reconnecting');

    const unsubscribers: (() => void)[] = [];

    try {
      // Listen to event changes
      const eventUnsubscribe = onSnapshot(
        doc(db, 'events', eventId),
        (doc) => {
          if (doc.exists()) {
            const eventData = { id: doc.id, ...doc.data() } as Event;
            setEvent(eventData);
            setConnectionStatus('connected');
          } else {
            setError('Event not found');
            setConnectionStatus('disconnected');
          }
        },
        (error) => {
          console.error('Error listening to event:', error);
          setError('Failed to load event data');
          setConnectionStatus('disconnected');
        }
      );
      unsubscribers.push(eventUnsubscribe);

      // Listen to athletes registered for this event
      const athletesQuery = query(
        collection(db, 'registrations'),
        where('eventId', '==', eventId),
        orderBy('createdAt', 'asc')
      );

      const athletesUnsubscribe = onSnapshot(
        athletesQuery,
        async (snapshot) => {
          const athleteIds = snapshot.docs.map(doc => doc.data().athleteId);
          
          if (athleteIds.length > 0) {
            // Fetch athlete details
            const athletePromises = athleteIds.map(async (athleteId) => {
              const athleteDoc = await import('firebase/firestore').then(({ getDoc, doc }) => 
                getDoc(doc(db, 'athletes', athleteId))
              );
              return athleteDoc.exists() ? { id: athleteDoc.id, ...athleteDoc.data() } as Athlete : null;
            });
            
            const athleteResults = await Promise.all(athletePromises);
            const validAthletes = athleteResults.filter((athlete): athlete is Athlete => athlete !== null);
            setAthletes(validAthletes);
          } else {
            setAthletes([]);
          }
        },
        (error) => {
          console.error('Error listening to athletes:', error);
          setError('Failed to load athletes data');
        }
      );
      unsubscribers.push(athletesUnsubscribe);

      // Listen to current attempts
      const attemptsQuery = query(
        collection(db, 'attempts'),
        where('eventId', '==', eventId),
        where('status', 'in', ['pending', 'in_progress']),
        orderBy('timestamp', 'asc')
      );

      const attemptsUnsubscribe = onSnapshot(
        attemptsQuery,
        (snapshot) => {
          const attempts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Attempt[];
          setCurrentAttempts(attempts);
        },
        (error) => {
          console.error('Error listening to attempts:', error);
          setError('Failed to load attempts data');
        }
      );
      unsubscribers.push(attemptsUnsubscribe);

      // Listen to live session
      const liveSessionQuery = query(
        collection(db, 'liveSessions'),
        where('eventId', '==', eventId),
        where('status', '==', 'active')
      );

      const liveSessionUnsubscribe = onSnapshot(
        liveSessionQuery,
        (snapshot) => {
          const sessions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as LiveSession[];
          
          // Get the most recent active session
          const activeSession = sessions.length > 0 ? sessions[0] : null;
          setLiveSession(activeSession);
        },
        (error) => {
          console.error('Error listening to live session:', error);
          setError('Failed to load live session data');
        }
      );
      unsubscribers.push(liveSessionUnsubscribe);

      setLoading(false);

    } catch (error) {
      console.error('Error setting up real-time listeners:', error);
      setError('Failed to initialize real-time connection');
      setConnectionStatus('disconnected');
      setLoading(false);
    }

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [eventId]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (connectionStatus === 'disconnected') {
        setConnectionStatus('reconnecting');
      }
    };

    const handleOffline = () => {
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionStatus]);

  return {
    event,
    athletes,
    currentAttempts,
    liveSession,
    loading,
    error,
    connectionStatus
  };
};