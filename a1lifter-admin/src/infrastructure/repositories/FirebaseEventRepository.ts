/**
 * Firebase Event Repository Implementation - Infrastructure layer
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Event } from '../../domain/entities/Event';
import { EventRepository, EventFilters } from '../../domain/repositories/EventRepository';

export class FirebaseEventRepository implements EventRepository {
  private readonly collectionName = 'events';

  async findById(id: string): Promise<Event | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return this.mapDocumentToEvent(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('Error finding event by ID:', error);
      throw new Error('Failed to find event');
    }
  }

  async findAll(filters?: EventFilters): Promise<Event[]> {
    try {
      let q = query(collection(db, this.collectionName));

      // Apply filters
      if (filters?.sport) {
        q = query(q, where('sport', '==', filters.sport));
      }
      if (filters?.status) {
        q = query(q, where('status.current', '==', filters.status));
      }
      if (filters?.organizer) {
        q = query(q, where('organizer', '==', filters.organizer));
      }
      if (filters?.federation) {
        q = query(q, where('settings.federation', '==', filters.federation));
      }
      if (filters?.dateFrom) {
        q = query(q, where('date', '>=', Timestamp.fromDate(filters.dateFrom)));
      }
      if (filters?.dateTo) {
        q = query(q, where('date', '<=', Timestamp.fromDate(filters.dateTo)));
      }

      // Default ordering by date
      q = query(q, orderBy('date', 'desc'));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.mapDocumentToEvent(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding events:', error);
      throw new Error('Failed to find events');
    }
  }

  async findByOrganizer(organizerId: string): Promise<Event[]> {
    return this.findAll({ organizer: organizerId });
  }

  async findUpcoming(limitCount: number = 10): Promise<Event[]> {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.collectionName),
        where('date', '>=', Timestamp.fromDate(now)),
        orderBy('date', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.mapDocumentToEvent(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding upcoming events:', error);
      throw new Error('Failed to find upcoming events');
    }
  }

  async findBySport(sport: string): Promise<Event[]> {
    return this.findAll({ sport });
  }

  async save(event: Event): Promise<Event> {
    try {
      const docRef = doc(db, this.collectionName, event.id);
      const eventData = this.mapEventToDocument(event);
      
      await setDoc(docRef, eventData, { merge: true });
      
      return event;
    } catch (error) {
      console.error('Error saving event:', error);
      throw new Error('Failed to save event');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event');
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking event existence:', error);
      return false;
    }
  }

  async count(filters?: EventFilters): Promise<number> {
    try {
      const events = await this.findAll(filters);
      return events.length;
    } catch (error) {
      console.error('Error counting events:', error);
      throw new Error('Failed to count events');
    }
  }

  async findWithPagination(
    page: number,
    limitCount: number,
    filters?: EventFilters
  ): Promise<{
    events: Event[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // For simplicity, we'll get all events and paginate in memory
      // In production, you'd want to implement proper Firestore pagination
      const allEvents = await this.findAll(filters);
      const total = allEvents.length;
      const totalPages = Math.ceil(total / limitCount);
      const startIndex = (page - 1) * limitCount;
      const endIndex = startIndex + limitCount;
      const events = allEvents.slice(startIndex, endIndex);

      return {
        events,
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('Error finding events with pagination:', error);
      throw new Error('Failed to find events with pagination');
    }
  }

  async updateStatus(id: string, status: 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled'): Promise<Event> {
    try {
      const event = await this.findById(id);
      if (!event) {
        throw new Error('Event not found');
      }

      const updatedEvent = event.updateStatus(status);
      return this.save(updatedEvent);
    } catch (error) {
      console.error('Error updating event status:', error);
      throw new Error('Failed to update event status');
    }
  }

  async incrementRegistrationCount(id: string): Promise<Event> {
    try {
      const event = await this.findById(id);
      if (!event) {
        throw new Error('Event not found');
      }

      const updatedEvent = event.incrementRegistrationCount();
      return this.save(updatedEvent);
    } catch (error) {
      console.error('Error incrementing registration count:', error);
      throw new Error('Failed to increment registration count');
    }
  }

  async decrementRegistrationCount(id: string): Promise<Event> {
    try {
      const event = await this.findById(id);
      if (!event) {
        throw new Error('Event not found');
      }

      const currentCount = event.status.registrationCount;
      if (currentCount > 0) {
        const updatedEvent = new Event(
          event.id,
          event.name,
          event.sport,
          event.date,
          event.location,
          event.organizer,
          event.settings,
          {
            ...event.status,
            registrationCount: currentCount - 1,
            updatedAt: new Date()
          },
          event.federation,
          event.description
        );
        return this.save(updatedEvent);
      }

      return event;
    } catch (error) {
      console.error('Error decrementing registration count:', error);
      throw new Error('Failed to decrement registration count');
    }
  }

  private mapDocumentToEvent(id: string, data: DocumentData): Event {
    return new Event(
      id,
      data.name,
      data.sport,
      data.date.toDate(),
      data.location,
      data.organizer,
      {
        maxAttempts: data.settings?.maxAttempts || 3,
        disciplines: data.settings?.disciplines || [],
        scoringSystem: data.settings?.scoringSystem || 'wilks',
        allowLateRegistration: data.settings?.allowLateRegistration || false,
        requireWeighIn: data.settings?.requireWeighIn || true,
        federation: data.settings?.federation,
        registrationDeadline: data.settings?.registrationDeadline?.toDate(),
        timeLimits: data.settings?.timeLimits || { attempt: 60, rest: 120, warmup: 300 }
      },
      {
        current: data.status?.current || 'draft',
        registrationCount: data.status?.registrationCount || 0,
        createdAt: data.status?.createdAt?.toDate() || new Date(),
        updatedAt: data.status?.updatedAt?.toDate() || new Date()
      }
    );
  }

  private mapEventToDocument(event: Event): DocumentData {
    return {
      name: event.name,
      sport: event.sport,
      date: Timestamp.fromDate(event.date),
      location: event.location,
      organizer: event.organizer,
      settings: {
        ...event.settings,
        registrationDeadline: event.settings.registrationDeadline 
          ? Timestamp.fromDate(event.settings.registrationDeadline)
          : null
      },
      status: {
        ...event.status,
        createdAt: Timestamp.fromDate(event.status.createdAt),
        updatedAt: Timestamp.fromDate(event.status.updatedAt)
      }
    };
  }
}