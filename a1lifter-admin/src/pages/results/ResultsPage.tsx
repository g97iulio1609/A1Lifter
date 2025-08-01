import React, { useState } from 'react';
import { EnhancedResultsManager } from '@/components/results/EnhancedResultsManager';
import { ResultsTable } from '@/components/results/ResultsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Table, Zap } from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('enhanced');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-auto grid-cols-2">
          <TabsTrigger value="enhanced" className="gap-2">
            <Zap className="h-4 w-4" />
            Analisi Avanzata
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2">
            <Table className="h-4 w-4" />
            Vista Tabella
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced">
          <EnhancedResultsManager />
        </TabsContent>

        <TabsContent value="table">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-500 rounded-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                Results
              </h1>
              <p className="text-muted-foreground">
                Visualizza e gestisci i risultati delle competizioni
              </p>
            </div>
            
            <ResultsTable 
              results={[]} 
              onEdit={() => {}} 
              onDelete={() => {}} 
              onAddLift={() => {}} 
              isLoading={false} 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};