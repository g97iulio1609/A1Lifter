import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  getPublicCompetition, 
  registerAthleteToCompetition, 
  canAthleteRegister 
} from '@/services/publicRegistrations';
import type { PublicRegistrationData } from '@/services/publicRegistrations';
import type { CategoryConfig, PublicCompetition } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, MapPin, Users, Euro, AlertCircle, CheckCircle } from 'lucide-react';

const registrationSchema = z.object({
  // Dati atleta
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  birthDate: z.string().min(1, 'Data di nascita richiesta'),
  gender: z.enum(['M', 'F'], { message: 'Genere richiesto' }),
  weightClass: z.string().min(1, 'Categoria di peso richiesta'),
  federation: z.string().min(1, 'Federazione richiesta'),
  phone: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria competizione richiesta'),
  
  // Record personali (opzionali)
  squat: z.number().positive().optional(),
  bench: z.number().positive().optional(),
  deadlift: z.number().positive().optional(),
  
  // Contatto emergenza
  emergencyName: z.string().min(2, 'Nome contatto emergenza richiesto'),
  emergencyPhone: z.string().min(10, 'Telefono contatto emergenza richiesto'),
  emergencyRelationship: z.string().min(1, 'Relazione con contatto emergenza richiesta'),
  
  // Informazioni mediche (opzionali)
  allergies: z.string().optional(),
  medications: z.string().optional(),
  conditions: z.string().optional(),
  
  // Note aggiuntive
  notes: z.string().optional(),
  
  // Consensi
  termsAccepted: z.boolean().refine(val => val === true, 'Devi accettare i termini e condizioni'),
  privacyAccepted: z.boolean().refine(val => val === true, 'Devi accettare l\'informativa privacy'),
  medicalResponsibility: z.boolean().refine(val => val === true, 'Devi accettare la responsabilità medica')
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export const CompetitionRegistrationPage: React.FC = () => {
  const { competitionId } = useParams<{ competitionId: string }>();
  const [competition, setCompetition] = useState<PublicCompetition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      termsAccepted: false,
      privacyAccepted: false,
      medicalResponsibility: false
    }
  });

  useEffect(() => {
    if (!competitionId) return;

    const fetchCompetition = async () => {
      try {
        const data = await getPublicCompetition(competitionId);
        if (!data) {
          setError('Competizione non trovata');
          return;
        }
        setCompetition(data);
      } catch (err) {
        setError('Errore nel caricamento della competizione');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetition();
  }, [competitionId]);

  const onSubmit = async (data: RegistrationFormData) => {
    if (!competition) return;

    setSubmitting(true);
    try {
      // Controlla se l'atleta può iscriversi
      const eligibilityCheck = await canAthleteRegister(competition.id, data.email);
      if (!eligibilityCheck.canRegister) {
        throw new Error(eligibilityCheck.reason || 'Impossibile iscriversi');
      }

      // Prepara i dati per la registrazione
      const registrationData: PublicRegistrationData = {
        competitionId: competition.id,
        categoryId: data.categoryId,
        athleteData: {
          name: data.name,
          email: data.email,
          birthDate: new Date(data.birthDate),
          gender: data.gender,
          weightClass: data.weightClass,
          federation: data.federation,
          phone: data.phone,
          personalRecords: {
            ...(data.squat && { squat: data.squat }),
            ...(data.bench && { bench: data.bench }),
            ...(data.deadlift && { deadlift: data.deadlift })
          }
        },
        emergencyContact: {
          name: data.emergencyName,
          phone: data.emergencyPhone,
          relationship: data.emergencyRelationship
        },
        medicalInfo: {
          allergies: data.allergies,
          medications: data.medications,
          conditions: data.conditions
        },
        notes: data.notes
      };

      const result = await registerAthleteToCompetition(registrationData);
      setRegistrationId(result.registrationId);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'iscrizione');
    } finally {
      setSubmitting(false);
    }
  };

  const weightClasses = {
    M: ['59kg', '66kg', '74kg', '83kg', '93kg', '105kg', '120kg', '120kg+'],
    F: ['47kg', '52kg', '57kg', '63kg', '69kg', '76kg', '84kg', '84kg+']
  };

  const federations = [
    'FIPL', 'IPF', 'WPC', 'WRPF', 'SPF', 'WUAP', 'Altra'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error && !competition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/competitions">
            <Button>Torna alle competizioni</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Iscrizione Completata!</CardTitle>
            <CardDescription>
              La tua iscrizione è stata inviata con successo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p>ID Iscrizione: <span className="font-mono font-semibold">{registrationId}</span></p>
              <p className="mt-2">Riceverai una email di conferma all'indirizzo fornito.</p>
            </div>
            <div className="flex space-x-2">
              <Link to="/competitions" className="flex-1">
                <Button variant="outline" className="w-full">
                  Altre competizioni
                </Button>
              </Link>
              <Button 
                onClick={() => window.print()} 
                variant="outline" 
                className="flex-1"
              >
                Stampa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link to="/competitions" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Iscrizione Competizione
              </h1>
              <p className="text-gray-600">{competition?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Competition Info */}
        {competition && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{competition.name}</span>
                <Badge className="bg-blue-500 text-white">
                  {competition.type === 'powerlifting' ? 'Powerlifting' : 'Strongman'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{format(competition.date, 'dd MMM yyyy', { locale: it })}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{competition.location}</span>
                </div>
                <div className="flex items-center">
                  <Euro className="h-4 w-4 mr-2 text-gray-500" />
                  <span>€{competition.registrationFee}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{competition.currentParticipants}/{competition.maxParticipants || '∞'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Modulo di Iscrizione</CardTitle>
            <CardDescription>
              Compila tutti i campi richiesti per completare l'iscrizione
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="athlete" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="athlete">Atleta</TabsTrigger>
                  <TabsTrigger value="competition">Competizione</TabsTrigger>
                  <TabsTrigger value="emergency">Emergenza</TabsTrigger>
                  <TabsTrigger value="terms">Consensi</TabsTrigger>
                </TabsList>

                <TabsContent value="athlete" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        {...form.register('name')}
                        placeholder="Nome Cognome"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register('email')}
                        placeholder="nome@email.com"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="birthDate">Data di Nascita *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        {...form.register('birthDate')}
                      />
                      {form.formState.errors.birthDate && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.birthDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefono</Label>
                      <Input
                        id="phone"
                        {...form.register('phone')}
                        placeholder="+39 123 456 7890"
                      />
                    </div>

                    <div>
                      <Label htmlFor="gender">Genere *</Label>
                      <Select onValueChange={(value) => form.setValue('gender', value as 'M' | 'F')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona genere" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Maschile</SelectItem>
                          <SelectItem value="F">Femminile</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.gender && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.gender.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="weightClass">Categoria di Peso *</Label>
                      <Select onValueChange={(value) => form.setValue('weightClass', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {form.watch('gender') && weightClasses[form.watch('gender')].map((weight) => (
                            <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.weightClass && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.weightClass.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="federation">Federazione *</Label>
                      <Select onValueChange={(value) => form.setValue('federation', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona federazione" />
                        </SelectTrigger>
                        <SelectContent>
                          {federations.map((fed) => (
                            <SelectItem key={fed} value={fed}>{fed}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.federation && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.federation.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="squat">Squat PB (kg)</Label>
                      <Input
                        id="squat"
                        type="number"
                        step="0.5"
                        {...form.register('squat', { valueAsNumber: true })}
                        placeholder="150"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bench">Panca PB (kg)</Label>
                      <Input
                        id="bench"
                        type="number"
                        step="0.5"
                        {...form.register('bench', { valueAsNumber: true })}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deadlift">Stacco PB (kg)</Label>
                      <Input
                        id="deadlift"
                        type="number"
                        step="0.5"
                        {...form.register('deadlift', { valueAsNumber: true })}
                        placeholder="200"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="competition" className="space-y-4">
                  <div>
                    <Label htmlFor="categoryId">Categoria Competizione *</Label>
                    <Select onValueChange={(value) => form.setValue('categoryId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {competition?.categories.map((category: CategoryConfig) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name} - {category.gender} - {category.weightClass}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.categoryId && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes">Note Aggiuntive</Label>
                    <Textarea
                      id="notes"
                      {...form.register('notes')}
                      placeholder="Eventuali note o richieste speciali..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="emergency" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyName">Nome Contatto Emergenza *</Label>
                      <Input
                        id="emergencyName"
                        {...form.register('emergencyName')}
                        placeholder="Nome Contatto"
                      />
                      {form.formState.errors.emergencyName && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.emergencyName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="emergencyPhone">Telefono Emergenza *</Label>
                      <Input
                        id="emergencyPhone"
                        {...form.register('emergencyPhone')}
                        placeholder="+39 123 456 7890"
                      />
                      {form.formState.errors.emergencyPhone && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.emergencyPhone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="emergencyRelationship">Relazione *</Label>
                      <Select onValueChange={(value) => form.setValue('emergencyRelationship', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona relazione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Coniuge</SelectItem>
                          <SelectItem value="parent">Genitore</SelectItem>
                          <SelectItem value="sibling">Fratello/Sorella</SelectItem>
                          <SelectItem value="friend">Amico</SelectItem>
                          <SelectItem value="other">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.emergencyRelationship && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.emergencyRelationship.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Informazioni Mediche (Opzionali)</h4>
                    <div>
                      <Label htmlFor="allergies">Allergie</Label>
                      <Input
                        id="allergies"
                        {...form.register('allergies')}
                        placeholder="Eventuali allergie..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="medications">Farmaci</Label>
                      <Input
                        id="medications"
                        {...form.register('medications')}
                        placeholder="Farmaci assunti regolarmente..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="conditions">Condizioni Mediche</Label>
                      <Input
                        id="conditions"
                        {...form.register('conditions')}
                        placeholder="Eventuali condizioni mediche rilevanti..."
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="terms" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="termsAccepted"
                        {...form.register('termsAccepted')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="termsAccepted" className="font-medium">
                          Accetto i Termini e Condizioni *
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Accetto i termini e le condizioni della competizione, 
                          inclusi i regolamenti tecnici e le norme di sicurezza.
                        </p>
                      </div>
                    </div>
                    {form.formState.errors.termsAccepted && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.termsAccepted.message}
                      </p>
                    )}

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="privacyAccepted"
                        {...form.register('privacyAccepted')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="privacyAccepted" className="font-medium">
                          Accetto l'Informativa Privacy *
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Accetto il trattamento dei dati personali secondo l'informativa privacy.
                        </p>
                      </div>
                    </div>
                    {form.formState.errors.privacyAccepted && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.privacyAccepted.message}
                      </p>
                    )}

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="medicalResponsibility"
                        {...form.register('medicalResponsibility')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="medicalResponsibility" className="font-medium">
                          Responsabilità Medica *
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Dichiaro di essere in buone condizioni di salute e di partecipare 
                          sotto la mia responsabilità medica.
                        </p>
                      </div>
                    </div>
                    {form.formState.errors.medicalResponsibility && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.medicalResponsibility.message}
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-6 border-t">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? 'Invio in corso...' : 'Completa Iscrizione'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};