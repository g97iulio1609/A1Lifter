import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Target, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Zap,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompetitionData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  sport: string;
  discipline: string;
  maxParticipants: number;
  registrationDeadline: string;
  entryFee: number;
  categories: string[];
  rules: string;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

interface SimplifiedCompetitionWizardProps {
  onComplete: (data: CompetitionData) => void;
  onCancel: () => void;
}

export const SimplifiedCompetitionWizard: React.FC<SimplifiedCompetitionWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CompetitionData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    sport: '',
    discipline: '',
    maxParticipants: 50,
    registrationDeadline: '',
    entryFee: 0,
    categories: [],
    rules: ''
  });

  const steps: WizardStep[] = [
    {
      id: 'basic',
      title: 'Informazioni Base',
      description: 'Nome, descrizione e sport',
      icon: Trophy,
      completed: !!(formData.name && formData.sport && formData.discipline)
    },
    {
      id: 'schedule',
      title: 'Date e Luogo',
      description: 'Quando e dove si svolge',
      icon: Calendar,
      completed: !!(formData.startDate && formData.location)
    },
    {
      id: 'participants',
      title: 'Partecipanti',
      description: 'Limiti e categorie',
      icon: Users,
      completed: formData.maxParticipants > 0
    },
    {
      id: 'settings',
      title: 'Impostazioni',
      description: 'Quote e regole',
      icon: Settings,
      completed: true // Sempre completato perché opzionale
    }
  ];

  const updateFormData = (field: keyof CompetitionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    return steps[currentStep].completed;
  };

  const handleComplete = () => {
    onComplete(formData);
  };

  const getProgress = () => {
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / steps.length) * 100;
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">Nome Competizione *</Label>
              <Input
                id="name"
                placeholder="es. Campionato Regionale Powerlifting 2024"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className="text-lg p-3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">Descrizione</Label>
              <Textarea
                id="description"
                placeholder="Descrivi brevemente la competizione..."
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Sport *</Label>
                <Select value={formData.sport} onValueChange={(value) => updateFormData('sport', value)}>
                  <SelectTrigger className="p-3">
                    <SelectValue placeholder="Seleziona sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="powerlifting">Powerlifting</SelectItem>
                    <SelectItem value="strongman">Strongman</SelectItem>
                    <SelectItem value="weightlifting">Weightlifting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Disciplina *</Label>
                <Select value={formData.discipline} onValueChange={(value) => updateFormData('discipline', value)}>
                  <SelectTrigger className="p-3">
                    <SelectValue placeholder="Seleziona disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="squat">Squat</SelectItem>
                    <SelectItem value="bench">Bench Press</SelectItem>
                    <SelectItem value="deadlift">Deadlift</SelectItem>
                    <SelectItem value="total">Total (SBD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-base font-medium">Luogo *</Label>
              <Input
                id="location"
                placeholder="es. Palestra Olimpia, Milano"
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                className="text-lg p-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-base font-medium">Data Inizio *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                  className="p-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-base font-medium">Data Fine</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => updateFormData('endDate', e.target.value)}
                  className="p-3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationDeadline" className="text-base font-medium">Scadenza Iscrizioni</Label>
              <Input
                id="registrationDeadline"
                type="datetime-local"
                value={formData.registrationDeadline}
                onChange={(e) => updateFormData('registrationDeadline', e.target.value)}
                className="p-3"
              />
            </div>
          </div>
        );

      case 'participants':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="maxParticipants" className="text-base font-medium">Numero Massimo Partecipanti</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                max="500"
                value={formData.maxParticipants}
                onChange={(e) => updateFormData('maxParticipants', parseInt(e.target.value) || 0)}
                className="text-lg p-3"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Categorie</Label>
              <div className="grid grid-cols-2 gap-3">
                {['Open', 'Junior', 'Master', 'Femminile', 'Maschile', 'Raw', 'Equipped'].map((category) => (
                  <Button
                    key={category}
                    variant={formData.categories.includes(category) ? 'default' : 'outline'}
                    onClick={() => {
                      const categories = formData.categories.includes(category)
                        ? formData.categories.filter(c => c !== category)
                        : [...formData.categories, category];
                      updateFormData('categories', categories);
                    }}
                    className="justify-start"
                  >
                    {formData.categories.includes(category) && <CheckCircle className="h-4 w-4 mr-2" />}
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="entryFee" className="text-base font-medium">Quota di Iscrizione (€)</Label>
              <Input
                id="entryFee"
                type="number"
                min="0"
                step="0.01"
                value={formData.entryFee}
                onChange={(e) => updateFormData('entryFee', parseFloat(e.target.value) || 0)}
                className="text-lg p-3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules" className="text-base font-medium">Regole Speciali</Label>
              <Textarea
                id="rules"
                placeholder="Eventuali regole specifiche per questa competizione..."
                value={formData.rules}
                onChange={(e) => updateFormData('rules', e.target.value)}
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
            <Trophy className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Nuova Competizione</h1>
        <p className="text-lg text-gray-600">Crea una nuova competizione in pochi semplici passaggi</p>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Progresso</span>
          <span>{Math.round(getProgress())}% completato</span>
        </div>
        <Progress value={getProgress()} className="h-2" />
      </div>

      {/* Steps Navigation */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = step.completed;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center space-y-2">
                <div className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all',
                  isActive 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : isCompleted 
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                )}>
                  {isCompleted && !isActive ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <div className="text-center">
                  <p className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-gray-200 mx-4 mt-6" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            {React.createElement(steps[currentStep].icon, { className: 'h-6 w-6 text-blue-500' })}
            {steps[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          {currentStep > 0 && (
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Indietro
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          {currentStep < steps.length - 1 ? (
            <Button 
              onClick={nextStep} 
              disabled={!canProceed()}
              className="gap-2"
            >
              Avanti
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              className="gap-2 bg-green-500 hover:bg-green-600"
            >
              <Zap className="h-4 w-4" />
              Crea Competizione
            </Button>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Suggerimento
          </h3>
          <p className="text-blue-800">
            {currentStep === 0 && "Scegli un nome descrittivo che includa l'anno e la categoria principale."}
            {currentStep === 1 && "Assicurati che le date siano corrette e che il luogo sia facilmente raggiungibile."}
            {currentStep === 2 && "Seleziona le categorie appropriate per il tuo evento."}
            {currentStep === 3 && "Le impostazioni possono essere modificate anche dopo la creazione."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};