import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DisciplineSelector } from './DisciplineSelector';
import { useInitializeDefaultDisciplines } from '@/hooks/useDisciplines';
import type { Competition, CustomDiscipline } from '@/types';

const categorySchema = z.object({
  id: z.string().min(1, 'ID categoria richiesto'),
  name: z.string().min(1, 'Nome categoria richiesto'),
  gender: z.enum(['M', 'F'], { message: 'Seleziona il genere' }),
  weightClass: z.string().min(1, 'Categoria di peso richiesta'),
  ageGroup: z.string().optional(),
});

const competitionSchema = z.object({
  name: z.string().min(2, 'Nome deve avere almeno 2 caratteri'),
  date: z.string().min(1, 'Data competizione richiesta'),
  location: z.string().min(1, 'Luogo competizione richiesto'),
  type: z.enum(['powerlifting', 'strongman', 'crossfit', 'weightlifting', 'streetlifting'], { message: 'Seleziona il tipo' }),
  status: z.enum(['draft', 'active', 'in_progress', 'completed'], { message: 'Seleziona lo stato' }),
  categories: z.array(categorySchema).min(1, 'Aggiungi almeno una categoria'),
  rules: z.object({
    attempts: z.number().min(1).max(10),
    disciplines: z.array(z.string()).min(1, 'Seleziona almeno una disciplina'),
    scoringSystem: z.enum(['ipf', 'wilks', 'dots'], { message: 'Seleziona il sistema di punteggio' }),
  }),
  // Nuovi campi per il sistema avanzato
  selectedDisciplines: z.array(z.any()).optional(), // Le discipline custom selezionate
  disciplineOrder: z.array(z.string()).optional(), // L'ordine delle discipline
});

type CompetitionFormData = z.infer<typeof competitionSchema>;

