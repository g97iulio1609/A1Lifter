import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  QueryConstraint,
  addDoc 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { RegistrationWithDetails } from '@/types';
import type { RegistrationsFilters } from '@/hooks/useRegistrations';

const REGISTRATIONS_COLLECTION = 'registrations';
const REGISTRATION_DETAILS_COLLECTION = 'registrationDetails';
const ATHLETES_COLLECTION = 'athletes';
const COMPETITIONS_COLLECTION = 'competitions';

export const registrationsService = {
  // Ottieni registrazioni con filtri e dati completi
  async getRegistrations(filters: RegistrationsFilters = {}): Promise<RegistrationWithDetails[]> {
    const constraints: QueryConstraint[] = [];
    
    // Filtri
    if (filters.competitionId) {
      constraints.push(where('competitionId', '==', filters.competitionId));
    }
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.paymentStatus) {
      constraints.push(where('paymentStatus', '==', filters.paymentStatus));
    }

    // Orderby rimosso temporaneamente per evitare problemi con indici compositi
    // TODO: Riattivare dopo aver configurato gli indici Firebase

    let querySnapshot;
    try {
      const q = query(collection(db, REGISTRATIONS_COLLECTION), ...constraints);
      querySnapshot = await getDocs(q);
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
      throw error;
    }
    
    const registrations: RegistrationWithDetails[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const registrationData = docSnapshot.data();
      const registration = {
        id: docSnapshot.id,
        competitionId: registrationData.competitionId,
        athleteId: registrationData.athleteId,
        categoryId: registrationData.categoryId,
        status: registrationData.status,
        paymentStatus: registrationData.paymentStatus,
        notes: registrationData.notes,
        registeredAt: registrationData.registeredAt?.toDate() || new Date(),
      };

      // Ottieni dati atleta
      const athleteDoc = await getDoc(doc(db, ATHLETES_COLLECTION, registration.athleteId));
      const athleteData = athleteDoc.exists() ? athleteDoc.data() : null;

      // Ottieni dati competizione
      const competitionDoc = await getDoc(doc(db, COMPETITIONS_COLLECTION, registration.competitionId));
      const competitionData = competitionDoc.exists() ? competitionDoc.data() : null;

      // Ottieni dettagli registrazione
      const detailsQuery = query(
        collection(db, REGISTRATION_DETAILS_COLLECTION),
        where('registrationId', '==', registration.id)
      );
      const detailsSnapshot = await getDocs(detailsQuery);
      const detailsData = detailsSnapshot.docs[0]?.data();

      if (athleteData && competitionData) {
        // Trova categoria
        const category = competitionData.categories?.find((c: any) => c.id === registration.categoryId);
        
        const enrichedRegistration: RegistrationWithDetails = {
          ...registration,
          athleteName: athleteData.name,
          athleteEmail: athleteData.email,
          athleteGender: athleteData.gender,
          athleteWeightClass: athleteData.weightClass,
          competitionName: competitionData.name,
          categoryName: category?.name || 'Categoria non trovata',
          emergencyContact: detailsData?.emergencyContact,
          medicalInfo: detailsData?.medicalInfo,
        };

        // Applica filtro di ricerca lato client
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          if (
            enrichedRegistration.athleteName.toLowerCase().includes(searchLower) ||
            enrichedRegistration.athleteEmail.toLowerCase().includes(searchLower)
          ) {
            registrations.push(enrichedRegistration);
          }
        } else {
          registrations.push(enrichedRegistration);
        }
      } else {
        // Skip registrations with missing athlete or competition data
        console.warn('Skipping registration due to missing athlete or competition data:', registration.id);
      }
    }
    
    // Ordina lato client per garantire ordine corretto
    return registrations.sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());
  },

  // Ottieni dettagli di una singola registrazione
  async getRegistrationDetails(registrationId: string): Promise<RegistrationWithDetails> {
    const registrationDoc = await getDoc(doc(db, REGISTRATIONS_COLLECTION, registrationId));
    
    if (!registrationDoc.exists()) {
      throw new Error('Registrazione non trovata');
    }

    const registrationData = registrationDoc.data()!;
    const registration = {
      id: registrationDoc.id,
      competitionId: registrationData.competitionId,
      athleteId: registrationData.athleteId,
      categoryId: registrationData.categoryId,
      status: registrationData.status,
      paymentStatus: registrationData.paymentStatus,
      notes: registrationData.notes,
      registeredAt: registrationData.registeredAt?.toDate() || new Date(),
    };

    // Ottieni dati atleta
    const athleteDoc = await getDoc(doc(db, ATHLETES_COLLECTION, registration.athleteId));
    const athleteData = athleteDoc.data();

    // Ottieni dati competizione
    const competitionDoc = await getDoc(doc(db, COMPETITIONS_COLLECTION, registration.competitionId));
    const competitionData = competitionDoc.data();

    // Ottieni dettagli registrazione
    const detailsQuery = query(
      collection(db, REGISTRATION_DETAILS_COLLECTION),
      where('registrationId', '==', registrationId)
    );
    const detailsSnapshot = await getDocs(detailsQuery);
    const detailsData = detailsSnapshot.docs[0]?.data();

    if (!athleteData || !competitionData) {
      throw new Error('Dati atleta o competizione non trovati');
    }

    // Trova categoria
    const category = competitionData.categories?.find((c: any) => c.id === registration.categoryId);

    return {
      ...registration,
      athleteName: athleteData.name,
      athleteEmail: athleteData.email,
      athleteGender: athleteData.gender,
      athleteWeightClass: athleteData.weightClass,
      competitionName: competitionData.name,
      categoryName: category?.name || 'Categoria non trovata',
      emergencyContact: detailsData?.emergencyContact,
      medicalInfo: detailsData?.medicalInfo,
    };
  },

  // Aggiorna una registrazione
  async updateRegistration({ id, data }: { id: string; data: Partial<RegistrationWithDetails> }): Promise<void> {
    const registrationRef = doc(db, REGISTRATIONS_COLLECTION, id);
    await updateDoc(registrationRef, {
      ...data,
      updatedAt: new Date(),
    });
  },

  // Elimina una registrazione
  async deleteRegistration(id: string): Promise<void> {
    const registrationRef = doc(db, REGISTRATIONS_COLLECTION, id);
    await deleteDoc(registrationRef);

    // Elimina anche i dettagli della registrazione
    const detailsQuery = query(
      collection(db, REGISTRATION_DETAILS_COLLECTION),
      where('registrationId', '==', id)
    );
    const detailsSnapshot = await getDocs(detailsQuery);
    
    for (const detailDoc of detailsSnapshot.docs) {
      await deleteDoc(detailDoc.ref);
    }
  },

  // Crea una nuova registrazione
  async createRegistration(data: {
    competitionId: string;
    athleteId: string;
    categoryId: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    paymentStatus: 'unpaid' | 'paid' | 'refunded';
    notes?: string;
  }): Promise<string> {
    const registrationsColRef = collection(db, REGISTRATIONS_COLLECTION);
    const docRef = await addDoc(registrationsColRef, {
      ...data,
      registeredAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  },

  // Ottieni statistiche delle registrazioni
  async getRegistrationsStats(competitionId?: string) {
    const constraints: QueryConstraint[] = [];
    
    if (competitionId) {
      constraints.push(where('competitionId', '==', competitionId));
    }

    const q = query(collection(db, REGISTRATIONS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      paid: 0,
      unpaid: 0,
    };

    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      stats.total++;
      
      switch (data.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'confirmed':
          stats.confirmed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }

      switch (data.paymentStatus) {
        case 'paid':
          stats.paid++;
          break;
        case 'unpaid':
          stats.unpaid++;
          break;
      }
    });

    return stats;
  },
}; 