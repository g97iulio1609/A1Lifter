import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Plus, Search, Download, User, Target, Award, CheckCircle, AlertTriangle } from 'lucide-react';
import { recordService } from '@/services/records';

import type { RecordBroken, AthleteQualification, Competition } from '@/types';
import { toast } from 'sonner';

interface RecordManagementProps {
  competitionId: string;
  competition: Competition;
}

interface CreateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  competitionId: string;
}

interface QualificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  competitionId: string;
}

const CreateRecordModal: React.FC<CreateRecordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  competitionId
}) => {
  const [formData, setFormData] = useState({
    athleteId: '',
    athleteName: '',
    discipline: '',
    weightCategory: '',
    recordType: 'competition' as 'world' | 'national' | 'regional' | 'competition',
    value: '',
    unit: 'kg',
    federation: '',
    location: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.athleteName || !formData.discipline || !formData.value) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await recordService.createRecord({
        competitionId,
        athleteId: formData.athleteId || Date.now().toString(),
        athleteName: formData.athleteName,
        disciplineId: formData.discipline,
        discipline: formData.discipline,
        weightCategory: formData.weightCategory,
        category: formData.weightCategory,
        recordType: formData.recordType,
        value: parseFloat(formData.value),
        weight: parseFloat(formData.value),
        unit: formData.unit,
        federation: formData.federation,
        location: formData.location,
        notes: formData.notes,
        competitionName: 'Competizione',
        sport: 'powerlifting' as const,
        type: 'competition' as const,
        ageGroup: '',
        gender: 'M' as const,
        dateSet: new Date(),
        isActive: true,
        isRatified: false
      });
      
      toast.success('Record creato con successo');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        athleteId: '',
        athleteName: '',
        discipline: '',
        weightCategory: '',
        recordType: 'competition',
        value: '',
        unit: 'kg',
        federation: '',
        location: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating record:', error);
      toast.error('Errore durante la creazione del record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuovo Record</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Atleta *
            </label>
            <input
              type="text"
              value={formData.athleteName}
              onChange={(e) => setFormData({ ...formData, athleteName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disciplina *
            </label>
            <input
              type="text"
              value={formData.discipline}
              onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Es. Squat, Deadlift, ecc."
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valore *
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unità
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
                <option value="sec">secondi</option>
                <option value="reps">ripetizioni</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria di Peso
            </label>
            <input
              type="text"
              value={formData.weightCategory}
              onChange={(e) => setFormData({ ...formData, weightCategory: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Es. 74kg, 83kg, ecc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo di Record
            </label>
            <select
              value={formData.recordType}
              onChange={(e) => setFormData({ ...formData, recordType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="competition">Competizione</option>
              <option value="regional">Regionale</option>
              <option value="national">Nazionale</option>
              <option value="world">Mondiale</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Federazione
            </label>
            <input
              type="text"
              value={formData.federation}
              onChange={(e) => setFormData({ ...formData, federation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Es. FIPL, IPF, ecc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Luogo
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Città, Paese"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
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
              {isSubmitting ? 'Creando...' : 'Crea Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const QualificationModal: React.FC<QualificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  competitionId
}) => {
  const [formData, setFormData] = useState({
    athleteId: '',
    athleteName: '',
    discipline: '',
    qualifyingValue: '',
    achievedValue: '',
    qualificationDate: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.athleteName || !formData.discipline || !formData.qualifyingValue) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await recordService.createAthleteQualification({
        competitionId,
        athleteId: formData.athleteId || Date.now().toString(),
        athleteName: formData.athleteName,
        disciplineId: formData.discipline,
        discipline: formData.discipline,
        qualifyingValue: parseFloat(formData.qualifyingValue),
        achievedValue: formData.achievedValue ? parseFloat(formData.achievedValue) : 0,
        qualifyingWeight: parseFloat(formData.qualifyingValue),
        qualifyingTotal: parseFloat(formData.qualifyingValue),
        qualificationDate: formData.qualificationDate ? new Date(formData.qualificationDate) : new Date(),
        qualifyingDate: formData.qualificationDate ? new Date(formData.qualificationDate) : new Date(),
        competitionName: 'Competizione',
        competitionLevel: 'competition',
        category: 'Open',
        weightCategory: '74kg',
        federation: 'FIPL',
        sport: 'powerlifting' as const,
        isValid: true,
        isActive: true,
        isQualified: true
      });
      
      toast.success('Qualificazione creata con successo');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        athleteId: '',
        athleteName: '',
        discipline: '',
        qualifyingValue: '',
        achievedValue: '',
        qualificationDate: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating qualification:', error);
      toast.error('Errore durante la creazione della qualificazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuova Qualificazione</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Atleta *
            </label>
            <input
              type="text"
              value={formData.athleteName}
              onChange={(e) => setFormData({ ...formData, athleteName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disciplina *
            </label>
            <input
              type="text"
              value={formData.discipline}
              onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valore Qualificante *
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.qualifyingValue}
              onChange={(e) => setFormData({ ...formData, qualifyingValue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valore Raggiunto
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.achievedValue}
              onChange={(e) => setFormData({ ...formData, achievedValue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Qualificazione
            </label>
            <input
              type="date"
              value={formData.qualificationDate}
              onChange={(e) => setFormData({ ...formData, qualificationDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
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
              {isSubmitting ? 'Creando...' : 'Crea Qualificazione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RecordManagement: React.FC<RecordManagementProps> = ({
  competitionId,
  competition
}) => {
  const [records, setRecords] = useState<RecordBroken[]>([]);
  const [qualifications, setQualifications] = useState<AthleteQualification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'records' | 'qualifications'>('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState<'all' | 'world' | 'national' | 'regional' | 'competition'>('all');
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [showQualificationModal, setShowQualificationModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [competitionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load records
      const recordData = await recordService.getRecordsBrokenInCompetition(competitionId);
      setRecords(recordData);
      
      // Load qualifications
      const qualificationData = await recordService.getQualificationsByCompetition(competitionId);
      setQualifications(qualificationData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Errore durante il caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportRecords = async () => {
    try {
      const csvContent = [
        ['Atleta', 'Disciplina', 'Valore', 'Unità', 'Tipo', 'Categoria', 'Federazione', 'Data'].join(','),
        ...records.map(record => [
          record.athleteName,
          record.discipline,
          record.newWeight,
          'kg',
          record.recordType,
          record.weightCategory || '',
          '',
          new Date(record.createdAt).toLocaleDateString()
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `record-${competition.name}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Record esportati con successo');
    } catch (error) {
      console.error('Error exporting records:', error);
      toast.error('Errore durante l\'esportazione');
    }
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'world':
        return <Trophy className="h-4 w-4 text-yellow-600" />;
      case 'national':
        return <Medal className="h-4 w-4 text-blue-600" />;
      case 'regional':
        return <Award className="h-4 w-4 text-green-600" />;
      default:
        return <Star className="h-4 w-4 text-purple-600" />;
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'world':
        return 'bg-yellow-100 text-yellow-800';
      case 'national':
        return 'bg-blue-100 text-blue-800';
      case 'regional':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.discipline || record.disciplineId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = recordTypeFilter === 'all' || record.recordType === recordTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredQualifications = qualifications.filter(qualification => {
    return qualification.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           qualification.discipline.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
          <h2 className="text-2xl font-bold text-gray-900">Gestione Record e Qualificazioni</h2>
          <p className="text-gray-600">{competition.name}</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExportRecords}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Esporta
          </button>
          
          <button
            onClick={() => setShowQualificationModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Target className="h-4 w-4" />
            Nuova Qualificazione
          </button>
          
          <button
            onClick={() => setShowCreateRecordModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nuovo Record
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Record ({records.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('qualifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'qualifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Qualificazioni ({qualifications.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cerca per atleta o disciplina..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {activeTab === 'records' && (
            <div className="sm:w-48">
              <select
                value={recordTypeFilter}
                onChange={(e) => setRecordTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tutti i tipi</option>
                <option value="world">Mondiale</option>
                <option value="national">Nazionale</option>
                <option value="regional">Regionale</option>
                <option value="competition">Competizione</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'records' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atleta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Disciplina
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valore
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900">
                            {record.athleteName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.discipline}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.newWeight} kg
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRecordTypeColor(record.recordType)}`}>
                          {getRecordTypeIcon(record.recordType)}
                          {record.recordType === 'world' ? 'Mondiale' :
                           record.recordType === 'national' ? 'Nazionale' :
                           record.recordType === 'regional' ? 'Regionale' : 'Competizione'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.weightCategory || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun record trovato</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || recordTypeFilter !== 'all'
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia registrando il primo record'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredQualifications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atleta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Disciplina
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valore Qualificante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valore Raggiunto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQualifications.map((qualification) => (
                    <tr key={qualification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900">
                            {qualification.athleteName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {qualification.discipline}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {qualification.qualifyingValue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {qualification.achievedValue || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          qualification.isQualified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {qualification.isQualified ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Qualificato
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3" />
                              Non qualificato
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(qualification.qualificationDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna qualificazione trovata</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia registrando la prima qualificazione'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateRecordModal
        isOpen={showCreateRecordModal}
        onClose={() => setShowCreateRecordModal(false)}
        onSuccess={loadData}
        competitionId={competitionId}
      />
      
      <QualificationModal
        isOpen={showQualificationModal}
        onClose={() => setShowQualificationModal(false)}
        onSuccess={loadData}
        competitionId={competitionId}
      />
    </div>
  );
};

export default RecordManagement;