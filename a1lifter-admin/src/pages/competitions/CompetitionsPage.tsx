import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Trophy, Calendar, Users, Target, List, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetitionWorkflow } from '@/components/competitions/CompetitionWorkflow';
import { CompetitionsTable } from '@/components/competitions/CompetitionsTable';
import { CompetitionForm } from '@/components/competitions/CompetitionForm';
import { 
  useCompetitions, 
  useCreateCompetition, 
  useUpdateCompetition, 
  useDeleteCompetition,
  useDuplicateCompetition,
  useCompetitionsStats
} from '@/hooks/useCompetitions';
import type { CompetitionWithStats } from '@/types';
import { toast } from 'sonner';

export const CompetitionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'draft' | 'active' | 'completed' | undefined>();
  const [typeFilter, setTypeFilter] = useState<'powerlifting' | 'strongman' | undefined>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionWithStats | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [competitionToDuplicate, setCompetitionToDuplicate] = useState<CompetitionWithStats | null>(null);
  const [activeTab, setActiveTab] = useState('workflow');

  const filters = {
    status: statusFilter,
    type: typeFilter,
  };

  const { data: competitions = [], isLoading, error } = useCompetitions(filters);
  const { data: stats } = useCompetitionsStats();
  const createMutation = useCreateCompetition();
  const updateMutation = useUpdateCompetition();
  const deleteMutation = useDeleteCompetition();
  const duplicateMutation = useDuplicateCompetition();

  useEffect(() => {
    // Controlla se c'è un'azione nei parametri URL
    const action = searchParams.get('action');
    if (action === 'create') {
      setIsCreateDialogOpen(true);
      // Rimuovi il parametro dall'URL
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Filtro client-side per la ricerca
  const filteredCompetitions = competitions.filter(competition =>
    !searchTerm || 
    competition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    competition.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCompetition = async (data: any) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        date: new Date(data.date),
      });
      toast.success('Competizione creata con successo');
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('Errore durante la creazione della competizione');
    }
  };

  const handleUpdateCompetition = async (data: any) => {
    if (!selectedCompetition) return;
    
    try {
      await updateMutation.mutateAsync({
        id: selectedCompetition.id,
        data: {
          ...data,
          date: new Date(data.date),
        },
      });
      toast.success('Competizione aggiornata con successo');
      setIsEditDialogOpen(false);
      setSelectedCompetition(null);
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento della competizione');
    }
  };

  const handleDeleteCompetition = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Competizione eliminata con successo');
    } catch (error) {
      toast.error('Errore durante l\'eliminazione della competizione');
    }
  };

  const handleEditCompetition = (competition: CompetitionWithStats) => {
    setSelectedCompetition(competition);
    setIsEditDialogOpen(true);
  };

  const handleDuplicateCompetition = (competition: CompetitionWithStats) => {
    setCompetitionToDuplicate(competition);
    setIsDuplicateDialogOpen(true);
  };

  const handleConfirmDuplicate = async () => {
    if (!competitionToDuplicate) return;
    
    try {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 30); // 30 giorni da oggi
      
      await duplicateMutation.mutateAsync({
        id: competitionToDuplicate.id,
        newDate,
        newName: `${competitionToDuplicate.name} (Copia)`,
      });
      
      toast.success('Competizione duplicata con successo');
      setIsDuplicateDialogOpen(false);
      setCompetitionToDuplicate(null);
    } catch (error) {
      toast.error('Errore durante la duplicazione della competizione');
    }
  };

  const handleViewRegistrations = (competition: CompetitionWithStats) => {
    navigate(`/registrations?competitionId=${competition.id}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setTypeFilter(undefined);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-destructive">Errore nel caricamento delle competizioni</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Ricarica pagina
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="workflow" className="gap-2">
              <Workflow className="h-4 w-4" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <List className="h-4 w-4" />
              Tabella
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuova Competizione
          </Button>
        </div>

        <TabsContent value="workflow">
          <CompetitionWorkflow 
            competitions={competitions || []} 
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="table">
          {/* Statistiche */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totale Competizioni</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attive</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.active || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prossime</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.upcoming || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totale Iscritti</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalRegistrations || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtri */}
          <Card>
            <CardHeader>
              <CardTitle>Filtri</CardTitle>
              <CardDescription>Filtra le competizioni per trovare quella che cerchi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca per nome o luogo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={(value: 'draft' | 'active' | 'completed') => setStatusFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bozza</SelectItem>
                    <SelectItem value="active">Attiva</SelectItem>
                    <SelectItem value="completed">Completata</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={(value: 'powerlifting' | 'strongman') => setTypeFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="powerlifting">Powerlifting</SelectItem>
                    <SelectItem value="strongman">Strongman</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={clearFilters}>
                  Pulisci filtri
                </Button>
              </div>
              {(searchTerm || statusFilter || typeFilter) && (
                <div className="flex gap-2">
                  {searchTerm && (
                    <Badge variant="secondary">
                      Ricerca: {searchTerm}
                    </Badge>
                  )}
                  {statusFilter && (
                    <Badge variant="secondary">
                      Stato: {statusFilter === 'draft' ? 'Bozza' : statusFilter === 'active' ? 'Attiva' : 'Completata'}
                    </Badge>
                  )}
                  {typeFilter && (
                    <Badge variant="secondary">
                      Tipo: {typeFilter === 'powerlifting' ? 'Powerlifting' : 'Strongman'}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabella */}
          <Card>
            <CardHeader>
              <CardTitle>Lista Competizioni</CardTitle>
              <CardDescription>
                {filteredCompetitions.length} competizioni trovate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitionsTable
                competitions={filteredCompetitions}
                onEdit={handleEditCompetition}
                onDelete={handleDeleteCompetition}
                onDuplicate={handleDuplicateCompetition}
                onViewRegistrations={handleViewRegistrations}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

      {/* Dialog Creazione */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuova Competizione</DialogTitle>
          </DialogHeader>
          <CompetitionForm
            onSubmit={handleCreateCompetition}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Competizione</DialogTitle>
          </DialogHeader>
          <CompetitionForm
            competition={selectedCompetition || undefined}
            onSubmit={handleUpdateCompetition}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setSelectedCompetition(null);
            }}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Duplicazione */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplica Competizione</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vuoi duplicare la competizione "{competitionToDuplicate?.name}"?
              La nuova competizione sarà programmata per 30 giorni da oggi.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleConfirmDuplicate} disabled={duplicateMutation.isPending}>
                {duplicateMutation.isPending ? 'Duplicazione...' : 'Duplica'}
              </Button>
              <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)}>
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </Tabs>
    </div>
  );
};