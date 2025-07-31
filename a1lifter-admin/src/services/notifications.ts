import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { SystemNotification } from '@/types';

export class NotificationService {
  private collection = collection(db, 'notifications');
  private listeners: Map<string, Unsubscribe> = new Map();

  // Crea una nuova notifica
  async createNotification(
    notificationData: Omit<SystemNotification, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(this.collection, {
        ...notificationData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Errore durante la creazione della notifica');
    }
  }

  // Ottieni notifiche per utente
  async getNotificationsForUser(
    userId: string, 
    limitCount: number = 50
  ): Promise<SystemNotification[]> {
    try {
      const q = query(
        this.collection,
        where('userId', 'in', [userId, null]), // include notifiche globali
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemNotification[];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw new Error('Errore durante il recupero delle notifiche');
    }
  }

  // Ottieni notifiche non lette
  async getUnreadNotifications(userId: string): Promise<SystemNotification[]> {
    try {
      const q = query(
        this.collection,
        where('userId', 'in', [userId, null]),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemNotification[];
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw new Error('Errore durante il recupero delle notifiche non lette');
    }
  }

  // Ottieni notifiche per competizione
  async getNotificationsForCompetition(
    competitionId: string,
    limitCount: number = 20
  ): Promise<SystemNotification[]> {
    try {
      const q = query(
        this.collection,
        where('competitionId', '==', competitionId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemNotification[];
    } catch (error) {
      console.error('Error fetching competition notifications:', error);
      throw new Error('Errore durante il recupero delle notifiche della competizione');
    }
  }

  // Marca notifica come letta
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(this.collection, notificationId);
      await updateDoc(docRef, {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Errore durante la marcatura della notifica come letta');
    }
  }

  // Marca tutte le notifiche come lette per un utente
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const unreadNotifications = await this.getUnreadNotifications(userId);
      
      const batch = [];
      for (const notification of unreadNotifications) {
        if (notification.userId === userId || notification.userId === null) {
          batch.push(this.markAsRead(notification.id));
        }
      }
      
      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Errore durante la marcatura di tutte le notifiche come lette');
    }
  }

  // Elimina notifica
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const docRef = doc(this.collection, notificationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Errore durante l\'eliminazione della notifica');
    }
  }

  // Crea notifica di sistema
  async createSystemNotification(
    type: 'info' | 'warning' | 'error' | 'success',
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    competitionId?: string,
    userId?: string
  ): Promise<string> {
    return this.createNotification({
      userId,
      competitionId,
      type,
      title,
      message,
      isRead: false,
      priority
    });
  }

  // Crea notifica per record stabilito
  async createRecordNotification(
    athleteName: string,
    discipline: string,
    weight: number,
    recordType: string,
    competitionId: string
  ): Promise<string> {
    return this.createSystemNotification(
      'success',
      'Nuovo Record Stabilito!',
      `${athleteName} ha stabilito un nuovo record ${recordType} in ${discipline} con ${weight}kg`,
      'high',
      competitionId
    );
  }

  // Crea notifica per tentativo fallito
  async createFailedAttemptNotification(
    athleteName: string,
    discipline: string,
    attemptNumber: number,
    competitionId: string
  ): Promise<string> {
    return this.createSystemNotification(
      'warning',
      'Tentativo Fallito',
      `${athleteName} ha fallito il ${attemptNumber}° tentativo in ${discipline}`,
      'medium',
      competitionId
    );
  }

  // Crea notifica per problema tecnico
  async createTechnicalIssueNotification(
    issue: string,
    competitionId?: string,
    userId?: string
  ): Promise<string> {
    return this.createSystemNotification(
      'error',
      'Problema Tecnico',
      issue,
      'high',
      competitionId,
      userId
    );
  }

  // Crea notifica per cambio disciplina
  async createDisciplineChangeNotification(
    fromDiscipline: string,
    toDiscipline: string,
    competitionId: string
  ): Promise<string> {
    return this.createSystemNotification(
      'info',
      'Cambio Disciplina',
      `Passaggio da ${fromDiscipline} a ${toDiscipline}`,
      'medium',
      competitionId
    );
  }

  // Ascolta notifiche in tempo reale per utente
  subscribeToUserNotifications(
    userId: string,
    callback: (notifications: SystemNotification[]) => void
  ): Unsubscribe {
    const q = query(
      this.collection,
      where('userId', 'in', [userId, null]),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemNotification[];
      
      callback(notifications);
    }, (error) => {
      console.error('Error in notifications subscription:', error);
      callback([]);
    });

    this.listeners.set(`user_${userId}`, unsubscribe);
    return unsubscribe;
  }

  // Ascolta notifiche competizione in tempo reale
  subscribeToCompetitionNotifications(
    competitionId: string,
    callback: (notifications: SystemNotification[]) => void
  ): Unsubscribe {
    const q = query(
      this.collection,
      where('competitionId', '==', competitionId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemNotification[];
      
      callback(notifications);
    }, (error) => {
      console.error('Error in competition notifications subscription:', error);
      callback([]);
    });

    this.listeners.set(`competition_${competitionId}`, unsubscribe);
    return unsubscribe;
  }

  // Rimuovi listener
  unsubscribe(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  // Pulisci notifiche scadute
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        this.collection,
        where('expiresAt', '<=', now)
      );
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw new Error('Errore durante la pulizia delle notifiche scadute');
    }
  }

  // Ottieni conteggio notifiche non lette
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const unreadNotifications = await this.getUnreadNotifications(userId);
      return unreadNotifications.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Pulisci tutti i listener
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

export const notificationService = new NotificationService();