import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  X, 
  Calendar, 
  Trophy, 
  Users, 
  Settings, 
  Eye, 
  Clock,
  Euro,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  Target,
  FileText,
  Building,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

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
  description: z.string().optional(),
  date: z.string().min(1, 'Data competizione richiesta'),
  endDate: z.string().optional(),
  location: z.string().min(1, 'Luogo competizione richiesto'),
  venue: z.string().optional(),
  type: z.enum(['powerlifting', 'strongman', 'crossfit', 'weightlifting', 'streetlifting'], { message: 'Seleziona il tipo' }),
  status: z.enum(['draft', 'active', 'in_progress', 'completed'], { message: 'Seleziona lo stato' }),
  maxParticipants: z.number().min(1, 'Numero massimo partecipanti richiesto').optional(),
  registrationDeadline: z.string().optional(),
  entryFee: z.number().min(0, 'La quota deve essere positiva').optional(),
  categories: z.array(categorySchema).min(1, 'Aggiungi almeno una categoria'),
  rules: z.object({
    attempts: z.number().min(1).max(10),
    disciplines: z.array(z.string()).min(1, 'Seleziona almeno una disciplina'),
    scoringSystem: z.enum(['ipf', 'wilks', 'dots'], { message: 'Seleziona il sistema di punteggio' }),
    weighInTime: z.string().optional(),
    equipmentCheck: z.boolean().default(false),
  }),
  selectedDisciplines: z.array(z.any()).optional(),
  disciplineOrder: z.array(z.string()).optional(),
});

type CompetitionFormData = z.infer<typeof competitionSchema>;

