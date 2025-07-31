import React, { useState } from 'react';
import type { Registration } from '@/types';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RegistrationsTable } from '@/components/registrations/RegistrationsTable';
import { RegistrationForm } from '@/components/competitions/RegistrationForm';
import { RegistrationDetails } from '@/components/registrations/RegistrationDetails';
import { useRegistrations, useCreateRegistration } from '@/hooks/useRegistrations';
import { useCompetitions } from '@/hooks/useCompetitions';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  XCircle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const RegistrationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get('competitionId') || undefined;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'confirmed' | 'cancelled' | undefined>();
  const [paymentFilter, setPaymentFilter] = useState<'unpaid' | 'paid' | 'refunded' | undefined>();
  const [selectedRegistration, setSelectedRegistration] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filters = {
    competitionId,
    status: statusFilter,
    paymentStatus: paymentFilter,
    searchTerm: searchTerm || undefined,
  };

  const { data: registrations = [], isLoading, error } = useRegistrations(filters);
  const { data: competitions = [] } = useCompetitions();
  const createMutation = useCreateRegistration();
  
  const selectedCompetition = competitions.find(c => c.id === competitionId);

  const getStatusStats = () => {
    const pending = registrations.filter((r: Registration) => r.status === 'pending').length;
    const confirmed = registrations.filter((r: Registration) => r.status === 'confirmed').length;
    const cancelled = registrations.filter((r: Registration) => r.status === 'cancelled').length;
    
    return { pending, confirmed, cancelled, total: registrations.length };
  };

  const stats = getStatusStats();

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setPaymentFilter(undefined);
  };

  const handleExport = () => {
    // TODO: Implementare export registrazioni
    toast.info('Funzionalità di export in sviluppo');
  };

  const handleCreateRegistration = async (data: any) => {
    if (!competitionId) {
      toast.error('Seleziona prima una competizione');
      return;
    }
    try {
      await createMutation.mutateAsync({
        competitionId,
        ...data,
      });
      toast.success('Iscrizione aggiunta con successo');
      setIsCreateDialogOpen(false);
    } catch (e) {
      toast.error('Errore durante la creazione iscrizione');
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-destructive">Errore nel caricamento delle iscrizioni</p>
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
          <h1 className="text-3xl font-bold">Iscrizioni</h1>
          <p className="text-muted-foreground">
            {selectedCompetition 
              ? `Gestisci le iscrizioni per ${selectedCompetition.name}`
              : 'Gestisci le iscrizioni alle competizioni'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!competitionId}>
            + Nuova Iscrizione
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Iscrizioni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confermate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annullate</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome atleta o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={statusFilter || 'all'} onValueChange={(value) => 
              setStatusFilter(value === 'all' ? undefined : value as any)
            }>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="confirmed">Confermata</SelectItem>
                <SelectItem value="cancelled">Annullata</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentFilter || 'all'} onValueChange={(value) => 
              setPaymentFilter(value === 'all' ? undefined : value as any)
            }>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i pagamenti</SelectItem>
                <SelectItem value="unpaid">Non pagato</SelectItem>
                <SelectItem value="paid">Pagato</SelectItem>
                <SelectItem value="refunded">Rimborsato</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Pulisci filtri
            </Button>
          </div>
          
          {(searchTerm || statusFilter || paymentFilter) && (
            <div className="flex gap-2 mt-4">
              {searchTerm && (
                <Badge variant="secondary">
                  Ricerca: {searchTerm}
                </Badge>
              )}
              {statusFilter && (
                <Badge variant="secondary">
                  Stato: {statusFilter === 'pending' ? 'In attesa' : 
                          statusFilter === 'confirmed' ? 'Confermata' : 'Annullata'}
                </Badge>
              )}
              {paymentFilter && (
                <Badge variant="secondary">
                  Pagamento: {paymentFilter === 'unpaid' ? 'Non pagato' : 
                             paymentFilter === 'paid' ? 'Pagato' : 'Rimborsato'}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabella */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Iscrizioni</CardTitle>
          <CardDescription>
            {registrations.length} iscrizioni trovate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationsTable
            registrations={registrations}
            onViewDetails={setSelectedRegistration}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Dialog dettagli registrazione */}
      {selectedRegistration && (
        <RegistrationDetails
          registrationId={selectedRegistration}
          open={!!selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
        />
      )}

      {/* Dialog nuova iscrizione */}
      {selectedCompetition && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuova Iscrizione</DialogTitle>
            </DialogHeader>
            <RegistrationForm
              competition={selectedCompetition}
              onSubmit={handleCreateRegistration}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 