interface CompetitionFormProps {
  competition?: Competition;
  onSubmit: (data: CompetitionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const weightClasses = [
  '53kg', '59kg', '66kg', '74kg', '83kg', '93kg', '105kg', '120kg', '120kg+',
  '47kg', '52kg', '57kg', '63kg', '69kg', '76kg', '84kg', '84kg+'
];

export const CompetitionForm: React.FC<CompetitionFormProps> = ({
  competition,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [selectedDisciplines, setSelectedDisciplines] = useState<CustomDiscipline[]>([]);
  const [disciplineOrder, setDisciplineOrder] = useState<string[]>([]);
  const initializeMutation = useInitializeDefaultDisciplines();

  // Quando stiamo modificando una competizione esistente, carica le discipline salvate
  useEffect(() => {
    if (competition) {
      // Cast a any per gestire eventuali competizioni salvate prima dell'aggiunta del campo
      const comp: any = competition;

      if (Array.isArray(comp.selectedDisciplines)) {
        setSelectedDisciplines(comp.selectedDisciplines as CustomDiscipline[]);
      }

      if (Array.isArray(comp.disciplineOrder) && comp.disciplineOrder.length > 0) {
        setDisciplineOrder(comp.disciplineOrder as string[]);
      } else if (Array.isArray(comp.selectedDisciplines)) {
        // Fallback: ordina secondo l'ordine nel payload se l'ordine esplicito manca
        setDisciplineOrder((comp.selectedDisciplines as CustomDiscipline[]).map(d => d.id));
      }
    }
  }, [competition]);
  // Inizializza discipline predefinite al primo caricamento
  useEffect(() => {
    const initializeDefaults = async () => {
      try {
        await initializeMutation.mutateAsync();
      } catch (error) {
        console.error('Error initializing default disciplines:', error);
      }
    };
    
    initializeDefaults();
  }, []);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control
  } = useForm<CompetitionFormData>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      name: competition?.name || '',
      date: competition?.date ? competition.date.toISOString().split('T')[0] : '',
      location: competition?.location || '',
      type: competition?.type || undefined,
      status: competition?.status || 'draft',
      categories: competition?.categories || [],
      rules: {
        attempts: competition?.rules?.attempts || 3,
        disciplines: competition?.rules?.disciplines || [],
        scoringSystem: competition?.rules?.scoringSystem || undefined,
      },
    }
  });

  // Mantieni sincronizzate le discipline nel form per superare la validazione
  useEffect(() => {
    setValue('rules.disciplines', selectedDisciplines.map(d => d.name));
  }, [selectedDisciplines, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories',
  });

  const competitionType = watch('type');

  const handleFormSubmit = (data: CompetitionFormData) => {
    // Aggiorna i dati del form con le discipline selezionate
    const formDataWithDisciplines = {
      ...data,
      selectedDisciplines,
      disciplineOrder,
      rules: {
        ...data.rules,
        disciplines: selectedDisciplines.map(d => d.name), // mantieni compatibilità con il vecchio schema
      }
    };
    onSubmit(formDataWithDisciplines);
  };

  const addCategory = () => {
    append({
      id: `cat-${Date.now()}`,
      name: '',
      gender: 'M',
      weightClass: '',
      ageGroup: '',
    });
  };



  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>
          {competition ? 'Modifica Competizione' : 'Nuova Competizione'}
        </CardTitle>
        <CardDescription>
          {competition ? 'Modifica i dettagli della competizione' : 'Crea una nuova competizione'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Informazioni Generali</TabsTrigger>
              <TabsTrigger value="disciplines">Discipline</TabsTrigger>
              <TabsTrigger value="categories">Categorie</TabsTrigger>
              <TabsTrigger value="rules">Regole</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Competizione</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Campionato Italiano Powerlifting"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                  />
                  {errors.date && (
                    <p className="text-sm text-destructive">{errors.date.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Luogo</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Palestra XYZ, Via Roma 123, Milano"
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo Competizione</Label>
                  <Select onValueChange={(value) => setValue('type', value as 'powerlifting' | 'strongman' | 'crossfit' | 'weightlifting' | 'streetlifting')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="powerlifting">Powerlifting</SelectItem>
                      <SelectItem value="strongman">Strongman</SelectItem>
                      <SelectItem value="crossfit">CrossFit</SelectItem>
                      <SelectItem value="weightlifting">Weightlifting</SelectItem>
                      <SelectItem value="streetlifting">Streetlifting</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-destructive">{errors.type.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Stato</Label>
                  <Select onValueChange={(value) => setValue('status', value as 'draft' | 'active' | 'in_progress' | 'completed')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bozza</SelectItem>
                      <SelectItem value="active">Attiva</SelectItem>
                      <SelectItem value="in_progress">In Corso</SelectItem>
                      <SelectItem value="completed">Completata</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-destructive">{errors.status.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="disciplines" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Configurazione Discipline</h3>
                  <p className="text-sm text-muted-foreground">
                    Seleziona e ordina le discipline per questa competizione. 
                    Puoi creare discipline personalizzate per sport specifici.
                  </p>
                </div>
                
                {competitionType ? (
                  <DisciplineSelector
                    selectedDisciplines={selectedDisciplines}
                    onDisciplinesChange={setSelectedDisciplines}
                    competitionType={competitionType}
                    onOrderChange={setDisciplineOrder}
                    disciplineOrder={disciplineOrder}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Seleziona prima il tipo di competizione per configurare le discipline
                  </div>
                )}
                
                {selectedDisciplines.length === 0 && competitionType && (
                  <p className="text-sm text-destructive">Seleziona almeno una disciplina</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Categorie</h3>
                <Button type="button" onClick={addCategory} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi Categoria
                </Button>
              </div>
              
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Categoria {index + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Nome Categoria</Label>
                          <Input
                            {...register(`categories.${index}.name`)}
                            placeholder="Senior Men 83kg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Genere</Label>
                          <Select onValueChange={(value) => setValue(`categories.${index}.gender`, value as 'M' | 'F')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona genere" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M">Maschio</SelectItem>
                              <SelectItem value="F">Femmina</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Categoria di Peso</Label>
                          <Select onValueChange={(value) => setValue(`categories.${index}.weightClass`, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {weightClasses.map((weightClass) => (
                                <SelectItem key={weightClass} value={weightClass}>
                                  {weightClass}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Gruppo Età (opzionale)</Label>
                          <Input
                            {...register(`categories.${index}.ageGroup`)}
                            placeholder="Senior, Junior, Master..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {errors.categories && (
                <p className="text-sm text-destructive">{errors.categories.message}</p>
              )}
            </TabsContent>

            <TabsContent value="rules" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="attempts">Numero Tentativi</Label>
                  <Input
                    id="attempts"
                    type="number"
                    min="1"
                    max="10"
                    {...register('rules.attempts', { valueAsNumber: true })}
                  />
                  {errors.rules?.attempts && (
                    <p className="text-sm text-destructive">{errors.rules.attempts.message}</p>
                  )}
                </div>



                <div className="space-y-2">
                  <Label>Sistema di Punteggio</Label>
                  <Select onValueChange={(value) => setValue('rules.scoringSystem', value as 'ipf' | 'wilks' | 'dots')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ipf">IPF Points</SelectItem>
                      <SelectItem value="wilks">Wilks Score</SelectItem>
                      <SelectItem value="dots">DOTS Score</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.rules?.scoringSystem && (
                    <p className="text-sm text-destructive">{errors.rules.scoringSystem.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvataggio...' : (competition ? 'Aggiorna' : 'Crea')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annulla
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};