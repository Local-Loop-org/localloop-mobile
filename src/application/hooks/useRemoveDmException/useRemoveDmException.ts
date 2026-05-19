import {
  InfiniteData,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';
import { dmApi, type ListDmExceptionsResponse } from '@/infra/api/dm.api';
import { DM_EXCEPTIONS_KEY } from '../useDmExceptions/useDmExceptions';

interface Context {
  previousExceptions: Array<
    [QueryKey, InfiniteData<ListDmExceptionsResponse> | undefined]
  >;
}

function removeException(
  old: InfiniteData<ListDmExceptionsResponse> | undefined,
  peerId: string,
): InfiniteData<ListDmExceptionsResponse> | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: page.data.filter((exception) => exception.peerId !== peerId),
    })),
  };
}

export function useRemoveDmException(): UseMutationResult<
  void,
  Error,
  string,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, Context>({
    mutationKey: ['dm', 'exceptions', 'remove'],
    mutationFn: (peerId) => dmApi.removeDmException(peerId),
    onMutate: async (peerId) => {
      await queryClient.cancelQueries({ queryKey: DM_EXCEPTIONS_KEY });
      const previousExceptions =
        queryClient.getQueriesData<InfiniteData<ListDmExceptionsResponse>>({
          queryKey: DM_EXCEPTIONS_KEY,
        });

      queryClient.setQueriesData<InfiniteData<ListDmExceptionsResponse>>(
        { queryKey: DM_EXCEPTIONS_KEY },
        (old) => removeException(old, peerId),
      );

      return { previousExceptions };
    },
    onError: (_err, _peerId, context) => {
      context?.previousExceptions.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: DM_EXCEPTIONS_KEY });
    },
  });
}
