import React, { useState, useEffect, useCallback } from 'react';
import { Scale, Search, Plus, Download, Filter, User, AlertTriangle, Check, X, Trophy } from 'lucide-react';
import { weighInService } from '@/services/weighIn';
import type { WeighIn } from '@/types';
import { AthleteAutocomplete } from '@/components/ui/athlete-autocomplete';
import { useCompetitionAthletes, useActiveCompetitions } from '@/hooks/useCompetitionAthletes';
import { toast } from 'sonner';

interface WeighInManagementProps {
  competitionId?: string;
}

interface CreateWeighInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  competitionId?: string;
}

const CreateWeighInModal: React.FC<CreateWeighInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  competitionId
}) => {
  const [formData, setFormData] = useState({
    athleteId: '',
    competitionId: competitionId || '',
    bodyWeight: '',
    categoryId: ''
  });
  type AthleteOption = Parameters<typeof AthleteAutocomplete>[0]['athletes'][number];
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { athletes } = useCompetitionAthletes(formData.competitionId);
  const { competitions } = useActiveCompetitions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAthlete) {
      toast.error('Seleziona un atleta');
      return;
    }
    
    if (!formData.competitionId || !formData.bodyWeight) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    const bodyWeight = parseFloat(formData.bodyWeight);
    if (isNaN(bodyWeight) || bodyWeight <= 0 || bodyWeight > 300) {
      toast.error('Inserisci un peso valido (0-300 kg)');
      return;
    }

    setIsSubmitting(true);
    try {
      await weighInService.createWeighIn({
        athleteId: formData.athleteId,
        athleteName: selectedAthlete.athlete.name,
        competitionId: formData.competitionId,
        categoryId: formData.categoryId,
        weightCategory: selectedAthlete.athlete.weightClass,
        bodyWeight: bodyWeight,
        weight: bodyWeight, // Alias per compatibilità
        weighInTime: new Date(),
        isOfficial: true,
        status: 'pending'
      });
      
      toast.success(`Pesata registrata per ${selectedAthlete.athlete.name}: ${bodyWeight} kg`);
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        athleteId: '',
        competitionId: competitionId || '',
        bodyWeight: '',
        categoryId: ''
      });
      setSelectedAthlete(null);
    } catch (error) {
      console.error('Error creating weigh-in:', error);
      toast.error('Errore nella registrazione della pesata');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registra Pesata</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atleta *
            </label>
            <AthleteAutocomplete
               athletes={athletes}
               value={selectedAthlete}
               onSelect={(athlete) => {
                 setSelectedAthlete(athlete);
                 setFormData(prev => ({ 
                   ...prev, 
                   athleteId: athlete?.athlete.id || '',
                   categoryId: athlete?.registration?.categoryId || ''
                 }));
               }}
               placeholder="Seleziona atleta iscritto"
               className="w-full"
             />
          </div>
          
          {!competitionId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Competizione *
              </label>
              <select
                value={formData.competitionId}
                onChange={(e) => setFormData(prev => ({ ...prev, competitionId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleziona competizione</option>
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Informazioni atleta selezionato */}
          {selectedAthlete && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Atleta Selezionato</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Nome:</span>
                  <span className="ml-2 text-blue-900">{selectedAthlete.athlete.name}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Pettorale:</span>
                  <span className="ml-2 text-blue-900">#{selectedAthlete.bibNumber}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Categoria:</span>
                  <span className="ml-2 text-blue-900">{selectedAthlete.athlete.weightClass}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Team:</span>
                  <span className="ml-2 text-blue-900">{selectedAthlete.athlete.team || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso Corporeo (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="300"
              value={formData.bodyWeight}
              onChange={(e) => setFormData(prev => ({ ...prev, bodyWeight: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="75.5"
              required
              disabled={!selectedAthlete}
            />
            <p className="text-xs text-gray-500 mt-1">
              Peso misurato durante la pesata ufficiale
            </p>
          </div>

          {selectedAthlete && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria di Gara
              </label>
              <input
                type="text"
                value={formData.categoryId}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Categoria assegnata automaticamente in base alla registrazione
              </p>
            </div>
          )}
          

          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Registrando...' : 'Registra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WeighInManagement: React.FC<WeighInManagementProps> = ({ competitionId: initialCompetitionId }) => {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(initialCompetitionId || '');
  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { competitions } = useActiveCompetitions();
  const { athletes } = useCompetitionAthletes(selectedCompetitionId);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const loadWeighIns = useCallback(async () => {
    try {
      setIsLoading(true);
      let weighInData: WeighIn[];
      if (selectedCompetitionId) {
        weighInData = await weighInService.getWeighInsByCompetition(selectedCompetitionId);
      } else {
        weighInData = await weighInService.getAllWeighIns();
      }
      setWeighIns(weighInData);
      updateStats(weighInData);
    } catch (error) {
      console.error('Error loading weigh-ins:', error);
      toast.error('Errore durante il caricamento delle pesate');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompetitionId]);

  useEffect(() => {
    loadWeighIns();
  }, [selectedCompetitionId, loadWeighIns]);

  // Aggiorna la competizione selezionata quando cambia quella iniziale
  useEffect(() => {
    if (initialCompetitionId && initialCompetitionId !== selectedCompetitionId) {
      setSelectedCompetitionId(initialCompetitionId);
    }
  }, [initialCompetitionId, selectedCompetitionId]);

  // loadWeighIns memoized sopra

  const updateStats = (weighInData: WeighIn[]) => {
    const stats = {
      total: weighInData.length,
      pending: weighInData.filter(w => w.status === 'pending').length,
      approved: weighInData.filter(w => w.status === 'approved').length,
      rejected: weighInData.filter(w => w.status === 'rejected').length
    };
    setStats(stats);
  };

  const handleApprove = async (weighInId: string) => {
    try {
      await weighInService.approveWeighIn(weighInId, 'judge-id');
      setWeighIns(prev => 
        prev.map(w => w.id === weighInId ? { ...w, status: 'approved' } : w)
      );
      toast.success('Pesata approvata');
    } catch (error) {
      console.error('Error approving weigh-in:', error);
      toast.error('Errore durante l\'approvazione della pesata');
    }
  };

  const handleReject = async (weighInId: string) => {
    try {
      await weighInService.rejectWeighIn(weighInId, 'Pesata rifiutata');
      setWeighIns(prev => 
        prev.map(w => w.id === weighInId ? { ...w, status: 'rejected' } : w)
      );
      toast.success('Pesata rifiutata');
    } catch (error) {
      console.error('Error rejecting weigh-in:', error);
      toast.error('Errore durante il rifiuto della pesata');
    }
  };

  const handleExport = async () => {
    try {
      const exportData = await weighInService.exportWeighIns(selectedCompetitionId || '');
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pesate-${selectedCompetitionId || 'tutte'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Dati esportati con successo');
    } catch (error) {
      console.error('Error exporting weigh-ins:', error);
      toast.error('Errore durante l\'esportazione');
    }
  };

  const filteredWeighIns = weighIns.filter(weighIn => {
    // Filter by status
    if (statusFilter !== 'all' && weighIn.status !== statusFilter) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        weighIn.athleteId.toLowerCase().includes(query) ||
        weighIn.competitionId.toLowerCase().includes(query) ||
        weighIn.categoryId.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Scale className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Pesate</h2>
          <p className="text-gray-600">
            {selectedCompetitionId ? 'Pesate per la competizione selezionata' : 'Seleziona una competizione per gestire le pesate'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedCompetitionId}
          >
            <Download className="h-4 w-4" />
            Esporta
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedCompetitionId}
          >
            <Plus className="h-4 w-4" />
            Nuova Pesata
          </button>
        </div>
      </div>

      {/* Competition Selector */}
      {!initialCompetitionId && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="competition-select" className="block text-sm font-medium text-gray-700 mb-1">
                Seleziona Competizione
              </label>
              <select
                id="competition-select"
                value={selectedCompetitionId}
                onChange={(e) => setSelectedCompetitionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Scegli una competizione...</option>
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({new Date(comp.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Scale className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totale Pesate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Attesa</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Check className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approvate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <X className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rifiutate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per atleta, competizione o categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutti gli stati</option>
              <option value="pending">In attesa</option>
              <option value="approved">Approvate</option>
              <option value="rejected">Rifiutate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Weigh-ins List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {!selectedCompetitionId ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Seleziona una competizione
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Scegli una competizione dal menu sopra per visualizzare e gestire le pesate
            </p>
          </div>
        ) : filteredWeighIns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atleta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peso Corporeo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Pesata
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWeighIns.map((weighIn) => {
                  // Trova l'atleta corrispondente per mostrare informazioni aggiuntive
                  const athleteInfo = athletes.find(a => a.athlete.id === weighIn.athleteId);
                  
                  return (
                    <tr key={weighIn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {weighIn.athleteName || weighIn.athleteId}
                            </div>
                            {athleteInfo && (
                              <div className="text-xs text-gray-500">
                                #{athleteInfo.bibNumber} • {athleteInfo.athlete.team || 'Nessun team'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {weighIn.bodyWeight} kg
                        </div>
                        <div className="text-xs text-gray-500">
                          {weighIn.isOfficial ? 'Ufficiale' : 'Non ufficiale'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {weighIn.weightCategory || weighIn.categoryId || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(weighIn.status)}`}>
                          {getStatusIcon(weighIn.status)}
                          {weighIn.status === 'pending' ? 'In attesa' :
                           weighIn.status === 'approved' ? 'Approvata' : 'Rifiutata'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{weighIn.weighInTime instanceof Date ? weighIn.weighInTime.toLocaleDateString() : new Date((weighIn.weighInTime as unknown as { toDate?: () => Date })?.toDate?.() ?? Date.now()).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {weighIn.weighInTime instanceof Date ? weighIn.weighInTime.toLocaleTimeString() : new Date((weighIn.weighInTime as unknown as { toDate?: () => Date })?.toDate?.() ?? Date.now()).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {weighIn.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(weighIn.id)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Approva pesata"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(weighIn.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Rifiuta pesata"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Scale className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery || statusFilter !== 'all' 
                ? 'Nessuna pesata trovata' 
                : 'Nessuna pesata registrata'
              }
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Registra la prima pesata per questa competizione'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateWeighInModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadWeighIns}
        competitionId={selectedCompetitionId}
      />
    </div>
  );
};

export default WeighInManagement;