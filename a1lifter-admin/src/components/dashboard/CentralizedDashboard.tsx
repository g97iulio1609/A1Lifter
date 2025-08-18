import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { 
  Trophy, 
  Users, 
  Play, 
  Plus, 
  Calendar, 
  BarChart3, 
  Clock,
  Award,
  TrendingUp,
  Activity,
  Eye,
  Settings,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { JudgeModeActivator } from '@/components/judge/JudgeModeActivator';
import { useCompetitions } from '@/hooks/useCompetitions';
import { useAthletes } from '@/hooks/useAthletes';


interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  color: string;
  disabled?: boolean;
}

interface DashboardStats {
  totalAthletes: number;
  activeCompetitions: number;
  todayResults: number;
  recordsBroken: number;
}

export const CentralizedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: athletes, isLoading: athletesLoading } = useAthletes();
  const [stats, setStats] = useState<DashboardStats>({
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
        todayResults: 0, // TODO: Implementare conteggio risultati giornalieri
        recordsBroken: 0 // TODO: Implementare conteggio record
      });
    }
  }, [competitions, athletes, competitionsLoading, athletesLoading]);

  const quickActions: QuickAction[] = [
    {
      title: 'Nuova Competizione',
      description: 'Crea una nuova competizione',
      icon: Trophy,
      href: '/competitions?action=create',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Aggiungi Atleta',
      description: 'Registra un nuovo atleta',
      icon: Users,
      href: '/athletes?action=create',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Avvia Live',
      description: 'Inizia una sessione live',
      icon: Play,
      href: '/live',
      color: 'bg-red-500 hover:bg-red-600',
      disabled: stats.activeCompetitions === 0
    },
    {
      title: 'Gestisci Pesate',
      description: 'Organizza le pesate',
      icon: Activity,
      href: '/weigh-in',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const recentCompetitions = competitions?.slice(0, 3) || [];
  const upcomingCompetitions = competitions?.filter((c) => 
    c.date > new Date() && c.status !== 'completed'
  ).slice(0, 3) || [];

  const handleQuickAction = (href: string) => {
    navigate(href);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Benvenuto, {user?.name || user?.email}. Gestisci le tue competizioni da qui.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/settings')} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Impostazioni
        </Button>
      </div>

      {/* Judge Mode Widget */}
      {user?.role === 'judge' && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Eye className="mr-2 h-5 w-5" />
              Modalità Giudice
            </CardTitle>
            <CardDescription className="text-blue-600">
              Attiva la modalità giudice per partecipare a una competizione in corso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JudgeModeActivator onJudgeModeEnabled={() => {}} />
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Azioni Rapide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
                onClick={() => !action.disabled && handleQuickAction(action.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${action.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Statistiche
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atleti Totali</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAthletes}</div>
              <p className="text-xs text-muted-foreground">Atleti registrati</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Competizioni Attive</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCompetitions}</div>
              <p className="text-xs text-muted-foreground">In corso ora</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risultati Oggi</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayResults}</div>
              <p className="text-xs text-muted-foreground">Risultati inseriti</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Record Battuti</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recordsBroken}</div>
              <p className="text-xs text-muted-foreground">Questo mese</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent and Upcoming Competitions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Competitions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Competizioni Recenti
              </CardTitle>
              <CardDescription>Le ultime competizioni</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/competitions')}
            >
              Vedi tutte
            </Button>
          </CardHeader>
          <CardContent>
            {recentCompetitions.length > 0 ? (
              <div className="space-y-3">
    {recentCompetitions.map((competition) => (
                  <div 
                    key={competition.id} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/competitions/${competition.id}`)}
                  >
                    <div>
                      <p className="font-medium">{competition.name}</p>
                      <p className="text-sm text-muted-foreground">
      {new Date(competition.date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <Badge variant={competition.status === 'active' ? 'default' : 'secondary'}>
                      {competition.status === 'active' ? 'Attiva' : 'Completata'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nessuna competizione recente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Competitions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                Prossime Competizioni
              </CardTitle>
              <CardDescription>Competizioni programmate</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/competitions?filter=upcoming')}
            >
              Pianifica
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingCompetitions.length > 0 ? (
              <div className="space-y-3">
        {upcomingCompetitions.map((competition) => {
                  const daysUntil = Math.ceil(
          (new Date(competition.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div 
                      key={competition.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate(`/competitions/${competition.id}`)}
                    >
                      <div>
                        <p className="font-medium">{competition.name}</p>
                        <p className="text-sm text-muted-foreground">
              {new Date(competition.date).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {daysUntil === 0 ? 'Oggi' : daysUntil === 1 ? 'Domani' : `${daysUntil} giorni`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Nessuna competizione programmata
                </p>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/competitions?action=create')}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crea Competizione
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};