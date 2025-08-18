import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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
import type { Athlete } from '@/types';

interface AthletesTableProps {
  athletes: Athlete[];
  onEdit: (athlete: Athlete) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const AthletesTable: React.FC<AthletesTableProps> = ({
  athletes,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);

  const handleDeleteClick = (athlete: Athlete) => {
    setAthleteToDelete(athlete);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (athleteToDelete) {
      onDelete(athleteToDelete.id);
      setDeleteDialogOpen(false);
      setAthleteToDelete(null);
    }
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Età</TableHead>
              <TableHead>Genere</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Federazione</TableHead>
              <TableHead>Data Creazione</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
  {/** safe date util to render firestore dates */}
  {(() => null)()}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Età</TableHead>
              <TableHead>Genere</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Federazione</TableHead>
              <TableHead>Data Creazione</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {athletes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nessun atleta trovato
                </TableCell>
              </TableRow>
            ) : (
              athletes.map((athlete) => (
                <TableRow key={athlete.id}>
                  <TableCell className="font-medium">
                    {athlete.name}
                  </TableCell>
                  <TableCell>{athlete.email}</TableCell>
                  <TableCell>{calculateAge(athlete.birthDate)} anni</TableCell>
                  <TableCell>
                    <Badge variant={athlete.gender === 'M' ? 'default' : 'secondary'}>
                      {athlete.gender === 'M' ? 'Maschio' : 'Femmina'}
                    </Badge>
                  </TableCell>
                  <TableCell>{athlete.weightClass}</TableCell>
                  <TableCell>{athlete.federation}</TableCell>
                  <TableCell>
                    {format((() => {
                      const v = athlete.createdAt as unknown;
                      if (v instanceof Date) return v;
                      if (v && typeof v === 'object' && 'toDate' in (v as Record<string, unknown>)) {
                        const toDate = (v as { toDate?: unknown }).toDate;
                        if (typeof toDate === 'function') return (toDate as () => Date)();
                      }
                      return new Date();
                    })(), 'dd/MM/yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(athlete)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(athlete)}
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
              Sei sicuro di voler eliminare l'atleta "{athleteToDelete?.name}"?
              Questa azione non può essere annullata.
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