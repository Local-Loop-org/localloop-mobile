import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { userApi, type UserProfileResponse } from '@/infra/api/user.api';

export const USER_PROFILE_KEY = ['user', 'me'] as const;

export function useUserProfile(): UseQueryResult<UserProfileResponse, Error> {
  return useQuery<UserProfileResponse, Error>({
    queryKey: USER_PROFILE_KEY,
    queryFn: () => userApi.getMe(),
    staleTime: 30_000,
  });
}
