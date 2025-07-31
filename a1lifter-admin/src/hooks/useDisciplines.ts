import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disciplinesService } from '@/services/disciplines';
import type { CustomDiscipline } from '@/types';

// Hook per ottenere tutte le discipline
export const useDisciplines = () => {
  return useQuery({
    queryKey: ['disciplines'],
    queryFn: disciplinesService.getAllDisciplines,
    staleTime: 1000 * 60 * 10, // 10 minuti
  });
};

// Hook per ottenere discipline per sport
export const useDisciplinesBySport = (sport: CustomDiscipline['sport']) => {
  return useQuery({
    queryKey: ['disciplines', 'sport', sport],
    queryFn: () => disciplinesService.getDisciplinesBySport(sport),
    staleTime: 1000 * 60 * 10,
  });
};

// Hook per creare disciplina
export const useCreateDiscipline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disciplinesService.createDiscipline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
    },
  });
};

// Hook per aggiornare disciplina
export const useUpdateDiscipline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CustomDiscipline> }) =>
      disciplinesService.updateDiscipline(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
    },
  });
};

// Hook per eliminare disciplina
export const useDeleteDiscipline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disciplinesService.deleteDiscipline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
    },
  });
};

// Hook per inizializzare discipline predefinite
export const useInitializeDefaultDisciplines = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disciplinesService.initializeDefaultDisciplines,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
    },
  });
}; 