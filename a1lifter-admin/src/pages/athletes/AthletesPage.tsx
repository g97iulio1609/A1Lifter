import React, { useState } from 'react';
import { EnhancedAthleteManager } from '@/components/athletes/EnhancedAthleteManager';
import { AthletesTable } from '@/components/athletes/AthletesTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Table, Zap } from 'lucide-react';

export const AthletesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('enhanced');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-auto grid-cols-2">
          <TabsTrigger value="enhanced" className="gap-2">
            <Zap className="h-4 w-4" />
            Gestione Migliorata
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2">
            <Table className="h-4 w-4" />
            Vista Tabella
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced">
          <EnhancedAthleteManager />
        </TabsContent>

        <TabsContent value="table">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Athletes
              </h1>
              <p className="text-muted-foreground">
                Gestisci gli atleti registrati nel sistema
              </p>
            </div>
            
            <AthletesTable 
              athletes={[]} 
              onEdit={() => {}} 
              onDelete={() => {}} 
              isLoading={false} 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};