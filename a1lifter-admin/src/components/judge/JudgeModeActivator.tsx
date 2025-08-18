import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, AlertTriangle, Check } from 'lucide-react';
import { useJudgeMode } from '@/hooks/useJudgeMode';
import { useCompetitions } from '@/hooks/useCompetitions';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

interface JudgeModeActivatorProps {
  onJudgeModeEnabled: () => void;
}

export const JudgeModeActivator: React.FC<JudgeModeActivatorProps> = ({
  onJudgeModeEnabled
}) => {
  const { canJudgeCompetition } = useAuth();
  const { enableJudgeMode, canEnableJudgeMode } = useJudgeMode();
  const { data: competitions = [] } = useCompetitions({ status: 'active' });
  
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<1 | 2 | 3 | ''>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filtra competizioni per cui il giudice ha i permessi
  const eligibleCompetitions = competitions.filter(comp => 
    canJudgeCompetition(comp.id) && canEnableJudgeMode(comp.id)
  );

  const getPositionLabel = (position: 1 | 2 | 3) => {
    switch (position) {
      case 1: return 'Sinistra';
      case 2: return 'Centro';  
      case 3: return 'Destra';
    }
  };

  const handleEnableJudgeMode = () => {
    if (!selectedCompetition || !selectedPosition) {
      toast.error('Seleziona competizione e posizione');
      return;
    }

    try {
      enableJudgeMode(selectedCompetition, selectedPosition as 1 | 2 | 3);
      toast.success(`Modalità giudice attivata - Posizione ${getPositionLabel(selectedPosition as 1 | 2 | 3)}`);
      setIsDialogOpen(false);
      onJudgeModeEnabled();
    } catch (error) {
      toast.error('Errore nell\'attivazione della modalità giudice');
      console.error('Error enabling judge mode:', error);
    }
  };

  if (eligibleCompetitions.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Non ci sono competizioni attive per cui hai i permessi di giudizio.
          Contatta l'organizzatore per essere abilitato.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Eye className="mr-2 h-4 w-4" />
          Attiva Modalità Giudice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Attiva Modalità Giudice</DialogTitle>
          <DialogDescription>
            Seleziona la competizione e la tua posizione per attivare la modalità giudice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selezione competizione */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Competizione</label>
            <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona una competizione" />
              </SelectTrigger>
              <SelectContent>
                {eligibleCompetitions.map((competition) => (
                  <SelectItem key={competition.id} value={competition.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{competition.name}</span>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge variant="outline">
                          {format(competition.date, 'dd MMM', { locale: it })}
                        </Badge>
                        <Badge className="bg-blue-500">
                          {competition.type}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dettagli competizione selezionata */}
          {selectedCompetition && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {eligibleCompetitions.find(c => c.id === selectedCompetition)?.name}
                </CardTitle>
                <CardDescription>
                  {eligibleCompetitions.find(c => c.id === selectedCompetition)?.location} • 
                  {format(eligibleCompetitions.find(c => c.id === selectedCompetition)?.date || new Date(), 'dd MMMM yyyy', { locale: it })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">
                      {eligibleCompetitions.find(c => c.id === selectedCompetition)?.type === 'powerlifting' ? 'Powerlifting' : 'Strongman'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Iscritti</p>
                    <p className="font-medium">
                      {eligibleCompetitions.find(c => c.id === selectedCompetition)?.registrationsCount || 0} atleti
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selezione posizione giudice */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Posizione Giudice</label>
            <Select value={selectedPosition.toString()} onValueChange={(value) => setSelectedPosition(value as 1 | 2 | 3 | '')}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona la tua posizione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Giudice Sinistra (1)
                  </div>
                </SelectItem>
                <SelectItem value="2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Giudice Centro (2)
                  </div>
                </SelectItem>
                <SelectItem value="3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    Giudice Destra (3)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Seleziona la posizione che ti è stata assegnata dall'organizzatore
            </p>
          </div>

          {/* Informazioni modalità giudice */}
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              <strong>Modalità Giudice:</strong> L'interfaccia sarà semplificata per mostrare solo l'alzata corrente.
              Potrai votare "Valida" o "Non Valida" e correggere il voto se necessario.
              I tuoi voti saranno salvati automaticamente.
            </AlertDescription>
          </Alert>

          {/* Pulsanti */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleEnableJudgeMode}
              disabled={!selectedCompetition || !selectedPosition}
            >
              <Eye className="mr-2 h-4 w-4" />
              Attiva Modalità
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};