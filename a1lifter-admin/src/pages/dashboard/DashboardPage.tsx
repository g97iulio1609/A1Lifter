import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JudgeModeActivator } from '@/components/judge/JudgeModeActivator';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, Database } from 'lucide-react';
import { testDataService } from '@/services/testDataInitializer';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isInitializingData, setIsInitializingData] = useState(false);

  const handleInitializeTestData = async () => {
    setIsInitializingData(true);
    try {
      await testDataService.initializeTestData();
      toast.success('Dati di test inizializzati con successo!');
    } catch (error) {
      console.error('Error initializing test data:', error);
      toast.error('Errore nell\'inizializzazione dei dati di test');
    } finally {
      setIsInitializingData(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Benvenuto nel pannello di amministrazione A1Lifter
        </p>
      </div>

      {/* Widget modalità giudice per i giudici */}
      {user?.role === 'judge' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Eye className="mr-2 h-5 w-5" />
              Modalità Giudice
            </CardTitle>
            <CardDescription className="text-blue-600">
              Attiva la modalità giudice per una competizione in corso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JudgeModeActivator onJudgeModeEnabled={() => {}} />
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Atleti Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Atleti registrati
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Competizioni Attive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Competizioni in corso
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Risultati Oggi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Risultati inseriti oggi
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Record Battuti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Record battuti questo mese
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Inizializzazione dati di test */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <Database className="mr-2 h-5 w-5" />
            Dati di Test
          </CardTitle>
          <CardDescription className="text-orange-600">
            Inizializza atleti, competizioni e registrazioni di test per sviluppo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleInitializeTestData}
            disabled={isInitializingData}
            variant="outline"
            className="w-full"
          >
            {isInitializingData ? 'Inizializzazione in corso...' : 'Inizializza Dati di Test'}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Attività Recenti</CardTitle>
          <CardDescription>
            Le ultime attività del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nessuna attività recente
          </p>
        </CardContent>
      </Card>
    </div>
  );
};