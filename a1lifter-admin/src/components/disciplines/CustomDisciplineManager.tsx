import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Trophy, Target, Clock, Weight, Settings } from 'lucide-react';
import { DISCIPLINES_BY_SPORT } from '@/constants/disciplines';
import type { CustomDiscipline, Competition } from '@/types';
import { toast } from 'sonner';

interface CustomDisciplineManagerProps {
  competitionId: string;
  competition: Competition;
  onDisciplinesChange?: (disciplines: CustomDiscipline[]) => void;
}

interface DisciplineFormData {
  name: string;
  sport: 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting';
  description: string;
  scoringType: 'weight' | 'time' | 'reps' | 'distance' | 'points';
  equipment: string;
  rules: string;
  maxAttempts: number;
  timeLimit: number;
  isActive: boolean;
}

const CustomDisciplineManager: React.FC<CustomDisciplineManagerProps> = ({
  competitionId,
  competition,
  onDisciplinesChange
}) => {
  const [disciplines, setDisciplines] = useState<CustomDiscipline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<CustomDiscipline | null>(null);
  const [formData, setFormData] = useState<DisciplineFormData>({
    name: '',
    sport: competition.type as any,
    description: '',
    scoringType: 'weight',
    equipment: '',
    rules: '',
    maxAttempts: 3,
    timeLimit: 60,
    isActive: true
  });

  useEffect(() => {
    loadDisciplines();
  }, [competitionId]);

  const loadDisciplines = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - in real implementation, this would come from a service
      const mockDisciplines: CustomDiscipline[] = [
        {
          id: '1',
          name: 'Squat Raw',
          sport: 'powerlifting',
          description: 'Squat senza supporti',
          scoringType: 'weight',
          unit: 'kg',
          equipment: ['Raw (senza supporti)'],
          rules: 'Discesa fino a quando le anche sono sotto il livello delle ginocchia, poi risalita completa.',
          maxAttempts: 3,
          timeLimit: 60,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Deadlift Equipped',
          sport: 'powerlifting',
          description: 'Stacco da terra con supporti',
          scoringType: 'weight',
          unit: 'kg',
          equipment: ['Equipped (con tuta)'],
          rules: 'Sollevamento del bilanciere da terra fino alla posizione eretta completa.',
          maxAttempts: 3,
          timeLimit: 60,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setDisciplines(mockDisciplines);
      onDisciplinesChange?.(mockDisciplines);
      
    } catch (error) {
      console.error('Error loading disciplines:', error);
      toast.error('Errore durante il caricamento delle discipline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDiscipline = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Il nome della disciplina è obbligatorio');
        return;
      }
      
      const newDiscipline: CustomDiscipline = {
        id: Date.now().toString(), // Mock ID generation
        ...formData,
        unit: formData.scoringType === 'weight' ? 'kg' as const : formData.scoringType === 'time' ? 'time' as const : formData.scoringType === 'distance' ? 'meters' as const : formData.scoringType === 'reps' ? 'reps' as const : 'kg' as const,
        equipment: formData.equipment ? formData.equipment.split(',').map(e => e.trim()) : [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedDisciplines = [...disciplines, newDiscipline];
      setDisciplines(updatedDisciplines);
      onDisciplinesChange?.(updatedDisciplines);
      
      toast.success('Disciplina creata con successo');
      resetForm();
      setShowCreateForm(false);
      
    } catch (error) {
      console.error('Error creating discipline:', error);
      toast.error('Errore durante la creazione della disciplina');
    }
  };

  const handleUpdateDiscipline = async () => {
    try {
      if (!editingDiscipline || !formData.name.trim()) {
        toast.error('Dati non validi');
        return;
      }
      
      const updatedDiscipline: CustomDiscipline = {
        ...editingDiscipline,
        ...formData,
        unit: formData.scoringType === 'weight' ? 'kg' as const : formData.scoringType === 'time' ? 'time' as const : formData.scoringType === 'distance' ? 'meters' as const : formData.scoringType === 'reps' ? 'reps' as const : 'kg' as const,
        equipment: formData.equipment ? formData.equipment.split(',').map(e => e.trim()) : [],
        updatedAt: new Date()
      };
      
      const updatedDisciplines = disciplines.map(d => 
        d.id === editingDiscipline.id ? updatedDiscipline : d
      );
      
      setDisciplines(updatedDisciplines);
      onDisciplinesChange?.(updatedDisciplines);
      
      toast.success('Disciplina aggiornata con successo');
      resetForm();
      setEditingDiscipline(null);
      
    } catch (error) {
      console.error('Error updating discipline:', error);
      toast.error('Errore durante l\'aggiornamento della disciplina');
    }
  };

  const handleDeleteDiscipline = async (disciplineId: string) => {
    try {
      if (!confirm('Sei sicuro di voler eliminare questa disciplina?')) {
        return;
      }
      
      const updatedDisciplines = disciplines.filter(d => d.id !== disciplineId);
      setDisciplines(updatedDisciplines);
      onDisciplinesChange?.(updatedDisciplines);
      
      toast.success('Disciplina eliminata con successo');
      
    } catch (error) {
      console.error('Error deleting discipline:', error);
      toast.error('Errore durante l\'eliminazione della disciplina');
    }
  };

  const handleToggleActive = async (disciplineId: string) => {
    try {
      const updatedDisciplines = disciplines.map(d => 
        d.id === disciplineId ? { ...d, isActive: !d.isActive, updatedAt: new Date() } : d
      );
      
      setDisciplines(updatedDisciplines);
      onDisciplinesChange?.(updatedDisciplines);
      
      toast.success('Stato disciplina aggiornato');
      
    } catch (error) {
      console.error('Error toggling discipline status:', error);
      toast.error('Errore durante l\'aggiornamento dello stato');
    }
  };

  const startEdit = (discipline: CustomDiscipline) => {
    setEditingDiscipline(discipline);
    setFormData({
      name: discipline.name,
      sport: discipline.sport as 'powerlifting' | 'strongman' | 'weightlifting' | 'streetlifting',
      description: discipline.description || '',
      scoringType: discipline.scoringType,
      equipment: discipline.equipment?.join(', ') || '',
      rules: discipline.rules || '',
      maxAttempts: discipline.maxAttempts,
      timeLimit: discipline.timeLimit || 60,
      isActive: discipline.isActive ?? true
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sport: competition.type as any,
      description: '',
      scoringType: 'weight',
      equipment: '',
      rules: '',
      maxAttempts: 3,
      timeLimit: 60,
      isActive: true
    });
  };

  const cancelEdit = () => {
    setEditingDiscipline(null);
    setShowCreateForm(false);
    resetForm();
  };

  const getScoringTypeIcon = (type: string) => {
    switch (type) {
      case 'weight':
        return <Weight className="h-4 w-4" />;
      case 'time':
        return <Clock className="h-4 w-4" />;
      case 'reps':
        return <Target className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getScoringTypeLabel = (type: string) => {
    switch (type) {
      case 'weight':
        return 'Peso';
      case 'time':
        return 'Tempo';
      case 'reps':
        return 'Ripetizioni';
      case 'distance':
        return 'Distanza';
      case 'points':
        return 'Punti';
      default:
        return type;
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
          <h2 className="text-2xl font-bold text-gray-900">Discipline Personalizzate</h2>
          <p className="text-gray-600">{competition.name}</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuova Disciplina
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingDiscipline) && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingDiscipline ? 'Modifica Disciplina' : 'Nuova Disciplina'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Disciplina *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Es. Squat Raw"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <select
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="powerlifting">Powerlifting</option>
                <option value="strongman">Strongman</option>
                <option value="weightlifting">Weightlifting</option>
                <option value="streetlifting">Streetlifting</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo di Punteggio
              </label>
              <select
                value={formData.scoringType}
                onChange={(e) => setFormData({ ...formData, scoringType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="weight">Peso</option>
                <option value="time">Tempo</option>
                <option value="reps">Ripetizioni</option>
                <option value="distance">Distanza</option>
                <option value="points">Punti</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipaggiamento
              </label>
              <input
                type="text"
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Es. Raw, Equipped, ecc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tentativi Massimi
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxAttempts}
                onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Limite (secondi)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Breve descrizione della disciplina..."
            />
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Regole
            </label>
            <textarea
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Regole dettagliate per l'esecuzione della disciplina..."
            />
          </div>
          
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Disciplina attiva
            </label>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button
              onClick={editingDiscipline ? handleUpdateDiscipline : handleCreateDiscipline}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {editingDiscipline ? 'Aggiorna' : 'Crea'} Disciplina
            </button>
            
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Disciplines List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {disciplines.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {disciplines.map((discipline) => (
              <div key={discipline.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {discipline.name}
                      </h3>
                      
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        discipline.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {discipline.isActive ? 'Attiva' : 'Inattiva'}
                      </span>
                      
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getScoringTypeIcon(discipline.scoringType)}
                        {getScoringTypeLabel(discipline.scoringType)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-2">{discipline.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Sport:</span> {discipline.sport}
                      </div>
                      <div>
                        <span className="font-medium">Equipaggiamento:</span> {discipline.equipment || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Tentativi:</span> {discipline.maxAttempts}
                      </div>
                      <div>
                        <span className="font-medium">Tempo limite:</span> {discipline.timeLimit}s
                      </div>
                    </div>
                    
                    {discipline.rules && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Regole:</span> {discipline.rules}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(discipline.id)}
                      className={`p-2 rounded-lg ${
                        discipline.isActive
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={discipline.isActive ? 'Disattiva' : 'Attiva'}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => startEdit(discipline)}
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                      title="Modifica"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteDiscipline(discipline.id)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna disciplina personalizzata</h3>
            <p className="mt-1 text-sm text-gray-500">
              Crea la prima disciplina personalizzata per questa competizione
            </p>
          </div>
        )}
      </div>

      {/* Standard Disciplines Reference */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Discipline Standard Disponibili</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(DISCIPLINES_BY_SPORT).map(([sport, disciplines]) => (
            <div key={sport} className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 capitalize">{sport}</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {disciplines.map((discipline, index) => (
                  <li key={index}>• {typeof discipline === 'string' ? discipline : discipline.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomDisciplineManager;