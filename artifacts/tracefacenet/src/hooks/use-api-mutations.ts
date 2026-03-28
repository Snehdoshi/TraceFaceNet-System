import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createMissingPerson,
  updateMissingPerson,
  deleteMissingPerson,
  createAlert,
  updateAlert,
  performSearch,
  getGetStatsQueryKey,
  getListMissingPersonsQueryKey,
  getListAlertsQueryKey,
  getListSearchesQueryKey,
  getGetMissingPersonQueryKey,
} from "@workspace/api-client-react";

export function useCreatePersonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMissingPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListMissingPersonsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
    },
  });
}

export function useUpdatePersonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateMissingPerson>[1] }) =>
      updateMissingPerson(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: getGetMissingPersonQueryKey(variables.id) });
      queryClient.invalidateQueries({ queryKey: getListMissingPersonsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
    },
  });
}

export function useDeletePersonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMissingPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListMissingPersonsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
    },
  });
}

export function useUpdateAlertMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateAlert>[1] }) =>
      updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
    },
  });
}

export function usePerformSearchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: performSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListSearchesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
    },
  });
}
