import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LiveDashboard } from '@/components/organizer/LiveDashboard';
import { ExportMenu } from '@/components/export/ExportMenu';
import { useCompetitions } from '@/hooks/useCompetitions';

export const OrganizerPage: React.FC = () => {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('');
  
  const { data: competitions = [] } = useCompetitions({ status: 'active' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Organizzatore</h1>
          <p className="text-muted-foreground">
            Monitora le competizioni in tempo reale
          </p>
        </div>
        {selectedCompetitionId && (
          <ExportMenu competitionId={selectedCompetitionId} />
        )}
      </div>

      {/* Selezione Competizione */}
      <Card>
        <CardHeader>
          <CardTitle>Seleziona Competizione</CardTitle>
          <CardDescription>
            Scegli una competizione attiva per monitorare i progressi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCompetitionId} onValueChange={setSelectedCompetitionId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleziona una competizione attiva" />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((competition) => (
                <SelectItem key={competition.id} value={competition.id}>
                  {competition.name} - {competition.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Dashboard Live */}
      {selectedCompetitionId && (
        <LiveDashboard competitionId={selectedCompetitionId} />
      )}

      {/* Placeholder quando nessuna competizione è selezionata */}
      {!selectedCompetitionId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                Seleziona una competizione per visualizzare il dashboard live
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};