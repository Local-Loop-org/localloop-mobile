import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DmPermission } from '@localloop/shared-types';
import { userApi, type UserProfileResponse } from '@/infra/api/user.api';
import { useAuthStore } from '@/application/stores/auth.store';
import { USER_PROFILE_KEY } from './useUserProfile';

export interface UpdateUserProfileVars {
  displayName?: string;
  dmPermission?: DmPermission;
}

interface MutationContext {
  previous: UserProfileResponse | undefined;
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation<
    UserProfileResponse,
    Error,
    UpdateUserProfileVars,
    MutationContext
  >({
    mutationFn: (vars) => userApi.updateProfile(vars),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: USER_PROFILE_KEY });
      const previous = queryClient.getQueryData<UserProfileResponse>(USER_PROFILE_KEY);
      if (previous) {
        queryClient.setQueryData<UserProfileResponse>(USER_PROFILE_KEY, {
          ...previous,
          ...vars,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(USER_PROFILE_KEY, context.previous);
      }
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(USER_PROFILE_KEY, data);
      await updateUser({
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        dmPermission: data.dmPermission,
      });
    },
  });
}
