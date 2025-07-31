import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registrationsService } from '@/services/registrations';

export interface RegistrationsFilters {
  competitionId?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  searchTerm?: string;
}

// Hook per ottenere le registrazioni con filtri
export const useRegistrations = (filters: RegistrationsFilters = {}) => {
  return useQuery({
    queryKey: ['registrations', filters],
    queryFn: () => registrationsService.getRegistrations(filters),
    staleTime: 1000 * 60 * 5, // 5 minuti
  });
};

// Hook per ottenere i dettagli di una singola registrazione
export const useRegistrationDetails = (registrationId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['registration', registrationId],
    queryFn: () => registrationsService.getRegistrationDetails(registrationId),
    enabled: enabled && !!registrationId,
    staleTime: 1000 * 60 * 2, // 2 minuti
  });
};

// Hook per aggiornare una registrazione
export const useUpdateRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registrationsService.updateRegistration,
    onSuccess: (_, variables) => {
      // Invalida la cache per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['registration', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
};

// Hook per creare una nuova registrazione
export const useCreateRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registrationsService.createRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
};

// Hook per eliminare una registrazione
export const useDeleteRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registrationsService.deleteRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
  });
};

// Hook per ottenere statistiche delle registrazioni
export const useRegistrationsStats = (competitionId?: string) => {
  return useQuery({
    queryKey: ['registrations-stats', competitionId],
    queryFn: () => registrationsService.getRegistrationsStats(competitionId),
    staleTime: 1000 * 60 * 2, // 2 minuti
  });
}; 