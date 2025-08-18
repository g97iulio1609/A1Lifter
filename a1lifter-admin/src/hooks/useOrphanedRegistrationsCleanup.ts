import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registrationsService } from '@/services/registrations';
import { toast } from 'sonner';

export const useOrphanedRegistrationsCleanup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registrationsService.cleanOrphanedRegistrations,
    onSuccess: (result) => {
      // Invalida le query delle registrazioni per aggiornare la UI
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['registrations-stats'] });
      
      if (result.cleaned > 0) {
        toast.success(`Pulite ${result.cleaned} iscrizioni orfane`);
      } else {
        toast.info('Nessuna iscrizione orfana trovata');
      }
      
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} errori durante la pulizia`);
      }
    },
    onError: (error) => {
      console.error('Errore durante la pulizia:', error);
      toast.error('Errore durante la pulizia delle iscrizioni orfane');
    },
  });
};