import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CompetitionForm } from '@/components/competitions/CompetitionForm';
import type { CategoryConfig, CompetitionRules as DomainCompetitionRules } from '@/types';
import { useCreateCompetition } from '@/hooks/useCompetitions';
import { toast } from 'sonner';

export const CreateCompetitionPage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateCompetition();

  type CompetitionRules = { attempts?: number; disciplines?: string[]; scoringSystem?: string } & Record<string, unknown>;
  type CompetitionFormData = { name: string; type: 'powerlifting' | 'strongman' | 'crossfit' | 'weightlifting' | 'streetlifting'; status: string; location: string; date: string; categories?: Record<string, unknown>[]; rules?: CompetitionRules; registrationDeadline?: string; [key: string]: unknown };
  const handleCreateCompetition = async (data: CompetitionFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        status: data.status as 'draft' | 'active' | 'in_progress' | 'completed',
        date: new Date(data.date),
  categories: (data.categories as CategoryConfig[]) || [],
  rules: (data.rules as DomainCompetitionRules) || {
          attempts: 3,
          disciplines: [],
          scoringSystem: 'ipf'
        },
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : new Date(data.date),
        createdBy: 'current-user-id' // TODO: get from auth context
      });
      toast.success('Competizione creata con successo');
      navigate('/competitions');
    } catch {
      toast.error('Errore durante la creazione della competizione');
    }
  };

  const handleCancel = () => {
    navigate('/competitions');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/competitions')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Torna alle competizioni
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold">Nuova Competizione</h1>
                <p className="text-sm text-muted-foreground">
                  Crea una nuova competizione configurando tutti i dettagli necessari
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                Anteprima
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Form principale - 3 colonne su XL */}
          <div className="xl:col-span-3">
            <Card className="shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Configurazione Competizione
                </CardTitle>
                <CardDescription>
                  Compila tutti i campi necessari per creare la tua competizione.
                  I dati vengono salvati automaticamente mentre procedi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompetitionForm
                  onSubmit={handleCreateCompetition}
                  onCancel={handleCancel}
                  isLoading={createMutation.isPending}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar di aiuto - 1 colonna su XL, nascosta su schermi più piccoli */}
          <div className="hidden xl:block">
            <div className="sticky top-8 space-y-6">
              {/* Guida rapida */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Guida Rapida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-sm">Informazioni Generali</p>
                        <p className="text-xs text-muted-foreground">
                          Nome, data, luogo e tipo di competizione
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-sm">Discipline</p>
                        <p className="text-xs text-muted-foreground">
                          Seleziona le discipline della competizione
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-sm">Categorie</p>
                        <p className="text-xs text-muted-foreground">
                          Configura le categorie di peso e età
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        4
                      </div>
                      <div>
                        <p className="font-medium text-sm">Regole</p>
                        <p className="text-xs text-muted-foreground">
                          Imposta regole specifiche e limitazioni
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suggerimenti */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suggerimenti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <p className="text-muted-foreground">
                      💡 <strong>Salvataggio automatico:</strong> I tuoi dati vengono salvati automaticamente mentre compili il form.
                    </p>
                    <p className="text-muted-foreground">
                      🎯 <strong>Template:</strong> Usa i template predefiniti per velocizzare la configurazione.
                    </p>
                    <p className="text-muted-foreground">
                      📋 <strong>Anteprima:</strong> Controlla sempre l'anteprima prima di salvare.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCompetitionPage;