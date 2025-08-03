import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OptimizedLiveInterface } from '@/components/live/OptimizedLiveInterface';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Play, 
  Users, 
  Trophy,
  Calendar,
  MapPin,
  ExternalLink,
  Maximize
} from 'lucide-react';

interface ActiveCompetition {
  id: string;
  name: string;
  startDate: string;
  date: string;
  location: string;
  participantsCount: number;
  discipline: string;
  status: 'active' | 'paused' | 'completed';
  currentSession?: string;
}

interface OptimizedLivePageProps {
  isPublicView?: boolean;
}

export const OptimizedLivePage: React.FC<OptimizedLivePageProps> = ({ isPublicView = false }) => {
  const [searchParams] = useSearchParams();
  const [selectedCompetition, setSelectedCompetition] = useState<ActiveCompetition | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Controlla i parametri URL per modalità speciali
  const urlPublicView = searchParams.get('public') === 'true';
  const isJudgeMode = searchParams.get('judge') === 'true';
  const finalIsPublicView = isPublicView || urlPublicView;
  
  // Mock data per demo
  const activeCompetitions: ActiveCompetition[] = [
    {
      id: '1',
      name: 'Campionato Regionale Powerlifting 2024',
      startDate: '2024-03-15',
      date: '15 Marzo 2024',
      location: 'Palestra Olimpia, Milano',
      participantsCount: 45,
      discipline: 'Powerlifting',
      status: 'active',
      currentSession: 'Sessione Mattina - Categoria Open'
    },
    {
      id: '2',
      name: 'Gara Locale Bench Press',
      startDate: '2024-02-20',
      date: '20 Febbraio 2024',
      location: 'Centro Fitness Roma',
      participantsCount: 23,
      discipline: 'Bench Press',
      status: 'paused'
    }
  ];

  // Auto-seleziona la prima competizione attiva se disponibile
  useEffect(() => {
    if (!selectedCompetition && activeCompetitions.length > 0) {
      const activeComp = activeCompetitions.find(c => c.status === 'active');
      if (activeComp) {
        setSelectedCompetition(activeComp);
      }
    }
  }, [activeCompetitions, selectedCompetition]);

  // Vista pubblica per monitor esterni
  if (finalIsPublicView) {
    return (
      <OptimizedLiveInterface
        competition={selectedCompetition}
        isFullscreen={true}
        isJudgeMode={false}
        isPublicView={true}
        onExitFullscreen={() => window.close()}
      />
    );
  }

  if (isFullscreen || isJudgeMode) {
    return (
      <div className="fixed inset-0 bg-white z-50">
        <OptimizedLiveInterface
          competition={selectedCompetition}
          isFullscreen={true}
          isJudgeMode={isJudgeMode}
          isPublicView={false}
          onExitFullscreen={() => {
            setIsFullscreen(false);
          }}
        />
      </div>
    );
  }

  // Se è selezionata una competizione, mostra l'interfaccia live
  if (selectedCompetition) {
    return (
      <div className="space-y-6">
        {!isFullscreen && (
          <div className="bg-white border-b border-gray-200 -mx-8 px-8 py-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-lg">
                  <Monitor className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {selectedCompetition.name}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {selectedCompetition.currentSession || 'Gestione competizione in tempo reale'}
                  </p>
                </div>
                <Badge variant="destructive" className="gap-1 ml-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedCompetition(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Indietro
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  className="gap-2"
                >
                  <Maximize className="h-4 w-4" />
                  Fullscreen
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/public/live/${selectedCompetition?.id}`, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Vista Pubblica
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <OptimizedLiveInterface 
          competition={selectedCompetition}
          isFullscreen={isFullscreen}
          isJudgeMode={isJudgeMode}
          isPublicView={false}
          onExitFullscreen={() => setIsFullscreen(false)}
        />
      </div>
    );
  }

  // Selezione competizione
  return (
    <div className="space-y-6">
      {/* Header semplificato */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center w-12 h-12 bg-red-500 rounded-xl mx-auto">
          <Play className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gestione Live
        </h1>
        <p className="text-gray-600">
          Seleziona una competizione per iniziare
        </p>
      </div>

      {/* Competizioni Disponibili */}
      <div className="max-w-3xl mx-auto space-y-4">
        {activeCompetitions.length > 0 ? (
          <div className="space-y-3">
            {activeCompetitions.map((competition) => (
              <Card 
                key={competition.id} 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 group"
                onClick={() => setSelectedCompetition(competition)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {competition.name}
                        </h3>
                        <Badge 
                          variant={competition.status === 'active' ? 'destructive' : 'secondary'}
                          className={competition.status === 'active' ? 'gap-1' : ''}
                        >
                          {competition.status === 'active' && (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          )}
                          {competition.status === 'active' ? 'LIVE' : 'In Pausa'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
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
                      </div>
                      {competition.currentSession && (
                        <div className="mt-3 text-sm text-blue-600 font-medium">
                          {competition.currentSession}
                        </div>
                      )}
                    </div>
                    <Button 
                      size="lg"
                      className={`gap-2 ml-4 ${
                        competition.status === 'active' 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCompetition(competition);
                      }}
                    >
                      <Monitor className="h-5 w-5" />
                      {competition.status === 'active' ? 'Entra Live' : 'Avvia'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="text-center py-8">
              <Trophy className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nessuna competizione disponibile
              </h3>
              <p className="text-gray-500 mb-4">
                Crea una nuova competizione per iniziare
              </p>
              <Button 
                onClick={() => window.location.href = '/competitions?action=create'}
                className="gap-2"
              >
                <Trophy className="h-4 w-4" />
                Crea Competizione
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};