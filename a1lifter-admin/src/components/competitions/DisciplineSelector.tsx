import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDisciplines, useCreateDiscipline, useDisciplinesBySport } from '@/hooks/useDisciplines';
import type { CustomDiscipline } from '@/types';
import { toast } from 'sonner';

const disciplineSchema = z.object({
  name: z.string().min(2, 'Nome deve avere almeno 2 caratteri'),
  sport: z.enum(['powerlifting', 'strongman', 'crossfit', 'weightlifting', 'streetlifting']),
  maxAttempts: z.number().min(1).max(10),
  unit: z.enum(['kg', 'lbs', 'reps', 'time', 'meters']),
  scoringType: z.enum(['weight', 'time', 'reps', 'points', 'distance']),
  description: z.string().optional(),
});

type DisciplineFormData = z.infer<typeof disciplineSchema>;

interface DisciplineSelectorProps {
  selectedDisciplines: CustomDiscipline[];
  onDisciplinesChange: (disciplines: CustomDiscipline[]) => void;
  competitionType: 'powerlifting' | 'strongman' | 'crossfit' | 'weightlifting' | 'streetlifting';
  onOrderChange: (orderedIds: string[]) => void;
  disciplineOrder: string[];
}

export const DisciplineSelector: React.FC<DisciplineSelectorProps> = ({
  selectedDisciplines,
  onDisciplinesChange,
  competitionType,
  onOrderChange,
  disciplineOrder
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const { isLoading } = useDisciplines();
  const { data: sportDisciplines = [] } = useDisciplinesBySport(competitionType);
  const createMutation = useCreateDiscipline();

  const form = useForm<DisciplineFormData>({
    resolver: zodResolver(disciplineSchema),
    defaultValues: {
      sport: competitionType,
      maxAttempts: competitionType === 'strongman' ? 4 : 3,
      unit: 'kg',
      scoringType: 'weight',
    }
  });

  // Filtra discipline disponibili per il tipo di competizione
  const availableDisciplines = sportDisciplines.filter(
    d => !selectedDisciplines.some(selected => selected.id === d.id)
  );

  const handleAddDiscipline = (discipline: CustomDiscipline) => {
    const updated = [...selectedDisciplines, discipline];
    onDisciplinesChange(updated);
    
    // Aggiorna l'ordine
    const newOrder = [...disciplineOrder, discipline.id];
    onOrderChange(newOrder);
  };

  const handleRemoveDiscipline = (disciplineId: string) => {
    const updated = selectedDisciplines.filter(d => d.id !== disciplineId);
    onDisciplinesChange(updated);
    
    // Rimuovi dall'ordine
    const newOrder = disciplineOrder.filter(id => id !== disciplineId);
    onOrderChange(newOrder);
  };

  const handleCreateDiscipline = async (data: DisciplineFormData) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Disciplina creata con successo');
      setIsCreateDialogOpen(false);
      form.reset();
  } catch {
      toast.error('Errore durante la creazione della disciplina');
    }
  };

  const handleDragStart = (e: React.DragEvent, disciplineId: string) => {
    setDraggedItem(disciplineId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) return;

    const currentOrder = [...disciplineOrder];
    const draggedIndex = currentOrder.indexOf(draggedItem);
    const targetIndex = currentOrder.indexOf(targetId);

    // Rimuovi l'elemento dalla posizione originale
    currentOrder.splice(draggedIndex, 1);
    
    // Inserisci nella nuova posizione
    currentOrder.splice(targetIndex, 0, draggedItem);
    
    onOrderChange(currentOrder);
    setDraggedItem(null);
  };

  if (isLoading) {
    return <div>Caricamento discipline...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Discipline selezionate con ordinamento */}
      <Card>
        <CardHeader>
          <CardTitle>Discipline Selezionate</CardTitle>
          <CardDescription>
            Trascina per cambiare l'ordine delle discipline nella gara
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDisciplines.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nessuna disciplina selezionata
            </p>
          ) : (
            <div className="space-y-2">
              {disciplineOrder
                .map(id => selectedDisciplines.find(d => d.id === id))
                .filter(Boolean)
                .map((discipline, index) => (
                <div
                  key={discipline!.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, discipline!.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, discipline!.id)}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card cursor-move hover:bg-accent"
                >
                  <div className="flex items-center space-x-3">
                    <Grip className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{discipline!.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {discipline!.maxAttempts} tentativi • {discipline!.unit}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDiscipline(discipline!.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discipline disponibili */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Discipline Disponibili</CardTitle>
              <CardDescription>
                Seleziona le discipline per {competitionType}
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crea Nuova
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crea Nuova Disciplina</DialogTitle>
                  <DialogDescription>
                    Crea una disciplina personalizzata per la tua competizione
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleCreateDiscipline)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Disciplina</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      placeholder="es. Atlas Stones"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="sport">Sport</Label>
                    <Select 
                      value={form.watch('sport')} 
                      onValueChange={(value) => form.setValue('sport', value as DisciplineFormData['sport'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="powerlifting">Powerlifting</SelectItem>
                        <SelectItem value="strongman">Strongman</SelectItem>
                        <SelectItem value="crossfit">CrossFit</SelectItem>
                        <SelectItem value="weightlifting">Weightlifting</SelectItem>
                        <SelectItem value="streetlifting">Streetlifting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxAttempts">Tentativi</Label>
                      <Input
                        id="maxAttempts"
                        type="number"
                        min="1"
                        max="10"
                        {...form.register('maxAttempts', { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unità</Label>
                      <Select 
                        value={form.watch('unit')} 
                        onValueChange={(value) => form.setValue('unit', value as DisciplineFormData['unit'])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="lbs">Lbs</SelectItem>
                          <SelectItem value="reps">Ripetizioni</SelectItem>
                          <SelectItem value="time">Tempo</SelectItem>
                          <SelectItem value="meters">Metri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="scoringType">Tipo di Punteggio</Label>
                    <Select 
                      value={form.watch('scoringType')} 
                      onValueChange={(value) => form.setValue('scoringType', value as DisciplineFormData['scoringType'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight">Peso</SelectItem>
                        <SelectItem value="time">Tempo</SelectItem>
                        <SelectItem value="reps">Ripetizioni</SelectItem>
                        <SelectItem value="points">Punti</SelectItem>
                        <SelectItem value="distance">Distanza</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrizione (opzionale)</Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      placeholder="Descrizione della disciplina..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Annulla
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Creazione...' : 'Crea Disciplina'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {availableDisciplines.length === 0 ? (
            <Alert>
              <AlertDescription>
                Tutte le discipline disponibili per {competitionType} sono già state selezionate.
                Puoi creare una nuova disciplina personalizzata.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-2">
              {availableDisciplines.map((discipline) => (
                <div
                  key={discipline.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card"
                >
                  <div>
                    <p className="font-medium">{discipline.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {discipline.maxAttempts} tentativi • {discipline.unit}
                      {discipline.description && ` • ${discipline.description}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddDiscipline(discipline)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};