interface CompetitionFormProps {
  competition?: Competition;
  onSubmit: (data: CompetitionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const weightClasses = {
  powerlifting: {
    men: ['59kg', '66kg', '74kg', '83kg', '93kg', '105kg', '120kg', '120kg+'],
    women: ['47kg', '52kg', '57kg', '63kg', '69kg', '76kg', '84kg', '84kg+']
  },
  strongman: {
    men: ['80kg', '90kg', '105kg', '105kg+'],
    women: ['60kg', '70kg', '80kg', '80kg+']
  },
  weightlifting: {
    men: ['55kg', '61kg', '67kg', '73kg', '81kg', '89kg', '96kg', '102kg', '109kg', '109kg+'],
    women: ['45kg', '49kg', '55kg', '59kg', '64kg', '71kg', '76kg', '81kg', '87kg', '87kg+']
  },
};
 
const competitionTemplates = {
  powerlifting: {
    name: 'Gara di Powerlifting',
    description: 'Competizione di powerlifting con squat, panca e stacco',
    rules: {
      attempts: 3,
      scoringSystem: 'ipf' as const,
      weighInTime: '08:00',
      equipmentCheck: true
    }
  },
  strongman: {
    name: 'Competizione Strongman',
    description: 'Gara di forza con prove multiple',
    rules: {
      attempts: 1,
      scoringSystem: 'dots' as const,
      weighInTime: '07:30',
      equipmentCheck: false
    }
  }
};

const TABS: { id: 'general' | 'disciplines' | 'categories' | 'rules'; title: string; description: string; icon: any; color: string }[] = [
  { 
    id: 'general', 
    title: 'Informazioni Generali', 
    description: 'Nome, data, luogo e dettagli base',
    icon: Info,
    color: 'blue'
  },
  { 
    id: 'disciplines', 
    title: 'Discipline', 
    description: 'Seleziona le discipline della competizione',
    icon: Target,
    color: 'amber'
  },
  { 
    id: 'categories', 
    title: 'Categorie', 
    description: 'Definisci le categorie di gara',
    icon: Users,
    color: 'green'
  },
  { 
    id: 'rules', 
    title: 'Regole & Configurazione', 
    description: 'Imposta regole e parametri di gara',
    icon: Settings,
    color: 'purple'
  }
];

export const CompetitionForm: React.FC<CompetitionFormProps> = ({
  competition,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [selectedDisciplines, setSelectedDisciplines] = useState<CustomDiscipline[]>([]);
  const [disciplineOrder, setDisciplineOrder] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [showPreview, setShowPreview] = useState(false);
  const initializeMutation = useInitializeDefaultDisciplines();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    control
  } = useForm<CompetitionFormData>({
    resolver: zodResolver(competitionSchema) as any,
    mode: 'onChange',
    defaultValues: {
      name: competition?.name || '',
      description: competition?.description || '',
      date: competition?.date ? competition.date.toISOString().split('T')[0] : '',
      endDate: (competition as any)?.endDate || '',
      location: competition?.location || '',
      venue: (competition as any)?.venue || '',
      type: competition?.type as any,
      status: competition?.status || 'draft',
      maxParticipants: (competition as any)?.maxParticipants,
      registrationDeadline: (competition as any)?.registrationDeadline ? new Date((competition as any).registrationDeadline).toISOString().slice(0, 16) : '',
      entryFee: (competition as any)?.entryFee,
      categories: competition?.categories || [],
      rules: {
        attempts: competition?.rules?.attempts || 3,
        disciplines: competition?.rules?.disciplines || [],
        scoringSystem: competition?.rules?.scoringSystem as any,
        weighInTime: (competition?.rules as any)?.weighInTime || '',
        equipmentCheck: (competition?.rules as any)?.equipmentCheck || false,
      },
    }
  });

  const watchedValues = watch();
  const competitionType = watch('type');
  const typeValue = watch('type');
  const statusValue = watch('status');
  const scoringValue = watch('rules.scoringSystem');
  const equipmentCheck = watch('rules.equipmentCheck');

  // Typed submit handler to satisfy RHF generics
  type SubmitData = CompetitionFormData;
  const onValidSubmit = (data: SubmitData) => {
    const formDataWithDisciplines = {
      ...data,
      selectedDisciplines,
      disciplineOrder,
      rules: {
        ...data.rules,
        disciplines: selectedDisciplines.map(d => d.name),
      }
    };
    onSubmit(formDataWithDisciplines as CompetitionFormData);
  };

  // Inizializza discipline predefinite
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

  // Carica dati competizione esistente
  useEffect(() => {
    if (competition) {
      const comp: any = competition;
      if (Array.isArray(comp.selectedDisciplines)) {
        setSelectedDisciplines(comp.selectedDisciplines as CustomDiscipline[]);
      }
      if (Array.isArray(comp.disciplineOrder) && comp.disciplineOrder.length > 0) {
        setDisciplineOrder(comp.disciplineOrder as string[]);
      }
    }
  }, [competition]);

  // Mantieni sincronizzate le discipline
  useEffect(() => {
    setValue('rules.disciplines', selectedDisciplines.map(d => d.name));
  }, [selectedDisciplines, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories',
  });

  // removed: replaced by onValidSubmit above

  const addCategory = () => {
    append({
      id: `cat-${Date.now()}`,
      name: '',
      gender: 'M',
      weightClass: '',
      ageGroup: '',
    });
  };

  const applyTemplate = (templateType: keyof typeof competitionTemplates) => {
    const template = competitionTemplates[templateType];
    setValue('name', template.name);
    setValue('description', template.description);
    setValue('type', templateType);
    setValue('rules.attempts', template.rules.attempts);
    setValue('rules.scoringSystem', template.rules.scoringSystem);
    setValue('rules.weighInTime', template.rules.weighInTime);
    setValue('rules.equipmentCheck', template.rules.equipmentCheck);
  };

  const getAvailableWeightClasses = (gender: 'M' | 'F') => {
    if (!competitionType || competitionType === 'crossfit' || competitionType === 'streetlifting') {
      return weightClasses.powerlifting[gender === 'F' ? 'women' : 'men'];
    }
    
    const classes = weightClasses[competitionType as keyof typeof weightClasses];
    if (!classes) return [];
    
    return gender === 'F' ? classes.women : classes.men;
  };

  const getFormProgress = () => {
    const totalTabs = TABS.length;
    let completedTabs = 0;
    
    // Tab 1: General info
    if (watchedValues.name && watchedValues.date && watchedValues.location && watchedValues.type) {
      completedTabs++;
    }
    // Tab 2: Disciplines
    if (selectedDisciplines.length > 0) {
      completedTabs++;
    }
    // Tab 3: Categories
    if (watchedValues.categories && watchedValues.categories.length > 0) {
      completedTabs++;
    }
    // Tab 4: Rules
    if (watchedValues.rules?.scoringSystem && watchedValues.rules?.attempts) {
      completedTabs++;
    }
    
    return (completedTabs / totalTabs) * 100;
  };

  const getTabStatus = (tabId: string) => {
    switch (tabId) {
      case 'general':
        return watchedValues.name && watchedValues.date && watchedValues.location && watchedValues.type ? 'completed' : 'incomplete';
      case 'disciplines':
        return selectedDisciplines.length > 0 ? 'completed' : 'incomplete';
      case 'categories':
        return watchedValues.categories && watchedValues.categories.length > 0 ? 'completed' : 'incomplete';
      case 'rules':
        return watchedValues.rules?.scoringSystem && watchedValues.rules?.attempts ? 'completed' : 'incomplete';
      default:
        return 'incomplete';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Semplificato */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {competition ? 'Modifica Competizione' : 'Nuova Competizione'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {competition ? 'Aggiorna i dettagli della competizione' : 'Crea una nuova competizione'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Nascondi' : 'Anteprima'}
            </Button>
            {!competition && (
              <Select onValueChange={applyTemplate}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="powerlifting">Powerlifting</SelectItem>
                  <SelectItem value="strongman">Strongman</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar Semplificato */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-muted-foreground">{Math.round(getFormProgress())}%</span>
          </div>
          <Progress value={getFormProgress()} className="h-2" />
        </CardContent>
      </Card>

      {/* Main Form */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation Semplificato */}
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-2 bg-transparent">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const status = getTabStatus(tab.id);
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`
                        relative flex flex-col items-center gap-2 p-3 rounded-lg transition-colors
                        ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="text-center">
                        <div className="font-medium text-xs">{tab.title}</div>
                      </div>
                      {status === 'completed' && (
                        <CheckCircle2 className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <form onSubmit={handleSubmit(onValidSubmit as any)} className="p-6">
              {/* Tab 1: Informazioni Generali */}
              <TabsContent value="general" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Informazioni Generali</h2>
                    <p className="text-muted-foreground text-sm">Configura i dettagli base della competizione</p>
                  </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Competizione *</Label>
                        <Input
                          id="name"
                          {...register('name')}
                          placeholder="es. Campionato Regionale Powerlifting"
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo Competizione *</Label>
                        <Select value={typeValue} onValueChange={(value) => setValue('type', value as any, { shouldDirty: true })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="powerlifting">Powerlifting</SelectItem>
                            <SelectItem value="strongman">Strongman</SelectItem>
                            <SelectItem value="weightlifting">Weightlifting</SelectItem>
                            <SelectItem value="crossfit">CrossFit</SelectItem>
                            <SelectItem value="streetlifting">Streetlifting</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.type && (
                          <p className="text-sm text-destructive">{errors.type.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrizione</Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Descrivi la competizione, le caratteristiche e obiettivi..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Data Inizio *</Label>
                        <Input
                          id="date"
                          type="date"
                          {...register('date')}
                        />
                        {errors.date && (
                          <p className="text-sm text-destructive">{errors.date.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">Data Fine</Label>
                        <Input
                          id="endDate"
                          type="date"
                          {...register('endDate')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Città *</Label>
                        <Input
                          id="location"
                          {...register('location')}
                          placeholder="es. Roma"
                        />
                        {errors.location && (
                          <p className="text-sm text-destructive">{errors.location.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venue" className="text-sm font-medium flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Sede/Palestra
                        </Label>
                        <Input
                          id="venue"
                          {...register('venue')}
                          placeholder="es. Palestra XYZ"
                          className="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="maxParticipants" className="text-sm font-medium flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Max Partecipanti
                            </Label>
                            <Input
                              id="maxParticipants"
                              type="number"
                              {...register('maxParticipants', { valueAsNumber: true })}
                              placeholder="es. 100"
                              className="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="entryFee" className="text-sm font-medium flex items-center gap-2">
                              <Euro className="h-4 w-4" />
                              Quota Iscrizione (€)
                            </Label>
                            <Input
                              id="entryFee"
                              type="number"
                              step="0.01"
                              {...register('entryFee', { valueAsNumber: true })}
                              placeholder="es. 50.00"
                              className="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-medium flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Stato
                            </Label>
                            <Select value={statusValue} onValueChange={(value) => setValue('status', value as any, { shouldDirty: true })}>
                              <SelectTrigger className="transition-all duration-200 focus:border-blue-500">
                                <SelectValue placeholder="Seleziona stato" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Bozza</SelectItem>
                                <SelectItem value="active">Attiva</SelectItem>
                                <SelectItem value="in_progress">In Corso</SelectItem>
                                <SelectItem value="completed">Completata</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="registrationDeadline" className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Scadenza Iscrizioni
                          </Label>
                          <Input
                            id="registrationDeadline"
                            type="datetime-local"
                            {...register('registrationDeadline')}
                            className="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab 2: Discipline */}
                    <TabsContent value="disciplines" className="space-y-8 mt-0">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                            <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Discipline</h2>
                            <p className="text-slate-600 dark:text-slate-400">Seleziona le discipline che faranno parte della competizione</p>
                          </div>
                        </div>

                        <DisciplineSelector
                          selectedDisciplines={selectedDisciplines}
                          onDisciplinesChange={setSelectedDisciplines}
                          disciplineOrder={disciplineOrder}
                          onOrderChange={setDisciplineOrder}
                          competitionType={competitionType}
                        />

                        {selectedDisciplines.length === 0 && (
                          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">Nessuna disciplina selezionata</p>
                            <p>Seleziona almeno una disciplina per continuare</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Tab 3: Categorie */}
                    <TabsContent value="categories" className="space-y-8 mt-0">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Categorie</h2>
                              <p className="text-slate-600 dark:text-slate-400">Definisci le categorie di gara per gli atleti</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={addCategory}
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                          >
                            <Plus className="h-4 w-4" />
                            Aggiungi Categoria
                          </Button>
                        </div>

                        {fields.length === 0 && (
                          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">Nessuna categoria definita</p>
                            <p>Aggiungi almeno una categoria per continuare</p>
                          </div>
                        )}

                        <div className="grid gap-6">
                          {fields.map((field, index) => (
                            <Card key={field.id} className="border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
                              <div className="bg-gradient-to-r from-green-500 to-green-600 h-1"></div>
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                      <Hash className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-slate-900 dark:text-white">
                                        Categoria {index + 1}
                                      </h3>
                                      <p className="text-sm text-slate-500 dark:text-slate-400">Configura i parametri della categoria</p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => remove(index)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Nome Categoria *
                                    </Label>
                                    <Input
                                      {...register(`categories.${index}.name`)}
                                      placeholder="es. Junior"
                                      className={`transition-all duration-200 ${
                                        errors.categories?.[index]?.name ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/20' : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                      }`}
                                    />
                                    {errors.categories?.[index]?.name && (
                                      <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.categories[index]?.name?.message}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      Genere *
                                    </Label>
                                    <Select
                                      value={watch(`categories.${index}.gender`) ?? 'M'}
                                      onValueChange={(value) => setValue(`categories.${index}.gender`, value as 'M' | 'F', { shouldDirty: true })}
                                    >
                                      <SelectTrigger className={`transition-all duration-200 ${
                                        errors.categories?.[index]?.gender ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/20' : 'focus:border-blue-500'
                                      }`}>
                                        <SelectValue placeholder="Seleziona" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="M">Maschile</SelectItem>
                                        <SelectItem value="F">Femminile</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {errors.categories?.[index]?.gender && (
                                      <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.categories[index]?.gender?.message}
                                      </p>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                      <Target className="h-4 w-4" />
                                      Categoria Peso *
                                    </Label>
                                    <Select
                                      value={watch(`categories.${index}.weightClass`) ?? undefined}
                                      onValueChange={(value) => setValue(`categories.${index}.weightClass`, value, { shouldDirty: true })}
                                    >
                                      <SelectTrigger className={`transition-all duration-200 ${
                                        errors.categories?.[index]?.weightClass ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/20' : 'focus:border-blue-500'
                                      }`}>
                                        <SelectValue placeholder="Seleziona peso" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getAvailableWeightClasses(watch(`categories.${index}.gender`) || 'M').map((weightClass: string) => (
                                          <SelectItem key={weightClass} value={weightClass}>
                                            {weightClass}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {errors.categories?.[index]?.weightClass && (
                                      <p className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.categories[index]?.weightClass?.message}
                                      </p>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      Fascia Età
                                    </Label>
                                    <Select
                                      value={watch(`categories.${index}.ageGroup`) ?? undefined}
                                      onValueChange={(value) => setValue(`categories.${index}.ageGroup`, value, { shouldDirty: true })}
                                    >
                                      <SelectTrigger className="transition-all duration-200 focus:border-blue-500">
                                        <SelectValue placeholder="Seleziona età" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="junior">Junior (14-23)</SelectItem>
                                        <SelectItem value="senior">Senior (24-39)</SelectItem>
                                        <SelectItem value="master1">Master 1 (40-49)</SelectItem>
                                        <SelectItem value="master2">Master 2 (50-59)</SelectItem>
                                        <SelectItem value="master3">Master 3 (60+)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {errors.categories && (
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            <AlertCircle className="h-4 w-4" />
                            {errors.categories.message || 'Aggiungi almeno una categoria'}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Tab 4: Regole */}
                    <TabsContent value="rules" className="space-y-8 mt-0">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Regole & Configurazione</h2>
                            <p className="text-slate-600 dark:text-slate-400">Imposta le regole e i parametri di gara</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="attempts" className="text-sm font-medium flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Numero Tentativi *
                            </Label>
                            <Input
                              id="attempts"
                              type="number"
                              min="1"
                              max="10"
                              {...register('rules.attempts', { valueAsNumber: true })}
                              className={`transition-all duration-200 ${
                                errors.rules?.attempts ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/20' : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                              }`}
                            />
                            {errors.rules?.attempts && (
                              <div className="flex items-center gap-1 text-sm text-red-600 animate-in slide-in-from-left-2">
                                <AlertCircle className="h-4 w-4" />
                                {errors.rules.attempts.message}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="scoringSystem" className="text-sm font-medium flex items-center gap-2">
                              <Trophy className="h-4 w-4" />
                              Sistema Punteggio *
                            </Label>
                            <Select value={scoringValue} onValueChange={(value) => setValue('rules.scoringSystem', value as any, { shouldDirty: true })}>
                              <SelectTrigger className={`transition-all duration-200 ${
                                errors.rules?.scoringSystem ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/20' : 'focus:border-blue-500'
                              }`}>
                                <SelectValue placeholder="Seleziona sistema" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ipf">IPF Points</SelectItem>
                                <SelectItem value="wilks">Wilks</SelectItem>
                                <SelectItem value="dots">DOTS</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.rules?.scoringSystem && (
                              <div className="flex items-center gap-1 text-sm text-red-600 animate-in slide-in-from-left-2">
                                <AlertCircle className="h-4 w-4" />
                                {errors.rules.scoringSystem.message}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="weighInTime" className="text-sm font-medium">
                              Orario Pesata
                            </Label>
                            <Input
                              id="weighInTime"
                              type="time"
                              {...register('rules.weighInTime')}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Controllo Attrezzatura
                            </Label>
                            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                              <Switch
                                checked={!!equipmentCheck}
                                onCheckedChange={(checked) => setValue('rules.equipmentCheck', checked, { shouldDirty: true })}
                              />
                              <div>
                                <p className="text-sm font-medium">Controllo obbligatorio</p>
                                <p className="text-xs text-muted-foreground">Richiedi controllo attrezzatura prima della gara</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between gap-4 pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                      >
                        Annulla
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading || !isValid}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            {competition ? 'Aggiorna' : 'Crea'} Competizione
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Tabs>
              </CardContent>
            </Card>
    </div>
  );
};
