import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Activity, 
  TrendingUp, 
  Plus, 
  Play, 
  Settings, 
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  Target,
  Award,
  MapPin,
  Eye,
  Edit,
  Loader2
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  color: string;
  badge?: string;
}

export const EnhancedAdminDashboard: React.FC = () => {
  const { stats, activeCompetitions, recentActivities, loading, error, refetch } = useDashboardStats();

  const quickActions: QuickAction[] = [
    {
      title: 'Nuova Competizione',
      description: 'Crea e configura una nuova gara',
      icon: Plus,
      href: '/competitions?action=create',
      color: 'bg-blue-500 hover:bg-blue-600',
      badge: 'Popolare'
    },
    {
      title: 'Gestione Live',
      description: 'Monitora le gare in corso',
      icon: Play,
      href: '/live',
      color: 'bg-red-500 hover:bg-red-600',
      badge: '3 Live'
    },
    {
      title: 'Iscrizioni',
      description: 'Gestisci atleti e pagamenti',
      icon: Users,
      href: '/registrations',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Pesate',
      description: 'Registra pesi ufficiali',
      icon: Target,
      href: '/weigh-in',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Risultati',
      description: 'Visualizza e esporta dati',
      icon: BarChart3,
      href: '/results',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Impostazioni',
      description: 'Configura sistema e utenti',
      icon: Settings,
      href: '/settings',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  // Generate quick stats from real data
  const quickStats = stats ? [
    {
      title: 'Competizioni Attive',
      value: stats.activeCompetitions,
      change: stats.activeCompetitions > 0 ? `${stats.activeCompetitions} in programma` : 'Nessuna attiva',
      trend: 'stable' as const,
      icon: Trophy,
      color: 'text-blue-600'
    },
    {
      title: 'Atleti Registrati',
      value: stats.totalAthletes.toLocaleString(),
      change: stats.recentRegistrations > 0 ? `+${stats.recentRegistrations} questo mese` : 'Nessun nuovo atleta',
      trend: stats.recentRegistrations > 0 ? 'up' as const : 'stable' as const,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Gare Live',
      value: stats.liveCompetitions,
      change: stats.liveCompetitions > 0 ? 'In corso ora' : 'Nessuna live',
      trend: 'stable' as const,
      icon: Activity,
      color: 'text-red-600'
    },
    {
      title: 'Incassi Mensili',
      value: `€${stats.monthlyRevenue.toLocaleString()}`,
      change: 'Stimato da iscrizioni',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Caricamento dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={refetch}>Riprova</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'live': return 'LIVE';
      case 'upcoming': return 'Prossima';
      case 'completed': return 'Completata';
      default: return status;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration': return Users;
      case 'competition': return Trophy;
      case 'result': return Award;
      case 'system': return Settings;
      default: return Activity;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    return `${Math.floor(diffHours / 24)}g fa`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Amministratore</h1>
          <p className="text-gray-600 mt-1">Panoramica completa del sistema A1Lifter</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link to="/live">
            <Button className="bg-red-500 hover:bg-red-600">
              <Activity className="h-4 w-4 mr-2" />
              Gare Live
              {stats && stats.liveCompetitions > 0 && (
                <Badge className="ml-2 bg-white text-red-500">
                  {stats.liveCompetitions}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    {stat.change && (
                      <p className={`text-sm ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {stat.change}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Azioni Rapide
          </CardTitle>
          <CardDescription>
            Accesso diretto alle funzioni più utilizzate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link key={index} to={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${action.color} text-white`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{action.title}</h3>
                            {action.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {action.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Active Competitions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Competizioni Attive
              </div>
              <Link to="/competitions">
                <Button variant="outline" size="sm">
                  Vedi Tutte
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCompetitions.map((comp) => (
              <div key={comp.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{comp.name}</h4>
                      <Badge className={getStatusColor(comp.status)}>
                        {getStatusLabel(comp.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {comp.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {comp.participants} atleti
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {comp.date.toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {comp.progress && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso gara</span>
                      <span>{comp.progress}%</span>
                    </div>
                    <Progress value={comp.progress} className="h-2" />
                  </div>
                )}
                
                <div className="flex space-x-2">
                  {comp.status === 'in_progress' && (
                    <Link to={`/live?competition=${comp.id}`}>
                      <Button size="sm" className="bg-red-500 hover:bg-red-600">
                        <Play className="h-4 w-4 mr-1" />
                        Gestisci Live
                      </Button>
                    </Link>
                  )}
                  <Link to={`/competitions/${comp.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Dettagli
                    </Button>
                  </Link>
                  <Link to={`/competitions/${comp.id}/edit`}>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Modifica
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Attività Recenti
            </CardTitle>
            <CardDescription>
              Ultime azioni nel sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const IconComponent = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.user}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(activity.time)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link to="/notifications">
                <Button variant="outline" className="w-full">
                  Vedi Tutte le Notifiche
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Stato Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Database</p>
                <p className="text-sm text-gray-600">Operativo</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Server Live</p>
                <p className="text-sm text-gray-600">3 connessioni attive</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium text-gray-900">Backup</p>
                <p className="text-sm text-gray-600">Ultimo: 2h fa</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};