import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useLeaderboard } from '@/hooks/useResults';
import { useCompetition } from '@/hooks/useCompetitions';
import { useAthletes } from '@/hooks/useAthletes';
import { useResultsStats } from '@/hooks/useResults';
import { exportService } from '@/services/export';
import { toast } from 'sonner';

interface ExportMenuProps {
  competitionId: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ competitionId }) => {
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: competition } = useCompetition(competitionId);
  const { data: leaderboard } = useLeaderboard(competitionId);
  const { data: athletes = [] } = useAthletes();
  const { data: stats } = useResultsStats(competitionId);

  const handleExportPDF = async () => {
    if (!competition || !leaderboard) {
      toast.error('Dati non disponibili per l\'export');
      return;
    }

    setIsExporting(true);
    try {
      exportService.exportLeaderboardToPDF(competition, leaderboard);
      toast.success('Classifica PDF esportata con successo');
    } catch {
      toast.error('Errore durante l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!competition || !leaderboard) {
      toast.error('Dati non disponibili per l\'export');
      return;
    }

    setIsExporting(true);
    try {
      exportService.exportLeaderboardToExcel(competition, leaderboard);
      toast.success('Classifica Excel esportata con successo');
    } catch {
      toast.error('Errore durante l\'export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAthletesCSV = async () => {
    if (athletes.length === 0) {
      toast.error('Nessun atleta da esportare');
      return;
    }

    setIsExporting(true);
    try {
      exportService.exportAthletesToCSV(athletes);
      toast.success('Lista atleti esportata con successo');
    } catch {
      toast.error('Errore durante l\'export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportReport = async () => {
    if (!competition || !leaderboard || !stats) {
      toast.error('Dati non disponibili per l\'export');
      return;
    }

    setIsExporting(true);
    try {
      exportService.exportCompetitionReport(competition, leaderboard, stats);
      toast.success('Report completo esportato con successo');
    } catch {
      toast.error('Errore durante l\'export del report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Esportando...' : 'Esporta'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Classifica PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Classifica Excel
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportAthletesCSV}>
          <Users className="mr-2 h-4 w-4" />
          Lista Atleti CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportReport}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Report Completo PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};