import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Athlete, Registration } from '@/types';

interface CompetitionAthlete {
  athlete: Athlete;
  registration: Registration;
  bibNumber: string;
}

interface UseCompetitionAthletesResult {
  athletes: CompetitionAthlete[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCompetitionAthletes = (competitionId: string | undefined): UseCompetitionAthletesResult => {
  const [athletes, setAthletes] = useState<CompetitionAthlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAthletes = async () => {
    if (!competitionId) {
      setAthletes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ottieni tutte le registrazioni per questa competizione
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('competitionId', '==', competitionId),
        where('status', 'in', ['confirmed', 'pending']) // Solo registrazioni attive
      );

      const registrationsSnapshot = await getDocs(registrationsQuery);
      const registrations = registrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];

      // Ottieni i dettagli degli atleti per ogni registrazione
      const athletePromises = registrations.map(async (registration) => {
        try {
          const athleteDoc = await getDoc(doc(db, 'athletes', registration.athleteId));
          if (athleteDoc.exists()) {
            const athleteData = {
              id: athleteDoc.id,
              ...athleteDoc.data()
            } as Athlete;

            // Genera un numero pettorale basato sull'ordine di registrazione
            // In un sistema reale, questo potrebbe essere gestito diversamente
            const bibNumber = `${registration.categoryId.slice(-2)}${String(registrations.indexOf(registration) + 1).padStart(2, '0')}`;

            return {
              athlete: athleteData,
              registration,
              bibNumber
            } as CompetitionAthlete;
          }
          return null;
        } catch (err) {
          console.error(`Error fetching athlete ${registration.athleteId}:`, err);
          return null;
        }
      });

      const athleteResults = await Promise.all(athletePromises);
      const validAthletes = athleteResults.filter((result): result is CompetitionAthlete => {
        return result !== null && result !== undefined;
      });

      // Ordina per nome dell'atleta
      validAthletes.sort((a, b) => a.athlete.name.localeCompare(b.athlete.name));

      setAthletes(validAthletes);
    } catch (err) {
      console.error('Error fetching competition athletes:', err);
      setError('Errore nel caricamento degli atleti iscritti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAthletes();
  }, [competitionId]);

  return {
    athletes,
    loading,
    error,
    refetch: fetchAthletes
  };
};

// Hook per ottenere le competizioni attive per il selettore
export const useActiveCompetitions = () => {
  const [competitions, setCompetitions] = useState<Array<{ id: string; name: string; date: Date }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompetitions = async () => {
    setLoading(true);
    setError(null);

    try {
      const competitionsQuery = query(
        collection(db, 'competitions'),
        where('status', 'in', ['active', 'in_progress'])
      );

      const snapshot = await getDocs(competitionsQuery);
      const competitionsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          date: data.date?.toDate() || new Date()
        };
      });

      // Ordina per data
      competitionsList.sort((a, b) => a.date.getTime() - b.date.getTime());

      setCompetitions(competitionsList);
    } catch (err) {
      console.error('Error fetching active competitions:', err);
      setError('Errore nel caricamento delle competizioni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  return {
    competitions,
    loading,
    error,
    refetch: fetchCompetitions
  };
};