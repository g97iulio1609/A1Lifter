import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useOrphanedRegistrationsCleanup } from '@/hooks/useOrphanedRegistrationsCleanup';

interface CleanupResult {
  cleaned: number;
  errors: string[];
}

export function OrphanedRegistrationsCleanup() {
  const [lastResult, setLastResult] = useState<CleanupResult | null>(null);
  const cleanupMutation = useOrphanedRegistrationsCleanup();

  const handleCleanup = async () => {
    try {
      const result = await cleanupMutation.mutateAsync();
      setLastResult(result);
    } catch (error) {
      // L'errore è già gestito nel hook
      console.error('Cleanup failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Pulizia Iscrizioni Orfane
        </CardTitle>
        <CardDescription>
          Rimuovi le iscrizioni che fanno riferimento a atleti o competizioni che non esistono più.
          Questo può risolvere errori di visualizzazione e migliorare le prestazioni.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleCleanup} 
          disabled={cleanupMutation.isPending}
          variant="destructive"
          className="w-full"
        >
          {cleanupMutation.isPending ? 'Pulizia in corso...' : 'Avvia Pulizia'}
        </Button>
        
        {lastResult && (
          <div className="space-y-2">
            {lastResult.cleaned > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Pulite {lastResult.cleaned} iscrizioni orfane
                </AlertDescription>
              </Alert>
            )}
            
            {lastResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {lastResult.errors.length} errori durante la pulizia:
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {lastResult.errors.slice(0, 3).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {lastResult.errors.length > 3 && (
                      <li>... e altri {lastResult.errors.length - 3} errori</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {lastResult.cleaned === 0 && lastResult.errors.length === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Nessuna iscrizione orfana trovata. Il database è pulito!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}