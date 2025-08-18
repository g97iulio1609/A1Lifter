import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { useAthletes } from '@/hooks/useAthletes';
import type { Registration, Competition } from '@/types';

const registrationSchema = z.object({
  athleteId: z.string().min(1, 'Seleziona un atleta'),
  categoryId: z.string().min(1, 'Seleziona una categoria'),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']),
  notes: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  competition: Competition;
  registration?: Registration;
  onSubmit: (data: RegistrationFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  competition,
  registration,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { data: athletes = [] } = useAthletes();
  
  // Debug logging
  console.log('RegistrationForm - Athletes data:', athletes);
  console.log('RegistrationForm - Athletes count:', athletes.length);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      athleteId: registration?.athleteId || '',
      categoryId: registration?.categoryId || '',
      status: registration?.status || 'pending',
      paymentStatus: registration?.paymentStatus || 'unpaid',
      notes: registration?.notes || '',
    }
  });

  const selectedAthleteId = watch('athleteId');
  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  // Prepara le opzioni per il Combobox degli atleti
  const athleteOptions: ComboboxOption[] = athletes.map(athlete => ({
    value: athlete.id,
    label: `${athlete.name} (${athlete.gender}) - ${athlete.weightClass}`,
    searchableText: `${athlete.name} ${athlete.email} ${athlete.gender} ${athlete.weightClass}`.toLowerCase()
  }));
  
  console.log('RegistrationForm - Athlete options:', athleteOptions);
  console.log('RegistrationForm - Selected athlete ID:', selectedAthleteId);

  // Filtra categorie compatibili con l'atleta selezionato
  const compatibleCategories = competition.categories.filter(category => {
    if (!selectedAthlete) return true;
    return category.gender === selectedAthlete.gender;
  });

  const handleFormSubmit = (data: RegistrationFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {registration ? 'Modifica Iscrizione' : 'Nuova Iscrizione'}
        </CardTitle>
        <CardDescription>
          Iscrizione per: {competition.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="athleteId">Atleta</Label>
            <Combobox
              options={athleteOptions}
              value={selectedAthleteId}
              onValueChange={(value) => {
                console.log('RegistrationForm - Athlete selected:', value);
                console.log('RegistrationForm - Setting athleteId to:', value);
                setValue('athleteId', value);
                console.log('RegistrationForm - After setValue, watch athleteId:', watch('athleteId'));
              }}
              placeholder="Cerca e seleziona un atleta..."
              searchPlaceholder="Cerca per nome, email o caratteristiche..."
              emptyText="Nessun atleta trovato."
              className="w-full"
            />
            {errors.athleteId && (
              <p className="text-sm text-destructive">{errors.athleteId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select onValueChange={(value) => setValue('categoryId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona una categoria" />
              </SelectTrigger>
              <SelectContent>
                {compatibleCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category.gender}) - {category.weightClass}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Stato Iscrizione</Label>
              <Select onValueChange={(value) => setValue('status', value as 'pending' | 'confirmed' | 'cancelled')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">In Attesa</SelectItem>
                  <SelectItem value="confirmed">Confermata</SelectItem>
                  <SelectItem value="cancelled">Cancellata</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Stato Pagamento</Label>
              <Select onValueChange={(value) => setValue('paymentStatus', value as 'unpaid' | 'paid' | 'refunded')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona stato pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Non Pagato</SelectItem>
                  <SelectItem value="paid">Pagato</SelectItem>
                  <SelectItem value="refunded">Rimborsato</SelectItem>
                </SelectContent>
              </Select>
              {errors.paymentStatus && (
                <p className="text-sm text-destructive">{errors.paymentStatus.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note (opzionale)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Note aggiuntive sull'iscrizione..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvataggio...' : (registration ? 'Aggiorna' : 'Iscriva')}
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