import {
  InfiniteData,
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  dmApi,
  type DmExceptionDto,
  type ListDmExceptionsResponse,
} from '@/infra/api/dm.api';
import { DM_EXCEPTIONS_KEY } from '../useDmExceptions/useDmExceptions';
import { DM_EXCEPTION_CANDIDATES_KEY } from '../useDmExceptionCandidates/useDmExceptionCandidates';

export interface AddDmExceptionVariables {
  peerId: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Context {
  previousExceptions: Array<
    [QueryKey, InfiniteData<ListDmExceptionsResponse> | undefined]
  >;
}

function prependException(
  old: InfiniteData<ListDmExceptionsResponse> | undefined,
  row: DmExceptionDto,
): InfiniteData<ListDmExceptionsResponse> {
  if (!old || old.pages.length === 0) {
    return {
      pageParams: [undefined],
      pages: [{ data: [row], next_cursor: null }],
    };
  }
  const [first, ...rest] = old.pages;
  const filtered = first.data.filter((e) => e.peerId !== row.peerId);
  return {
    ...old,
    pages: [{ ...first, data: [row, ...filtered] }, ...rest],
  };
}

export function useAddDmException(): UseMutationResult<
  void,
  Error,
  AddDmExceptionVariables,
  Context
> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, AddDmExceptionVariables, Context>({
    mutationKey: ['dm', 'exceptions', 'add'],
    mutationFn: ({ peerId }) => dmApi.addDmException(peerId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: DM_EXCEPTIONS_KEY });
      const previousExceptions =
        queryClient.getQueriesData<InfiniteData<ListDmExceptionsResponse>>({
          queryKey: DM_EXCEPTIONS_KEY,
        });

      const optimisticRow: DmExceptionDto = {
        peerId: variables.peerId,
        displayName: variables.displayName,
        avatarUrl: variables.avatarUrl,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueriesData<InfiniteData<ListDmExceptionsResponse>>(
        { queryKey: DM_EXCEPTIONS_KEY },
        (old) => prependException(old, optimisticRow),
      );

      return { previousExceptions };
    },
    onError: (_err, _vars, context) => {
      context?.previousExceptions.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: DM_EXCEPTIONS_KEY });
      void queryClient.invalidateQueries({
        queryKey: DM_EXCEPTION_CANDIDATES_KEY,
      });
    },
  });
}
