import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { competitionsService } from '@/services/competitions';
import type { Competition, Registration } from '@/types';

export const COMPETITIONS_QUERY_KEY = 'competitions';
export const REGISTRATIONS_QUERY_KEY = 'registrations';

// Hook per ottenere tutte le competizioni
export const useCompetitions = (filters?: {
  status?: 'draft' | 'active' | 'completed';
  type?: 'powerlifting' | 'strongman';
  upcoming?: boolean;
}) => {
  return useQuery({
    queryKey: [COMPETITIONS_QUERY_KEY, filters],
    queryFn: () => competitionsService.getCompetitions(filters),
    staleTime: 1000 * 60 * 5, // 5 minuti
  });
};

// Hook per ottenere una singola competizione
export const useCompetition = (id: string) => {
  return useQuery({
    queryKey: [COMPETITIONS_QUERY_KEY, id],
    queryFn: () => competitionsService.getCompetition(id),
    enabled: !!id,
  });
};

// Hook per statistiche competizioni
export const useCompetitionsStats = () => {
  return useQuery({
    queryKey: [COMPETITIONS_QUERY_KEY, 'stats'],
    queryFn: () => competitionsService.getCompetitionsStats(),
    staleTime: 1000 * 60 * 10, // 10 minuti
  });
};

// Hook per registrazioni di una competizione
export const useRegistrations = (competitionId: string) => {
  return useQuery({
    queryKey: [REGISTRATIONS_QUERY_KEY, competitionId],
    queryFn: () => competitionsService.getRegistrations(competitionId),
    enabled: !!competitionId,
  });
};

// Hook per creare una competizione
export const useCreateCompetition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (competitionData: Omit<Competition, 'id' | 'createdAt' | 'updatedAt'>) =>
      competitionsService.createCompetition(competitionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPETITIONS_QUERY_KEY] });
    },
  });
};

// Hook per aggiornare una competizione
export const useUpdateCompetition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Competition, 'id' | 'createdAt'>> }) =>
      competitionsService.updateCompetition(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [COMPETITIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [COMPETITIONS_QUERY_KEY, id] });
    },
  });
};

// Hook per eliminare una competizione
export const useDeleteCompetition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => competitionsService.deleteCompetition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPETITIONS_QUERY_KEY] });
    },
  });
};

// Hook per duplicare una competizione
export const useDuplicateCompetition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, newDate, newName }: { id: string; newDate: Date; newName?: string }) =>
      competitionsService.duplicateCompetition(id, newDate, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPETITIONS_QUERY_KEY] });
    },
  });
};

// Hook per registrare un atleta
export const useRegisterAthlete = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (registrationData: Omit<Registration, 'id' | 'registeredAt'>) =>
      competitionsService.registerAthlete(registrationData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [REGISTRATIONS_QUERY_KEY, variables.competitionId] });
      queryClient.invalidateQueries({ queryKey: [COMPETITIONS_QUERY_KEY] });
    },
  });
};

// Hook per aggiornare una registrazione
export const useUpdateRegistration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Registration, 'id' | 'registeredAt'>> }) =>
      competitionsService.updateRegistration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REGISTRATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [COMPETITIONS_QUERY_KEY] });
    },
  });
};

// Hook per eliminare una registrazione
export const useDeleteRegistration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => competitionsService.deleteRegistration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REGISTRATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [COMPETITIONS_QUERY_KEY] });
    },
  });
};