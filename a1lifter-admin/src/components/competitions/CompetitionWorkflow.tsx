import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Play, 
  Users, 
  Settings, 
  Trophy,
  Scale,
  ChevronRight,
  Calendar,
  Target,
  CheckCircle,
  Info,
  UserCheck,
  BarChart3,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Competition } from '@/types';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'current' | 'pending';
  href?: string;
  action?: () => void;
}

interface WorkflowCompetition {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  participantsCount: number;
  discipline: string;
  location: string;
  progress: number;
}

interface CompetitionWorkflowProps {
  competitions?: Competition[];
  isLoading?: boolean;
}

export const CompetitionWorkflow: React.FC<CompetitionWorkflowProps> = ({
  competitions = []
}) => {
  const navigate = useNavigate();
  const [selectedCompetition, setSelectedCompetition] = useState<WorkflowCompetition | null>(null);

  // Mock data per demo
  const mockCompetitions: WorkflowCompetition[] = [
    {
      id: '1',
      name: 'Campionato Regionale Powerlifting 2024',
      startDate: '2024-03-15',
      endDate: '2024-03-17',
      status: 'scheduled',
      participantsCount: 45,
      discipline: 'Powerlifting',
      location: 'Palestra Olimpia, Milano',
      progress: 75
    },
    {
      id: '2',
      name: 'Gara Locale Bench Press',
      startDate: '2024-02-20',
      endDate: '2024-02-20',
      status: 'active',
      participantsCount: 23,
      discipline: 'Bench Press',
      location: 'Centro Fitness Roma',
      progress: 40
    },
    {
      id: '3',
      name: 'Coppa Italia Powerlifting',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      status: 'completed',
      participantsCount: 78,
      discipline: 'Powerlifting',
      location: 'PalaFitness Torino',
      progress: 100
    }
  ];

  const displayCompetitions: WorkflowCompetition[] = competitions.length > 0 
    ? competitions.map(comp => ({
        id: comp.id,
        name: comp.name,
        startDate: comp.date.toISOString(),
        endDate: comp.date.toISOString(),
        status: comp.status === 'draft' ? 'draft' : comp.status === 'active' ? 'scheduled' : comp.status === 'in_progress' ? 'active' : 'completed',
        participantsCount: 0, // Default value
        discipline: comp.type.charAt(0).toUpperCase() + comp.type.slice(1),
        location: comp.location,
        progress: comp.status === 'completed' ? 100 : comp.status === 'in_progress' ? 50 : comp.status === 'active' ? 25 : 0
      }))
    : mockCompetitions;

  const getWorkflowSteps = (competition: WorkflowCompetition): WorkflowStep[] => {
    const baseSteps: WorkflowStep[] = [
      {
        id: 'create',
        title: 'Crea Competizione',
        description: 'Imposta nome, date e discipline',
        icon: Plus,
        status: 'completed',
        href: `/competitions/${competition.id}/edit`
      },
      {
        id: 'configure',
        title: 'Configura Dettagli',
        description: 'Categorie, regole e impostazioni',
        icon: Settings,
        status: competition.progress >= 25 ? 'completed' : 'current',
        href: `/competitions/${competition.id}/settings`
      },
      {
        id: 'athletes',
        title: 'Gestisci Atleti',
        description: 'Iscrizioni e categorie atleti',
        icon: Users,
        status: competition.progress >= 50 ? 'completed' : competition.progress >= 25 ? 'current' : 'pending',
        href: `/registrations?competition=${competition.id}`
      },
      {
        id: 'weigh-in',
        title: 'Pesate',
        description: 'Organizza le pesate pre-gara',
        icon: Scale,
        status: competition.progress >= 75 ? 'completed' : competition.progress >= 50 ? 'current' : 'pending',
        href: `/weigh-in?competition=${competition.id}`
      },
      {
        id: 'live',
        title: 'Avvia Live',
        description: 'Gestione gara in tempo reale',
        icon: Play,
        status: competition.status === 'active' ? 'current' : competition.progress >= 75 ? 'pending' : 'pending',
        href: `/live?competition=${competition.id}`
      },
      {
        id: 'results',
        title: 'Risultati',
        description: 'Visualizza e pubblica risultati',
        icon: Trophy,
        status: competition.status === 'completed' ? 'completed' : 'pending',
        href: `/results?competition=${competition.id}`
      }
    ];

    return baseSteps;
  };

  const getStatusColor = (status: WorkflowCompetition['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: WorkflowCompetition['status']) => {
    switch (status) {
      case 'draft': return 'Bozza';
      case 'scheduled': return 'Programmata';
      case 'active': return 'In corso';
      case 'completed': return 'Completata';
      default: return 'Sconosciuto';
    }
  };

  const handleStepClick = (step: WorkflowStep) => {
    if (step.href && step.status !== 'pending') {
      navigate(step.href);
    } else if (step.action) {
      step.action();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestione Competizioni</h1>
          <p className="text-muted-foreground">
            Workflow completo per la gestione delle competizioni
          </p>
        </div>
        <Button 
          onClick={() => navigate('/competitions/create')} 
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuova Competizione
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="quick-actions">Azioni Rapide</TabsTrigger>
        </TabsList>

        {/* Panoramica Competizioni */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4">
            {displayCompetitions.map((competition) => (
              <Card 
                key={competition.id} 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  selectedCompetition?.id === competition.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedCompetition(competition)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {competition.name}
                        <Badge className={getStatusColor(competition.status)}>
                          {getStatusText(competition.status)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(competition.startDate).toLocaleDateString('it-IT')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {competition.participantsCount} atleti
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {competition.discipline}
                        </span>
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso completamento</span>
                      <span className="font-medium">{competition.progress}%</span>
                    </div>
                    <Progress value={competition.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Workflow Dettagliato */}
        <TabsContent value="workflow" className="space-y-6">
          {selectedCompetition ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    {selectedCompetition.name}
                  </CardTitle>
                  <CardDescription>
                    Workflow di gestione per questa competizione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getWorkflowSteps(selectedCompetition).map((step, index) => {
                      const Icon = step.icon;
                      const isLast = index === getWorkflowSteps(selectedCompetition).length - 1;
                      
                      return (
                        <div key={step.id} className="relative">
                          <div 
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
                              step.status === 'completed' && "border-green-200 bg-green-50",
                              step.status === 'current' && "border-blue-200 bg-blue-50",
                              step.status === 'pending' && "border-gray-200 bg-gray-50",
                              step.status !== 'pending' && "cursor-pointer hover:shadow-md"
                            )}
                            onClick={() => handleStepClick(step)}
                          >
                            <div className={cn(
                              "flex items-center justify-center w-12 h-12 rounded-full",
                              step.status === 'completed' && "bg-green-500 text-white",
                              step.status === 'current' && "bg-blue-500 text-white",
                              step.status === 'pending' && "bg-gray-300 text-gray-600"
                            )}>
                              {step.status === 'completed' ? (
                                <CheckCircle className="h-6 w-6" />
                              ) : (
                                <Icon className="h-6 w-6" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold">{step.title}</h3>
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {step.status === 'completed' && (
                                <Badge variant="default" className="bg-green-500">
                                  Completato
                                </Badge>
                              )}
                              {step.status === 'current' && (
                                <Badge variant="default" className="bg-blue-500">
                                  In corso
                                </Badge>
                              )}
                              {step.status === 'pending' && (
                                <Badge variant="outline">
                                  In attesa
                                </Badge>
                              )}
                              {step.status !== 'pending' && (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          
                          {!isLast && (
                            <div className={cn(
                              "absolute left-6 top-16 w-0.5 h-4",
                              step.status === 'completed' ? "bg-green-300" : "bg-gray-300"
                            )} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Seleziona una Competizione</h3>
                <p className="text-muted-foreground">
                  Scegli una competizione dalla tab "Panoramica" per visualizzare il workflow dettagliato
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Azioni Rapide */}
        <TabsContent value="quick-actions" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/competitions?action=create')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-blue-500 text-white">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Nuova Competizione</h3>
                    <p className="text-sm text-muted-foreground">Crea una nuova competizione</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/athletes?action=import')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-green-500 text-white">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Importa Atleti</h3>
                    <p className="text-sm text-muted-foreground">Carica atleti da CSV</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/live')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-red-500 text-white">
                    <Play className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Avvia Live</h3>
                    <p className="text-sm text-muted-foreground">Inizia una sessione live</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/weigh-in')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-purple-500 text-white">
                    <Scale className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Gestisci Pesate</h3>
                    <p className="text-sm text-muted-foreground">Organizza le pesate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/results')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-yellow-500 text-white">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Visualizza Risultati</h3>
                    <p className="text-sm text-muted-foreground">Consulta i risultati</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/records')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-orange-500 text-white">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Gestisci Record</h3>
                    <p className="text-sm text-muted-foreground">Aggiorna i record</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};