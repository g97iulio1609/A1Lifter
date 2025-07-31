import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, UserCheck, UserX, Award } from 'lucide-react';
import { judgeService } from '@/services/judges';
import type { Judge, JudgeAssignment } from '@/types';
import { toast } from 'sonner';

interface JudgeManagementProps {
  competitionId?: string;
  onJudgeSelect?: (judge: Judge) => void;
}

const JudgeManagement: React.FC<JudgeManagementProps> = ({ 
  competitionId 
}) => {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    loadJudges();
    if (competitionId) {
      loadAssignments();
    }
  }, [competitionId]);

  const loadJudges = async () => {
    try {
      setLoading(true);
      const judgesData = await judgeService.getAllJudges();
      setJudges(judgesData);
    } catch (error) {
      console.error('Error loading judges:', error);
      toast.error('Errore durante il caricamento dei giudici');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!competitionId) return;
    
    try {
      const assignmentsData = await judgeService.getCompetitionJudges(competitionId);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Errore durante il caricamento delle assegnazioni');
    }
  };

  const handleCreateJudge = async (judgeData: Omit<Judge, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await judgeService.createJudge(judgeData);
      toast.success('Giudice creato con successo');
      setShowCreateModal(false);
      loadJudges();
    } catch (error) {
      console.error('Error creating judge:', error);
      toast.error('Errore durante la creazione del giudice');
    }
  };



  const handleDeleteJudge = async (judgeId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo giudice?')) return;
    
    try {
      await judgeService.deleteJudge(judgeId);
      toast.success('Giudice eliminato con successo');
      loadJudges();
    } catch (error) {
      console.error('Error deleting judge:', error);
      toast.error('Errore durante l\'eliminazione del giudice');
    }
  };

  const handleAssignJudge = async (judgeId: string, sessionId: string, role: 'head' | 'side') => {
    if (!competitionId) return;
    
    try {
      await judgeService.assignJudgeToCompetition({
        judgeId,
        competitionId,
        sessionId,
        role,
        position: Math.min(assignments.length + 1, 3) as 1 | 2 | 3,
        isActive: true,
        assignedAt: new Date()
      });
      toast.success('Giudice assegnato con successo');
      setShowAssignModal(false);
      loadAssignments();
    } catch (error) {
      console.error('Error assigning judge:', error);
      toast.error('Errore durante l\'assegnazione del giudice');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questa assegnazione?')) return;
    
    try {
      await judgeService.removeJudgeAssignment(assignmentId);
      toast.success('Assegnazione rimossa con successo');
      loadAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Errore durante la rimozione dell\'assegnazione');
    }
  };

  const filteredJudges = judges.filter(judge => {
    const matchesSearch = judge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         judge.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || judge.certificationLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getAssignedJudgeIds = () => {
    return new Set(assignments.map(a => a.judgeId));
  };

  const getCertificationBadgeColor = (level: string) => {
    switch (level) {
      case 'international': return 'bg-purple-100 text-purple-800';
      case 'national': return 'bg-blue-100 text-blue-800';
      case 'regional': return 'bg-green-100 text-green-800';
      case 'local': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Gestione Giudici</h2>
          <p className="text-gray-600 mt-1">
            {competitionId ? 'Gestisci i giudici per questa competizione' : 'Gestisci tutti i giudici del sistema'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuovo Giudice
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Cerca giudici..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tutti i livelli</option>
            <option value="international">Internazionale</option>
            <option value="national">Nazionale</option>
            <option value="regional">Regionale</option>
            <option value="local">Locale</option>
          </select>
        </div>
      </div>

      {/* Assigned Judges (if competition context) */}
      {competitionId && assignments.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Giudici Assegnati</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignments.map((assignment) => {
              const judge = judges.find(j => j.id === assignment.judgeId);
              if (!judge) return null;
              
              return (
                <div key={assignment.id} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{judge.name}</p>
                      <p className="text-sm text-gray-600">
                        {assignment.role === 'head' ? 'Giudice Capo' : 'Giudice Laterale'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Judges List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giudice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificazione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Esperienza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sport
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJudges.map((judge) => {
                const isAssigned = getAssignedJudgeIds().has(judge.id);
                
                return (
                  <tr key={judge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {judge.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{judge.name}</div>
                          <div className="text-sm text-gray-500">{judge.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getCertificationBadgeColor(judge.certificationLevel)
                      }`}>
                        {judge.certificationLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {judge.experienceYears || 0} anni
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {judge.specializations?.map((sport: string) => (
                          <span key={sport} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {sport}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          judge.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {judge.isActive ? 'Attivo' : 'Inattivo'}
                        </span>
                        {isAssigned && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Assegnato
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {competitionId && !isAssigned && judge.isActive && (
                          <button
                            onClick={() => {
                              setSelectedJudge(judge);
                              setShowAssignModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Assegna alla competizione"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedJudge(judge);
                            // Apri modal di modifica
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="Modifica"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteJudge(judge.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredJudges.length === 0 && (
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun giudice trovato</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterLevel !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia creando il tuo primo giudice'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Judge Modal */}
      {showCreateModal && (
        <CreateJudgeModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateJudge}
        />
      )}

      {/* Assign Judge Modal */}
      {showAssignModal && selectedJudge && (
        <AssignJudgeModal
          judge={selectedJudge}
          competitionId={competitionId!}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedJudge(null);
          }}
          onSubmit={handleAssignJudge}
        />
      )}
    </div>
  );
};

// Create Judge Modal Component
interface CreateJudgeModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<Judge, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const CreateJudgeModal: React.FC<CreateJudgeModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    certificationLevel: 'local' as const,
    certificationNumber: '',
    experienceYears: 0,
    federations: [] as string[],
    certifications: [] as any[],
    specializations: [] as string[],
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSportToggle = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(sport)
        ? prev.specializations.filter(s => s !== sport)
        : [...prev.specializations, sport]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Nuovo Giudice</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Livello Certificazione *
            </label>
            <select
              required
              value={formData.certificationLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, certificationLevel: e.target.value as any }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="local">Locale</option>
              <option value="regional">Regionale</option>
              <option value="national">Nazionale</option>
              <option value="international">Internazionale</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numero Certificazione
            </label>
            <input
              type="text"
              value={formData.certificationNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, certificationNumber: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anni di Esperienza
            </label>
            <input
              type="number"
              min="0"
              value={formData.experienceYears}
              onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport di Competenza
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['powerlifting', 'strongman', 'weightlifting', 'streetlifting'].map((sport) => (
                <label key={sport} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.specializations.includes(sport)}
                    onChange={() => handleSportToggle(sport)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{sport}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Giudice attivo
            </label>
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crea Giudice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Assign Judge Modal Component
interface AssignJudgeModalProps {
  judge: Judge;
  competitionId: string;
  onClose: () => void;
  onSubmit: (judgeId: string, sessionId: string, role: 'head' | 'side') => void;
}

const AssignJudgeModal: React.FC<AssignJudgeModalProps> = ({ 
  judge, 
  onClose, 
  onSubmit 
}) => {
  const [sessionId, setSessionId] = useState('');
  const [role, setRole] = useState<'head' | 'side'>('side');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(judge.id, sessionId, role);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Assegna Giudice</h3>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium">{judge.name}</p>
          <p className="text-sm text-gray-600">{judge.certificationLevel}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Sessione *
            </label>
            <input
              type="text"
              required
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="es. session_1, morning, evening"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ruolo *
            </label>
            <select
              required
              value={role}
              onChange={(e) => setRole(e.target.value as 'head' | 'side')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="side">Giudice Laterale</option>
              <option value="head">Giudice Capo</option>
            </select>
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Assegna
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JudgeManagement;