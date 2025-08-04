import React, { useState } from 'react';
import { EnhancedLiveInterface } from '@/components/live/EnhancedLiveInterface';
import LiveDashboard from '@/components/live/LiveDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Settings, 
  Play, 
  Users, 
  Trophy,
  Calendar,
  MapPin,
  Clock,
  Zap,
  Plus
} from 'lucide-react';


interface ActiveCompetition {
  id: string;
  name: string;
  startDate: string;
  location: string;
  participantsCount: number;
  discipline: string;
  status: 'active' | 'scheduled';
  currentSession?: string;
}

export const LivePage: React.FC = () => {
  const [selectedCompetition, setSelectedCompetition] = useState<ActiveCompetition | null>(null);
  const [, setActiveTab] = useState('enhanced');

  // Load real active competitions from API
  const activeCompetitions: ActiveCompetition[] = [];
  
  const handleSelectCompetition = (competition: ActiveCompetition) => {
    setSelectedCompetition(competition);
    setActiveTab('enhanced');
  };

  const handleStartLive = (competition: ActiveCompetition) => {
    setSelectedCompetition(competition);
    setActiveTab('enhanced');
  };

  if (selectedCompetition) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-lg">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              Live: {selectedCompetition.name}
            </h1>
            <p className="text-muted-foreground">
              {selectedCompetition.currentSession || 'Gestione competizione in tempo reale'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              LIVE
            </Badge>
            <Button 
               variant="outline" 
               onClick={() => {
                 setSelectedCompetition(null);
               }}
            >
              Cambia Competizione
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="enhanced" className="space-y-6">
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="enhanced" className="gap-2">
              <Zap className="h-4 w-4" />
              Interfaccia Migliorata
            </TabsTrigger>
            <TabsTrigger value="classic" className="gap-2">
              <Settings className="h-4 w-4" />
              Vista Classica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enhanced">
            <EnhancedLiveInterface 
              competitionId={selectedCompetition.id}
              sessionId={selectedCompetition.id + '-session'}
              isAdmin={true}
            />
          </TabsContent>

          <TabsContent value="classic">
            <LiveDashboard 
              competitionId={selectedCompetition.id}
              sessionId={selectedCompetition.id + '-session'}
              isAdmin={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-lg">
            <Play className="h-6 w-6 text-white" />
          </div>
          Live Competition
        </h1>
        <p className="text-muted-foreground">
          Seleziona una competizione per iniziare la gestione live
        </p>
      </div>

      {/* Competizioni Attive */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Competizioni Disponibili</h2>
        
        {activeCompetitions.length > 0 ? (
          <div className="grid gap-4">
            {activeCompetitions.map((competition) => (
              <Card 
                key={competition.id} 
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                onClick={() => handleSelectCompetition(competition)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        {competition.name}
                        <Badge 
                          variant={competition.status === 'active' ? 'destructive' : 'default'}
                          className={competition.status === 'active' ? 'gap-1' : ''}
                        >
                          {competition.status === 'active' && (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          )}
                          {competition.status === 'active' ? 'LIVE' : 'Programmata'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(competition.startDate).toLocaleDateString('it-IT')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {competition.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {competition.participantsCount} atleti
                        </span>
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartLive(competition);
                      }}
                      className={competition.status === 'active' ? 'bg-red-500 hover:bg-red-600' : ''}
                    >
                      {competition.status === 'active' ? (
                        <>
                          <Monitor className="mr-2 h-4 w-4" />
                          Entra Live
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Avvia Live
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                
                {competition.currentSession && (
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Sessione corrente:</span>
                      <span className="font-medium">{competition.currentSession}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessuna Competizione Attiva</h3>
              <p className="text-muted-foreground mb-4">
                Non ci sono competizioni attive o programmate al momento
              </p>
              <Button onClick={() => window.location.href = '/competitions?action=create'}>
                <Plus className="mr-2 h-4 w-4" />
                Crea Nuova Competizione
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LivePage;