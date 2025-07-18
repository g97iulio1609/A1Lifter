import React, { useState } from 'react';
import { Plus, Trophy, Target, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResultsTable } from '@/components/results/ResultsTable';
import { LiftForm } from '@/components/results/LiftForm';
import { useCompetitions } from '@/hooks/useCompetitions';
import { useResultsWithAthletes, useResultsStats, useAddLift } from '@/hooks/useResults';
import type { AthleteResult } from '@/types';
import { toast } from 'sonner';

export const ResultsPage: React.FC = () => {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isLiftDialogOpen, setIsLiftDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AthleteResult | null>(null);

  const { data: competitions = [] } = useCompetitions({ status: 'active' });
  const { data: results = [], isLoading } = useResultsWithAthletes(selectedCompetitionId);
  const { data: stats } = useResultsStats(selectedCompetitionId);
  const addLiftMutation = useAddLift();

  const selectedCompetition = competitions.find(c => c.id === selectedCompetitionId);
  
  // Filtra risultati per categoria se selezionata
  const filteredResults = selectedCategoryId 
    ? results.filter(r => r.categoryId === selectedCategoryId)
    : results;

  // Raggruppa risultati per categoria
  const resultsByCategory = results.reduce((acc, result) => {
    if (!acc[result.categoryId]) {
      acc[result.categoryId] = [];
    }
    acc[result.categoryId].push(result);
    return acc;
  }, {} as Record<string, AthleteResult[]>);

  const handleAddLift = (result: AthleteResult) => {
    setSelectedResult(result);
    setIsLiftDialogOpen(true);
  };

  const handleSubmitLift = async (data: any) => {
    if (!selectedResult) return;

    try {
      await addLiftMutation.mutateAsync({
        resultId: selectedResult.id,
        lift: {
          ...data,
          timestamp: new Date(),
        },
      });
      toast.success('Tentativo aggiunto con successo');
      setIsLiftDialogOpen(false);
      setSelectedResult(null);
    } catch (error) {
      toast.error('Errore durante l\'aggiunta del tentativo');
    }
  };

  const handleEditResult = (_result: AthleteResult) => {
    // TODO: Implementare modifica risultato
    toast.info('Funzionalità in sviluppo');
  };

  const handleDeleteResult = async (_id: string) => {
    // TODO: Implementare eliminazione risultato
    toast.info('Funzionalità in sviluppo');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Risultati</h1>
          <p className="text-muted-foreground">
            Gestisci i risultati e le classifiche delle competizioni
          </p>
        </div>
        <Button onClick={() => toast.info('Funzionalità in sviluppo')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Risultato
        </Button>
      </div>

      {/* Selezione Competizione */}
      <Card>
        <CardHeader>
          <CardTitle>Seleziona Competizione</CardTitle>
          <CardDescription>Scegli una competizione attiva per visualizzare i risultati</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Competizione</label>
              <Select value={selectedCompetitionId} onValueChange={setSelectedCompetitionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona competizione" />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map((competition) => (
                    <SelectItem key={competition.id} value={competition.id}>
                      {competition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCompetition && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria (opzionale)</label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte le categorie</SelectItem>
                    {selectedCompetition.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCompetitionId && (
        <>
          {/* Statistiche */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totale Risultati</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalResults || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tentativi Validi</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.validAttempts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  su {stats?.totalAttempts || 0} totali
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Punteggio Massimo</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.topScore || 0}kg</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Media Punteggio</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.averageScore ? Math.round(stats.averageScore) : 0}kg
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risultati */}
          <Card>
            <CardHeader>
              <CardTitle>Risultati</CardTitle>
              <CardDescription>
                {selectedCategoryId 
                  ? `Categoria: ${selectedCompetition?.categories.find(c => c.id === selectedCategoryId)?.name}`
                  : 'Tutte le categorie'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCategoryId ? (
                <ResultsTable
                  results={filteredResults}
                  onEdit={handleEditResult}
                  onDelete={handleDeleteResult}
                  onAddLift={handleAddLift}
                  isLoading={isLoading}
                />
              ) : (
                <Tabs defaultValue="overall" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overall">Classifica Generale</TabsTrigger>
                    <TabsTrigger value="categories">Per Categoria</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overall" className="space-y-4">
                    <ResultsTable
                      results={results}
                      onEdit={handleEditResult}
                      onDelete={handleDeleteResult}
                      onAddLift={handleAddLift}
                      isLoading={isLoading}
                    />
                  </TabsContent>

                  <TabsContent value="categories" className="space-y-4">
                    {Object.entries(resultsByCategory).map(([categoryId, categoryResults]) => {
                      const category = selectedCompetition?.categories.find(c => c.id === categoryId);
                      return (
                        <Card key={categoryId}>
                          <CardHeader>
                            <CardTitle className="text-lg">{category?.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResultsTable
                              results={categoryResults}
                              onEdit={handleEditResult}
                              onDelete={handleDeleteResult}
                              onAddLift={handleAddLift}
                              isLoading={isLoading}
                            />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog Tentativo */}
      <Dialog open={isLiftDialogOpen} onOpenChange={setIsLiftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Tentativo</DialogTitle>
          </DialogHeader>
          {selectedResult && selectedCompetition && (
            <LiftForm
              result={selectedResult}
              disciplines={selectedCompetition.rules.disciplines}
              onSubmit={handleSubmitLift}
              onCancel={() => setIsLiftDialogOpen(false)}
              isLoading={addLiftMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};