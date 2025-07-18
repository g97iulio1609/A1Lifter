import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Scale, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { scoringService } from '@/services/scoring';
import type { Athlete } from '@/types';

const weightSchema = z.object({
  bodyweight: z.number().min(30, 'Peso minimo 30kg').max(300, 'Peso massimo 300kg'),
});

type WeightFormData = z.infer<typeof weightSchema>;

interface WeightManagementProps {
  athlete: Athlete;
  onSave: (bodyweight: number) => void;
  isLoading?: boolean;
}

export const WeightManagement: React.FC<WeightManagementProps> = ({
  athlete,
  onSave,
  isLoading = false
}) => {
  const [currentBodyweight, setCurrentBodyweight] = useState<number>(0);
  const [showValidation, setShowValidation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<WeightFormData>({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      bodyweight: 0,
    }
  });

  const bodyweight = watch('bodyweight');
  const isValidForCategory = bodyweight > 0 && scoringService.isValidForWeightClass(bodyweight, athlete.weightClass);
  const weightRange = scoringService.getWeightRange(athlete.weightClass);

  const handleFormSubmit = (data: WeightFormData) => {
    setCurrentBodyweight(data.bodyweight);
    onSave(data.bodyweight);
  };

  const handleWeightChange = (value: number) => {
    setShowValidation(value > 0);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Peso Corporeo
        </CardTitle>
        <CardDescription>
          Atleta: {athlete.name} ({athlete.gender})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Categoria: {athlete.weightClass}
          </Badge>
          <Badge variant="secondary">
            Range: {weightRange.min === 0 ? 'Fino a' : `${weightRange.min.toFixed(1)} - `}
            {weightRange.max === 999 ? '∞' : `${weightRange.max}kg`}
          </Badge>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bodyweight">Peso Corporeo (kg)</Label>
            <Input
              id="bodyweight"
              type="number"
              step="0.1"
              min="30"
              max="300"
              placeholder="75.5"
              {...register('bodyweight', { 
                valueAsNumber: true,
                onChange: (e) => handleWeightChange(Number(e.target.value))
              })}
            />
            {errors.bodyweight && (
              <p className="text-sm text-destructive">{errors.bodyweight.message}</p>
            )}
          </div>

          {showValidation && bodyweight > 0 && (
            <Alert variant={isValidForCategory ? 'default' : 'destructive'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isValidForCategory ? (
                  <>
                    ✓ Peso valido per la categoria {athlete.weightClass}
                  </>
                ) : (
                  <>
                    ⚠ Peso non valido per la categoria {athlete.weightClass}
                    <br />
                    Range richiesto: {weightRange.min === 0 ? 'Fino a' : `${weightRange.min.toFixed(1)} - `}
                    {weightRange.max === 999 ? '∞' : `${weightRange.max}kg`}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {bodyweight > 0 && (
            <div className="space-y-2">
              <Label>Anteprima Punteggi</Label>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">Wilks</div>
                  <div className="text-xs text-muted-foreground">
                    {scoringService.calculateWilksScore(300, bodyweight, athlete.gender).toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">IPF</div>
                  <div className="text-xs text-muted-foreground">
                    {scoringService.calculateIPFScore(300, bodyweight, athlete.gender).toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">DOTS</div>
                  <div className="text-xs text-muted-foreground">
                    {scoringService.calculateDOTSScore(300, bodyweight, athlete.gender).toFixed(2)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                * Punteggi calcolati con 300kg di totale (esempio)
              </p>
            </div>
          )}

          <Button type="submit" disabled={isLoading || !isValidForCategory} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Salvando...' : 'Salva Peso'}
          </Button>
        </form>

        {currentBodyweight > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Peso attuale: <span className="font-medium">{currentBodyweight}kg</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};