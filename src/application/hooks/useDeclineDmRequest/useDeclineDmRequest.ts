import {
  InfiniteData,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';
import { dmApi, type ListDmRequestsResponse } from '@/infra/api/dm.api';
import { DM_REQUESTS_KEY } from '../useDmRequests/useDmRequests';

interface Context {
  previousRequests: Array<
    [QueryKey, InfiniteData<ListDmRequestsResponse> | undefined]
  >;
}

function removeRequest(
  old: InfiniteData<ListDmRequestsResponse> | undefined,
  requestId: string,
): InfiniteData<ListDmRequestsResponse> | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: page.data.filter((request) => request.id !== requestId),
    })),
  };
}

export function useDeclineDmRequest(): UseMutationResult<
  void,
  Error,
  string,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, Context>({
    mutationKey: ['dm', 'requests', 'decline'],
    mutationFn: (requestId) => dmApi.declineDmRequest(requestId),
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: DM_REQUESTS_KEY });
      const previousRequests =
        queryClient.getQueriesData<InfiniteData<ListDmRequestsResponse>>({
          queryKey: DM_REQUESTS_KEY,
        });

      queryClient.setQueriesData<InfiniteData<ListDmRequestsResponse>>(
        { queryKey: DM_REQUESTS_KEY },
        (old) => removeRequest(old, requestId),
      );

      return { previousRequests };
    },
    onError: (_err, _requestId, context) => {
      context?.previousRequests.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: DM_REQUESTS_KEY });
    },
  });
}
