import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CompetitionForm } from '@/components/competitions/CompetitionForm';
import { useCompetition, useUpdateCompetition, useDeleteCompetition } from '@/hooks/useCompetitions';
import { toast } from 'sonner';

const EditCompetitionPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: competition, isLoading: isLoadingCompetition } = useCompetition(id!);
  const updateMutation = useUpdateCompetition();
  const deleteMutation = useDeleteCompetition();

  const handleUpdateCompetition = async (data: any) => {
    if (!id) return;
    
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          ...data,
          date: new Date(data.date),
        },
      });
      toast.success('Competizione aggiornata con successo');
      navigate('/competitions');
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento della competizione');
    }
  };

  const handleDeleteCompetition = async () => {
    if (!id) return;
    
    if (window.confirm('Sei sicuro di voler eliminare questa competizione? Questa azione non può essere annullata.')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Competizione eliminata con successo');
        navigate('/competitions');
      } catch (error) {
        toast.error('Errore durante l\'eliminazione della competizione');
      }
    }
  };

  const handleCancel = () => {
    navigate('/competitions');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Bozza</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Attiva</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-800">In corso</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-800">Completata</Badge>;
      default:
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };

  if (isLoadingCompetition) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Competizione non trovata</h2>
          <p className="text-muted-foreground mb-4">La competizione richiesta non esiste o è stata eliminata.</p>
          <Button onClick={() => navigate('/competitions')}>Torna alle competizioni</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/competitions')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Torna alle competizioni
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">Modifica Competizione</h1>
                  {getStatusBadge(competition.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {competition.name} • {new Date(competition.date).toLocaleDateString('it-IT')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                Anteprima
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-2"
                onClick={handleDeleteCompetition}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                {deleteMutation.isPending ? 'Eliminazione...' : 'Elimina'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Form principale - 3 colonne su XL */}
          <div className="xl:col-span-3">
            <Card className="shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Modifica Configurazione
                </CardTitle>
                <CardDescription>
                  Aggiorna i dettagli della competizione. Le modifiche vengono salvate automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompetitionForm
                  competition={competition}
                  onSubmit={handleUpdateCompetition}
                  onCancel={handleCancel}
                  isLoading={updateMutation.isPending}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar informazioni - 1 colonna su XL */}
          <div className="hidden xl:block">
            <div className="sticky top-8 space-y-6">
              {/* Informazioni competizione */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informazioni</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Stato</p>
                      <div className="mt-1">
                        {getStatusBadge(competition.status)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Data creazione</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(competition.createdAt || '').toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Ultima modifica</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(competition.updatedAt || '').toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Tipo</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {competition.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Luogo</p>
                      <p className="text-sm text-muted-foreground">
                        {competition.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Azioni rapide */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Azioni Rapide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate(`/registrations?competitionId=${competition.id}`)}
                  >
                    👥 Gestisci Iscrizioni
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate(`/weigh-in?competitionId=${competition.id}`)}
                  >
                    ⚖️ Pesate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate(`/live?competitionId=${competition.id}`)}
                  >
                    🔴 Live
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate(`/results?competitionId=${competition.id}`)}
                  >
                    🏆 Risultati
                  </Button>
                </CardContent>
              </Card>

              {/* Avvisi */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Avvisi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <p className="text-muted-foreground">
                      ⚠️ <strong>Attenzione:</strong> Le modifiche a competizioni attive potrebbero influenzare i risultati.
                    </p>
                    <p className="text-muted-foreground">
                      💾 <strong>Salvataggio:</strong> Le modifiche vengono salvate automaticamente.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCompetitionPage;