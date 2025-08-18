import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Registration, Competition, Athlete, PublicCompetition } from '@/types';

export type PublicRegistrationData = {
  competitionId: string;
  categoryId: string;
  athleteData: {
    name: string;
    email: string;
    birthDate: Date;
    gender: 'M' | 'F';
    weightClass: string;
    federation: string;
    phone?: string;
    personalRecords?: Record<string, number>;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalInfo?: {
    allergies?: string;
    medications?: string;
    conditions?: string;
  };
  notes?: string;
};

// Tipo esteso per registrazioni pubbliche
export type PublicCompetitionExtended = PublicCompetition & {
  registrationFee: number;
  currentParticipants: number;
};

// Ottiene tutte le competizioni aperte alle iscrizioni
export const getPublicCompetitions = async (): Promise<PublicCompetitionExtended[]> => {
  try {
    const competitionsRef = collection(db, 'competitions');
    
    let snapshot;
    try {
      const q = query(
        competitionsRef, 
        where('status', '==', 'active'),
        orderBy('date', 'asc')
      );
      snapshot = await getDocs(q);
    } catch (error: unknown) {
      // Fallback senza orderBy se l'indice composito non esiste
      if ((error as { code?: string }).code === 'failed-precondition') {
        console.warn('Indice composito mancante per competizioni pubbliche, utilizzo fallback senza orderBy');
        const qFallback = query(
          competitionsRef,
          where('status', '==', 'active')
        );
        snapshot = await getDocs(qFallback);
      } else {
        throw error;
      }
    }
    const competitions: PublicCompetitionExtended[] = [];
    
    for (const docSnapshot of snapshot.docs) {
      const competition = { id: docSnapshot.id, ...docSnapshot.data() } as Competition;
      
      // Assicura che la data sia un oggetto Date (Firestore Timestamp -> Date)
      const rawDate: unknown = (competition as Record<string, unknown>).date;
      const competitionDate: Date =
        rawDate instanceof Date
          ? rawDate
          : (rawDate && typeof rawDate === 'object' && 'toDate' in rawDate && typeof rawDate.toDate === 'function'
              ? rawDate.toDate()
              : new Date());
      
      // Conta le iscrizioni attuali
      const registrationsRef = collection(db, 'registrations');
      const regQuery = query(
        registrationsRef,
        where('competitionId', '==', competition.id),
        where('status', '!=', 'cancelled')
      );
      const regSnapshot = await getDocs(regQuery);
      
      competitions.push({
        id: competition.id,
        name: competition.name,
        date: competitionDate,
        location: competition.location,
        type: competition.type,
        status: competition.status,
        categories: competition.categories,
        description: competition.description,
        registrationDeadline: new Date(competitionDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 giorni prima
        registrationFee: 50, // Euro
        currentParticipants: regSnapshot.size,
        maxParticipants: competition.maxParticipants || 100,
        rules: competition.rules
      });
    }
    
    // Ordina le competizioni per data (lato client per gestire il fallback)
    return competitions.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error('Error fetching public competitions:', error);
    throw error;
  }
};

// Ottiene una singola competizione per la pagina di registrazione
export const getPublicCompetition = async (competitionId: string): Promise<PublicCompetitionExtended | null> => {
  try {
    const competitionRef = doc(db, 'competitions', competitionId);
    const competitionSnapshot = await getDoc(competitionRef);
    
    if (!competitionSnapshot.exists()) {
      return null;
    }
    
    const competition = { id: competitionSnapshot.id, ...competitionSnapshot.data() } as Competition;
    
    // Assicura che la data sia un oggetto Date (Firestore Timestamp -> Date)
    const rawDate: unknown = (competition as Record<string, unknown>).date;
    const competitionDate: Date =
      rawDate instanceof Date
        ? rawDate
        : (rawDate && typeof rawDate === 'object' && 'toDate' in rawDate && typeof rawDate.toDate === 'function'
            ? rawDate.toDate()
            : new Date());
    
    // Conta le iscrizioni attuali
    const registrationsRef = collection(db, 'registrations');
    const regQuery = query(
      registrationsRef,
      where('competitionId', '==', competitionId),
      where('status', '!=', 'cancelled')
    );
    const regSnapshot = await getDocs(regQuery);
    
    return {
      id: competition.id,
      name: competition.name,
      date: competitionDate,
      location: competition.location,
      type: competition.type,
      status: competition.status,
      categories: competition.categories,
      description: competition.description,
      registrationDeadline: new Date(competitionDate.getTime() - 7 * 24 * 60 * 60 * 1000),
      registrationFee: 50,
      currentParticipants: regSnapshot.size,
      maxParticipants: competition.maxParticipants || 100,
      rules: competition.rules
    };
  } catch (error) {
    console.error('Error fetching public competition:', error);
    throw error;
  }
};

// Registra un atleta a una competizione
export const registerAthleteToCompetition = async (
  registrationData: PublicRegistrationData
): Promise<{ athleteId: string; registrationId: string }> => {
  try {
    const batch = writeBatch(db);
    
    // Controlla se l'atleta esiste già
    const athletesRef = collection(db, 'athletes');
    const athleteQuery = query(
      athletesRef,
      where('email', '==', registrationData.athleteData.email)
    );
    const athleteSnapshot = await getDocs(athleteQuery);
    
    let athleteId: string;
    
    if (athleteSnapshot.empty) {
      // Crea nuovo atleta
      const newAthleteRef = doc(collection(db, 'athletes'));
      athleteId = newAthleteRef.id;
      
      const athleteData: Omit<Athlete, 'id'> = {
        name: registrationData.athleteData.name,
        email: registrationData.athleteData.email,
        birthDate: registrationData.athleteData.birthDate,
        gender: registrationData.athleteData.gender,
        weightClass: registrationData.athleteData.weightClass,
        federation: registrationData.athleteData.federation,
        personalRecords: registrationData.athleteData.personalRecords || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      batch.set(newAthleteRef, athleteData);
    } else {
      // Usa atleta esistente
      athleteId = athleteSnapshot.docs[0].id;
    }
    
    // Controlla se l'atleta è già iscritto
    const existingRegQuery = query(
      collection(db, 'registrations'),
      where('competitionId', '==', registrationData.competitionId),
      where('athleteId', '==', athleteId),
      where('status', '!=', 'cancelled')
    );
    const existingRegSnapshot = await getDocs(existingRegQuery);
    
    if (!existingRegSnapshot.empty) {
      throw new Error('Atleta già iscritto a questa competizione');
    }
    
    // Crea la registrazione
    const newRegistrationRef = doc(collection(db, 'registrations'));
    const registrationId = newRegistrationRef.id;
    
    const registrationDocData: Omit<Registration, 'id'> = {
      competitionId: registrationData.competitionId,
      athleteId: athleteId,
      categoryId: registrationData.categoryId,
      registeredAt: new Date(),
      status: 'pending',
      paymentStatus: 'unpaid',
      notes: registrationData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    batch.set(newRegistrationRef, registrationDocData);
    
    // Salva dati aggiuntivi della registrazione
    const registrationDetailsRef = doc(collection(db, 'registrationDetails'));
    const registrationDetailsData = {
      registrationId: registrationId,
      athleteId: athleteId,
      competitionId: registrationData.competitionId,
      emergencyContact: registrationData.emergencyContact,
      medicalInfo: registrationData.medicalInfo,
      submittedAt: serverTimestamp()
    };
    
    batch.set(registrationDetailsRef, registrationDetailsData);
    
    await batch.commit();
    
    return { athleteId, registrationId };
  } catch (error) {
    console.error('Error registering athlete:', error);
    throw error;
  }
};

// Controlla se un atleta può iscriversi a una competizione
export const canAthleteRegister = async (
  competitionId: string, 
  athleteEmail: string
): Promise<{ canRegister: boolean; reason?: string }> => {
  try {
    const competition = await getPublicCompetition(competitionId);
    
    if (!competition) {
      return { canRegister: false, reason: 'Competizione non trovata' };
    }
    
    if (competition.status !== 'active') {
      return { canRegister: false, reason: 'Competizione non attiva' };
    }
    
    if (new Date() > competition.registrationDeadline) {
      return { canRegister: false, reason: 'Scadenza iscrizioni superata' };
    }
    
    if (competition.maxParticipants && competition.currentParticipants >= competition.maxParticipants) {
      return { canRegister: false, reason: 'Numero massimo di partecipanti raggiunto' };
    }
    
    // Controlla se l'atleta è già iscritto
    const athletesRef = collection(db, 'athletes');
    const athleteQuery = query(athletesRef, where('email', '==', athleteEmail));
    const athleteSnapshot = await getDocs(athleteQuery);
    
    if (!athleteSnapshot.empty) {
      const athleteId = athleteSnapshot.docs[0].id;
      const registrationsRef = collection(db, 'registrations');
      const regQuery = query(
        registrationsRef,
        where('competitionId', '==', competitionId),
        where('athleteId', '==', athleteId),
        where('status', '!=', 'cancelled')
      );
      const regSnapshot = await getDocs(regQuery);
      
      if (!regSnapshot.empty) {
        return { canRegister: false, reason: 'Atleta già iscritto a questa competizione' };
      }
    }
    
    return { canRegister: true };
  } catch (error) {
    console.error('Error checking registration eligibility:', error);
    throw error;
  }
};