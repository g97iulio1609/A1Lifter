import React, { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Plus } from 'lucide-react';
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
import type { AthleteResult, Lift } from '@/types';

interface ResultsTableProps {
  results: AthleteResult[];
  onEdit: (result: AthleteResult) => void;
  onDelete: (id: string) => void;
  onAddLift: (result: AthleteResult) => void;
  isLoading?: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  onEdit,
  onDelete,
  onAddLift,
  isLoading = false
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<AthleteResult | null>(null);

  const handleDeleteClick = (result: AthleteResult) => {
    setResultToDelete(result);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (resultToDelete) {
      onDelete(resultToDelete.id);
      setDeleteDialogOpen(false);
      setResultToDelete(null);
    }
  };

  const getRankingBadge = (ranking: number) => {
    if (ranking === 1) return <Badge className="bg-yellow-500">🥇 1°</Badge>;
    if (ranking === 2) return <Badge className="bg-gray-400">🥈 2°</Badge>;
    if (ranking === 3) return <Badge className="bg-orange-600">🥉 3°</Badge>;
    return <Badge variant="outline">{ranking}°</Badge>;
  };

  const getValidLifts = (lifts: Lift[]) => {
    return lifts.filter(lift => lift.valid).length;
  };

  const getTotalLifts = (lifts: Lift[]) => {
    return lifts.length;
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pos.</TableHead>
              <TableHead>Atleta</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tentativi</TableHead>
              <TableHead>Totale (kg)</TableHead>
              <TableHead>Wilks</TableHead>
              <TableHead>IPF</TableHead>
              <TableHead>DOTS</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(9)].map((_, j) => (
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
              <TableHead>Pos.</TableHead>
              <TableHead>Atleta</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tentativi</TableHead>
              <TableHead>Totale (kg)</TableHead>
              <TableHead>Wilks</TableHead>
              <TableHead>IPF</TableHead>
              <TableHead>DOTS</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Nessun risultato trovato
                </TableCell>
              </TableRow>
            ) : (
              results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    {getRankingBadge(result.ranking)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{result.athleteName}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.athleteGender} • {result.athleteWeight}kg
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{result.categoryName}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">
                        {getValidLifts(result.lifts)}
                      </span>
                      <span className="text-muted-foreground">
                        / {getTotalLifts(result.lifts)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-lg">
                      {result.totalScore}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {result.wilksScore ? result.wilksScore.toFixed(2) : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {result.ipfScore ? result.ipfScore.toFixed(2) : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {result.dotsScore ? result.dotsScore.toFixed(2) : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAddLift(result)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Aggiungi Tentativo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(result)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(result)}
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
              Sei sicuro di voler eliminare il risultato di "{resultToDelete?.athleteName}"?
              Tutti i tentativi associati verranno eliminati e questa azione non può essere annullata.
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