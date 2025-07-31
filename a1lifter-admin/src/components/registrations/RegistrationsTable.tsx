import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MoreHorizontal, Eye, Check, X, CreditCard, FileText } from 'lucide-react';
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
import { useUpdateRegistration } from '@/hooks/useRegistrations';
import type { RegistrationWithDetails } from '@/types';
import { toast } from 'sonner';

interface RegistrationsTableProps {
  registrations: RegistrationWithDetails[];
  onViewDetails: (registrationId: string) => void;
  isLoading?: boolean;
}

export const RegistrationsTable: React.FC<RegistrationsTableProps> = ({
  registrations,
  onViewDetails,
  isLoading = false
}) => {
  const [confirmAction, setConfirmAction] = useState<{
    action: 'confirm' | 'cancel' | 'markPaid';
    registration: RegistrationWithDetails;
  } | null>(null);

  const updateMutation = useUpdateRegistration();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">In attesa</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Confermata</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600">Annullata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'unpaid':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Non pagato</Badge>;
      case 'paid':
        return <Badge variant="outline" className="text-green-600 border-green-600">Pagato</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Rimborsato</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  const handleAction = async (action: 'confirm' | 'cancel' | 'markPaid', registration: RegistrationWithDetails) => {
    try {
      let updateData;
      let successMessage;

      switch (action) {
        case 'confirm':
          updateData = { status: 'confirmed' as const };
          successMessage = 'Iscrizione confermata';
          break;
        case 'cancel':
          updateData = { status: 'cancelled' as const };
          successMessage = 'Iscrizione annullata';
          break;
        case 'markPaid':
          updateData = { paymentStatus: 'paid' as const };
          successMessage = 'Pagamento registrato';
          break;
      }

      await updateMutation.mutateAsync({
        id: registration.id,
        data: updateData
      });

      toast.success(successMessage);
      setConfirmAction(null);
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    handleAction(confirmAction.action, confirmAction.registration);
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'confirm': return 'confermare';
      case 'cancel': return 'annullare';
      case 'markPaid': return 'segnare come pagata';
      default: return action;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-4">
            <div className="animate-pulse bg-gray-200 h-4 w-1/4 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-1/4 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-1/4 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-4 w-1/4 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nessuna iscrizione trovata
        </h3>
        <p className="text-gray-600">
          Non ci sono iscrizioni che corrispondono ai filtri selezionati.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Atleta</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Competizione</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data Iscrizione</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((registration) => (
              <TableRow key={registration.id}>
                <TableCell className="font-medium">
                  {registration.athleteName}
                </TableCell>
                <TableCell>{registration.athleteEmail}</TableCell>
                <TableCell>{registration.competitionName}</TableCell>
                <TableCell>{registration.categoryName}</TableCell>
                <TableCell>
                  {format(registration.registeredAt, 'dd/MM/yyyy HH:mm', { locale: it })}
                </TableCell>
                <TableCell>
                  {getStatusBadge(registration.status)}
                </TableCell>
                <TableCell>
                  {getPaymentBadge(registration.paymentStatus)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(registration.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizza dettagli
                      </DropdownMenuItem>
                      
                      {registration.status === 'pending' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setConfirmAction({ action: 'confirm', registration })}
                            className="text-green-600"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Conferma iscrizione
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setConfirmAction({ action: 'cancel', registration })}
                            className="text-red-600"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Annulla iscrizione
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {registration.paymentStatus === 'unpaid' && registration.status !== 'cancelled' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setConfirmAction({ action: 'markPaid', registration })}
                            className="text-blue-600"
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Segna come pagato
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog di conferma */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma azione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler {getActionLabel(confirmAction?.action || '')} 
              l'iscrizione di {confirmAction?.registration.athleteName}?
              {confirmAction?.action === 'cancel' && 
                ' Questa azione non può essere annullata.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Elaborazione...' : 'Conferma'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 