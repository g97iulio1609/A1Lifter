import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Users, 
  Play, 
  BarChart3, 
  Activity,
  ChevronRight,
  Calendar,
  MapPin,
  Award,
  Zap,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompetitions } from '@/hooks/useCompetitions';
import { useAthletes } from '@/hooks/useAthletes';

interface QuickAction {
  title: string;
  subtitle: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  action: () => void;
  color: string;
  disabled?: boolean;
  badge?: string;
}



export const AppleDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: athletes, isLoading: athletesLoading } = useAthletes();
  const [stats, setStats] = useState({
    totalAthletes: 0,
    activeCompetitions: 0,
    todayResults: 0,
    recordsBroken: 0
  });

  useEffect(() => {
    if (!competitionsLoading && !athletesLoading) {
      const activeComps = competitions?.filter((c) => c.status === 'active').length || 0;
      setStats({
        totalAthletes: athletes?.length || 0,
        activeCompetitions: activeComps,
        todayResults: Math.floor(Math.random() * 50), // Mock data
        recordsBroken: Math.floor(Math.random() * 5) // Mock data
      });
    }
  }, [competitions, athletes, competitionsLoading, athletesLoading]);

  const quickActions: QuickAction[] = [
    {
      title: 'Avvia Live',
      subtitle: 'Gestisci gara in tempo reale',
      icon: Play,
      action: () => navigate('/live'),
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      disabled: stats.activeCompetitions === 0,
      badge: 'HOT'
    },
    {
      title: 'Nuova Competizione',
      subtitle: 'Crea una nuova competizione',
      icon: Trophy,
      action: () => navigate('/competitions?action=create'),
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      title: 'Aggiungi Atleta',
      subtitle: 'Registra nuovo atleta',
      icon: Users,
      action: () => navigate('/athletes?action=create'),
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      title: 'Gestisci Pesate',
      subtitle: 'Organizza le pesate',
      icon: Activity,
      action: () => navigate('/weigh-in'),
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    }
  ];

  // Usa le competizioni reali caricate dal hook
  const activeCompetitions = competitions?.filter(comp => 
    comp.status === 'in_progress' || comp.status === 'draft'
  ).slice(0, 3) || [];

  const formatDate = (date: Date) => {
    const dateObj = date;
    return dateObj.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Ciao, {user?.name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-xl text-gray-600">
          Gestisci le tue competizioni con semplicità
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Atleti</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalAthletes}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Live</p>
                <p className="text-3xl font-bold text-green-900">{stats.activeCompetitions}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Risultati Oggi</p>
                <p className="text-3xl font-bold text-purple-900">{stats.todayResults}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Record</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.recordsBroken}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Azioni Rapide</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title}
                className={`border-0 shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => !action.disabled && action.action()}
              >
                <CardContent className="p-0">
                  <div className={`${action.color} p-6 text-white relative overflow-hidden`}>
                    {action.badge && (
                      <Badge className="absolute top-3 right-3 bg-white/20 text-white border-white/30">
                        {action.badge}
                      </Badge>
                    )}
                    <Icon className="h-8 w-8 mb-4" />
                    <h3 className="text-lg font-bold mb-1">{action.title}</h3>
                    <p className="text-white/80 text-sm">{action.subtitle}</p>
                    <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 opacity-60" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Active Competitions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900">Competizioni</h2>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/competitions')}
            className="gap-2"
          >
            Vedi Tutte
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4">
          {competitionsLoading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ) : activeCompetitions.length > 0 ? (
            activeCompetitions.map((competition) => (
              <Card 
                key={competition.id}
                className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/competitions/${competition.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {competition.name}
                        </h3>
                        <Badge 
                          variant={competition.status === 'in_progress' ? 'destructive' : 'default'}
                          className={competition.status === 'in_progress' ? 'gap-1' : ''}
                        >
                          {competition.status === 'in_progress' && (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          )}
                          {competition.status === 'in_progress' ? 'LIVE' : 'Programmata'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(competition.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {competition.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {competition.registrationsCount || 0} atleti
                        </span>
                      </div>
                    </div>
                    
                    {competition.status === 'in_progress' && (
                      <Button 
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/live');
                        }}
                      >
                        <Play className="h-4 w-4" />
                        Entra Live
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna Competizione</h3>
                <p className="text-gray-600 mb-4">Non ci sono competizioni attive al momento</p>
                <Button onClick={() => navigate('/competitions?action=create')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Crea Prima Competizione
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};