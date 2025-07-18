import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { athletesService } from '@/services/athletes';
import type { Athlete } from '@/types';

export const ATHLETES_QUERY_KEY = 'athletes';

// Hook per ottenere tutti gli atleti
export const useAthletes = (filters?: {
  gender?: 'M' | 'F';
  weightClass?: string;
  federation?: string;
  searchTerm?: string;
}) => {
  return useQuery({
    queryKey: [ATHLETES_QUERY_KEY, filters],
    queryFn: () => athletesService.getAthletes(filters),
    staleTime: 1000 * 60 * 5, // 5 minuti
  });
};

// Hook per ottenere un singolo atleta
export const useAthlete = (id: string) => {
  return useQuery({
    queryKey: [ATHLETES_QUERY_KEY, id],
    queryFn: () => athletesService.getAthlete(id),
    enabled: !!id,
  });
};

// Hook per statistiche atleti
export const useAthletesStats = () => {
  return useQuery({
    queryKey: [ATHLETES_QUERY_KEY, 'stats'],
    queryFn: () => athletesService.getAthletesStats(),
    staleTime: 1000 * 60 * 10, // 10 minuti
  });
};

// Hook per creare un atleta
export const useCreateAthlete = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (athleteData: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>) =>
      athletesService.createAthlete(athleteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATHLETES_QUERY_KEY] });
    },
  });
};

// Hook per aggiornare un atleta
export const useUpdateAthlete = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Athlete, 'id' | 'createdAt'>> }) =>
      athletesService.updateAthlete(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [ATHLETES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ATHLETES_QUERY_KEY, id] });
    },
  });
};

// Hook per eliminare un atleta
export const useDeleteAthlete = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => athletesService.deleteAthlete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATHLETES_QUERY_KEY] });
    },
  });
};

// Hook per importare atleti
export const useImportAthletes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (athletes: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>[]) =>
      athletesService.importAthletes(athletes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATHLETES_QUERY_KEY] });
    },
  });
};