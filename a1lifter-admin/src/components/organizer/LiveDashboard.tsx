import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Users, 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganizerDashboard, useLiveStats, useAlerts } from '@/hooks/useOrganizer';

interface LiveDashboardProps {
  competitionId: string;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({ competitionId }) => {
  const { data: dashboardData, isLoading } = useOrganizerDashboard(competitionId);
  const { data: liveStats } = useLiveStats(competitionId);
  const { data: alerts = [] } = useAlerts(competitionId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Competizione non trovata
          </p>
        </CardContent>
      </Card>
    );
  }

  const { competition, stats, timeline } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{competition.name}</h2>
        <p className="text-muted-foreground">
          {format(competition.date, 'dd MMMM yyyy', { locale: it })} • {competition.location}
        </p>
      </div>

      {/* Alert */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Statistiche Principali */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Iscrizioni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="text-green-600">✓ {stats.confirmedRegistrations}</span>
              <span className="text-yellow-600">⏳ {stats.pendingRegistrations}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atleti Completati</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAthletes}</div>
            <div className="text-xs text-muted-foreground">
              su {stats.totalRegistrations} totali
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Percentuale Successo</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveStats ? Math.round(liveStats.successRate) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              {liveStats?.validLifts || 0} su {liveStats?.totalLifts || 0} tentativi
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Punteggio Massimo</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topScore}kg</div>
            <div className="text-xs text-muted-foreground">
              Media: {Math.round(stats.averageScore)}kg
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress">Progresso</TabsTrigger>
          <TabsTrigger value="leaders">Leader</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progresso per Categoria</CardTitle>
              <CardDescription>
                Percentuale di completamento per ogni categoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.categoriesProgress.map((category) => (
                <div key={category.categoryId} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{category.categoryName}</span>
                    <span className="text-muted-foreground">
                      {category.completed}/{category.registered}
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(category.percentage)}% completato
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leader di Categoria</CardTitle>
              <CardDescription>
                Atleti in testa per ogni categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liveStats?.currentLeaders.map((leader) => (
                  <div key={leader.categoryId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{leader.athleteName}</div>
                      <div className="text-sm text-muted-foreground">
                        {leader.categoryName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{leader.totalScore}kg</div>
                      <Badge variant="outline">🥇 1° posto</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Attività</CardTitle>
              <CardDescription>
                Ultimi aggiornamenti della competizione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1">
                      {event.type === 'registration' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {event.type === 'result' && (
                        <Trophy className="h-4 w-4 text-blue-500" />
                      )}
                      {event.type === 'lift' && (
                        <Target className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.athleteName}</span>
                        <Badge variant="outline" className="text-xs">
                          {event.type === 'registration' ? 'Iscrizione' : 
                           event.type === 'result' ? 'Risultato' : 'Tentativo'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {event.description}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(event.timestamp, 'HH:mm', { locale: it })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};