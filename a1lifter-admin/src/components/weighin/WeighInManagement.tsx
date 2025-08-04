import React, { useState, useEffect } from 'react';
import { Scale, Search, Plus, Download, User, AlertTriangle, CheckCircle, XCircle, Check, X } from 'lucide-react';
import { weighInService } from '@/services/weighIn';
import { calculationService } from '@/services/calculations';
import type { WeighIn, Athlete, Competition } from '@/types';
import { toast } from 'sonner';

interface WeighInManagementProps {
  competitionId: string;
  competition: Competition;
}

interface CreateWeighInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  competitionId: string;
  athletes: Athlete[];
  competition: Competition;
}

const CreateWeighInModal: React.FC<CreateWeighInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  competitionId,
  athletes,
  competition
}) => {
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (weight && parseFloat(weight) > 0 && competition.categories) {
      const weightValue = parseFloat(weight);
      // Estrai i pesi numerici dalle categorie
      const weightNumbers = competition.categories.map(cat => 
        parseFloat(cat.weightClass.replace(/kg\+?/, ''))
      ).filter(w => !isNaN(w));
      
      const category = calculationService.findWeightCategory(
        weightValue,
        weightNumbers
      );
      setSuggestedCategory(category);
    } else {
      setSuggestedCategory(null);
    }
  }, [weight, competition.categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAthlete || !weight) {
      toast.error('Seleziona un atleta e inserisci il peso');
      return;
    }
    
    const athlete = athletes.find(a => a.id === selectedAthlete);
    if (!athlete) {
      toast.error('Atleta non trovato');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await weighInService.createWeighIn({
        competitionId,
        athleteId: selectedAthlete,
        athleteName: athlete.name,
        categoryId: 'category-1',
        weightCategory: suggestedCategory || '',
        bodyWeight: parseFloat(weight),
        weight: parseFloat(weight),
        weighInTime: new Date(),
        isOfficial: false,
        notes,
        status: 'pending'
      });
      
      toast.success('Pesata registrata con successo');
      onSuccess();
      onClose();
      
      // Reset form
      setSelectedAthlete('');
      setWeight('');
      setNotes('');
      setSuggestedCategory(null);
    } catch (error) {
      console.error('Error creating weigh-in:', error);
      toast.error('Errore durante la registrazione della pesata');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuova Pesata</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atleta
            </label>
            <select
              value={selectedAthlete}
              onChange={(e) => setSelectedAthlete(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleziona un atleta</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Es. 75.5"
              required
            />
            {suggestedCategory && (
              <p className="text-sm text-blue-600 mt-1">
                Categoria suggerita: {suggestedCategory}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (opzionale)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Note aggiuntive..."
            />
          </div>
          
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
              {isSubmitting ? 'Registrando...' : 'Registra Pesata'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WeighInManagement: React.FC<WeighInManagementProps> = ({
  competitionId,
  competition
}) => {
  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [competitionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load weigh-ins
      const weighInData = await weighInService.getWeighInsByCompetition(competitionId);
      setWeighIns(weighInData);
      
      // Load athletes from registrations service
      // This would load real athletes registered for the competition
      const realAthletes: Athlete[] = [];
      setAthletes(realAthletes);
      
      // Load statistics
      const stats = await weighInService.getWeighInStats(competitionId);
      setStatistics(stats);
      
    } catch (error) {
      console.error('Error loading weigh-in data:', error);
      toast.error('Errore durante il caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveWeighIn = async (weighInId: string) => {
    try {
      await weighInService.approveWeighIn(weighInId, 'judge-id');
      toast.success('Pesata approvata');
      loadData();
    } catch (error) {
      console.error('Error approving weigh-in:', error);
      toast.error('Errore durante l\'approvazione');
    }
  };

  const handleRejectWeighIn = async (weighInId: string) => {
    try {
      await weighInService.rejectWeighIn(weighInId, 'Pesata rifiutata');
      toast.success('Pesata rifiutata');
      loadData();
    } catch (error) {
      console.error('Error rejecting weigh-in:', error);
      toast.error('Errore durante il rifiuto');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await weighInService.exportWeighIns(competitionId);
      
      // Create and download CSV file
      const csvContent = [
        ['ID Atleta', 'Peso Corporeo (kg)', 'Data Pesatura', 'Ora Pesatura', 'Stato', 'Ufficiale', 'Giudice Testimone', 'Note'].join(','),
        ...data.map((weighIn: any) => [
          weighIn['ID Atleta'],
          weighIn['Peso Corporeo (kg)'],
          weighIn['Data Pesatura'],
          weighIn['Ora Pesatura'],
          weighIn['Stato'],
          weighIn['Ufficiale'],
          weighIn['Giudice Testimone'],
          weighIn['Note']
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pesate-${competition.name}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Dati esportati con successo');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Errore durante l\'esportazione');
    }
  };

  const filteredWeighIns = weighIns.filter(weighIn => {
    const matchesSearch = weighIn.athleteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || weighIn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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
          <p className="text-gray-600">{competition.name}</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Esporta
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nuova Pesata
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totale Pesate</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approvate</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Attesa</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rifiutate</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.rejected}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cerca per nome atleta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        {filteredWeighIns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atleta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWeighIns.map((weighIn) => (
                  <tr key={weighIn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {weighIn.athleteName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {weighIn.weight} kg
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {weighIn.weightCategory}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(weighIn.status)}`}>
                        {getStatusIcon(weighIn.status)}
                        {weighIn.status === 'approved' ? 'Approvata' : 
                         weighIn.status === 'rejected' ? 'Rifiutata' : 'In attesa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(weighIn.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {weighIn.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveWeighIn(weighIn.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approva"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRejectWeighIn(weighIn.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Rifiuta"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Scale className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna pesata trovata</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia registrando la prima pesata'}
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateWeighInModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadData}
        competitionId={competitionId}
        athletes={athletes}
        competition={competition}
      />
    </div>
  );
};

export default WeighInManagement;