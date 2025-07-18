import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MoreHorizontal, Edit, Trash2, Users, Copy, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CompetitionWithStats } from '@/types';

interface CompetitionsTableProps {
  competitions: CompetitionWithStats[];
  onEdit: (competition: CompetitionWithStats) => void;
  onDelete: (id: string) => void;
  onDuplicate: (competition: CompetitionWithStats) => void;
  onViewRegistrations: (competition: CompetitionWithStats) => void;
  isLoading?: boolean;
}

export const CompetitionsTable: React.FC<CompetitionsTableProps> = ({
  competitions,
  onEdit,
  onDelete,
  onDuplicate,
  onViewRegistrations,
  isLoading = false
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [competitionToDelete, setCompetitionToDelete] = useState<CompetitionWithStats | null>(null);

  const handleDeleteClick = (competition: CompetitionWithStats) => {
    setCompetitionToDelete(competition);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (competitionToDelete) {
      onDelete(competitionToDelete.id);
      setDeleteDialogOpen(false);
      setCompetitionToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Bozza</Badge>;
      case 'active':
        return <Badge variant="default">Attiva</Badge>;
      case 'completed':
        return <Badge variant="outline">Completata</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'powerlifting':
        return <Badge variant="outline">Powerlifting</Badge>;
      case 'strongman':
        return <Badge variant="outline">Strongman</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getDaysUntilStart = (daysUntilStart: number) => {
    if (daysUntilStart < 0) {
      return `${Math.abs(daysUntilStart)} giorni fa`;
    } else if (daysUntilStart === 0) {
      return 'Oggi';
    } else {
      return `Tra ${daysUntilStart} giorni`;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Luogo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Iscritti</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(8)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Luogo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Iscritti</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nessuna competizione trovata
                </TableCell>
              </TableRow>
            ) : (
              competitions.map((competition) => (
                <TableRow key={competition.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{competition.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getDaysUntilStart(competition.daysUntilStart)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(competition.date, 'dd/MM/yyyy', { locale: it })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {competition.location}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(competition.type)}</TableCell>
                  <TableCell>{getStatusBadge(competition.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{competition.registrationsCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {competition.categoriesCount} categorie
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewRegistrations(competition)}>
                          <Users className="mr-2 h-4 w-4" />
                          Visualizza Iscritti
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(competition)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(competition)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplica
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(competition)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la competizione "{competitionToDelete?.name}"?
              Questa azione eliminerà anche tutte le iscrizioni associate e non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};