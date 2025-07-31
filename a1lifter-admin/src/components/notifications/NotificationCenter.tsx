import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle, Clock, Filter, Search, Trash2 } from 'lucide-react';
import { notificationService } from '@/services/notifications';
import type { SystemNotification } from '@/types';
import { toast } from 'sonner';

interface NotificationCenterProps {
  userId?: string;
  competitionId?: string;
}

interface NotificationItemProps {
  notification: SystemNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'record':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed_attempt':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'technical_issue':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'discipline_change':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${getPriorityColor(notification.priority)} p-6 ${!notification.isRead ? 'bg-blue-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getTypeIcon(notification.type)}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h3>
              {!notification.isRead && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Nuovo
                </span>
              )}
            </div>
            <p className="mt-1 text-gray-600">{notification.message}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span>Priorità: {notification.priority === 'high' ? 'Alta' : notification.priority === 'medium' ? 'Media' : 'Bassa'}</span>
              <span>•</span>
              <span>{new Date(notification.createdAt).toLocaleString()}</span>
              {notification.competitionId && (
                <>
                  <span>•</span>
                  <span>Competizione: {notification.competitionId}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Segna come letta"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(notification.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Elimina notifica"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, competitionId }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    byType: {} as Record<string, number>
  });

  useEffect(() => {
    loadNotifications();
  }, [userId, competitionId]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      let notificationData: SystemNotification[];
      
      if (competitionId) {
        notificationData = await notificationService.getNotificationsForCompetition(competitionId);
      } else if (userId) {
        notificationData = await notificationService.getNotificationsForUser(userId);
      } else {
        // Carica tutte le notifiche per admin
        notificationData = await notificationService.getNotificationsForUser('admin');
      }
      
      setNotifications(notificationData);
      updateStats(notificationData);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Errore durante il caricamento delle notifiche');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStats = (notificationData: SystemNotification[]) => {
    const stats = {
      total: notificationData.length,
      unread: notificationData.filter(n => !n.isRead).length,
      byType: notificationData.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    setStats(stats);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      toast.success('Notifica segnata come letta');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Errore durante la marcatura della notifica');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (!userId) return;
      
      const unreadNotifications = notifications.filter(n => !n.isRead);
      for (const notification of unreadNotifications) {
        await notificationService.markAsRead(notification.id);
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('Tutte le notifiche sono state segnate come lette');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Errore durante la marcatura delle notifiche');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notifica eliminata');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Errore durante l\'eliminazione della notifica');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare tutte le notifiche?')) {
      return;
    }
    
    try {
      for (const notification of notifications) {
        await notificationService.deleteNotification(notification.id);
      }
      
      setNotifications([]);
      toast.success('Tutte le notifiche sono state eliminate');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast.error('Errore durante l\'eliminazione delle notifiche');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'read' && !notification.isRead) return false;
    
    // Filter by type
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const notificationTypes = [
    { value: 'all', label: 'Tutti i tipi' },
    { value: 'record', label: 'Record' },
    { value: 'failed_attempt', label: 'Tentativi Falliti' },
    { value: 'technical_issue', label: 'Problemi Tecnici' },
    { value: 'discipline_change', label: 'Cambi Disciplina' },
    { value: 'info', label: 'Informazioni' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Centro Notifiche</h2>
          <p className="text-gray-600">
            {stats.total} notifiche totali, {stats.unread} non lette
          </p>
        </div>
        
        <div className="flex gap-3">
          {stats.unread > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4" />
              Segna tutte come lette
            </button>
          )}
          
          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Elimina tutte
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Bell className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Totale</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{stats.unread}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Non lette</p>
              <p className="text-xl font-semibold text-gray-900">{stats.unread}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Record</p>
              <p className="text-xl font-semibold text-gray-900">{stats.byType.record || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="h-6 w-6 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Falliti</p>
              <p className="text-xl font-semibold text-gray-900">{stats.byType.failed_attempt || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Problemi</p>
              <p className="text-xl font-semibold text-gray-900">{stats.byType.technical_issue || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca nelle notifiche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutte</option>
              <option value="unread">Non lette</option>
              <option value="read">Lette</option>
            </select>
          </div>
          
          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {notificationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery || filter !== 'all' || typeFilter !== 'all' 
                ? 'Nessuna notifica trovata' 
                : 'Nessuna notifica'
              }
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filter !== 'all' || typeFilter !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Le notifiche appariranno qui quando disponibili'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;