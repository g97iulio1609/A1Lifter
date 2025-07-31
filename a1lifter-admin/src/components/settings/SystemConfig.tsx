import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Timer, Users, Trophy, Shield, Bell, HardDrive } from 'lucide-react';
import { configService } from '@/services/config';
import type { SystemConfig } from '@/types';
import { toast } from 'sonner';

interface SystemConfigProps {
  onConfigChange?: (config: SystemConfig) => void;
}

interface ConfigSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({ title, description, icon, children }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
};

const SystemConfigComponent: React.FC<SystemConfigProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const systemConfig = await configService.getAllConfigs();
      
      // Converte l'array in oggetto per facilità d'uso
      const configObject: any = {};
      systemConfig.forEach(item => {
        if (typeof item.value === 'object' && item.value !== null) {
          Object.assign(configObject, item.value);
        } else {
          configObject[item.key] = item.value;
        }
      });
      setConfig(configObject);
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Errore durante il caricamento delle configurazioni');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigUpdate = (key: string, value: any) => {
    if (!config) return;
    
    const updatedConfig = { ...config, [key]: value };
    setConfig(updatedConfig);
    setHasChanges(true);
    
    if (onConfigChange) {
      onConfigChange(updatedConfig);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    setIsSaving(true);
    
    try {
      // Save each configuration key
      for (const [key, value] of Object.entries(config)) {
        await configService.setConfig(key, value);
      }
      
      setHasChanges(false);
      toast.success('Configurazione salvata con successo');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Errore durante il salvataggio della configurazione');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Sei sicuro di voler ripristinare le impostazioni predefinite?')) {
      return;
    }
    
    try {
      await configService.initializeDefaultConfigs();
      await loadConfig();
      setHasChanges(false);
      toast.success('Configurazione ripristinata alle impostazioni predefinite');
    } catch (error) {
      console.error('Error resetting config:', error);
      toast.error('Errore durante il ripristino della configurazione');
    }
  };

  const tabs = [
    { id: 'general', label: 'Generale', icon: <Settings className="h-4 w-4" /> },
    { id: 'competition', label: 'Competizioni', icon: <Trophy className="h-4 w-4" /> },
    { id: 'timing', label: 'Tempi', icon: <Timer className="h-4 w-4" /> },
    { id: 'users', label: 'Utenti', icon: <Users className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifiche', icon: <Bell className="h-4 w-4" /> },
    { id: 'backup', label: 'Backup', icon: <HardDrive className="h-4 w-4" /> }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <Settings className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Configurazione non disponibile</h3>
        <p className="mt-1 text-sm text-gray-500">Impossibile caricare la configurazione del sistema</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurazione Sistema</h2>
          <p className="text-gray-600">Gestisci le impostazioni globali del sistema</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Ripristina
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'general' && (
          <>
            <ConfigSection
              title="Impostazioni Generali"
              description="Configurazioni di base del sistema"
              icon={<Settings className="h-6 w-6 text-blue-600" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Sistema
                  </label>
                  <input
                    type="text"
                    value={config.systemName || 'A1Lifter'}
                    onChange={(e) => handleConfigUpdate('systemName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Versione
                  </label>
                  <input
                    type="text"
                    value={config.version || '1.0.0'}
                    onChange={(e) => handleConfigUpdate('version', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lingua Predefinita
                  </label>
                  <select
                    value={config.defaultLanguage || 'it'}
                    onChange={(e) => handleConfigUpdate('defaultLanguage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="it">Italiano</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={config.timezone || 'Europe/Rome'}
                    onChange={(e) => handleConfigUpdate('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Europe/Rome">Europe/Rome</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>
              </div>
            </ConfigSection>
            
            <ConfigSection
              title="Sicurezza"
              description="Impostazioni di sicurezza e autenticazione"
              icon={<Shield className="h-6 w-6 text-green-600" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.requireTwoFactor || false}
                      onChange={(e) => handleConfigUpdate('requireTwoFactor', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Richiedi autenticazione a due fattori
                    </span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durata Sessione (minuti)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="1440"
                    value={config.sessionTimeout || 480}
                    onChange={(e) => handleConfigUpdate('sessionTimeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </ConfigSection>
          </>
        )}

        {activeTab === 'competition' && (
          <>
            <ConfigSection
              title="Impostazioni Competizioni"
              description="Configurazioni per le competizioni"
              icon={<Trophy className="h-6 w-6 text-yellow-600" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Massimo Partecipanti per Competizione
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={config.maxParticipantsPerCompetition || 200}
                    onChange={(e) => handleConfigUpdate('maxParticipantsPerCompetition', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giorni Anticipo Registrazione
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={config.registrationAdvanceDays || 30}
                    onChange={(e) => handleConfigUpdate('registrationAdvanceDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.allowLateRegistration || false}
                      onChange={(e) => handleConfigUpdate('allowLateRegistration', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Consenti registrazioni tardive
                    </span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.requireWeighIn || true}
                      onChange={(e) => handleConfigUpdate('requireWeighIn', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Richiedi pesata ufficiale
                    </span>
                  </label>
                </div>
              </div>
            </ConfigSection>
          </>
        )}

        {activeTab === 'timing' && (
          <>
            <ConfigSection
              title="Impostazioni Tempi"
              description="Configurazioni per timer e tempi di gara"
              icon={<Timer className="h-6 w-6 text-purple-600" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo Tentativo Powerlifting (secondi)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={config.powerliftingAttemptTime || 60}
                    onChange={(e) => handleConfigUpdate('powerliftingAttemptTime', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo Tentativo Weightlifting (secondi)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={config.weightliftingAttemptTime || 60}
                    onChange={(e) => handleConfigUpdate('weightliftingAttemptTime', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo Pausa tra Tentativi (secondi)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="600"
                    value={config.breakTime || 120}
                    onChange={(e) => handleConfigUpdate('breakTime', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo Cambio Disciplina (secondi)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="1800"
                    value={config.disciplineChangeTime || 300}
                    onChange={(e) => handleConfigUpdate('disciplineChangeTime', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </ConfigSection>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <ConfigSection
              title="Gestione Utenti"
              description="Configurazioni per utenti e ruoli"
              icon={<Users className="h-6 w-6 text-indigo-600" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.allowSelfRegistration || true}
                      onChange={(e) => handleConfigUpdate('allowSelfRegistration', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Consenti auto-registrazione
                    </span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.requireEmailVerification || true}
                      onChange={(e) => handleConfigUpdate('requireEmailVerification', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Richiedi verifica email
                    </span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ruolo Predefinito
                  </label>
                  <select
                    value={config.defaultUserRole || 'athlete'}
                    onChange={(e) => handleConfigUpdate('defaultUserRole', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="athlete">Atleta</option>
                    <option value="coach">Allenatore</option>
                    <option value="judge">Giudice</option>
                    <option value="organizer">Organizzatore</option>
                  </select>
                </div>
              </div>
            </ConfigSection>
          </>
        )}

        {activeTab === 'notifications' && (
          <>
            <ConfigSection
              title="Notifiche"
              description="Configurazioni per le notifiche del sistema"
              icon={<Bell className="h-6 w-6 text-orange-600" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.enableEmailNotifications || true}
                      onChange={(e) => handleConfigUpdate('enableEmailNotifications', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Abilita notifiche email
                    </span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.enablePushNotifications || true}
                      onChange={(e) => handleConfigUpdate('enablePushNotifications', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Abilita notifiche push
                    </span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.notifyRecordBreaks || true}
                      onChange={(e) => handleConfigUpdate('notifyRecordBreaks', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Notifica record battuti
                    </span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.notifyTechnicalIssues || true}
                      onChange={(e) => handleConfigUpdate('notifyTechnicalIssues', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Notifica problemi tecnici
                    </span>
                  </label>
                </div>
              </div>
            </ConfigSection>
          </>
        )}

        {activeTab === 'backup' && (
          <>
            <ConfigSection
              title="Backup Automatico"
              description="Configurazioni per il backup automatico"
              icon={<HardDrive className="h-6 w-6 text-gray-600" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.enableAutoBackup || true}
                      onChange={(e) => handleConfigUpdate('enableAutoBackup', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Abilita backup automatico
                    </span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequenza Backup (ore)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={config.backupFrequencyHours || 24}
                    onChange={(e) => handleConfigUpdate('backupFrequencyHours', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup da Mantenere
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.maxBackupsToKeep || 30}
                    onChange={(e) => handleConfigUpdate('maxBackupsToKeep', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.compressBackups || true}
                      onChange={(e) => handleConfigUpdate('compressBackups', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Comprimi backup
                    </span>
                  </label>
                </div>
              </div>
            </ConfigSection>
          </>
        )}
      </div>

      {/* Save Indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-yellow-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Modifiche non salvate</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfigComponent;