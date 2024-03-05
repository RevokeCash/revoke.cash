import { alert_rule, user } from '@prisma/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import { HOUR } from 'lib/utils/time';
import { queryClient } from './QueryProvider';

export const useProfile = () => {
  const { data, error } = useQuery({
    queryKey: ['user'],
    queryFn: () => ky.get('/api/profile').json<user>(),
    staleTime: 12 * HOUR,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 5,
  });

  const { mutateAsync: update } = useMutation({
    mutationKey: ['user', 'update'],
    mutationFn: (body: Partial<user>) => ky.put('/api/profile', { json: body }).json<user>(),

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['user'],
      });
    },
  });

  const { mutateAsync: logout } = useMutation({
    mutationKey: ['user', 'logout'],
    mutationFn: () => ky.get('/api/profile/logout').json<any>(),
  });

  const { mutateAsync: addAlertRule } = useMutation({
    mutationKey: ['user', 'alert_rule', 'add'],
    mutationFn: (body: { transport: string; trigger: string }) =>
      ky.post('/api/alert-rule', { json: body }).json<alert_rule>(),

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['user'],
      });
    },
  });

  return { data, error, update, logout, addAlertRule };
};
