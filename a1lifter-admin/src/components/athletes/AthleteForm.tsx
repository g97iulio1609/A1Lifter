import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Athlete } from '@/types';

const athleteSchema = z.object({
  name: z.string().min(2, 'Nome deve avere almeno 2 caratteri'),
  email: z.string().email('Email non valida'),
  birthDate: z.string().min(1, 'Data di nascita richiesta'),
  gender: z.enum(['M', 'F'], { message: 'Seleziona il genere' }),
  weightClass: z.string().min(1, 'Categoria di peso richiesta'),
  federation: z.string().min(1, 'Federazione richiesta'),
});

type AthleteFormData = z.infer<typeof athleteSchema>;

interface AthleteFormProps {
  athlete?: Athlete;
  onSubmit: (data: AthleteFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const weightClasses = [
  '53kg', '59kg', '66kg', '74kg', '83kg', '93kg', '105kg', '120kg', '120kg+',
  '47kg', '52kg', '57kg', '63kg', '69kg', '76kg', '84kg', '84kg+'
];

const federations = [
  'FIPL', 'IPF', 'WDFPF', 'WPC', 'WPF', 'AWPC', 'SPF', 'NASA', 'Altra'
];

export const AthleteForm: React.FC<AthleteFormProps> = ({
  athlete,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    // watch
  } = useForm<AthleteFormData>({
    resolver: zodResolver(athleteSchema),
    defaultValues: {
      name: athlete?.name || '',
      email: athlete?.email || '',
      birthDate: athlete?.birthDate ? athlete.birthDate.toISOString().split('T')[0] : '',
      gender: athlete?.gender || undefined,
      weightClass: athlete?.weightClass || '',
      federation: athlete?.federation || '',
    }
  });

  const handleFormSubmit = (data: AthleteFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {athlete ? 'Modifica Atleta' : 'Nuovo Atleta'}
        </CardTitle>
        <CardDescription>
          {athlete ? 'Modifica i dati dell\'atleta' : 'Inserisci i dati del nuovo atleta'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Mario Rossi"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="mario.rossi@email.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data di Nascita</Label>
              <Input
                id="birthDate"
                type="date"
                {...register('birthDate')}
              />
              {errors.birthDate && (
                <p className="text-sm text-destructive">{errors.birthDate.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Genere</Label>
              <Select onValueChange={(value) => setValue('gender', value as 'M' | 'F')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona genere" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Maschio</SelectItem>
                  <SelectItem value="F">Femmina</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-destructive">{errors.gender.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weightClass">Categoria di Peso</Label>
              <Select onValueChange={(value) => setValue('weightClass', value)}>
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
              {errors.weightClass && (
                <p className="text-sm text-destructive">{errors.weightClass.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="federation">Federazione</Label>
              <Select onValueChange={(value) => setValue('federation', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona federazione" />
                </SelectTrigger>
                <SelectContent>
                  {federations.map((federation) => (
                    <SelectItem key={federation} value={federation}>
                      {federation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.federation && (
                <p className="text-sm text-destructive">{errors.federation.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvataggio...' : (athlete ? 'Aggiorna' : 'Crea')}
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