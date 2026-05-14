import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  groupsApi,
  type GroupDetail,
  type JoinRequest,
  type JoinRequestAction,
  type ResolveJoinRequestResult,
} from '@/infra/api/groups.api';
import { groupDetailKey } from '../useGroupDetail/useGroupDetail';
import { groupJoinRequestsKey } from '../useGroupJoinRequests/useGroupJoinRequests';

export type ResolveJoinRequestVars = {
  groupId: string;
  requestId: string;
  action: JoinRequestAction;
};

interface Context {
  previousRequests: JoinRequest[] | undefined;
  previousDetail: GroupDetail | undefined;
}

export function useResolveJoinRequest(): UseMutationResult<
  ResolveJoinRequestResult,
  Error,
  ResolveJoinRequestVars,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<
    ResolveJoinRequestResult,
    Error,
    ResolveJoinRequestVars,
    Context
  >({
    mutationKey: ['resolve-join-request'],
    mutationFn: ({ groupId, requestId, action }) =>
      groupsApi.resolveJoinRequest(groupId, requestId, action),
    onMutate: async ({ groupId, requestId, action }) => {
      const requestsKey = groupJoinRequestsKey(groupId);
      const detailKey = groupDetailKey(groupId);

      await queryClient.cancelQueries({ queryKey: requestsKey });
      await queryClient.cancelQueries({ queryKey: detailKey });

      const previousRequests =
        queryClient.getQueryData<JoinRequest[]>(requestsKey);
      const previousDetail = queryClient.getQueryData<GroupDetail>(detailKey);

      queryClient.setQueryData<JoinRequest[]>(requestsKey, (prev) =>
        prev ? prev.filter((r) => r.id !== requestId) : prev,
      );
      if (action === 'approve' && previousDetail) {
        queryClient.setQueryData<GroupDetail>(detailKey, {
          ...previousDetail,
          memberCount: previousDetail.memberCount + 1,
        });
      }

      return { previousRequests, previousDetail };
    },
    onError: (_err, { groupId }, context) => {
      if (context?.previousRequests !== undefined) {
        queryClient.setQueryData(
          groupJoinRequestsKey(groupId),
          context.previousRequests,
        );
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          groupDetailKey(groupId),
          context.previousDetail,
        );
      }
    },
  });
}
