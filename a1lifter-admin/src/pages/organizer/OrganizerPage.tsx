import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LiveDashboard } from '@/components/organizer/LiveDashboard';
import { LiveSessionDashboard } from '@/components/organizer/LiveSessionDashboard';
import { ExportMenu } from '@/components/export/ExportMenu';
import { useCompetitions } from '@/hooks/useCompetitions';

export const OrganizerPage: React.FC = () => {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('');
  const [dashboardMode, setDashboardMode] = useState<'traditional' | 'live'>('traditional');
  
  const { data: competitions = [] } = useCompetitions();
  
  const selectedCompetition = competitions.find(c => c.id === selectedCompetitionId);

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
            Scegli una competizione per monitorare i progressi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedCompetitionId} onValueChange={setSelectedCompetitionId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleziona una competizione" />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((competition) => (
                <SelectItem key={competition.id} value={competition.id}>
                  {competition.name} - {competition.location} ({competition.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedCompetitionId && (
            <div>
              <label className="text-sm font-medium">Modalità Dashboard</label>
              <Select value={dashboardMode} onValueChange={(value: 'traditional' | 'live') => setDashboardMode(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Dashboard Tradizionale</SelectItem>
                  <SelectItem value="live">Sessione Live</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard */}
      {selectedCompetitionId && dashboardMode === 'traditional' && (
        <LiveDashboard competitionId={selectedCompetitionId} />
      )}
      
      {selectedCompetitionId && dashboardMode === 'live' && selectedCompetition && (
        <LiveSessionDashboard 
          competitionId={selectedCompetitionId} 
          competitionName={selectedCompetition.name}
        />
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