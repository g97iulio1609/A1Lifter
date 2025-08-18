import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { AthleteResult } from '@/types';

const liftSchema = z.object({
  discipline: z.string().min(1, 'Seleziona una disciplina'),
  attempt: z.number().min(1, 'Numero tentativo richiesto').max(10, 'Massimo 10 tentativi'),
  weight: z.number().min(0, 'Peso deve essere positivo'),
  valid: z.boolean(),
});

type LiftFormData = z.infer<typeof liftSchema>;

interface LiftFormProps {
  result: AthleteResult;
  disciplines: string[];
  onSubmit: (data: LiftFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const LiftForm: React.FC<LiftFormProps> = ({
  result,
  disciplines,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<LiftFormData>({
    resolver: zodResolver(liftSchema),
    defaultValues: {
      discipline: '',
      attempt: 1,
      weight: 0,
      valid: true,
    }
  });

  const selectedDiscipline = watch('discipline');
  const isValid = watch('valid');

  // Calcola il prossimo numero di tentativo per la disciplina selezionata
  const getNextAttemptNumber = React.useCallback((discipline: string) => {
    const disciplineLifts = result.lifts.filter(lift => lift.discipline === discipline);
    return disciplineLifts.length + 1;
  }, [result.lifts]);

  // Aggiorna automaticamente il numero di tentativo quando cambia la disciplina
  React.useEffect(() => {
    if (selectedDiscipline) {
      setValue('attempt', getNextAttemptNumber(selectedDiscipline));
    }
  }, [selectedDiscipline, setValue, getNextAttemptNumber]);

  const handleFormSubmit = (data: LiftFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Nuovo Tentativo</CardTitle>
        <CardDescription>
          Atleta: {result.athleteName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discipline">Disciplina</Label>
            <Select onValueChange={(value) => setValue('discipline', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona disciplina" />
              </SelectTrigger>
              <SelectContent>
                {disciplines.map((discipline) => (
                  <SelectItem key={discipline} value={discipline}>
                    {discipline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.discipline && (
              <p className="text-sm text-destructive">{errors.discipline.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attempt">Tentativo #</Label>
              <Input
                id="attempt"
                type="number"
                min="1"
                max="10"
                {...register('attempt', { valueAsNumber: true })}
                readOnly
                className="bg-muted"
              />
              {errors.attempt && (
                <p className="text-sm text-destructive">{errors.attempt.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.5"
                min="0"
                {...register('weight', { valueAsNumber: true })}
                placeholder="120.5"
              />
              {errors.weight && (
                <p className="text-sm text-destructive">{errors.weight.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="valid"
              checked={isValid}
              onCheckedChange={(checked) => setValue('valid', checked)}
            />
            <Label htmlFor="valid">
              Tentativo {isValid ? 'valido' : 'non valido'}
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Aggiungendo...' : 'Aggiungi Tentativo'}
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