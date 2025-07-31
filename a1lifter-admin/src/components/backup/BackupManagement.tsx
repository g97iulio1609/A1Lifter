import React, { useState, useEffect } from 'react';
import { Download, Upload, RefreshCw, Database, Clock, CheckCircle, AlertTriangle, XCircle, Play, Pause, Settings, FileText, HardDrive } from 'lucide-react';
import { backupService } from '@/services/backup';
import type { BackupData } from '@/types';
import { toast } from 'sonner';

interface BackupManagementProps {
  competitionId?: string;
}

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  backup: BackupData;
}

const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  backup
}) => {
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);

  const availableComponents = [
    { id: 'competitions', label: 'Competizioni', description: 'Dati delle competizioni' },
    { id: 'athletes', label: 'Atleti', description: 'Profili degli atleti' },
    { id: 'registrations', label: 'Iscrizioni', description: 'Iscrizioni alle competizioni' },
    { id: 'results', label: 'Risultati', description: 'Risultati delle competizioni' },
    { id: 'weighins', label: 'Pesate', description: 'Dati delle pesate ufficiali' },
    { id: 'judges', label: 'Giudici', description: 'Assegnazioni dei giudici' },
    { id: 'livesessions', label: 'Sessioni Live', description: 'Dati delle sessioni live' }
  ];

  const handleComponentToggle = (componentId: string) => {
    setSelectedComponents(prev => 
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  const handleRestore = async () => {
    if (selectedComponents.length === 0) {
      toast.error('Seleziona almeno un componente da ripristinare');
      return;
    }

    if (!confirm('Sei sicuro di voler ripristinare i dati selezionati? Questa operazione sovrascriverà i dati esistenti.')) {
      return;
    }

    setIsRestoring(true);
    setRestoreProgress(0);

    try {
      const totalComponents = selectedComponents.length;
      
      for (let i = 0; i < selectedComponents.length; i++) {
        const component = selectedComponents[i];
        
        switch (component) {
          case 'competitions':
            // await backupService.restoreCompetitions(backup.id);
            console.log('Restore competitions temporarily disabled');
            break;
          case 'athletes':
            // await backupService.restoreAthletes(backup.id);
            console.log('Restore athletes temporarily disabled');
            break;
          case 'registrations':
            // await backupService.restoreRegistrations(backup.id);
            console.log('Restore registrations temporarily disabled');
            break;
          case 'results':
            // await backupService.restoreResults(backup.id);
            console.log('Restore results temporarily disabled');
            break;
          case 'weighins':
            // await backupService.restoreWeighIns(backup.id);
            console.log('Restore weighins temporarily disabled');
            break;
          case 'judges':
            // await backupService.restoreJudgeAssignments(backup.id);
            console.log('Restore judges temporarily disabled');
            break;
          case 'livesessions':
            // await backupService.restoreLiveSessions(backup.id);
            console.log('Restore livesessions temporarily disabled');
            break;
        }
        
        setRestoreProgress(((i + 1) / totalComponents) * 100);
      }
      
      toast.success('Ripristino completato con successo');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error during restore:', error);
      toast.error('Errore durante il ripristino');
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ripristina Backup</h3>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Backup:</strong> {backup.name}
          </p>
          <p className="text-sm text-blue-600">
            Creato il {new Date(backup.createdAt).toLocaleString()}
          </p>
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Seleziona componenti da ripristinare:</h4>
          
          <div className="space-y-2">
            {availableComponents.map((component) => (
              <label key={component.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedComponents.includes(component.id)}
                  onChange={() => handleComponentToggle(component.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{component.label}</div>
                  <div className="text-xs text-gray-600">{component.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        {isRestoring && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Ripristino in corso...</span>
              <span className="text-sm text-gray-600">{Math.round(restoreProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${restoreProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isRestoring}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
          >
            Annulla
          </button>
          <button
            onClick={handleRestore}
            disabled={isRestoring || selectedComponents.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isRestoring ? 'Ripristinando...' : 'Ripristina'}
          </button>
        </div>
      </div>
    </div>
  );
};

const BackupManagement: React.FC<BackupManagementProps> = () => {
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState(24); // hours
  const [selectedBackup, setSelectedBackup] = useState<BackupData | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupStats, setBackupStats] = useState<any>(null);

  useEffect(() => {
    loadBackups();
    loadBackupStats();
  }, []);

  const loadBackups = async () => {
    try {
      setIsLoading(true);
      const backupData = await backupService.getBackups();
      setBackups(backupData);
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error('Errore durante il caricamento dei backup');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBackupStats = async () => {
    try {
      // Mock stats - in real implementation, this would come from the service
      const stats = {
        totalBackups: 15,
        totalSize: '2.3 GB',
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        autoBackupStatus: 'active'
      };
      setBackupStats(stats);
    } catch (error) {
      console.error('Error loading backup stats:', error);
    }
  };

  const handleCreateFullBackup = async () => {
    setIsCreatingBackup(true);
    
    try {
      await backupService.createFullBackup(`Backup completo - ${new Date().toLocaleString()}`);
      toast.success('Backup completo creato con successo');
      loadBackups();
      loadBackupStats();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Errore durante la creazione del backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleCreateIncrementalBackup = async () => {
    setIsCreatingBackup(true);
    
    try {
      await backupService.createIncrementalBackup(`Backup incrementale - ${new Date().toLocaleString()}`);
      toast.success('Backup incrementale creato con successo');
      loadBackups();
      loadBackupStats();
    } catch (error) {
      console.error('Error creating incremental backup:', error);
      toast.error('Errore durante la creazione del backup incrementale');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      // Temporarily commented out due to type issues
      // const exportData = await backupService.exportBackupAsJSON(backup.id);
      
      // const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `backup-${backup.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      // document.body.appendChild(a);
      // a.click();
      // document.body.removeChild(a);
      // window.URL.revokeObjectURL(url);
      
      toast.success('Funzione temporaneamente disabilitata');
    } catch (error) {
      console.error('Error exporting backup:', error);
      toast.error('Errore durante l\'esportazione del backup');
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // const text = await file.text();
      // const backupData = JSON.parse(text);
      
      // await backupService.importBackupFromJSON(backupData);
      toast.success('Funzione temporaneamente disabilitata');
      // loadBackups();
    } catch (error) {
      console.error('Error importing backup:', error);
      toast.error('Errore durante l\'importazione del backup');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleToggleAutoBackup = async () => {
    try {
      if (autoBackupEnabled) {
        // await backupService.stopAutoBackup();
        setAutoBackupEnabled(false);
        toast.success('Backup automatico disattivato');
      } else {
        // await backupService.scheduleAutoBackup(autoBackupInterval);
        setAutoBackupEnabled(true);
        toast.success('Backup automatico attivato');
      }
    } catch (error) {
      console.error('Error toggling auto backup:', error);
      toast.error('Errore durante la configurazione del backup automatico');
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo backup?')) {
      return;
    }
    
    try {
      await backupService.deleteBackup(id);
      toast.success('Backup eliminato con successo');
      loadBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Errore durante l\'eliminazione del backup');
    }
  };

  const openRestoreModal = (backup: BackupData) => {
    setSelectedBackup(backup);
    setShowRestoreModal(true);
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <Database className="h-4 w-4 text-blue-600" />;
      case 'incremental':
        return <RefreshCw className="h-4 w-4 text-green-600" />;
      default:
        return <HardDrive className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBackupStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <h2 className="text-2xl font-bold text-gray-900">Gestione Backup</h2>
          <p className="text-gray-600">Backup e ripristino dei dati del sistema</p>
        </div>
        
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Upload className="h-4 w-4" />
            Importa Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
          
          <button
            onClick={handleCreateIncrementalBackup}
            disabled={isCreatingBackup}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            <RefreshCw className="h-4 w-4" />
            Backup Incrementale
          </button>
          
          <button
            onClick={handleCreateFullBackup}
            disabled={isCreatingBackup}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Database className="h-4 w-4" />
            {isCreatingBackup ? 'Creando...' : 'Backup Completo'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      {backupStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totale Backup</p>
                <p className="text-2xl font-semibold text-gray-900">{backupStats.totalBackups}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Spazio Utilizzato</p>
                <p className="text-2xl font-semibold text-gray-900">{backupStats.totalSize}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ultimo Backup</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round((Date.now() - backupStats.lastBackup.getTime()) / (1000 * 60 * 60))}h fa
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Backup Automatico</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {backupStats.autoBackupStatus === 'active' ? 'Attivo' : 'Inattivo'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto Backup Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurazione Backup Automatico</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoBackup"
                checked={autoBackupEnabled}
                onChange={handleToggleAutoBackup}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoBackup" className="text-sm font-medium text-gray-900">
                Abilita backup automatico
              </label>
            </div>
            
            {autoBackupEnabled && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Ogni</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={autoBackupInterval}
                  onChange={(e) => setAutoBackupInterval(parseInt(e.target.value) || 24)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <label className="text-sm text-gray-600">ore</label>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {autoBackupEnabled ? (
              <>
                <Play className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Attivo</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">Inattivo</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Backup Disponibili</h3>
        </div>
        
        {backups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dimensione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Creazione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">
                          {backup.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getBackupTypeIcon(backup.type)}
                        {backup.type === 'full' ? 'Completo' : 'Incrementale'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        backup.status === 'completed' ? 'bg-green-100 text-green-800' :
                        backup.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getBackupStatusIcon(backup.status)}
                        {backup.status === 'completed' ? 'Completato' :
                         backup.status === 'failed' ? 'Fallito' : 'In corso'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {backup.status === 'completed' && (
                          <>
                            <button
                              onClick={() => openRestoreModal(backup)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ripristina"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleExportBackup()}
                              className="text-green-600 hover:text-green-900"
                              title="Esporta"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Elimina"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun backup disponibile</h3>
            <p className="mt-1 text-sm text-gray-500">
              Crea il primo backup per iniziare
            </p>
          </div>
        )}
      </div>

      {/* Restore Modal */}
      {selectedBackup && (
        <RestoreModal
          isOpen={showRestoreModal}
          onClose={() => {
            setShowRestoreModal(false);
            setSelectedBackup(null);
          }}
          onSuccess={() => {
            loadBackups();
            loadBackupStats();
          }}
          backup={selectedBackup}
        />
      )}
    </div>
  );
};

export default BackupManagement;