import React, { useState } from 'react';
import { Plus, Search, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AthletesTable } from '@/components/athletes/AthletesTable';
import { AthleteForm } from '@/components/athletes/AthleteForm';
import { useAthletes, useCreateAthlete, useUpdateAthlete, useDeleteAthlete } from '@/hooks/useAthletes';
import type { Athlete } from '@/types';
import { toast } from 'sonner';

export const AthletesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'M' | 'F' | undefined>();
  const [federationFilter, setFederationFilter] = useState<string | undefined>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  const filters = {
    searchTerm: searchTerm || undefined,
    gender: genderFilter,
    federation: federationFilter,
  };

  const { data: athletes = [], isLoading, error } = useAthletes(filters);
  const createMutation = useCreateAthlete();
  const updateMutation = useUpdateAthlete();
  const deleteMutation = useDeleteAthlete();

  const handleCreateAthlete = async (data: any) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        birthDate: new Date(data.birthDate),
        personalRecords: {},
      });
      toast.success('Atleta creato con successo');
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('Errore durante la creazione dell\'atleta');
    }
  };

  const handleUpdateAthlete = async (data: any) => {
    if (!selectedAthlete) return;
    
    try {
      await updateMutation.mutateAsync({
        id: selectedAthlete.id,
        data: {
          ...data,
          birthDate: new Date(data.birthDate),
        },
      });
      toast.success('Atleta aggiornato con successo');
      setIsEditDialogOpen(false);
      setSelectedAthlete(null);
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento dell\'atleta');
    }
  };

  const handleDeleteAthlete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Atleta eliminato con successo');
    } catch (error) {
      toast.error('Errore durante l\'eliminazione dell\'atleta');
    }
  };

  const handleEditAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setIsEditDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGenderFilter(undefined);
    setFederationFilter(undefined);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-destructive">Errore nel caricamento degli atleti</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Ricarica pagina
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Atleti</h1>
          <p className="text-muted-foreground">
            Gestisci gli atleti registrati nel sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Importa CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Atleta
          </Button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Atleti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{athletes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maschi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {athletes.filter(a => a.gender === 'M').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Femmine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {athletes.filter(a => a.gender === 'F').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Federazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(athletes.map(a => a.federation)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>Filtra gli atleti per trovare quello che cerchi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={genderFilter} onValueChange={(value: 'M' | 'F') => setGenderFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Genere" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Maschio</SelectItem>
                <SelectItem value="F">Femmina</SelectItem>
              </SelectContent>
            </Select>
            <Select value={federationFilter} onValueChange={setFederationFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Federazione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIPL">FIPL</SelectItem>
                <SelectItem value="IPF">IPF</SelectItem>
                <SelectItem value="WDFPF">WDFPF</SelectItem>
                <SelectItem value="WPC">WPC</SelectItem>
                <SelectItem value="WPF">WPF</SelectItem>
                <SelectItem value="AWPC">AWPC</SelectItem>
                <SelectItem value="SPF">SPF</SelectItem>
                <SelectItem value="NASA">NASA</SelectItem>
                <SelectItem value="Altra">Altra</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              Pulisci filtri
            </Button>
          </div>
          {(searchTerm || genderFilter || federationFilter) && (
            <div className="flex gap-2">
              {searchTerm && (
                <Badge variant="secondary">
                  Ricerca: {searchTerm}
                </Badge>
              )}
              {genderFilter && (
                <Badge variant="secondary">
                  Genere: {genderFilter === 'M' ? 'Maschio' : 'Femmina'}
                </Badge>
              )}
              {federationFilter && (
                <Badge variant="secondary">
                  Federazione: {federationFilter}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabella */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Atleti</CardTitle>
          <CardDescription>
            {athletes.length} atleti trovati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AthletesTable
            athletes={athletes}
            onEdit={handleEditAthlete}
            onDelete={handleDeleteAthlete}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Dialog Creazione */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nuovo Atleta</DialogTitle>
          </DialogHeader>
          <AthleteForm
            onSubmit={handleCreateAthlete}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modifica Atleta</DialogTitle>
          </DialogHeader>
          <AthleteForm
            athlete={selectedAthlete || undefined}
            onSubmit={handleUpdateAthlete}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setSelectedAthlete(null);
            }}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};